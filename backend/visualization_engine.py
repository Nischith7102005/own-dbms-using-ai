import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from typing import Dict, Any
import json

class VisualizationEngine:
    """
    Visualization Engine for Sankalp DBMS
    Creates interactive charts and graphs from data
    """

    def __init__(self):
        self.supported_charts = ['bar', 'line', 'pie', 'scatter', 'histogram', 'box']

    async def create_visualization(self, dataset: Dict, chart_type: str, config: Dict) -> Dict[str, Any]:
        """Create visualization from dataset"""
        try:
            # Load the dataset
            df = self._load_dataset(dataset)

            # Create the visualization based on chart type
            if chart_type == 'bar':
                return self._create_bar_chart(df, config)
            elif chart_type == 'line':
                return self._create_line_chart(df, config)
            elif chart_type == 'pie':
                return self._create_pie_chart(df, config)
            elif chart_type == 'scatter':
                return self._create_scatter_plot(df, config)
            elif chart_type == 'histogram':
                return self._create_histogram(df, config)
            elif chart_type == 'box':
                return self._create_box_plot(df, config)
            else:
                return {
                    "success": False,
                    "error": f"Unsupported chart type: {chart_type}"
                }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
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

    def _create_bar_chart(self, df: pd.DataFrame, config: Dict) -> Dict[str, Any]:
        """Create bar chart"""
        x_column = config.get('x_column')
        y_column = config.get('y_column')
        title = config.get('title', 'Bar Chart')

        if not y_column or y_column not in df.columns:
            return {"success": False, "error": "Y column not specified or not found"}

        if x_column and x_column in df.columns:
            # Grouped bar chart
            grouped_data = df.groupby(x_column)[y_column].sum().reset_index()
            fig = px.bar(grouped_data, x=x_column, y=y_column, title=title)
        else:
            # Simple bar chart of value counts
            value_counts = df[y_column].value_counts().reset_index()
            value_counts.columns = [y_column, 'count']
            fig = px.bar(value_counts, x=y_column, y='count', title=title)

        return {
            "success": True,
            "chart_type": "bar",
            "chart_data": fig.to_json(),
            "title": title
        }

    def _create_line_chart(self, df: pd.DataFrame, config: Dict) -> Dict[str, Any]:
        """Create line chart"""
        x_column = config.get('x_column')
        y_column = config.get('y_column')
        title = config.get('title', 'Line Chart')

        if not y_column or y_column not in df.columns:
            return {"success": False, "error": "Y column not specified or not found"}

        if x_column and x_column in df.columns:
            fig = px.line(df, x=x_column, y=y_column, title=title)
        else:
            # Use index as x-axis
            fig = px.line(df, y=y_column, title=title)

        return {
            "success": True,
            "chart_type": "line",
            "chart_data": fig.to_json(),
            "title": title
        }

    def _create_pie_chart(self, df: pd.DataFrame, config: Dict) -> Dict[str, Any]:
        """Create pie chart"""
        column = config.get('column')
        title = config.get('title', 'Pie Chart')

        if not column or column not in df.columns:
            return {"success": False, "error": "Column not specified or not found"}

        value_counts = df[column].value_counts()

        fig = px.pie(
            values=value_counts.values,
            names=value_counts.index,
            title=title
        )

        return {
            "success": True,
            "chart_type": "pie",
            "chart_data": fig.to_json(),
            "title": title
        }

    def _create_scatter_plot(self, df: pd.DataFrame, config: Dict) -> Dict[str, Any]:
        """Create scatter plot"""
        x_column = config.get('x_column')
        y_column = config.get('y_column')
        title = config.get('title', 'Scatter Plot')

        if not x_column or x_column not in df.columns:
            return {"success": False, "error": "X column not specified or not found"}

        if not y_column or y_column not in df.columns:
            return {"success": False, "error": "Y column not specified or not found"}

        fig = px.scatter(df, x=x_column, y=y_column, title=title)

        return {
            "success": True,
            "chart_type": "scatter",
            "chart_data": fig.to_json(),
            "title": title
        }

    def _create_histogram(self, df: pd.DataFrame, config: Dict) -> Dict[str, Any]:
        """Create histogram"""
        column = config.get('column')
        title = config.get('title', 'Histogram')
        bins = config.get('bins', 30)

        if not column or column not in df.columns:
            return {"success": False, "error": "Column not specified or not found"}

        fig = px.histogram(df, x=column, nbins=bins, title=title)

        return {
            "success": True,
            "chart_type": "histogram",
            "chart_data": fig.to_json(),
            "title": title
        }

    def _create_box_plot(self, df: pd.DataFrame, config: Dict) -> Dict[str, Any]:
        """Create box plot"""
        column = config.get('column')
        title = config.get('title', 'Box Plot')

        if not column or column not in df.columns:
            return {"success": False, "error": "Column not specified or not found"}

        fig = px.box(df, y=column, title=title)

        return {
            "success": True,
            "chart_type": "box",
            "chart_data": fig.to_json(),
            "title": title
        }