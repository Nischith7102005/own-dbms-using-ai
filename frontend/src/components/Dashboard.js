import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Database, 
  BarChart3, 
  BookOpen, 
  TrendingUp, 
  Users, 
  Activity,
  FileText,
  Sparkles,
  ArrowRight,
  Play,
  ChevronRight,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

const Dashboard = ({ 
  datasets, 
  selectedDataset, 
  onDatasetSelect, 
  queryHistory, 
  tutorialProgress, 
  onViewChange,
  isOnboarding,
  onOnboardingComplete
}) => {
  const [stats, setStats] = useState({
    totalDatasets: 0,
    totalQueries: 0,
    avgQueryTime: 0,
    tutorialCompletion: 0
  });

  useEffect(() => {
    // Calculate stats
    const totalDatasets = datasets.length;
    const totalQueries = queryHistory.length;
    const avgQueryTime = queryHistory.length > 0 
      ? queryHistory.reduce((sum, q) => sum + (q.execution_time || 0), 0) / queryHistory.length
      : 0;
    const tutorialCompletion = Object.keys(tutorialProgress).length > 0 
      ? (Object.values(tutorialProgress).reduce((sum, p) => sum + p, 0) / Object.values(tutorialProgress).length) * 100
      : 0;

    setStats({
      totalDatasets,
      totalQueries,
      avgQueryTime,
      tutorialCompletion
    });
  }, [datasets, queryHistory, tutorialProgress]);

  const recentQueries = queryHistory.slice(0, 5);
  const recentDatasets = datasets.slice(0, 5);

  const OnboardingFlow = () => (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6 border border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Sparkles className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Welcome to Sankalp DBMS!</h3>
            <p className="text-sm text-blue-700">Let's get you started with your natural language database</p>
          </div>
        </div>
        <button 
          onClick={onOnboardingComplete}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Skip tour
        </button>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">1</span>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">Upload Your Data</h4>
            <p className="text-sm text-gray-600">Start by uploading a CSV, JSON, or Excel file</p>
          </div>
          <button
            onClick={() => onViewChange('upload')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Data</span>
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-semibold text-sm">2</span>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-400">Learn Sankalp Query Language</h4>
            <p className="text-sm text-gray-400">Take the tutorial to learn natural language queries</p>
          </div>
          <button
            onClick={() => onViewChange('tutorial')}
            className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
            disabled
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Tutorial
          </button>
        </div>
      </div>
    </div>
  );

  const StatCard = ({ title, value, icon: Icon, color, description }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  const QuickActions = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <button
        onClick={() => onViewChange('upload')}
        className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Upload className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Upload Data</h3>
            <p className="text-sm text-gray-600">Add new dataset</p>
          </div>
        </div>
      </button>
      
      <button
        onClick={() => onViewChange('query')}
        className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Database className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Query Data</h3>
            <p className="text-sm text-gray-600">Ask questions in plain English</p>
          </div>
        </div>
      </button>
      
      <button
        onClick={() => onViewChange('visualize')}
        className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <BarChart3 className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Visualize</h3>
            <p className="text-sm text-gray-600">Create charts and graphs</p>
          </div>
        </div>
      </button>
      
      <button
        onClick={() => onViewChange('tutorial')}
        className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <BookOpen className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Learn</h3>
            <p className="text-sm text-gray-600">Take the tutorial</p>
          </div>
        </div>
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to your natural language database</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Onboarding Flow */}
      {isOnboarding && <OnboardingFlow />}

      {/* Quick Actions */}
      <QuickActions />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Datasets"
          value={stats.totalDatasets}
          icon={Database}
          color="text-blue-600"
          description="Uploaded files"
        />
        <StatCard
          title="Total Queries"
          value={stats.totalQueries}
          icon={Activity}
          color="text-green-600"
          description="Executed queries"
        />
        <StatCard
          title="Avg Query Time"
          value={`${stats.avgQueryTime.toFixed(2)}s`}
          icon={TrendingUp}
          color="text-purple-600"
          description="Query performance"
        />
        <StatCard
          title="Tutorial Progress"
          value={`${stats.tutorialCompletion.toFixed(0)}%`}
          icon={BookOpen}
          color="text-orange-600"
          description="Learning progress"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Queries */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Recent Queries</h3>
              <button
                onClick={() => onViewChange('query')}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <span>View all</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentQueries.length > 0 ? (
              recentQueries.map((query, index) => (
                <div key={index} className="px-6 py-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        query.success ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {query.query}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(query.timestamp).toLocaleString()} • {query.execution_time?.toFixed(2)}s
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center">
                <Database className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No queries yet</p>
                <p className="text-sm text-gray-400">Start by uploading data and asking questions</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Datasets */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Recent Datasets</h3>
              <button
                onClick={() => onViewChange('data')}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <span>View all</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentDatasets.length > 0 ? (
              recentDatasets.map((dataset) => (
                <div key={dataset.id} className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {dataset.original_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {dataset.metadata?.rows} rows • {dataset.metadata?.columns} columns
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => onDatasetSelect(dataset)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center">
                <Upload className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No datasets yet</p>
                <p className="text-sm text-gray-400">Upload your first dataset to get started</p>
                <button
                  onClick={() => onViewChange('upload')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Upload Dataset
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tips and Getting Started */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Getting Started Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Natural Language Queries</h4>
              <p className="text-sm text-gray-600">Ask questions like "Show me all sales from last month" or "What's the average age of customers?"</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Supported File Types</h4>
              <p className="text-sm text-gray-600">Upload CSV, JSON, Excel (.xlsx, .xls) files up to 100MB in size</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Tutorial Available</h4>
              <p className="text-sm text-gray-600">Take the interactive tutorial to learn the Sankalp query language from basic to advanced</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <BarChart3 className="h-5 w-5 text-purple-500 mt-0.5" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Auto Visualizations</h4>
              <p className="text-sm text-gray-600">Create charts and graphs automatically from your query results</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;