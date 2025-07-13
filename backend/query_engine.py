
import pandas as pd
import numpy as np
import re
from typing import Dict, Any, List, Optional
from datetime import datetime
import json

class SankalpQueryEngine:
    """
    Natural Language Query Engine for Sankalp DBMS
    Processes English-like queries and converts them to data operations
    """
    
    def __init__(self):
        self.query_patterns = {
            # Basic operations
            'show_all': [r'show\s+(?:me\s+)?all\s+(?:data|records)?', r'display\s+(?:all\s+)?(?:data|records)', r'select\s+all'],
            'show_first': [r'show\s+(?:me\s+)?(?:first\s+|top\s+)?(\d+)', r'display\s+(?:first\s+|top\s+)?(\d+)'],
            'show_last': [r'show\s+(?:me\s+)?(?:last\s+|bottom\s+)?(\d+)', r'display\s+(?:last\s+|bottom\s+)?(\d+)'],
            'count': [r'count\s+(?:total\s+)?(?:records|rows)', r'how\s+many\s+(?:records|rows)'],
            'columns': [r'show\s+(?:me\s+)?columns?', r'what\s+(?:are\s+)?(?:the\s+)?columns?', r'list\s+columns?'],
            'describe': [r'describe\s+(?:the\s+)?data', r'summary\s+of\s+data', r'data\s+info'],
            
            # Filtering
            'filter_greater': [r'where\s+(\w+)\s+(?:is\s+)?(?:greater\s+than|>)\s+(\d+\.?\d*)', 
                              r'(\w+)\s+(?:greater\s+than|>)\s+(\d+\.?\d*)',
                              r'filter\s+(\w+)\s+(?:greater\s+than|>)\s+(\d+\.?\d*)'],
            'filter_less': [r'where\s+(\w+)\s+(?:is\s+)?(?:less\s+than|<)\s+(\d+\.?\d*)',
                           r'(\w+)\s+(?:less\s+than|<)\s+(\d+\.?\d*)',
                           r'filter\s+(\w+)\s+(?:less\s+than|<)\s+(\d+\.?\d*)'],
            'filter_equal': [r'where\s+(\w+)\s+(?:is\s+)?(?:equal\s+to|equals?|=)\s+["\']?([^"\']+)["\']?',
                            r'(\w+)\s+(?:equal\s+to|equals?|=)\s+["\']?([^"\']+)["\']?',
                            r'filter\s+(\w+)\s+(?:equal\s+to|equals?|=)\s+["\']?([^"\']+)["\']?'],
            'filter_contains': [r'where\s+(\w+)\s+contains\s+["\']?([^"\']+)["\']?',
                               r'(\w+)\s+contains\s+["\']?([^"\']+)["\']?',
                               r'filter\s+(\w+)\s+containing\s+["\']?([^"\']+)["\']?'],
            
            # Aggregation
            'average': [r'(?:calculate\s+)?average\s+(?:of\s+)?(\w+)(?:\s+by\s+(\w+))?',
                       r'mean\s+(?:of\s+)?(\w+)(?:\s+by\s+(\w+))?',
                       r'avg\s+(\w+)(?:\s+by\s+(\w+))?'],
            'sum': [r'(?:calculate\s+)?sum\s+(?:of\s+)?(\w+)(?:\s+by\s+(\w+))?',
                   r'total\s+(?:of\s+)?(\w+)(?:\s+by\s+(\w+))?'],
            'max': [r'(?:find\s+)?maximum\s+(?:of\s+)?(\w+)(?:\s+by\s+(\w+))?',
                   r'max\s+(\w+)(?:\s+by\s+(\w+))?',
                   r'highest\s+(\w+)(?:\s+by\s+(\w+))?'],
            'min': [r'(?:find\s+)?minimum\s+(?:of\s+)?(\w+)(?:\s+by\s+(\w+))?',
                   r'min\s+(\w+)(?:\s+by\s+(\w+))?',
                   r'lowest\s+(\w+)(?:\s+by\s+(\w+))?'],
            'count_by': [r'count\s+(?:records|rows)?\s+by\s+(\w+)',
                        r'count\s+(\w+)\s+(?:by\s+category|by\s+group)',
                        r'group\s+by\s+(\w+)\s+and\s+count'],
            
            # Sorting
            'sort_asc': [r'sort\s+by\s+(\w+)(?:\s+(?:ascending|asc))?',
                        r'order\s+by\s+(\w+)(?:\s+(?:ascending|asc))?'],
            'sort_desc': [r'sort\s+by\s+(\w+)\s+(?:descending|desc)',
                         r'order\s+by\s+(\w+)\s+(?:descending|desc)'],
            
            # Visualization
            'bar_chart': [r'(?:create\s+|show\s+|make\s+)?bar\s+chart\s+of\s+(\w+)(?:\s+by\s+(\w+))?',
                         r'bar\s+graph\s+(?:of\s+)?(\w+)(?:\s+by\s+(\w+))?'],
            'line_chart': [r'(?:create\s+|show\s+|make\s+)?line\s+chart\s+of\s+(\w+)(?:\s+by\s+(\w+))?',
                          r'line\s+graph\s+(?:of\s+)?(\w+)(?:\s+by\s+(\w+))?'],
            'pie_chart': [r'(?:create\s+|show\s+|make\s+)?pie\s+chart\s+of\s+(\w+)',
                         r'pie\s+graph\s+(?:of\s+)?(\w+)'],
            'scatter_plot': [r'(?:create\s+|show\s+|make\s+)?scatter\s+plot\s+of\s+(\w+)\s+(?:vs|versus|against)\s+(\w+)',
                            r'scatter\s+chart\s+(\w+)\s+(?:vs|versus|against)\s+(\w+)']
        }
    
    async def execute_query(self, query: str, dataset: Dict) -> Dict[str, Any]:
        """Execute a natural language query on the dataset"""
        start_time = datetime.now()
        
        try:
            # Load the dataset
            df = self._load_dataset(dataset)
            
            # Clean and normalize the query
            normalized_query = query.lower().strip()
            
            # Match query pattern and execute
            result = self._match_and_execute_query(normalized_query, df)
            
            execution_time = (datetime.now() - start_time).total_seconds()
            
            return {
                "success": True,
                "query": query,
                "result": result,
                "execution_time": execution_time,
                "dataset_id": dataset["id"]
            }
            
        except Exception as e:
            return {
                "success": False,
                "query": query,
                "error": str(e),
                "execution_time": (datetime.now() - start_time).total_seconds()
            }
    
    def _load_dataset(self, dataset: Dict) -> pd.DataFrame:
        """Load dataset from file path"""
        file_path = dataset["file_path"]
        file_type = dataset["file_type"]
        
        if file_type == 'csv':
            return pd.read_csv(file_path)
        elif file_type == 'json':
            return pd.read_json(file_path)
        elif file_type in ['xlsx', 'xls']:
            return pd.read_excel(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
    
    def _match_and_execute_query(self, query: str, df: pd.DataFrame) -> Dict[str, Any]:
        """Match query pattern and execute corresponding operation"""
        
        # Basic operations
        if self._matches_pattern(query, 'show_all'):
            return self._show_all(df)
        
        elif self._matches_pattern(query, 'show_first'):
            match = self._extract_match(query, 'show_first')
            n = int(match.group(1)) if match else 10
            return self._show_first_n(df, n)
        
        elif self._matches_pattern(query, 'show_last'):
            match = self._extract_match(query, 'show_last')
            n = int(match.group(1)) if match else 10
            return self._show_last_n(df, n)
        
        elif self._matches_pattern(query, 'count'):
            return self._count_records(df)
        
        elif self._matches_pattern(query, 'columns'):
            return self._show_columns(df)
        
        elif self._matches_pattern(query, 'describe'):
            return self._describe_data(df)
        
        # Filtering operations
        elif self._matches_pattern(query, 'filter_greater'):
            match = self._extract_match(query, 'filter_greater')
            if match:
                column, value = match.group(1), float(match.group(2))
                return self._filter_greater_than(df, column, value)
        
        elif self._matches_pattern(query, 'filter_less'):
            match = self._extract_match(query, 'filter_less')
            if match:
                column, value = match.group(1), float(match.group(2))
                return self._filter_less_than(df, column, value)
        
        elif self._matches_pattern(query, 'filter_equal'):
            match = self._extract_match(query, 'filter_equal')
            if match:
                column, value = match.group(1), match.group(2)
                return self._filter_equal(df, column, value)
        
        elif self._matches_pattern(query, 'filter_contains'):
            match = self._extract_match(query, 'filter_contains')
            if match:
                column, value = match.group(1), match.group(2)
                return self._filter_contains(df, column, value)
        
        # Aggregation operations
        elif self._matches_pattern(query, 'average'):
            match = self._extract_match(query, 'average')
            if match:
                column = match.group(1)
                group_by = match.group(2) if match.lastindex > 1 else None
                return self._calculate_average(df, column, group_by)
        
        elif self._matches_pattern(query, 'sum'):
            match = self._extract_match(query, 'sum')
            if match:
                column = match.group(1)
                group_by = match.group(2) if match.lastindex > 1 else None
                return self._calculate_sum(df, column, group_by)
        
        elif self._matches_pattern(query, 'max'):
            match = self._extract_match(query, 'max')
            if match:
                column = match.group(1)
                group_by = match.group(2) if match.lastindex > 1 else None
                return self._calculate_max(df, column, group_by)
        
        elif self._matches_pattern(query, 'min'):
            match = self._extract_match(query, 'min')
            if match:
                column = match.group(1)
                group_by = match.group(2) if match.lastindex > 1 else None
                return self._calculate_min(df, column, group_by)
        
        elif self._matches_pattern(query, 'count_by'):
            match = self._extract_match(query, 'count_by')
            if match:
                column = match.group(1)
                return self._count_by_group(df, column)
        
        # Visualization operations
        elif self._matches_pattern(query, 'bar_chart'):
            match = self._extract_match(query, 'bar_chart')
            if match:
                y_column = match.group(1)
                x_column = match.group(2) if match.lastindex > 1 else None
                return self._create_bar_chart(df, y_column, x_column)
        
        elif self._matches_pattern(query, 'line_chart'):
            match = self._extract_match(query, 'line_chart')
            if match:
                y_column = match.group(1)
                x_column = match.group(2) if match.lastindex > 1 else None
                return self._create_line_chart(df, y_column, x_column)
        
        elif self._matches_pattern(query, 'pie_chart'):
            match = self._extract_match(query, 'pie_chart')
            if match:
                column = match.group(1)
                return self._create_pie_chart(df, column)
        
        elif self._matches_pattern(query, 'scatter_plot'):
            match = self._extract_match(query, 'scatter_plot')
            if match:
                x_column, y_column = match.group(1), match.group(2)
                return self._create_scatter_plot(df, x_column, y_column)
        
        else:
            return {
                "type": "error",
                "message": f"Sorry, I don't understand the query: '{query}'. Try queries like 'show all data', 'count records', or 'average sales by region'."
            }
    
    def _matches_pattern(self, query: str, pattern_key: str) -> bool:
        """Check if query matches any pattern for the given key"""
        patterns = self.query_patterns.get(pattern_key, [])
        return any(re.search(pattern, query) for pattern in patterns)
    
    def _extract_match(self, query: str, pattern_key: str):
        """Extract match object for the first matching pattern"""
        patterns = self.query_patterns.get(pattern_key, [])
        for pattern in patterns:
            match = re.search(pattern, query)
            if match:
                return match
        return None
    
    # Data operation methods
    def _show_all(self, df: pd.DataFrame) -> Dict[str, Any]:
        return {
            "type": "table",
            "data": df.to_dict('records'),
            "columns": df.columns.tolist(),
            "total_rows": len(df),
            "message": f"Showing all {len(df)} records"
        }
    
    def _show_first_n(self, df: pd.DataFrame, n: int) -> Dict[str, Any]:
        result_df = df.head(n)
        return {
            "type": "table",
            "data": result_df.to_dict('records'),
            "columns": df.columns.tolist(),
            "total_rows": len(result_df),
            "message": f"Showing first {len(result_df)} records"
        }
    
    def _show_last_n(self, df: pd.DataFrame, n: int) -> Dict[str, Any]:
        result_df = df.tail(n)
        return {
            "type": "table",
            "data": result_df.to_dict('records'),
            "columns": df.columns.tolist(),
            "total_rows": len(result_df),
            "message": f"Showing last {len(result_df)} records"
        }
    
    def _count_records(self, df: pd.DataFrame) -> Dict[str, Any]:
        return {
            "type": "metric",
            "value": len(df),
            "label": "Total Records",
            "message": f"Dataset contains {len(df)} records"
        }
    
    def _show_columns(self, df: pd.DataFrame) -> Dict[str, Any]:
        return {
            "type": "list",
            "data": df.columns.tolist(),
            "message": f"Dataset has {len(df.columns)} columns"
        }
    
    def _describe_data(self, df: pd.DataFrame) -> Dict[str, Any]:
        description = df.describe(include='all').to_dict()
        return {
            "type": "summary",
            "data": description,
            "message": "Data summary statistics"
        }
    
    def _filter_greater_than(self, df: pd.DataFrame, column: str, value: float) -> Dict[str, Any]:
        if column not in df.columns:
            return {"type": "error", "message": f"Column '{column}' not found"}
        
        try:
            filtered_df = df[df[column] > value]
            return {
                "type": "table",
                "data": filtered_df.to_dict('records'),
                "columns": df.columns.tolist(),
                "total_rows": len(filtered_df),
                "message": f"Found {len(filtered_df)} records where {column} > {value}"
            }
        except Exception as e:
            return {"type": "error", "message": f"Error filtering data: {str(e)}"}
    
    def _filter_less_than(self, df: pd.DataFrame, column: str, value: float) -> Dict[str, Any]:
        if column not in df.columns:
            return {"type": "error", "message": f"Column '{column}' not found"}
        
        try:
            filtered_df = df[df[column] < value]
            return {
                "type": "table",
                "data": filtered_df.to_dict('records'),
                "columns": df.columns.tolist(),
                "total_rows": len(filtered_df),
                "message": f"Found {len(filtered_df)} records where {column} < {value}"
            }
        except Exception as e:
            return {"type": "error", "message": f"Error filtering data: {str(e)}"}
    
    def _filter_equal(self, df: pd.DataFrame, column: str, value: str) -> Dict[str, Any]:
        if column not in df.columns:
            return {"type": "error", "message": f"Column '{column}' not found"}
        
        try:
            filtered_df = df[df[column].astype(str).str.lower() == value.lower()]
            return {
                "type": "table",
                "data": filtered_df.to_dict('records'),
                "columns": df.columns.tolist(),
                "total_rows": len(filtered_df),
                "message": f"Found {len(filtered_df)} records where {column} = {value}"
            }
        except Exception as e:
            return {"type": "error", "message": f"Error filtering data: {str(e)}"}
    
    def _filter_contains(self, df: pd.DataFrame, column: str, value: str) -> Dict[str, Any]:
        if column not in df.columns:
            return {"type": "error", "message": f"Column '{column}' not found"}
        
        try:
            filtered_df = df[df[column].astype(str).str.contains(value, case=False, na=False)]
            return {
                "type": "table",
                "data": filtered_df.to_dict('records'),
                "columns": df.columns.tolist(),
                "total_rows": len(filtered_df),
                "message": f"Found {len(filtered_df)} records where {column} contains '{value}'"
            }
        except Exception as e:
            return {"type": "error", "message": f"Error filtering data: {str(e)}"}
    
    def _calculate_average(self, df: pd.DataFrame, column: str, group_by: str = None) -> Dict[str, Any]:
        if column not in df.columns:
            return {"type": "error", "message": f"Column '{column}' not found"}
        
        try:
            if group_by:
                if group_by not in df.columns:
                    return {"type": "error", "message": f"Group by column '{group_by}' not found"}
                
                result = df.groupby(group_by)[column].mean().to_dict()
                return {
                    "type": "grouped_metric",
                    "data": result,
                    "operation": "average",
                    "column": column,
                    "group_by": group_by,
                    "message": f"Average {column} by {group_by}"
                }
            else:
                avg_value = df[column].mean()
                return {
                    "type": "metric",
                    "value": avg_value,
                    "label": f"Average {column}",
                    "message": f"Average {column}: {avg_value:.2f}"
                }
        except Exception as e:
            return {"type": "error", "message": f"Error calculating average: {str(e)}"}
    
    def _calculate_sum(self, df: pd.DataFrame, column: str, group_by: str = None) -> Dict[str, Any]:
        if column not in df.columns:
            return {"type": "error", "message": f"Column '{column}' not found"}
        
        try:
            if group_by:
                if group_by not in df.columns:
                    return {"type": "error", "message": f"Group by column '{group_by}' not found"}
                
                result = df.groupby(group_by)[column].sum().to_dict()
                return {
                    "type": "grouped_metric",
                    "data": result,
                    "operation": "sum",
                    "column": column,
                    "group_by": group_by,
                    "message": f"Sum {column} by {group_by}"
                }
            else:
                sum_value = df[column].sum()
                return {
                    "type": "metric",
                    "value": sum_value,
                    "label": f"Total {column}",
                    "message": f"Total {column}: {sum_value}"
                }
        except Exception as e:
            return {"type": "error", "message": f"Error calculating sum: {str(e)}"}
    
    def _calculate_max(self, df: pd.DataFrame, column: str, group_by: str = None) -> Dict[str, Any]:
        if column not in df.columns:
            return {"type": "error", "message": f"Column '{column}' not found"}
        
        try:
            if group_by:
                if group_by not in df.columns:
                    return {"type": "error", "message": f"Group by column '{group_by}' not found"}
                
                result = df.groupby(group_by)[column].max().to_dict()
                return {
                    "type": "grouped_metric",
                    "data": result,
                    "operation": "maximum",
                    "column": column,
                    "group_by": group_by,
                    "message": f"Maximum {column} by {group_by}"
                }
            else:
                max_value = df[column].max()
                return {
                    "type": "metric",
                    "value": max_value,
                    "label": f"Maximum {column}",
                    "message": f"Maximum {column}: {max_value}"
                }
        except Exception as e:
            return {"type": "error", "message": f"Error finding maximum: {str(e)}"}
    
    def _calculate_min(self, df: pd.DataFrame, column: str, group_by: str = None) -> Dict[str, Any]:
        if column not in df.columns:
            return {"type": "error", "message": f"Column '{column}' not found"}
        
        try:
            if group_by:
                if group_by not in df.columns:
                    return {"type": "error", "message": f"Group by column '{group_by}' not found"}
                
                result = df.groupby(group_by)[column].min().to_dict()
                return {
                    "type": "grouped_metric",
                    "data": result,
                    "operation": "minimum",
                    "column": column,
                    "group_by": group_by,
                    "message": f"Minimum {column} by {group_by}"
                }
            else:
                min_value = df[column].min()
                return {
                    "type": "metric",
                    "value": min_value,
                    "label": f"Minimum {column}",
                    "message": f"Minimum {column}: {min_value}"
                }
        except Exception as e:
            return {"type": "error", "message": f"Error finding minimum: {str(e)}"}
    
    def _count_by_group(self, df: pd.DataFrame, column: str) -> Dict[str, Any]:
        if column not in df.columns:
            return {"type": "error", "message": f"Column '{column}' not found"}
        
        try:
            result = df[column].value_counts().to_dict()
            return {
                "type": "grouped_metric",
                "data": result,
                "operation": "count",
                "column": column,
                "message": f"Count by {column}"
            }
        except Exception as e:
            return {"type": "error", "message": f"Error counting by group: {str(e)}"}
    
    def _create_bar_chart(self, df: pd.DataFrame, y_column: str, x_column: str = None) -> Dict[str, Any]:
        return {
            "type": "visualization",
            "chart_type": "bar",
            "config": {
                "x_column": x_column,
                "y_column": y_column,
                "title": f"Bar Chart: {y_column}" + (f" by {x_column}" if x_column else "")
            },
            "message": f"Created bar chart visualization"
        }
    
    def _create_line_chart(self, df: pd.DataFrame, y_column: str, x_column: str = None) -> Dict[str, Any]:
        return {
            "type": "visualization",
            "chart_type": "line",
            "config": {
                "x_column": x_column,
                "y_column": y_column,
                "title": f"Line Chart: {y_column}" + (f" by {x_column}" if x_column else "")
            },
            "message": f"Created line chart visualization"
        }
    
    def _create_pie_chart(self, df: pd.DataFrame, column: str) -> Dict[str, Any]:
        return {
            "type": "visualization",
            "chart_type": "pie",
            "config": {
                "column": column,
                "title": f"Pie Chart: {column} Distribution"
            },
            "message": f"Created pie chart visualization"
        }
    
    def _create_scatter_plot(self, df: pd.DataFrame, x_column: str, y_column: str) -> Dict[str, Any]:
        return {
            "type": "visualization",
            "chart_type": "scatter",
            "config": {
                "x_column": x_column,
                "y_column": y_column,
                "title": f"Scatter Plot: {x_column} vs {y_column}"
            },
            "message": f"Created scatter plot visualization"
        }

    def get_all_query_examples(self) -> List[Dict[str, Any]]:
        """Get all supported query examples with descriptions"""
        return [
            {
                "category": "Basic Data Operations",
                "queries": [
                    {"query": "show all data", "description": "Display all records in the dataset"},
                    {"query": "show first 10", "description": "Display first 10 records"},
                    {"query": "show last 5", "description": "Display last 5 records"},
                    {"query": "count total records", "description": "Count total number of records"},
                    {"query": "show columns", "description": "List all column names"},
                    {"query": "describe data", "description": "Show summary statistics of the dataset"}
                ]
            },
            {
                "category": "Data Filtering",
                "queries": [
                    {"query": "where age greater than 25", "description": "Filter records where age > 25"},
                    {"query": "where price less than 100", "description": "Filter records where price < 100"},
                    {"query": "where city equals New York", "description": "Filter records where city = 'New York'"},
                    {"query": "where name contains john", "description": "Filter records where name contains 'john'"},
                    {"query": "filter status equal to active", "description": "Filter records where status = 'active'"}
                ]
            },
            {
                "category": "Data Aggregation",
                "queries": [
                    {"query": "average sales", "description": "Calculate average of sales column"},
                    {"query": "sum revenue by region", "description": "Calculate total revenue grouped by region"},
                    {"query": "maximum price by category", "description": "Find maximum price in each category"},
                    {"query": "minimum age", "description": "Find minimum age value"},
                    {"query": "count records by department", "description": "Count records grouped by department"}
                ]
            },
            {
                "category": "Data Visualization",
                "queries": [
                    {"query": "bar chart of sales by region", "description": "Create bar chart showing sales by region"},
                    {"query": "line chart of revenue by month", "description": "Create line chart showing revenue trends by month"},
                    {"query": "pie chart of category", "description": "Create pie chart showing category distribution"},
                    {"query": "scatter plot of price vs quantity", "description": "Create scatter plot comparing price and quantity"}
                ]
            }
        ]
