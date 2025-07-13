import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { 
  Database, 
  FileText, 
  BarChart3, 
  BookOpen, 
  Search, 
  Upload, 
  Settings,
  Home,
  Users,
  Globe,
  Sparkles,
  Brain,
  ChevronRight,
  Play,
  Download,
  Eye,
  Trash2,
  Filter,
  SortAsc,
  RefreshCw,
  HelpCircle,
  Lightbulb,
  Code,
  Zap
} from 'lucide-react';

// Import components
import Dashboard from './components/Dashboard';
import FileUpload from './components/FileUpload';
import QueryEditor from './components/QueryEditor';
import DataVisualization from './components/DataVisualization';
import Tutorial from './components/Tutorial';
import QueryLibrary from './components/QueryLibrary';
import DataManager from './components/DataManager';
import SettingsPage from './components/Settings';
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';

// Import services
import { apiService } from './services/api';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);
  const [queryHistory, setQueryHistory] = useState([]);
  const [tutorialProgress, setTutorialProgress] = useState({});
  const [isOnboarding, setIsOnboarding] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setLoading(true);
      
      // Load configuration
      const configData = await apiService.getConfig();
      setConfig(configData);
      
      // Load datasets
      const datasetsData = await apiService.getDatasets();
      setDatasets(datasetsData.datasets || []);
      
      // Load query history
      const queryHistoryData = await apiService.getQueryHistory();
      setQueryHistory(queryHistoryData.queries || []);
      
      // Check if first time user
      const hasDatasets = datasetsData.datasets && datasetsData.datasets.length > 0;
      const hasQueries = queryHistoryData.queries && queryHistoryData.queries.length > 0;
      
      if (!hasDatasets && !hasQueries) {
        setIsOnboarding(true);
      }
      
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDatasetUpload = async (uploadedDataset) => {
    setDatasets(prev => [uploadedDataset, ...prev]);
    if (!selectedDataset) {
      setSelectedDataset(uploadedDataset);
    }
  };

  const handleQueryExecution = async (queryResult) => {
    setQueryHistory(prev => [queryResult, ...prev]);
  };

  const handleDatasetSelect = (dataset) => {
    setSelectedDataset(dataset);
  };

  const handleDatasetDelete = async (datasetId) => {
    try {
      await apiService.deleteDataset(datasetId);
      setDatasets(prev => prev.filter(d => d.id !== datasetId));
      if (selectedDataset?.id === datasetId) {
        setSelectedDataset(null);
      }
    } catch (error) {
      console.error('Error deleting dataset:', error);
    }
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'upload', label: 'Upload Data', icon: Upload },
    { id: 'query', label: 'Query Editor', icon: Code },
    { id: 'visualize', label: 'Visualizations', icon: BarChart3 },
    { id: 'tutorial', label: 'Tutorial', icon: BookOpen },
    { id: 'library', label: 'Query Library', icon: Database },
    { id: 'data', label: 'Data Manager', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const renderCurrentView = () => {
    const commonProps = {
      datasets,
      selectedDataset,
      onDatasetSelect: handleDatasetSelect,
      config
    };

    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            {...commonProps}
            queryHistory={queryHistory}
            tutorialProgress={tutorialProgress}
            onViewChange={setCurrentView}
            isOnboarding={isOnboarding}
            onOnboardingComplete={() => setIsOnboarding(false)}
          />
        );
      case 'upload':
        return (
          <FileUpload
            {...commonProps}
            onUpload={handleDatasetUpload}
          />
        );
      case 'query':
        return (
          <QueryEditor
            {...commonProps}
            queryHistory={queryHistory}
            onQueryExecute={handleQueryExecution}
          />
        );
      case 'visualize':
        return (
          <DataVisualization
            {...commonProps}
          />
        );
      case 'tutorial':
        return (
          <Tutorial
            {...commonProps}
            progress={tutorialProgress}
            onProgressUpdate={setTutorialProgress}
          />
        );
      case 'library':
        return (
          <QueryLibrary
            {...commonProps}
            queryHistory={queryHistory}
            onQuerySelect={(query) => {
              // Switch to query editor with selected query
              setCurrentView('query');
              // You might want to pass the query to the editor
            }}
          />
        );
      case 'data':
        return (
          <DataManager
            {...commonProps}
            onDatasetDelete={handleDatasetDelete}
            onDatasetEdit={(dataset) => {
              setSelectedDataset(dataset);
              setCurrentView('query');
            }}
          />
        );
      case 'settings':
        return (
          <Settings
            {...commonProps}
            config={config}
            onConfigUpdate={setConfig}
          />
        );
      default:
        return <Dashboard {...commonProps} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">
            <div className="text-xl font-semibold mb-2">Initializing Sankalp DBMS</div>
            <div className="text-sm">Loading your natural language database...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">Sankalp DBMS</h1>
                <p className="text-sm text-gray-600">Natural Language Database Management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {selectedDataset && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-full">
                  <Database className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    {selectedDataset.original_name}
                  </span>
                </div>
              )}
              
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <Globe className="h-4 w-4" />
                <span>{config?.multi_user_mode ? 'Multi-User' : 'Single-User'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg border-r border-gray-200 min-h-screen">
          <div className="p-4">
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          
          {/* Quick Stats */}
          <div className="p-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Quick Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Datasets</span>
                <span className="font-medium">{datasets.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Queries</span>
                <span className="font-medium">{queryHistory.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Version</span>
                <span className="font-medium">{config?.version || '1.0.0'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {renderCurrentView()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;