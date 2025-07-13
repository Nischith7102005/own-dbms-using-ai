
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
import pymongo
from pymongo import MongoClient
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
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/sankalp_db")
try:
    client = MongoClient(MONGO_URL)
    db = client.sankalp_db
    # Test connection
    client.admin.command('ping')
    print("Connected to MongoDB successfully")
except Exception as e:
    print(f"MongoDB connection failed: {e}")
    # Use in-memory storage as fallback
    db = None

# Collections
if db:
    users_collection = db.users
    datasets_collection = db.datasets
    queries_collection = db.queries
    tutorials_collection = db.tutorials
else:
    # In-memory storage fallback
    datasets_storage = []
    queries_storage = []

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
        "database": "connected" if db else "fallback"
    }

@app.get("/api/config")
async def get_config():
    return {
        "multi_user_mode": MULTI_USER_MODE,
        "max_file_size": os.getenv("MAX_FILE_SIZE", "100MB"),
        "supported_formats": ["csv", "json", "xlsx", "xls"],
        "version": "1.0.0"
    }

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Check file extension
        file_extension = file.filename.split('.')[-1].lower()
        if file_extension not in ['csv', 'json', 'xlsx', 'xls']:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file format: {file_extension}"
            )
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        filename = f"{file_id}.{file_extension}"
        file_path = UPLOAD_DIR / filename
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Process file and extract metadata
        metadata = await process_uploaded_file(file_path, file.filename, file_extension)
        
        # Save to database or memory
        dataset_doc = {
            "id": file_id,
            "original_name": file.filename,
            "file_path": str(file_path),
            "file_type": file_extension,
            "upload_time": datetime.now().isoformat(),
            "metadata": metadata,
            "status": "processed"
        }
        
        if db:
            datasets_collection.insert_one(dataset_doc)
        else:
            datasets_storage.append(dataset_doc)
        
        return {
            "file_id": file_id,
            "filename": file.filename,
            "metadata": metadata,
            "message": "File uploaded and processed successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def process_uploaded_file(file_path: Path, original_name: str, file_type: str) -> Dict:
    """Process uploaded file and extract metadata"""
    try:
        if file_type == 'csv':
            df = pd.read_csv(file_path)
        elif file_type == 'json':
            df = pd.read_json(file_path)
        elif file_type in ['xlsx', 'xls']:
            df = pd.read_excel(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
        
        # Extract metadata
        metadata = {
            "rows": len(df),
            "columns": len(df.columns),
            "column_names": df.columns.tolist(),
            "column_types": df.dtypes.astype(str).to_dict(),
            "sample_data": df.head().to_dict('records'),
            "missing_values": df.isnull().sum().to_dict(),
            "file_size": file_path.stat().st_size,
            "numeric_columns": df.select_dtypes(include=[np.number]).columns.tolist(),
            "categorical_columns": df.select_dtypes(include=['object']).columns.tolist(),
            "date_columns": df.select_dtypes(include=['datetime']).columns.tolist()
        }
        
        return metadata
        
    except Exception as e:
        raise Exception(f"Error processing file: {str(e)}")

@app.get("/api/datasets")
async def get_datasets():
    """Get all uploaded datasets"""
    try:
        if db:
            datasets = list(datasets_collection.find({}, {"_id": 0}))
        else:
            datasets = datasets_storage
        return {"datasets": datasets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/datasets/{dataset_id}")
async def get_dataset(dataset_id: str):
    """Get specific dataset by ID"""
    try:
        if db:
            dataset = datasets_collection.find_one({"id": dataset_id}, {"_id": 0})
        else:
            dataset = next((d for d in datasets_storage if d["id"] == dataset_id), None)
        
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        return dataset
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/datasets/{dataset_id}")
async def delete_dataset(dataset_id: str):
    """Delete a dataset"""
    try:
        if db:
            dataset = datasets_collection.find_one({"id": dataset_id})
            if not dataset:
                raise HTTPException(status_code=404, detail="Dataset not found")
            
            # Delete file
            file_path = Path(dataset["file_path"])
            if file_path.exists():
                file_path.unlink()
            
            # Delete from database
            datasets_collection.delete_one({"id": dataset_id})
        else:
            dataset = next((d for d in datasets_storage if d["id"] == dataset_id), None)
            if not dataset:
                raise HTTPException(status_code=404, detail="Dataset not found")
            
            # Delete file
            file_path = Path(dataset["file_path"])
            if file_path.exists():
                file_path.unlink()
            
            # Remove from storage
            datasets_storage[:] = [d for d in datasets_storage if d["id"] != dataset_id]
        
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
        if db:
            dataset = datasets_collection.find_one({"id": dataset_id})
        else:
            dataset = next((d for d in datasets_storage if d["id"] == dataset_id), None)
        
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
        
        if db:
            queries_collection.insert_one(query_doc)
        else:
            queries_storage.append(query_doc)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/queries")
async def get_query_history():
    """Get query history"""
    try:
        if db:
            queries = list(queries_collection.find({}, {"_id": 0}).sort("timestamp", -1).limit(50))
        else:
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
        if db:
            dataset = datasets_collection.find_one({"id": dataset_id})
        else:
            dataset = next((d for d in datasets_storage if d["id"] == dataset_id), None)
        
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
