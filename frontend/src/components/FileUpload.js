import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  File, 
  FileText, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  X,
  Eye,
  Download,
  BarChart3,
  Database,
  Loader2
} from 'lucide-react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const FileUpload = ({ onUpload, datasets, selectedDataset, onDatasetSelect }) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'csv':
        return <FileSpreadsheet className="h-8 w-8 text-green-600" />;
      case 'json':
        return <FileText className="h-8 w-8 text-blue-600" />;
      case 'xlsx':
      case 'xls':
        return <FileSpreadsheet className="h-8 w-8 text-green-600" />;
      default:
        return <File className="h-8 w-8 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const supportedTypes = ['csv', 'json', 'xlsx', 'xls'];
    
    if (!supportedTypes.includes(fileExtension)) {
      toast.error('Unsupported file type. Please upload CSV, JSON, or Excel files.');
      return;
    }

    // No file size limits - accept any size file

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = await apiService.uploadFile(file, (progress) => {
        setUploadProgress(progress);
      });

      setUploadedFile(result);
      setPreviewData(result.metadata?.sample_data || []);
      onUpload(result);
      
      toast.success('File uploaded successfully!');
      setShowPreview(true);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  const DataPreview = ({ data, metadata }) => {
    if (!data || data.length === 0) return null;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Data Preview</h3>
          <button
            onClick={() => setShowPreview(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Total Rows</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 mt-2">{metadata?.rows || 0}</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">Columns</span>
            </div>
            <p className="text-2xl font-bold text-green-600 mt-2">{metadata?.columns || 0}</p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">File Size</span>
            </div>
            <p className="text-2xl font-bold text-purple-600 mt-2">
              {formatFileSize(metadata?.file_size || 0)}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {metadata?.column_names?.map((column, index) => (
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
              {data.slice(0, 5).map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {metadata?.column_names?.map((column, colIndex) => (
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
        
        <div className="mt-4 text-sm text-gray-500 text-center">
          Showing first 5 rows of {metadata?.rows || 0} total rows
        </div>
      </div>
    );
  };

  const DatasetsList = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Your Datasets</h3>
        <p className="text-sm text-gray-600 mt-1">Select a dataset to work with</p>
      </div>
      
      <div className="divide-y divide-gray-200">
        {datasets.length > 0 ? (
          datasets.map((dataset) => (
            <div
              key={dataset.id}
              className={`px-6 py-4 hover:bg-gray-50 cursor-pointer ${
                selectedDataset?.id === dataset.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
              onClick={() => onDatasetSelect(dataset)}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {getFileIcon(dataset.file_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {dataset.original_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {dataset.metadata?.rows} rows • {dataset.metadata?.columns} columns • {formatFileSize(dataset.metadata?.file_size || 0)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Uploaded {new Date(dataset.upload_time).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {selectedDataset?.id === dataset.id && (
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-6 py-8 text-center">
            <Database className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No datasets uploaded yet</p>
            <p className="text-sm text-gray-400">Upload your first dataset to get started</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Data</h1>
        <p className="text-gray-600">Upload CSV, JSON, or Excel files to start querying your data</p>
      </div>

      {/* Upload Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <Upload className="h-8 w-8 text-gray-400" />
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {isDragActive ? 'Drop your file here' : 'Upload your data file'}
                </h3>
                <p className="text-gray-600 mt-2">
                  Drag and drop or click to select a file
                </p>
              </div>
              
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <span>CSV</span>
                <span>•</span>
                <span>JSON</span>
                <span>•</span>
                <span>Excel</span>
                <span>•</span>
                <span>No Size Limit</span>
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                <span className="text-sm font-medium text-gray-900">Uploading and processing...</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">{uploadProgress}% complete</p>
            </div>
          )}

          {/* Upload Success */}
          {uploadedFile && !isUploading && (
            <div className="bg-green-50 rounded-lg p-6 border border-green-200">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="text-lg font-medium text-green-900">Upload Successful!</h3>
                  <p className="text-green-700 mt-1">
                    {uploadedFile.filename} has been processed and is ready to use.
                  </p>
                </div>
              </div>
              
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => setShowPreview(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>Preview Data</span>
                </button>
                <button
                  onClick={() => onDatasetSelect(uploadedFile)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Start Querying
                </button>
              </div>
            </div>
          )}

          {/* File Format Guide */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Supported File Formats</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">CSV Files</p>
                  <p className="text-xs text-gray-600">Comma-separated values with headers</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">JSON Files</p>
                  <p className="text-xs text-gray-600">Structured data in JSON format</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Excel Files</p>
                  <p className="text-xs text-gray-600">Microsoft Excel (.xlsx, .xls)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Datasets List */}
        <DatasetsList />
      </div>

      {/* Data Preview Modal */}
      {showPreview && previewData && (
        <DataPreview data={previewData} metadata={uploadedFile?.metadata} />
      )}
    </div>
  );
};

export default FileUpload;