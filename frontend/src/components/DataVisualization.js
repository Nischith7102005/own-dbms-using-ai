import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { 
  BarChart3, 
  PieChart, 
  LineChart, 
  TrendingUp, 
  Download,
  Settings,
  Maximize,
  RefreshCw
} from 'lucide-react';

const DataVisualization = ({ datasets, selectedDataset, onDatasetSelect }) => {
  const [chartType, setChartType] = useState('bar');
  const [chartData, setChartData] = useState(null);
  const [config, setConfig] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const chartTypes = [
    { id: 'bar', label: 'Bar Chart', icon: BarChart3 },
    { id: 'line', label: 'Line Chart', icon: LineChart },
    { id: 'pie', label: 'Pie Chart', icon: PieChart },
    { id: 'scatter', label: 'Scatter Plot', icon: TrendingUp }
  ];

  const createVisualization = async () => {
    if (!selectedDataset) return;

    setIsLoading(true);
    try {
      // This would call the API to create visualization
      // For now, we'll show a placeholder
      setTimeout(() => {
        setChartData({
          data: [
            {
              x: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
              y: [20, 14, 23, 25, 22],
              type: 'bar'
            }
          ],
          layout: {
            title: 'Sample Chart'
          }
        });
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error creating visualization:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Visualization</h1>
        <p className="text-gray-600">Create interactive charts and graphs from your data</p>
      </div>

      {/* Chart Type Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Chart Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {chartTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setChartType(type.id)}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  chartType === type.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon className={`h-6 w-6 mx-auto mb-2 ${
                  chartType === type.id ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <span className={`text-sm font-medium ${
                  chartType === type.id ? 'text-blue-900' : 'text-gray-700'
                }`}>
                  {type.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart Display */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Chart</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={createVisualization}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={!selectedDataset}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate Chart
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : chartData ? (
            <Plot
              data={chartData.data}
              layout={chartData.layout}
              config={{ responsive: true }}
              style={{ width: '100%', height: '400px' }}
            />
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No chart data available</p>
              <p className="text-sm text-gray-400 mt-2">
                {selectedDataset ? 'Click Generate Chart to create a visualization' : 'Select a dataset to get started'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataVisualization;