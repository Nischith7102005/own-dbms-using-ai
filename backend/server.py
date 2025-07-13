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

# Import file_utils for safe dataframe loading
try:
    from file_utils import load_dataframe
except ImportError:
    print("Warning: file_utils not found, using fallback dataframe loading")
    
    def load_dataframe(file_path, file_type):
        """Fallback dataframe loading function"""
        import pandas as pd
        if file_type == 'csv':
            return pd.read_csv(file_path)
        elif file_type == 'json':
            return pd.read_json(file_path)
        elif file_type in ['xlsx', 'xls']:
            return pd.read_excel(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")

# Initialize FastAPI app
app = FastAPI(title="Sankalp DBMS", version="1.0.0")

# Add CORS middleware
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
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
    "audit_logging": True,
    "multi_user_mode": True,
    "version": "1.0.0"
}
print("Using in-memory storage")

# Upload directory
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads"))
UPLOAD_DIR.mkdir(exist_ok=True)

# Security
security = HTTPBearer(auto_error=False)
MULTI_USER_MODE = os.getenv("MULTI_USER_MODE", "true").lower() == "true"

# Import query engine and visualization modules
try:
    from query_engine import SankalpQueryEngine
    from visualization_engine import VisualizationEngine
    
    # Initialize engines
    query_engine = SankalpQueryEngine()
    viz_engine = VisualizationEngine()
    print("Query and visualization engines initialized")
except ImportError as e:
    print(f"Warning: Could not import engines: {e}")
    query_engine = None
    viz_engine = None

@app.get("/")
async def root():
    return {"message": "Welcome to Sankalp DBMS - Your Natural Language Database"}

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy", 
        "timestamp": datetime.now().isoformat(),
        "database": "in-memory",
        "query_engine": query_engine is not None,
        "visualization_engine": viz_engine is not None
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
    """
    Handle user file upload and persist to disk, then process metadata.
    """
    ext = file.filename.split('.')[-1].lower()
    if ext not in config_storage["allowed_file_types"] + ["xls"]:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    dataset_id = str(uuid.uuid4())
    save_path = UPLOAD_DIR / f"{dataset_id}.{ext}"

    # Save file to disk
    try:
        async with aiofiles.open(save_path, 'wb') as out_file:
            while True:
                content = await file.read(1024*1024)
                if not content:
                    break
                await out_file.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

    # Process metadata using new safe loading
    try:
        metadata = await process_uploaded_file(save_path, file.filename, ext)
    except Exception as e:
        # Clean up if processing fails
        if save_path.exists():
            save_path.unlink()
        raise HTTPException(status_code=500, detail=f"Failed to process file: {e}")

    dataset_info = {
        "id": dataset_id,
        "original_name": file.filename,
        "file_path": str(save_path),
        "file_type": ext,
        "upload_time": datetime.now().isoformat(),
        "metadata": metadata
    }
    datasets_storage[dataset_id] = dataset_info

    return dataset_info

async def process_uploaded_file(file_path: Path, original_name: str, file_type: str) -> Dict:
    """Process uploaded file and extract metadata using safe loader"""
    try:
        print(f"Processing file: {file_path}, type: {file_type}")

        # Use safe loader for DataFrame
        df = load_dataframe(file_path, file_type)
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

            print(f"Metadata extracted successfully")
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
    """Get all datasets"""
    return {
        "success": True,
        "datasets": list(datasets_storage.values())
    }

@app.get("/api/datasets/{dataset_id}")
async def get_dataset(dataset_id: str):
    """Get specific dataset"""
    if dataset_id not in datasets_storage:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    return {
        "success": True,
        "dataset": datasets_storage[dataset_id]
    }

@app.delete("/api/datasets/{dataset_id}")
async def delete_dataset(dataset_id: str):
    """Delete a dataset"""
    if dataset_id not in datasets_storage:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    dataset = datasets_storage[dataset_id]
    file_path = Path(dataset["file_path"])
    
    # Delete file from disk
    if file_path.exists():
        file_path.unlink()
    
    # Remove from storage
    del datasets_storage[dataset_id]
    
    return {"success": True, "message": "Dataset deleted successfully"}

