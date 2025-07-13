import re
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
from datetime import datetime
import json
from textblob import TextBlob
from fuzzywuzzy import fuzz
import asyncio

class SankalpQueryEngine:
    """
    Natural Language Query Engine for Sankalp DBMS
    Processes English-like queries and converts them to data operations
    """
    
    def __init__(self):
        self.query_patterns = {
            # Basic operations
            'show_all': [r'show\s+(?:me\s+)?all', r'display\s+(?:all\s+)?(?:data|records)', r'select\s+all'],
            'show_first': [r'show\s+(?:me\s+)?(?:first\s+|top\s+)?(\d+)', r'display\s+(?:first\s+|top\s+)?(\d+)'],
            'count': [r'count\s+(?:total\s+)?(?:records|rows)', r'how\s+many\s+(?:records|rows)'],
            'columns': [r'show\s+(?:me\s+)?columns?', r'what\s+(?:are\s+)?(?:the\s+)?columns?'],
            
            # Filtering
            'filter_greater': [r'where\s+(\w+)\s+(?:is\s+)?(?:greater\s+than|>)\s+(\d+\.?\d*)', 
                              r'(\w+)\s+(?:greater\s+than|>)\s+(\d+\.?\d*)'],
            'filter_less': [r'where\s+(\w+)\s+(?:is\s+)?(?:less\s+than|<)\s+(\d+\.?\d*)',
                           r'(\w+)\s+(?:less\s+than|<)\s+(\d+\.?\d*)'],
            'filter_equal': [r'where\s+(\w+)\s+(?:is\s+)?(?:equal\s+to|=)\s+["\']?([^"\']+)["\']?',
                            r'(\w+)\s+(?:equal\s+to|=)\s+["\']?([^"\']+)["\']?'],
            'filter_contains': [r'where\s+(\w+)\s+contains\s+["\']?([^"\']+)["\']?',
                               r'(\w+)\s+contains\s+["\']?([^"\']+)["\']?'],
            
            # Aggregation
            'average': [r'(?:calculate\s+)?average\s+(?:of\s+)?(\w+)(?:\s+by\s+(\w+))?',
                       r'(?:find\s+)?mean\s+(?:of\s+)?(\w+)(?:\s+by\s+(\w+))?'],
            'sum': [r'(?:calculate\s+)?sum\s+(?:of\s+)?(\w+)(?:\s+by\s+(\w+))?',
                   r'(?:find\s+)?total\s+(?:of\s+)?(\w+)(?:\s+by\s+(\w+))?'],
            'max': [r'(?:find\s+)?max(?:imum)?\s+(?:of\s+)?(\w+)(?:\s+by\s+(\w+))?',
                   r'(?:find\s+)?highest\s+(?:of\s+)?(\w+)(?:\s+by\s+(\w+))?'],
            'min': [r'(?:find\s+)?min(?:imum)?\s+(?:of\s+)?(\w+)(?:\s+by\s+(\w+))?',
                   r'(?:find\s+)?lowest\s+(?:of\s+)?(\w+)(?:\s+by\s+(\w+))?'],
            
            # Visualization
            'bar_chart': [r'(?:create\s+)?bar\s+chart\s+(?:of\s+)?(\w+)(?:\s+by\s+(\w+))?',
                         r'(?:show\s+)?bar\s+graph\s+(?:of\s+)?(\w+)(?:\s+by\s+(\w+))?'],
            'line_chart': [r'(?:create\s+)?line\s+chart\s+(?:of\s+)?(\w+)(?:\s+by\s+(\w+))?',
                          r'(?:show\s+)?line\s+graph\s+(?:of\s+)?(\w+)(?:\s+by\s+(\w+))?'],
            'pie_chart': [r'(?:create\s+)?pie\s+chart\s+(?:of\s+)?(\w+)',
                         r'(?:show\s+)?pie\s+graph\s+(?:of\s+)?(\w+)'],
            'scatter_plot': [r'(?:create\s+)?scatter\s+plot\s+(?:of\s+)?(\w+)\s+(?:vs\s+|against\s+)(\w+)',
                            r'(?:show\s+)?scatter\s+graph\s+(?:of\s+)?(\w+)\s+(?:vs\s+|against\s+)(\w+)']
        }
        
        self.operation_types = {
            'display': ['show_all', 'show_first', 'columns'],
            'filter': ['filter_greater', 'filter_less', 'filter_equal', 'filter_contains'],
            'aggregate': ['average', 'sum', 'max', 'min', 'count'],
            'visualize': ['bar_chart', 'line_chart', 'pie_chart', 'scatter_plot']
        }
    
    async def execute_query(self, query: str, dataset: Dict) -> Dict:
        """Execute a Sankalp query against a dataset"""
        try:
            start_time = datetime.now()
            
            # Clean and normalize query
            query = query.lower().strip()
            
            # Parse query to understand intent
            parsed_query = self._parse_query(query)
            
            # Load dataset
            df = self._load_dataset(dataset)
            
            # Execute operation
            result = await self._execute_operation(parsed_query, df)
            
            # Calculate execution time
            execution_time = (datetime.now() - start_time).total_seconds()
            
            return {
                'success': True,
                'query': query,
                'operation': parsed_query,
                'result': result,
                'execution_time': execution_time,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'success': False,
                'query': query,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def _parse_query(self, query: str) -> Dict:
        """Parse natural language query to extract operation and parameters"""
        
        # Check each pattern category
        for operation, patterns in self.query_patterns.items():
            for pattern in patterns:
                match = re.search(pattern, query, re.IGNORECASE)
                if match:
                    return {
                        'operation': operation,
                        'parameters': match.groups() if match.groups() else [],
                        'original_query': query
                    }
        
        # If no exact match, try fuzzy matching
        best_match = self._fuzzy_match_query(query)
        if best_match:
            return best_match
        
        # Default fallback
        return {
            'operation': 'show_all',
            'parameters': [],
            'original_query': query,
            'note': 'Query not fully understood, showing all data'
        }
    
    def _fuzzy_match_query(self, query: str) -> Optional[Dict]:
        """Use fuzzy matching to find closest query pattern"""
        best_score = 0
        best_match = None
        
        common_queries = [
            "show me all data",
            "display first 10 rows",
            "count total records",
            "show columns",
            "average of sales",
            "sum of revenue",
            "bar chart of sales"
        ]
        
        for common_query in common_queries:
            score = fuzz.ratio(query, common_query)
            if score > best_score and score > 60:  # Threshold for fuzzy matching
                best_score = score
                # Parse the common query instead
                best_match = self._parse_query(common_query)
        
        return best_match
    
    def _load_dataset(self, dataset: Dict) -> pd.DataFrame:
        """Load dataset from file path"""
        file_path = dataset['file_path']
        file_type = dataset['file_type']
        
        if file_type == 'csv':
            return pd.read_csv(file_path)
        elif file_type == 'json':
            return pd.read_json(file_path)
        elif file_type in ['xlsx', 'xls']:
            return pd.read_excel(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
    
    async def _execute_operation(self, parsed_query: Dict, df: pd.DataFrame) -> Dict:
        """Execute the parsed operation on the dataframe"""
        operation = parsed_query['operation']
        parameters = parsed_query['parameters']
        
        if operation == 'show_all':
            return self._show_all(df)
        elif operation == 'show_first':
            limit = int(parameters[0]) if parameters else 10
            return self._show_first(df, limit)
        elif operation == 'count':
            return self._count_records(df)
        elif operation == 'columns':
            return self._show_columns(df)
        elif operation in ['filter_greater', 'filter_less', 'filter_equal', 'filter_contains']:
            return self._filter_data(df, operation, parameters)
        elif operation in ['average', 'sum', 'max', 'min']:
            return self._aggregate_data(df, operation, parameters)
        elif operation in ['bar_chart', 'line_chart', 'pie_chart', 'scatter_plot']:
            return self._prepare_visualization(df, operation, parameters)
        else:
            return self._show_all(df)
    
    def _show_all(self, df: pd.DataFrame) -> Dict:
        """Show all data"""
        return {
            'type': 'table',
            'data': df.to_dict('records'),
            'columns': df.columns.tolist(),
            'total_rows': len(df),
            'message': f"Showing all {len(df)} records"
        }
    
    def _show_first(self, df: pd.DataFrame, limit: int) -> Dict:
        """Show first N records"""
        result_df = df.head(limit)
        return {
            'type': 'table',
            'data': result_df.to_dict('records'),
            'columns': df.columns.tolist(),
            'total_rows': len(result_df),
            'message': f"Showing first {limit} records"
        }
    
    def _count_records(self, df: pd.DataFrame) -> Dict:
        """Count total records"""
        return {
            'type': 'metric',
            'value': len(df),
            'message': f"Total records: {len(df)}"
        }
    
    def _show_columns(self, df: pd.DataFrame) -> Dict:
        """Show column information"""
        columns_info = []
        for col in df.columns:
            columns_info.append({
                'name': col,
                'type': str(df[col].dtype),
                'null_count': df[col].isnull().sum(),
                'unique_count': df[col].nunique()
            })
        
        return {
            'type': 'columns',
            'data': columns_info,
            'message': f"Dataset has {len(df.columns)} columns"
        }
    
    def _filter_data(self, df: pd.DataFrame, operation: str, parameters: List) -> Dict:
        """Filter data based on conditions"""
        if len(parameters) < 2:
            return self._show_all(df)
        
        column, value = parameters[0], parameters[1]
        
        # Find closest matching column name
        column = self._find_closest_column(df, column)
        
        if column not in df.columns:
            return {
                'type': 'error',
                'message': f"Column '{column}' not found in dataset"
            }
        
        try:
            if operation == 'filter_greater':
                filtered_df = df[df[column] > float(value)]
            elif operation == 'filter_less':
                filtered_df = df[df[column] < float(value)]
            elif operation == 'filter_equal':
                filtered_df = df[df[column] == value]
            elif operation == 'filter_contains':
                filtered_df = df[df[column].astype(str).str.contains(value, case=False, na=False)]
            else:
                filtered_df = df
            
            return {
                'type': 'table',
                'data': filtered_df.to_dict('records'),
                'columns': df.columns.tolist(),
                'total_rows': len(filtered_df),
                'message': f"Filtered data: {len(filtered_df)} records match the condition"
            }
            
        except Exception as e:
            return {
                'type': 'error',
                'message': f"Error filtering data: {str(e)}"
            }
    
    def _aggregate_data(self, df: pd.DataFrame, operation: str, parameters: List) -> Dict:
        """Perform aggregation operations"""
        if not parameters:
            return {'type': 'error', 'message': 'No column specified for aggregation'}
        
        column = parameters[0]
        group_by = parameters[1] if len(parameters) > 1 else None
        
        # Find closest matching column name
        column = self._find_closest_column(df, column)
        
        if column not in df.columns:
            return {
                'type': 'error',
                'message': f"Column '{column}' not found in dataset"
            }
        
        try:
            if group_by:
                group_by = self._find_closest_column(df, group_by)
                if group_by not in df.columns:
                    return {
                        'type': 'error',
                        'message': f"Group by column '{group_by}' not found in dataset"
                    }
                
                if operation == 'average':
                    result = df.groupby(group_by)[column].mean()
                elif operation == 'sum':
                    result = df.groupby(group_by)[column].sum()
                elif operation == 'max':
                    result = df.groupby(group_by)[column].max()
                elif operation == 'min':
                    result = df.groupby(group_by)[column].min()
                
                return {
                    'type': 'aggregated_table',
                    'data': result.reset_index().to_dict('records'),
                    'columns': [group_by, f"{operation}_{column}"],
                    'message': f"{operation.capitalize()} of {column} by {group_by}"
                }
            else:
                if operation == 'average':
                    result = df[column].mean()
                elif operation == 'sum':
                    result = df[column].sum()
                elif operation == 'max':
                    result = df[column].max()
                elif operation == 'min':
                    result = df[column].min()
                
                return {
                    'type': 'metric',
                    'value': result,
                    'message': f"{operation.capitalize()} of {column}: {result}"
                }
                
        except Exception as e:
            return {
                'type': 'error',
                'message': f"Error in aggregation: {str(e)}"
            }
    
    def _prepare_visualization(self, df: pd.DataFrame, operation: str, parameters: List) -> Dict:
        """Prepare data for visualization"""
        if not parameters:
            return {'type': 'error', 'message': 'No column specified for visualization'}
        
        column = parameters[0]
        group_by = parameters[1] if len(parameters) > 1 else None
        
        # Find closest matching column names
        column = self._find_closest_column(df, column)
        
        if column not in df.columns:
            return {
                'type': 'error',
                'message': f"Column '{column}' not found in dataset"
            }
        
        try:
            if operation == 'bar_chart':
                if group_by:
                    group_by = self._find_closest_column(df, group_by)
                    data = df.groupby(group_by)[column].sum().reset_index()
                else:
                    data = df[column].value_counts().reset_index()
                    data.columns = [column, 'count']
                
                return {
                    'type': 'visualization',
                    'chart_type': 'bar',
                    'data': data.to_dict('records'),
                    'x_column': group_by or column,
                    'y_column': column if group_by else 'count',
                    'title': f"Bar Chart: {column}" + (f" by {group_by}" if group_by else "")
                }
            
            elif operation == 'line_chart':
                if group_by:
                    group_by = self._find_closest_column(df, group_by)
                    data = df.groupby(group_by)[column].mean().reset_index()
                else:
                    data = df[[column]].reset_index()
                
                return {
                    'type': 'visualization',
                    'chart_type': 'line',
                    'data': data.to_dict('records'),
                    'x_column': group_by or 'index',
                    'y_column': column,
                    'title': f"Line Chart: {column}" + (f" by {group_by}" if group_by else "")
                }
            
            elif operation == 'pie_chart':
                data = df[column].value_counts().reset_index()
                data.columns = [column, 'count']
                
                return {
                    'type': 'visualization',
                    'chart_type': 'pie',
                    'data': data.to_dict('records'),
                    'label_column': column,
                    'value_column': 'count',
                    'title': f"Pie Chart: {column} Distribution"
                }
            
            elif operation == 'scatter_plot':
                if len(parameters) < 2:
                    return {'type': 'error', 'message': 'Scatter plot requires two columns'}
                
                y_column = self._find_closest_column(df, parameters[1])
                
                return {
                    'type': 'visualization',
                    'chart_type': 'scatter',
                    'data': df[[column, y_column]].to_dict('records'),
                    'x_column': column,
                    'y_column': y_column,
                    'title': f"Scatter Plot: {column} vs {y_column}"
                }
            
        except Exception as e:
            return {
                'type': 'error',
                'message': f"Error preparing visualization: {str(e)}"
            }
    
    def _find_closest_column(self, df: pd.DataFrame, column_name: str) -> str:
        """Find the closest matching column name using fuzzy matching"""
        if column_name in df.columns:
            return column_name
        
        best_match = None
        best_score = 0
        
        for col in df.columns:
            score = fuzz.ratio(column_name.lower(), col.lower())
            if score > best_score:
                best_score = score
                best_match = col
        
        return best_match if best_score > 60 else column_name