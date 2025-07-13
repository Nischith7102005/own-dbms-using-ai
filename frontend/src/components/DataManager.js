
import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Eye, 
  Edit, 
  Calendar,
  FileText,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';

const DataManager = ({ 
  datasets, 
  selectedDataset, 
  onDatasetSelect, 
  onDatasetDelete, 
  onDatasetEdit 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedDatasets, setSelectedDatasets] = useState(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [datasetToDelete, setDatasetToDelete] = useState(null);
  const [loading, setLoading] = useState(false);

  const filteredDatasets = datasets.filter(dataset => {
    const matchesSearch = dataset.original_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || dataset.file_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleSelectDataset = (datasetId) => {
    const newSelected = new Set(selectedDatasets);
    if (newSelected.has(datasetId)) {
      newSelected.delete(datasetId);
    } else {
      newSelected.add(datasetId);
    }
    setSelectedDatasets(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedDatasets.size === filteredDatasets.length) {
      setSelectedDatasets(new Set());
    } else {
      setSelectedDatasets(new Set(filteredDatasets.map(d => d.id)));
    }
  };

  const handleDeleteDataset = async (dataset) => {
    setDatasetToDelete(dataset);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!datasetToDelete) return;

    setLoading(true);
    try {
      await apiService.deleteDataset(datasetToDelete.id);
      onDatasetDelete(datasetToDelete.id);
      toast.success('Dataset deleted successfully');
      setShowDeleteModal(false);
      setDatasetToDelete(null);
    } catch (error) {
      toast.error('Failed to delete dataset');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (fileType) => {
    switch (fileType) {
      case 'csv':
      case 'xlsx':
      case 'xls':
        return <FileText className="h-5 w-5 text-green-600" />;
      case 'json':
        return <Database className="h-5 w-5 text-blue-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const DeleteModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Delete Dataset</h3>
            <p className="text-sm text-gray-600">This action cannot be undone</p>
          </div>
        </div>
        
        <p className="text-gray-700 mb-6">
          Are you sure you want to delete <strong>{datasetToDelete?.original_name}</strong>? 
          All associated queries and visualizations will also be removed.
        </p>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? <LoadingSpinner size="sm" variant="white" text="Deleting..." /> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Manager</h1>
        <p className="text-gray-600">Manage your uploaded datasets and their metadata</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search datasets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="xlsx">Excel</option>
            </select>
          </div>
        </div>
      </div>

      {/* Datasets Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                checked={selectedDatasets.size === filteredDatasets.length && filteredDatasets.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <h3 className="text-lg font-medium text-gray-900">
                {selectedDatasets.size > 0 ? `${selectedDatasets.size} selected` : 'All Datasets'}
              </h3>
            </div>
            
            {selectedDatasets.size > 0 && (
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                  <Trash2 className="h-4 w-4" />
                </button>
                <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dataset
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rows/Columns
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Upload Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDatasets.map((dataset) => (
                <tr 
                  key={dataset.id} 
                  className={`hover:bg-gray-50 ${selectedDataset?.id === dataset.id ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedDatasets.has(dataset.id)}
                        onChange={() => handleSelectDataset(dataset.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center space-x-3">
                        {getFileTypeIcon(dataset.file_type)}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {dataset.original_name}
                          </div>
                          <div className="text-sm text-gray-500">{dataset.id}</div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {dataset.file_type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatFileSize(dataset.metadata?.file_size || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dataset.metadata?.rows || 0} × {dataset.metadata?.columns || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{new Date(dataset.upload_time).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">Processed</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onDatasetSelect(dataset)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Select Dataset"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDatasetEdit(dataset)}
                        className="text-gray-600 hover:text-gray-900"
                        title="View Details"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDataset(dataset)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Dataset"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredDatasets.length === 0 && (
            <div className="text-center py-12">
              <Database className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No datasets found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'Upload your first dataset to get started.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && <DeleteModal />}
    </div>
  );
};

export default DataManager;
