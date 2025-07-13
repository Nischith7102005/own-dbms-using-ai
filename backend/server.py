from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import uuid
from dotenv import load_dotenv
import aiofiles
from pathlib import Path
import shutil

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Sankalp DBMS", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# In-memory storage (replace with database later)
datasets_storage = {}
queries_storage = []
config_storage = {
    "max_file_size": 100,
    "allowed_file_types": ["csv", "json", "xlsx"],
    "auto_backup": True,
    "encrypt_data": False,
    "audit_logging": True
}
print("Using in-memory storage")

# Upload directory
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads"))
UPLOAD_DIR.mkdir(exist_ok=True)

# Security
security = HTTPBearer(auto_error=False)
MULTI_USER_MODE = os.getenv("MULTI_USER_MODE", "true").lower() == "true"

# Import query engine and visualization modules
from query_engine import SankalpQueryEngine
from visualization_engine import VisualizationEngine

# Initialize engines
query_engine = SankalpQueryEngine()
viz_engine = VisualizationEngine()

@app.get("/")
async def root():
    return {"message": "Welcome to Sankalp DBMS - Your Natural Language Database"}

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy", 
        "timestamp": datetime.now().isoformat(),
        "database": "fallback"
    }

@app.get("/api/config")
async def get_config():
    return config_storage