@app.post("/api/query")
async def execute_query(request: Dict[str, Any]):
    """Execute a natural language query"""
    query = request.get("query")
    dataset_id = request.get("dataset_id")
    
    if not query:
        raise HTTPException(status_code=400, detail="Query is required")
    
    if not dataset_id:
        raise HTTPException(status_code=400, detail="Dataset ID is required")
    
    if dataset_id not in datasets_storage:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    if not query_engine:
        raise HTTPException(status_code=503, detail="Query engine not available")
    
    dataset = datasets_storage[dataset_id]
    
    try:
        # Execute query using the query engine
        result = await query_engine.execute_query(query, dataset)
        
        # Store query in history
        query_record = {
            "id": str(uuid.uuid4()),
            "query": query,
            "dataset_id": dataset_id,
            "dataset_name": dataset["original_name"],
            "result": result,
            "timestamp": datetime.now().isoformat(),
            "execution_time": result.get("execution_time", 0)
        }
        queries_storage.append(query_record)
        
        return {
            "success": True,
            "query_id": query_record["id"],
            "result": result
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/api/queries")
async def get_query_history():
    """Get query history"""
    return {
        "success": True,
        "queries": sorted(queries_storage, key=lambda x: x["timestamp"], reverse=True)
    }

@app.post("/api/visualize")
async def create_visualization(request: Dict[str, Any]):
    """Create a visualization"""
    dataset_id = request.get("dataset_id")
    chart_type = request.get("chart_type")
    config = request.get("config", {})
    
    if not dataset_id:
        raise HTTPException(status_code=400, detail="Dataset ID is required")
    
    if not chart_type:
        raise HTTPException(status_code=400, detail="Chart type is required")
    
    if dataset_id not in datasets_storage:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    if not viz_engine:
        raise HTTPException(status_code=503, detail="Visualization engine not available")
    
    dataset = datasets_storage[dataset_id]
    
    try:
        result = await viz_engine.create_visualization(dataset, chart_type, config)
        return {
            "success": True,
            "visualization": result
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/api/tutorial/levels")
async def get_tutorial_levels():
    """Get tutorial levels"""
    levels = [
        {
            "id": "basic",
            "title": "Basic Operations",
            "description": "Learn fundamental data operations",
            "lessons": [
                {
                    "id": "show_data",
                    "title": "Displaying Data",
                    "content": "Learn how to view your data",
                    "example": "show all data"
                },
                {
                    "id": "count_records",
                    "title": "Counting Records",
                    "content": "Count total records in dataset",
                    "example": "count total records"
                },
                {
                    "id": "show_columns",
                    "title": "Column Information",
                    "content": "Display column names and structure",
                    "example": "show columns"
                }
            ]
        },
        {
            "id": "filtering",
            "title": "Data Filtering",
            "description": "Filter and search your data",
            "lessons": [
                {
                    "id": "filter_numbers",
                    "title": "Numeric Filters",
                    "content": "Filter data using numeric conditions",
                    "example": "where age greater than 25"
                },
                {
                    "id": "filter_text",
                    "title": "Text Filters",
                    "content": "Filter data using text conditions",
                    "example": "where name contains john"
                },
                {
                    "id": "filter_equals",
                    "title": "Exact Matches",
                    "content": "Find exact matches in data",
                    "example": "where status equals active"
                }
            ]
        },
        {
            "id": "aggregation",
            "title": "Data Aggregation",
            "description": "Calculate statistics and summaries",
            "lessons": [
                {
                    "id": "averages",
                    "title": "Averages",
                    "content": "Calculate average values",
                    "example": "average salary by department"
                },
                {
                    "id": "sums",
                    "title": "Totals",
                    "content": "Calculate sum of values",
                    "example": "sum revenue by region"
                },
                {
                    "id": "min_max",
                    "title": "Min/Max Values",
                    "content": "Find minimum and maximum values",
                    "example": "maximum price by category"
                }
            ]
        },
        {
            "id": "visualization",
            "title": "Data Visualization",
            "description": "Create charts and graphs",
            "lessons": [
                {
                    "id": "bar_charts",
                    "title": "Bar Charts",
                    "content": "Create bar charts for categorical data",
                    "example": "bar chart of sales by region"
                },
                {
                    "id": "line_charts",
                    "title": "Line Charts",
                    "content": "Create line charts for trends",
                    "example": "line chart of revenue by month"
                },
                {
                    "id": "pie_charts",
                    "title": "Pie Charts",
                    "content": "Create pie charts for distributions",
                    "example": "pie chart of category"
                }
            ]
        }
    ]
    
    return {
        "success": True,
        "levels": levels
    }

@app.get("/api/tutorial/examples")
async def get_query_examples():
    """Get query examples from the query engine"""
    if not query_engine:
        # Return fallback examples if query engine is not available
        examples = [
            {
                "category": "Basic Data Operations",
                "queries": [
                    {"query": "show all data", "description": "Display all records in the dataset"},
                    {"query": "show first 10", "description": "Display first 10 records"},
                    {"query": "count total records", "description": "Count total number of records"},
                    {"query": "show columns", "description": "List all column names"}
                ]
            },
            {
                "category": "Data Filtering",
                "queries": [
                    {"query": "where age greater than 25", "description": "Filter records where age > 25"},
                    {"query": "where name contains john", "description": "Filter records where name contains 'john'"},
                    {"query": "where status equals active", "description": "Filter records where status = 'active'"}
                ]
            }
        ]
    else:
        examples = query_engine.get_all_query_examples()
    
    return {
        "success": True,
        "examples": examples
    }

@app.get("/api/datasets/{dataset_id}/preview")
async def preview_dataset(dataset_id: str, limit: int = 10):
    """Preview dataset with limited rows"""
    if dataset_id not in datasets_storage:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    dataset = datasets_storage[dataset_id]
    
    try:
        df = load_dataframe(dataset["file_path"], dataset["file_type"])
        
        preview_data = df.head(limit).fillna("").to_dict('records')
        
        # Convert numpy types to native Python types
        for record in preview_data:
            for key, value in record.items():
                if pd.isna(value) or value is None:
                    record[key] = ""
                elif isinstance(value, (np.int64, np.int32)):
                    record[key] = int(value)
                elif isinstance(value, (np.float64, np.float32)):
                    record[key] = float(value)
                else:
                    record[key] = str(value)
        
        return {
            "success": True,
            "data": preview_data,
            "columns": df.columns.tolist(),
            "total_rows": len(df),
            "preview_rows": len(preview_data)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/api/datasets/{dataset_id}/analyze")
async def analyze_dataset(dataset_id: str):
    """Analyze dataset for insights"""
    if dataset_id not in datasets_storage:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    dataset = datasets_storage[dataset_id]
    
    try:
        df = load_dataframe(dataset["file_path"], dataset["file_type"])
        
        # Basic analysis
        analysis = {
            "basic_stats": {
                "rows": len(df),
                "columns": len(df.columns),
                "missing_values": df.isnull().sum().sum(),
                "duplicate_rows": df.duplicated().sum()
            },
            "column_analysis": {},
            "data_types": {str(k): str(v) for k, v in df.dtypes.to_dict().items()},
            "memory_usage": int(df.memory_usage(deep=True).sum())
        }
        
        # Analyze each column
        for col in df.columns:
            col_analysis = {
                "type": str(df[col].dtype),
                "null_count": int(df[col].isnull().sum()),
                "unique_count": int(df[col].nunique()),
                "null_percentage": float(df[col].isnull().sum() / len(df) * 100)
            }
            
            if df[col].dtype in ['int64', 'float64']:
                col_analysis.update({
                    "min": float(df[col].min()),
                    "max": float(df[col].max()),
                    "mean": float(df[col].mean()),
                    "std": float(df[col].std())
                })
            else:
                col_analysis.update({
                    "most_common": df[col].mode().iloc[0] if not df[col].empty else None,
                    "sample_values": df[col].dropna().head(5).tolist()
                })
            
            analysis["column_analysis"][col] = col_analysis
        
        return {
            "success": True,
            "analysis": analysis
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
