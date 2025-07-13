import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  File, 
  FileText, 
  Database, 
  CheckCircle, 
  AlertCircle,
  X,
  Eye,
  BarChart3
} from 'lucide-react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const FileUpload = ({ onUpload, config }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const allowedTypes = config?.allowed_file_types || ['csv', 'json', 'xlsx', 'xls'];

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Check file type
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
      toast.error(`File type .${fileExt} not supported. Allowed types: ${allowedTypes.join(', ')}`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadedFile(null);

    try {
      const result = await apiService.uploadFile(file, (progress) => {
        setUploadProgress(progress);
      });

      setUploadedFile(result);
      setPreviewData(result.metadata);
      setShowPreview(true);
      
      toast.success('File uploaded successfully!');
      
      if (onUpload) {
        onUpload(result);
      }
    } catch (error) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [allowedTypes, onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    disabled: uploading
  });

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'csv':
        return <FileText className="h-8 w-8 text-green-600" />;
      case 'json':
        return <File className="h-8 w-8 text-blue-600" />;
      case 'xlsx':
      case 'xls':
        return <BarChart3 className="h-8 w-8 text-orange-600" />;
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Dataset</h1>
        <p className="text-gray-600">Upload your data files to start analyzing with Sankalp</p>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : uploading
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <div>
              <p className="text-lg font-medium text-gray-900">Uploading...</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">{uploadProgress}% complete</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Upload className="h-12 w-12 text-gray-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragActive ? 'Drop your file here' : 'Drag & drop your file here'}
              </p>
              <p className="text-gray-600">or click to browse</p>
            </div>
            <div className="text-sm text-gray-500">
              <p>Supported formats: {allowedTypes.join(', ').toUpperCase()}</p>
              <p>Maximum file size: {config?.max_file_size || 100}MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Success */}
      {uploadedFile && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start space-x-4">
            <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900">File Uploaded Successfully!</h3>
              <div className="mt-2 text-sm text-green-800">
                <p><strong>File:</strong> {uploadedFile.original_name}</p>
                <p><strong>Size:</strong> {formatFileSize(uploadedFile.metadata?.file_size || 0)}</p>
                <p><strong>Records:</strong> {uploadedFile.metadata?.rows || 0}</p>
                <p><strong>Columns:</strong> {uploadedFile.metadata?.columns || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {showPreview && previewData && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Data Preview</h3>
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* File Info */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  {getFileIcon(uploadedFile?.file_type)}
                  <div>
                    <p className="font-medium text-gray-900">File Type</p>
                    <p className="text-sm text-gray-600">{uploadedFile?.file_type?.toUpperCase()}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Database className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Records</p>
                    <p className="text-sm text-gray-600">{previewData.rows?.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Columns</p>
                    <p className="text-sm text-gray-600">{previewData.columns}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Eye className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-900">Size</p>
                    <p className="text-sm text-gray-600">{formatFileSize(previewData.file_size || 0)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Column Information */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Column Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {previewData.column_names?.map((column) => (
                  <div key={column} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium text-gray-900 text-sm">{column}</span>
                    <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded">
                      {previewData.column_types?.[column] || 'unknown'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sample Data */}
            {previewData.sample_data && previewData.sample_data.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Sample Data</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        {previewData.column_names?.map((column) => (
                          <th key={column} className="px-4 py-2 text-left text-sm font-medium text-gray-900 border-b">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.sample_data.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          {previewData.column_names?.map((column) => (
                            <td key={column} className="px-4 py-2 text-sm text-gray-900 border-b">
                              {row[column] || ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Tips for Better Results</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
            <span>Use descriptive column names for better query understanding</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
            <span>Ensure your data is clean and formatted consistently</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
            <span>CSV files should have headers in the first row</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
            <span>Large files may take longer to process</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
