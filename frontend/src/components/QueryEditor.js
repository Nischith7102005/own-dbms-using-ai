import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  History, 
  Database, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Copy,
  Download,
  Eye,
  Trash2,
  Play,
  Loader2,
  HelpCircle,
  Lightbulb,
  Code,
  BarChart3
} from 'lucide-react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const QueryEditor = ({ 
  datasets, 
  selectedDataset, 
  onDatasetSelect, 
  queryHistory, 
  onQueryExecute 
}) => {
  const [query, setQuery] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [examples, setExamples] = useState([]);
  const textareaRef = useRef(null);

  useEffect(() => {
    loadExamples();
  }, []);

  const loadExamples = async () => {
    try {
      const response = await apiService.getQueryExamples();
      setExamples(response.examples || []);
    } catch (error) {
      console.error('Error loading examples:', error);
    }
  };

  const executeQuery = async () => {
    if (!query.trim()) {
      toast.error('Please enter a query');
      return;
    }

    if (!selectedDataset) {
      toast.error('Please select a dataset first');
      return;
    }

    setIsExecuting(true);
    setQueryResult(null);

    try {
      const result = await apiService.executeQuery(query, selectedDataset.id);
      setQueryResult(result);
      onQueryExecute(result);
      
      if (result.success) {
        toast.success('Query executed successfully!');
      } else {
        toast.error(result.error || 'Query execution failed');
      }
    } catch (error) {
      toast.error('Failed to execute query');
      console.error('Query execution error:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      executeQuery();
    }
  };

  const copyQuery = (queryText) => {
    navigator.clipboard.writeText(queryText);
    toast.success('Query copied to clipboard');
  };

  const useExample = (exampleQuery) => {
    setQuery(exampleQuery);
    setShowExamples(false);
    textareaRef.current?.focus();
  };

  const ResultDisplay = ({ result }) => {
    if (!result) return null;

    if (!result.success) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <h3 className="text-sm font-medium text-red-900">Query Error</h3>
          </div>
          <p className="text-sm text-red-700 mt-2">{result.error}</p>
        </div>
      );
    }

    const { result: queryResult } = result;

    if (queryResult.type === 'table') {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Query Results</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>{result.execution_time?.toFixed(2)}s</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-1">{queryResult.message}</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {queryResult.columns?.map((column, index) => (
                    <th
                      key={index}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {queryResult.data?.slice(0, 50).map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {queryResult.columns?.map((column, colIndex) => (
                      <td
                        key={colIndex}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      >
                        {row[column]?.toString() || ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {queryResult.data && queryResult.data.length > 50 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing first 50 of {queryResult.total_rows} rows
              </p>
            </div>
          )}
        </div>
      );
    }

    if (queryResult.type === 'metric') {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {queryResult.value}
            </div>
            <p className="text-gray-600">{queryResult.message}</p>
          </div>
        </div>
      );
    }

    if (queryResult.type === 'visualization') {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">{queryResult.title}</h3>
          </div>
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Visualization data prepared</p>
            <p className="text-sm text-gray-400 mt-2">
              Chart type: {queryResult.chart_type}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <pre className="text-sm text-gray-900 whitespace-pre-wrap">
          {JSON.stringify(queryResult, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Query Editor</h1>
          <p className="text-gray-600">Ask questions about your data in plain English</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowExamples(!showExamples)}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Lightbulb className="h-4 w-4" />
            <span>Examples</span>
          </button>
          
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <History className="h-4 w-4" />
            <span>History</span>
          </button>
        </div>
      </div>

      {/* Dataset Selection */}
      {!selectedDataset && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <h3 className="text-sm font-medium text-yellow-900">No Dataset Selected</h3>
          </div>
          <p className="text-sm text-yellow-700 mt-2">
            Please select a dataset to start querying your data.
          </p>
          <div className="mt-3 flex space-x-2">
            {datasets.slice(0, 3).map((dataset) => (
              <button
                key={dataset.id}
                onClick={() => onDatasetSelect(dataset)}
                className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 text-sm"
              >
                {dataset.original_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Query Editor */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Natural Language Query</h3>
            {selectedDataset && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Database className="h-4 w-4" />
                <span>{selectedDataset.original_name}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-6">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your data... (e.g., 'Show me all customers from New York' or 'What is the average sales by region?')"
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm"
              disabled={isExecuting}
            />
            
            <div className="absolute bottom-3 right-3 flex items-center space-x-2">
              <div className="text-xs text-gray-500">
                Ctrl+Enter to execute
              </div>
              <button
                onClick={executeQuery}
                disabled={isExecuting || !query.trim() || !selectedDataset}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isExecuting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                <span>{isExecuting ? 'Executing...' : 'Execute'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Examples Panel */}
      {showExamples && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Query Examples</h3>
            <p className="text-sm text-gray-600 mt-1">Click on any example to use it</p>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              {examples.map((category, index) => (
                <div key={index}>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">{category.category}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {category.queries?.map((exampleQuery, qIndex) => (
                      <button
                        key={qIndex}
                        onClick={() => useExample(exampleQuery)}
                        className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <Code className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{exampleQuery}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Query History */}
      {showHistory && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Query History</h3>
            <p className="text-sm text-gray-600 mt-1">Your recent queries</p>
          </div>
          
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {queryHistory.slice(0, 10).map((historyItem, index) => (
              <div key={index} className="px-6 py-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-2 h-2 rounded-full ${
                      historyItem.success ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{historyItem.query}</p>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      <span>{new Date(historyItem.timestamp).toLocaleString()}</span>
                      <span>{historyItem.execution_time?.toFixed(2)}s</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-center space-x-2">
                    <button
                      onClick={() => copyQuery(historyItem.query)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => useExample(historyItem.query)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {queryHistory.length === 0 && (
              <div className="px-6 py-8 text-center">
                <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No queries yet</p>
                <p className="text-sm text-gray-400">Your query history will appear here</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Query Result */}
      {queryResult && <ResultDisplay result={queryResult} />}
    </div>
  );
};

export default QueryEditor;