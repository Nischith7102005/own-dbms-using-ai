import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
import json
import matplotlib.pyplot as plt
import seaborn as sns
from io import BytesIO
import base64

class VisualizationEngine:
    """
    Advanced Visualization Engine for Sankalp DBMS
    Creates interactive charts and visualizations
    """
    
    def __init__(self):
        self.chart_types = {
            'bar': self._create_bar_chart,
            'line': self._create_line_chart,
            'pie': self._create_pie_chart,
            'scatter': self._create_scatter_plot,
            'histogram': self._create_histogram,
            'box': self._create_box_plot,
            'heatmap': self._create_heatmap,
            'area': self._create_area_chart,
            'bubble': self._create_bubble_chart,
            'treemap': self._create_treemap
        }
        
        self.color_palettes = {
            'default': px.colors.qualitative.Set3,
            'viridis': px.colors.sequential.Viridis,
            'plasma': px.colors.sequential.Plasma,
            'rainbow': px.colors.qualitative.Pastel,
            'blues': px.colors.sequential.Blues,
            'greens': px.colors.sequential.Greens
        }
    
    async def create_visualization(self, dataset: Dict, chart_type: str, config: Dict) -> Dict:
        """Create visualization based on dataset and configuration"""
        try:
            # Load dataset
            df = self._load_dataset(dataset)
            
            # Validate chart type
            if chart_type not in self.chart_types:
                return {
                    'success': False,
                    'error': f"Unsupported chart type: {chart_type}",
                    'supported_types': list(self.chart_types.keys())
                }
            
            # Create visualization
            chart_func = self.chart_types[chart_type]
            chart_data = chart_func(df, config)
            
            return {
                'success': True,
                'chart_type': chart_type,
                'chart_data': chart_data,
                'config': config,
                'dataset_info': {
                    'rows': len(df),
                    'columns': len(df.columns),
                    'column_names': df.columns.tolist()
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'chart_type': chart_type
            }
    
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
    
    def _create_bar_chart(self, df: pd.DataFrame, config: Dict) -> Dict:
        """Create bar chart"""
        x_column = config.get('x_column')
        y_column = config.get('y_column')
        color_column = config.get('color_column')
        title = config.get('title', 'Bar Chart')
        
        if not x_column or not y_column:
            # Auto-detect columns
            numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
            
            if not x_column:
                x_column = categorical_cols[0] if categorical_cols else df.columns[0]
            if not y_column:
                y_column = numeric_cols[0] if numeric_cols else df.columns[1]
        
        # Aggregate data if needed
        if df[x_column].dtype == 'object':
            chart_data = df.groupby(x_column)[y_column].sum().reset_index()
        else:
            chart_data = df
        
        fig = px.bar(
            chart_data,
            x=x_column,
            y=y_column,
            color=color_column,
            title=title,
            color_discrete_sequence=self.color_palettes['default']
        )
        
        fig.update_layout(
            xaxis_title=x_column.title(),
            yaxis_title=y_column.title(),
            showlegend=True if color_column else False
        )
        
        return fig.to_dict()
    
    def _create_line_chart(self, df: pd.DataFrame, config: Dict) -> Dict:
        """Create line chart"""
        x_column = config.get('x_column')
        y_column = config.get('y_column')
        color_column = config.get('color_column')
        title = config.get('title', 'Line Chart')
        
        if not x_column or not y_column:
            # Auto-detect columns
            numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            date_cols = df.select_dtypes(include=['datetime']).columns.tolist()
            
            if not x_column:
                x_column = date_cols[0] if date_cols else df.columns[0]
            if not y_column:
                y_column = numeric_cols[0] if numeric_cols else df.columns[1]
        
        fig = px.line(
            df,
            x=x_column,
            y=y_column,
            color=color_column,
            title=title,
            color_discrete_sequence=self.color_palettes['default']
        )
        
        fig.update_layout(
            xaxis_title=x_column.title(),
            yaxis_title=y_column.title(),
            showlegend=True if color_column else False
        )
        
        return fig.to_dict()
    
    def _create_pie_chart(self, df: pd.DataFrame, config: Dict) -> Dict:
        """Create pie chart"""
        label_column = config.get('label_column')
        value_column = config.get('value_column')
        title = config.get('title', 'Pie Chart')
        
        if not label_column:
            # Auto-detect categorical column
            categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
            label_column = categorical_cols[0] if categorical_cols else df.columns[0]
        
        if not value_column:
            # Use count if no value column specified
            chart_data = df[label_column].value_counts().reset_index()
            chart_data.columns = [label_column, 'count']
            value_column = 'count'
        else:
            chart_data = df.groupby(label_column)[value_column].sum().reset_index()
        
        fig = px.pie(
            chart_data,
            names=label_column,
            values=value_column,
            title=title,
            color_discrete_sequence=self.color_palettes['default']
        )
        
        return fig.to_dict()
    
    def _create_scatter_plot(self, df: pd.DataFrame, config: Dict) -> Dict:
        """Create scatter plot"""
        x_column = config.get('x_column')
        y_column = config.get('y_column')
        color_column = config.get('color_column')
        size_column = config.get('size_column')
        title = config.get('title', 'Scatter Plot')
        
        if not x_column or not y_column:
            # Auto-detect numeric columns
            numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            if len(numeric_cols) >= 2:
                x_column = numeric_cols[0]
                y_column = numeric_cols[1]
            else:
                x_column = df.columns[0]
                y_column = df.columns[1]
        
        fig = px.scatter(
            df,
            x=x_column,
            y=y_column,
            color=color_column,
            size=size_column,
            title=title,
            color_discrete_sequence=self.color_palettes['default']
        )
        
        fig.update_layout(
            xaxis_title=x_column.title(),
            yaxis_title=y_column.title(),
            showlegend=True if color_column else False
        )
        
        return fig.to_dict()
    
    def _create_histogram(self, df: pd.DataFrame, config: Dict) -> Dict:
        """Create histogram"""
        column = config.get('column')
        bins = config.get('bins', 20)
        title = config.get('title', 'Histogram')
        
        if not column:
            # Auto-detect numeric column
            numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            column = numeric_cols[0] if numeric_cols else df.columns[0]
        
        fig = px.histogram(
            df,
            x=column,
            nbins=bins,
            title=title,
            color_discrete_sequence=self.color_palettes['default']
        )
        
        fig.update_layout(
            xaxis_title=column.title(),
            yaxis_title='Frequency'
        )
        
        return fig.to_dict()
    
    def _create_box_plot(self, df: pd.DataFrame, config: Dict) -> Dict:
        """Create box plot"""
        column = config.get('column')
        category_column = config.get('category_column')
        title = config.get('title', 'Box Plot')
        
        if not column:
            # Auto-detect numeric column
            numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            column = numeric_cols[0] if numeric_cols else df.columns[0]
        
        fig = px.box(
            df,
            y=column,
            x=category_column,
            title=title,
            color_discrete_sequence=self.color_palettes['default']
        )
        
        fig.update_layout(
            xaxis_title=category_column.title() if category_column else '',
            yaxis_title=column.title()
        )
        
        return fig.to_dict()
    
    def _create_heatmap(self, df: pd.DataFrame, config: Dict) -> Dict:
        """Create heatmap"""
        title = config.get('title', 'Heatmap')
        
        # Use only numeric columns for correlation heatmap
        numeric_df = df.select_dtypes(include=[np.number])
        
        if numeric_df.empty:
            raise ValueError("No numeric columns found for heatmap")
        
        correlation_matrix = numeric_df.corr()
        
        fig = px.imshow(
            correlation_matrix,
            title=title,
            color_continuous_scale='RdBu_r',
            aspect='auto'
        )
        
        return fig.to_dict()
    
    def _create_area_chart(self, df: pd.DataFrame, config: Dict) -> Dict:
        """Create area chart"""
        x_column = config.get('x_column')
        y_column = config.get('y_column')
        title = config.get('title', 'Area Chart')
        
        if not x_column or not y_column:
            # Auto-detect columns
            numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            x_column = df.columns[0] if not x_column else x_column
            y_column = numeric_cols[0] if numeric_cols and not y_column else y_column
        
        fig = px.area(
            df,
            x=x_column,
            y=y_column,
            title=title,
            color_discrete_sequence=self.color_palettes['default']
        )
        
        fig.update_layout(
            xaxis_title=x_column.title(),
            yaxis_title=y_column.title()
        )
        
        return fig.to_dict()
    
    def _create_bubble_chart(self, df: pd.DataFrame, config: Dict) -> Dict:
        """Create bubble chart"""
        x_column = config.get('x_column')
        y_column = config.get('y_column')
        size_column = config.get('size_column')
        color_column = config.get('color_column')
        title = config.get('title', 'Bubble Chart')
        
        if not x_column or not y_column:
            # Auto-detect numeric columns
            numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            if len(numeric_cols) >= 2:
                x_column = numeric_cols[0]
                y_column = numeric_cols[1]
                size_column = numeric_cols[2] if len(numeric_cols) > 2 else numeric_cols[0]
            else:
                x_column = df.columns[0]
                y_column = df.columns[1]
        
        fig = px.scatter(
            df,
            x=x_column,
            y=y_column,
            size=size_column,
            color=color_column,
            title=title,
            size_max=60,
            color_discrete_sequence=self.color_palettes['default']
        )
        
        fig.update_layout(
            xaxis_title=x_column.title(),
            yaxis_title=y_column.title()
        )
        
        return fig.to_dict()
    
    def _create_treemap(self, df: pd.DataFrame, config: Dict) -> Dict:
        """Create treemap"""
        label_column = config.get('label_column')
        value_column = config.get('value_column')
        parent_column = config.get('parent_column')
        title = config.get('title', 'Treemap')
        
        if not label_column:
            # Auto-detect categorical column
            categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
            label_column = categorical_cols[0] if categorical_cols else df.columns[0]
        
        if not value_column:
            # Use count if no value column specified
            chart_data = df[label_column].value_counts().reset_index()
            chart_data.columns = [label_column, 'count']
            value_column = 'count'
        else:
            chart_data = df.groupby(label_column)[value_column].sum().reset_index()
        
        fig = px.treemap(
            chart_data,
            path=[label_column] if not parent_column else [parent_column, label_column],
            values=value_column,
            title=title,
            color_discrete_sequence=self.color_palettes['default']
        )
        
        return fig.to_dict()
    
    def get_chart_suggestions(self, df: pd.DataFrame) -> List[Dict]:
        """Get suggested chart types based on data characteristics"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
        date_cols = df.select_dtypes(include=['datetime']).columns.tolist()
        
        suggestions = []
        
        # Bar chart suggestions
        if categorical_cols and numeric_cols:
            suggestions.append({
                'chart_type': 'bar',
                'description': f'Bar chart of {numeric_cols[0]} by {categorical_cols[0]}',
                'config': {
                    'x_column': categorical_cols[0],
                    'y_column': numeric_cols[0],
                    'title': f'{numeric_cols[0]} by {categorical_cols[0]}'
                }
            })
        
        # Line chart suggestions
        if date_cols and numeric_cols:
            suggestions.append({
                'chart_type': 'line',
                'description': f'Line chart of {numeric_cols[0]} over time',
                'config': {
                    'x_column': date_cols[0],
                    'y_column': numeric_cols[0],
                    'title': f'{numeric_cols[0]} Trend'
                }
            })
        
        # Pie chart suggestions
        if categorical_cols:
            suggestions.append({
                'chart_type': 'pie',
                'description': f'Pie chart of {categorical_cols[0]} distribution',
                'config': {
                    'label_column': categorical_cols[0],
                    'title': f'{categorical_cols[0]} Distribution'
                }
            })
        
        # Scatter plot suggestions
        if len(numeric_cols) >= 2:
            suggestions.append({
                'chart_type': 'scatter',
                'description': f'Scatter plot of {numeric_cols[0]} vs {numeric_cols[1]}',
                'config': {
                    'x_column': numeric_cols[0],
                    'y_column': numeric_cols[1],
                    'title': f'{numeric_cols[0]} vs {numeric_cols[1]}'
                }
            })
        
        # Histogram suggestions
        if numeric_cols:
            suggestions.append({
                'chart_type': 'histogram',
                'description': f'Histogram of {numeric_cols[0]}',
                'config': {
                    'column': numeric_cols[0],
                    'title': f'{numeric_cols[0]} Distribution'
                }
            })
        
        return suggestions