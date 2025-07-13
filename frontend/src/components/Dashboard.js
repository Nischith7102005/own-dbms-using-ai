import React, { useState, useEffect } from 'react';
import { 
  Database, 
  FileText, 
  BarChart3, 
  Brain, 
  TrendingUp, 
  Users, 
  Clock, 
  Activity,
  Upload,
  Search,
  Plus,
  ChevronRight,
  BookOpen,
  Zap
} from 'lucide-react';

const Dashboard = ({ 
  datasets, 
  queryHistory, 
  onViewChange, 
  isOnboarding,
  onOnboardingComplete 
}) => {
  const [stats, setStats] = useState({
    totalDatasets: 0,
    totalQueries: 0,
    totalRows: 0,
    recentActivity: []
  });

  useEffect(() => {
    // Calculate stats
    const totalRows = datasets.reduce((sum, dataset) => sum + (dataset.metadata?.rows || 0), 0);
    const recentActivity = [...queryHistory].slice(0, 5);
    
    setStats({
      totalDatasets: datasets.length,
      totalQueries: queryHistory.length,
      totalRows,
      recentActivity
    });
  }, [datasets, queryHistory]);

  const StatCard = ({ icon: Icon, label, value, color = "blue" }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const QuickActionCard = ({ icon: Icon, title, description, onClick, color = "blue" }) => (
    <div 
      onClick={onClick}
      className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </div>
    </div>
  );

  if (isOnboarding) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <Brain className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Sankalp DBMS</h1>
          <p className="text-gray-600">Your natural language database management system</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <QuickActionCard
            icon={Upload}
            title="Upload Your First Dataset"
            description="Start by uploading a CSV, JSON, or Excel file"
            onClick={() => onViewChange('upload')}
            color="green"
          />
          <QuickActionCard
            icon={BookOpen}
            title="Learn Sankalp Language"
            description="Explore our tutorial to master natural language queries"
            onClick={() => onViewChange('tutorial')}
            color="purple"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Getting Started</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span>Upload your data files (CSV, JSON, Excel)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span>Use natural language to query your data</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span>Create visualizations with simple commands</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview of your data and recent activity</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => onViewChange('upload')}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Data</span>
          </button>
          <button
            onClick={() => onViewChange('query')}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Search className="h-4 w-4" />
            <span>Query Data</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          icon={Database}
          label="Total Datasets"
          value={stats.totalDatasets}
          color="blue"
        />
        <StatCard
          icon={FileText}
          label="Total Queries"
          value={stats.totalQueries}
          color="green"
        />
        <StatCard
          icon={BarChart3}
          label="Total Records"
          value={stats.totalRows.toLocaleString()}
          color="purple"
        />
        <StatCard
          icon={Activity}
          label="Active Sessions"
          value={1}
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <QuickActionCard
            icon={Upload}
            title="Upload Dataset"
            description="Add new data files to analyze"
            onClick={() => onViewChange('upload')}
            color="blue"
          />
          <QuickActionCard
            icon={Search}
            title="Query Data"
            description="Ask questions in natural language"
            onClick={() => onViewChange('query')}
            color="green"
          />
          <QuickActionCard
            icon={BarChart3}
            title="Create Visualization"
            description="Generate charts and graphs"
            onClick={() => onViewChange('visualize')}
            color="purple"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Datasets</h3>
          {datasets.length === 0 ? (
            <p className="text-gray-500 text-sm">No datasets uploaded yet</p>
          ) : (
            <div className="space-y-3">
              {datasets.slice(0, 5).map((dataset) => (
                <div key={dataset.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{dataset.original_name}</p>
                    <p className="text-sm text-gray-600">
                      {dataset.metadata?.rows || 0} rows • {dataset.metadata?.columns || 0} columns
                    </p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(dataset.upload_time).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Queries</h3>
          {queryHistory.length === 0 ? (
            <p className="text-gray-500 text-sm">No queries executed yet</p>
          ) : (
            <div className="space-y-3">
              {stats.recentActivity.map((query) => (
                <div key={query.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900 text-sm">{query.query}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-600">{query.dataset_name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(query.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
