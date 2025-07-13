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
from backend.file_utils import load_dataframe

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

# ... rest of the server.py remains unchanged (routes, query endpoints, etc.)
