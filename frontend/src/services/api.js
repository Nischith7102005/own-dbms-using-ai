import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.client.get('/api/health');
      return response.data;
    } catch (error) {
      throw new Error('Failed to connect to server');
    }
  }

  // Configuration
  async getConfig() {
    try {
      const response = await this.client.get('/api/config');
      return response.data;
    } catch (error) {
      throw new Error('Failed to get configuration');
    }
  }

  // File upload
  async uploadFile(file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log('API Request: POST /api/upload');
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      const response = await this.client.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          if (onProgress) {
            onProgress(percentCompleted);
          }
        },
        timeout: 30000, // 30 second timeout
      });

      console.log('Upload response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      console.error('Full error:', error);

      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.message === 'Network Error') {
        throw new Error('Cannot connect to server. Please check if the backend is running.');
      } else {
        throw new Error(error.message || 'Upload failed');
      }
    }
  }

  // Datasets
  async getDatasets() {
    try {
      const response = await this.client.get('/api/datasets');
      return response.data.datasets;
    } catch (error) {
      throw new Error('Failed to get datasets');
    }
  }

  async getDataset(datasetId) {
    try {
      const response = await this.client.get(`/api/datasets/${datasetId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to get dataset');
    }
  }

  async deleteDataset(datasetId) {
    try {
      const response = await this.client.delete(`/api/datasets/${datasetId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to delete dataset');
    }
  }

  // Queries
  async executeQuery(query, datasetId) {
    try {
      const response = await this.client.post('/api/query', {
        query,
        dataset_id: datasetId,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to execute query');
    }
  }

  async getQueryHistory() {
    try {
      const response = await this.client.get('/api/queries');
      return response.data.queries;
    } catch (error) {
      throw new Error('Failed to get query history');
    }
  }

  // Visualizations
  async createVisualization(datasetId, chartType, config) {
    try {
      const response = await this.client.post('/api/visualize', {
        dataset_id: datasetId,
        chart_type: chartType,
        config,
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to create visualization');
    }
  }

  // Tutorial
  async getTutorialLevels() {
    try {
      const response = await this.client.get('/api/tutorial/levels');
      return response.data.levels;
    } catch (error) {
      throw new Error('Failed to get tutorial levels');
    }
  }

  async getQueryExamples() {
    try {
      const response = await this.client.get('/api/tutorial/examples');
      return response.data.examples;
    } catch (error) {
      throw new Error('Failed to get query examples');
    }
  }
}

export const apiService = new ApiService();
export default apiService;