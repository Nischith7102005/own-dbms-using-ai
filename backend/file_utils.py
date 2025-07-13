import pandas as pd
import json

def load_dataframe(file_path, file_type):
    """
    Load a dataframe from file based on file type.
    Handles file opening modes for each type.
    """
    if file_type == 'csv':
        with open(file_path, 'r', encoding='utf-8') as f:
            return pd.read_csv(f)
    elif file_type == 'json':
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # Try to convert dict/list to DataFrame
            return pd.DataFrame(data)
    elif file_type in ['xlsx', 'xls']:
        with open(file_path, 'rb') as f:
            return pd.read_excel(f)
    else:
        raise ValueError("Unsupported file type: " + file_type)