@app.post("/api/config")
async def update_config(config: Dict[str, Any]):
    config_storage.update(config)
    return {"success": True}

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        print(f"Received file upload request: {file.filename}")

        # Validate file
        if not file.filename:
            print("No filename provided")
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": "No file provided"}
            )

        # Check file extension
        file_extension = file.filename.split('.')[-1].lower()
        if file_extension not in ['csv', 'json', 'xlsx', 'xls']:
            print(f"Unsupported file format: {file_extension}")
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": f"Unsupported file format: {file_extension}"}
            )

        # Generate unique filename
        file_id = str(uuid.uuid4())
        filename = f"{file_id}.{file_extension}"
        file_path = UPLOAD_DIR / filename

        print(f"Saving file to: {file_path}")

        # Save file
        try:
            content = await file.read()
            with open(file_path, 'wb') as f:
                f.write(content)
            print(f"File saved successfully, size: {len(content)} bytes")
        except Exception as save_error:
            print(f"Error saving file: {save_error}")
            return JSONResponse(
                status_code=500,
                content={"success": False, "error": f"Error saving file: {str(save_error)}"}
            )

        # Process file and extract metadata
        try:
            metadata = await process_uploaded_file(file_path, file.filename, file_extension)
            print(f"File processed successfully, metadata: {metadata}")
        except Exception as process_error:
            print(f"Error processing file: {process_error}")
            return JSONResponse(
                status_code=500,
                content={"success": False, "error": f"Error processing file: {str(process_error)}"}
            )

        # Save to database or memory
        dataset_doc = {
            "id": file_id,
            "original_name": file.filename,
            "filename": file.filename,
            "file_path": str(file_path),
            "file_type": file_extension,
            "upload_time": datetime.now().isoformat(),
            "metadata": metadata,
            "status": "processed"
        }

        datasets_storage[file_id] = dataset_doc
        print("Dataset saved to storage")

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "id": file_id,
                "file_id": file_id,
                "filename": file.filename,
                "original_name": file.filename,
                "file_type": file_extension,
                "upload_time": dataset_doc["upload_time"],
                "metadata": metadata,
                "status": "processed",
                "message": "File uploaded and processed successfully"
            }
        )

    except Exception as e:
        print(f"Upload error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

async def process_uploaded_file(file_path: Path, original_name: str, file_type: str) -> Dict:
    """Process uploaded file and extract metadata"""
    try:
        print(f"Processing file: {file_path}, type: {file_type}")

        # Read the file based on type
        if file_type == 'csv':
            df = pd.read_csv(file_path, encoding='utf-8')
        elif file_type == 'json':
            df = pd.read_json(file_path)
        elif file_type in ['xlsx', 'xls']:
            df = pd.read_excel(file_path, engine='openpyxl' if file_type == 'xlsx' else 'xlrd')
        else:
            raise ValueError(f"Unsupported file type: {file_type}")

        print(f"File loaded successfully, shape: {df.shape}")

        # Extract metadata safely
        try:
            column_types = {}
            for col in df.columns:
                try:
                    column_types[col] = str(df[col].dtype)
                except:
                    column_types[col] = "object"

            sample_data = []
            try:
                sample_data = df.head(5).fillna("").to_dict('records')
                # Convert any numpy types to native Python types
                for record in sample_data:
                    for key, value in record.items():
                        if pd.isna(value) or value is None:
                            record[key] = ""
                        elif isinstance(value, (np.int64, np.int32)):
                            record[key] = int(value)
                        elif isinstance(value, (np.float64, np.float32)):
                            record[key] = float(value)
                        else:
                            record[key] = str(value)
            except Exception as sample_error:
                print(f"Error creating sample data: {sample_error}")
                sample_data = []

            metadata = {
                "rows": int(len(df)),
                "columns": int(len(df.columns)),
                "column_names": [str(col) for col in df.columns.tolist()],
                "column_types": column_types,
                "sample_data": sample_data,
                "missing_values": {str(col): int(df[col].isnull().sum()) for col in df.columns},
                "file_size": int(file_path.stat().st_size),
                "numeric_columns": [str(col) for col in df.select_dtypes(include=[np.number]).columns.tolist()],
                "categorical_columns": [str(col) for col in df.select_dtypes(include=['object']).columns.tolist()],
                "date_columns": [str(col) for col in df.select_dtypes(include=['datetime']).columns.tolist()]
            }

            print(f"Metadata extracted successfully: {metadata}")
            return metadata

        except Exception as metadata_error:
            print(f"Error extracting metadata: {metadata_error}")
            # Return basic metadata if detailed extraction fails
            return {
                "rows": int(len(df)),
                "columns": int(len(df.columns)),
                "column_names": [str(col) for col in df.columns.tolist()],
                "column_types": {},
                "sample_data": [],
                "missing_values": {},
                "file_size": int(file_path.stat().st_size),
                "numeric_columns": [],
                "categorical_columns": [],
                "date_columns": []
            }

    except Exception as e:
        print(f"Error processing file {file_path}: {str(e)}")
        raise Exception(f"Error processing file: {str(e)}")

@app.get("/api/datasets")
async def get_datasets():
    return list(datasets_storage.values())

@app.get("/api/datasets/{dataset_id}")
async def get_dataset(dataset_id: str):
    """Get specific dataset by ID"""
    try:
        dataset = datasets_storage.get(dataset_id)

        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        return dataset
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/datasets/{dataset_id}")
async def delete_dataset(dataset_id: str):
    """Delete a dataset"""
    try:
        dataset = datasets_storage.get(dataset_id)
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")

        # Delete file
        file_path = Path(dataset["file_path"])
        if file_path.exists():
            file_path.unlink()

        # Remove from storage
        del datasets_storage[dataset_id]

        return {"message": "Dataset deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/query")
async def execute_query(query_request: Dict):
    """Execute Sankalp query"""
    try:
        query_text = query_request.get("query")
        dataset_id = query_request.get("dataset_id")

        if not query_text:
            raise HTTPException(status_code=400, detail="Query text is required")

        if not dataset_id:
            raise HTTPException(status_code=400, detail="Dataset ID is required")

        # Get dataset
        dataset = datasets_storage.get(dataset_id)

        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")

        # Execute query
        result = await query_engine.execute_query(query_text, dataset)

        # Save query to history
        query_doc = {
            "id": str(uuid.uuid4()),
            "query": query_text,
            "dataset_id": dataset_id,
            "timestamp": datetime.now().isoformat(),
            "result": result,
            "execution_time": result.get("execution_time", 0)
        }

        queries_storage.append(query_doc)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/queries")
async def get_query_history():
    """Get query history"""
    try:
        queries = sorted(queries_storage, key=lambda x: x["timestamp"], reverse=True)[:50]
        return {"queries": queries}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tutorial/levels")
async def get_tutorial_levels():
    """Get all tutorial levels"""
    try:
        levels = [
            {
                "level": 1,
                "title": "Getting Started with Sankalp",
                "description": "Learn the basics of natural language querying",
                "lessons": [
                    "Introduction to Sankalp Query Language",
                    "Basic data viewing commands",
                    "Understanding your dataset"
                ]
            },
            {
                "level": 2,
                "title": "Data Filtering and Selection",
                "description": "Filter and select specific data",
                "lessons": [
                    "Simple filtering operations",
                    "Comparison operators",
                    "Text-based filtering"
                ]
            },
            {
                "level": 3,
                "title": "Data Aggregation",
                "description": "Perform calculations and summarizations",
                "lessons": [
                    "Basic aggregations (sum, average, count)",
                    "Grouping data",
                    "Advanced calculations"
                ]
            },
            {
                "level": 4,
                "title": "Data Visualization",
                "description": "Create charts and graphs",
                "lessons": [
                    "Creating bar charts",
                    "Line charts and trends",
                    "Advanced visualizations"
                ]
            }
        ]
        return {"levels": levels}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tutorial/examples")
async def get_query_examples():
    """Get query examples for learning"""
    try:
        examples = [
            {
                "category": "Basic Queries",
                "queries": [
                    "Show me all data",
                    "Display first 10 rows",
                    "Count total records",
                    "Show column names"
                ]
            },
            {
                "category": "Filtering",
                "queries": [
                    "Show records where age is greater than 25",
                    "Filter data for New York city",
                    "Find all products with price below 100",
                    "Show data where status equals active"
                ]
            },
            {
                "category": "Aggregation",
                "queries": [
                    "Calculate average sales by region",
                    "Sum total revenue by month",
                    "Count customers by category",
                    "Find maximum price in each category"
                ]
            },
            {
                "category": "Visualization",
                "queries": [
                    "Create bar chart of sales by region",
                    "Show line chart of monthly trends",
                    "Generate pie chart of category distribution",
                    "Create scatter plot of price vs quantity"
                ]
            }
        ]
        return {"examples": examples}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/visualize")
async def create_visualization(viz_request: Dict):
    """Create data visualization"""
    try:
        dataset_id = viz_request.get("dataset_id")
        chart_type = viz_request.get("chart_type", "bar")
        config = viz_request.get("config", {})

        if not dataset_id:
            raise HTTPException(status_code=400, detail="Dataset ID is required")

        # Get dataset
        dataset = datasets_storage.get(dataset_id)

        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")

        # Create visualization
        result = await viz_engine.create_visualization(dataset, chart_type, config)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)