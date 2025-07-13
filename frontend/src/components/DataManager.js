import React, { useState } from 'react';
import { 
  FileText, 
  Database, 
  Trash2, 
  Edit3, 
  Eye, 
  Download, 
  Upload,
  MoreVertical,
  Calendar,
  BarChart3,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  RefreshCw
} from 'lucide-react';

const DataManager = ({ 
  datasets, 
  selectedDataset, 
  onDatasetSelect, 
  onDatasetDelete, 
  onDatasetEdit 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('upload_time');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedDatasets, setSelectedDatasets] = useState(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [datasetToDelete, setDatasetToDelete] = useState(null);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'csv':
        return <FileText className="h-5 w-5 text-green-600" />;
      case 'json':
        return <Database className="h-5 w-5 text-blue-600" />;
      case 'xlsx':
      case 'xls':
        return <BarChart3 className="h-5 w-5 text-orange-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const filteredDatasets = datasets
    .filter(dataset => 
      dataset.original_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dataset.file_type.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
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

  const handleDeleteDataset = (dataset) => {
    setDatasetToDelete(dataset);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (datasetToDelete) {
      onDatasetDelete(datasetToDelete.id);
      setShowDeleteModal(false);
      setDatasetToDelete(null);
    }
  };

  const DeleteModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Delete Dataset</h3>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete "{datasetToDelete?.original_name}"? This action cannot be undone.
          </p>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Manager</h1>
          <p className="text-gray-600">Manage your uploaded datasets</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            {datasets.length} dataset{datasets.length !== 1 ? 's' : ''}
          </span>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span>Upload New</span>
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search datasets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="upload_time">Upload Date</option>
              <option value="original_name">Name</option>
              <option value="file_type">Type</option>
              <option value="metadata.rows">Rows</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </button>
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
                  Rows
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Columns
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDatasets.map((dataset) => (
                <tr
                  key={dataset.id}
                  className={`hover:bg-gray-50 ${
                    selectedDataset?.id === dataset.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedDatasets.has(dataset.id)}
                        onChange={() => handleSelectDataset(dataset.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                      />
                      <div className="flex items-center space-x-3">
                        {getFileIcon(dataset.file_type)}
                        <div>
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {dataset.original_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {dataset.id}
                          </div>
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
                    {dataset.metadata?.rows?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dataset.metadata?.columns || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(dataset.upload_time)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onDatasetSelect(dataset)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Select dataset"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDatasetEdit(dataset)}
                        className="text-green-600 hover:text-green-900"
                        title="Edit dataset"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDataset(dataset)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete dataset"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredDatasets.length === 0 && (
          <div className="px-6 py-12 text-center">
            <Database className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? 'No datasets match your search' : 'No datasets uploaded yet'}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              {searchTerm ? 'Try adjusting your search terms' : 'Upload your first dataset to get started'}
            </p>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && <DeleteModal />}
    </div>
  );
};

export default DataManager;