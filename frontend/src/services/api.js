import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Add authentication token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        return response.data;
      },
      (error) => {
        console.error('API Error:', error);
        
        if (error.response) {
          // Server responded with error status
          const { status, data } = error.response;
          
          if (status === 401) {
            // Unauthorized - redirect to login or handle auth
            localStorage.removeItem('auth_token');
            toast.error('Session expired. Please log in again.');
          } else if (status === 403) {
            toast.error('Access forbidden');
          } else if (status === 404) {
            toast.error('Resource not found');
          } else if (status === 500) {
            toast.error('Server error. Please try again later.');
          } else {
            toast.error(data?.detail || 'An error occurred');
          }
        } else if (error.request) {
          // Request was made but no response received
          toast.error('Network error. Please check your connection.');
        } else {
          // Something else happened
          toast.error('An unexpected error occurred');
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.api.get('/health');
      return response;
    } catch (error) {
      throw new Error('Backend service unavailable');
    }
  }

  // Configuration
  async getConfig() {
    return await this.api.get('/config');
  }

  // Dataset management
  async uploadFile(file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);

    return await this.api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
  }

  async getDatasets() {
    return await this.api.get('/datasets');
  }

  async getDataset(datasetId) {
    return await this.api.get(`/datasets/${datasetId}`);
  }

  async deleteDataset(datasetId) {
    return await this.api.delete(`/datasets/${datasetId}`);
  }

  async updateDataset(datasetId, updates) {
    return await this.api.put(`/datasets/${datasetId}`, updates);
  }

  // Query execution
  async executeQuery(query, datasetId) {
    return await this.api.post('/query', {
      query,
      dataset_id: datasetId,
    });
  }

  async getQueryHistory() {
    return await this.api.get('/queries');
  }

  async getQueryById(queryId) {
    return await this.api.get(`/queries/${queryId}`);
  }

  async deleteQuery(queryId) {
    return await this.api.delete(`/queries/${queryId}`);
  }

  async saveQuery(query, datasetId, name, description) {
    return await this.api.post('/queries/save', {
      query,
      dataset_id: datasetId,
      name,
      description,
    });
  }

  // Visualization
  async createVisualization(datasetId, chartType, config) {
    return await this.api.post('/visualize', {
      dataset_id: datasetId,
      chart_type: chartType,
      config,
    });
  }

  async getVisualizationSuggestions(datasetId) {
    return await this.api.get(`/visualize/suggestions/${datasetId}`);
  }

  async exportVisualization(vizId, format) {
    return await this.api.get(`/visualize/export/${vizId}`, {
      params: { format },
      responseType: 'blob',
    });
  }

  // Tutorial system
  async getTutorialLevels() {
    return await this.api.get('/tutorial/levels');
  }

  async getTutorialLevel(levelId) {
    return await this.api.get(`/tutorial/levels/${levelId}`);
  }

  async updateTutorialProgress(levelId, progress) {
    return await this.api.post(`/tutorial/progress/${levelId}`, { progress });
  }

  async getTutorialProgress() {
    return await this.api.get('/tutorial/progress');
  }

  // Query examples and library
  async getQueryExamples() {
    return await this.api.get('/tutorial/examples');
  }

  async getQueryTemplates() {
    return await this.api.get('/library/templates');
  }

  async searchQueryLibrary(query) {
    return await this.api.get('/library/search', { params: { q: query } });
  }

  async getPopularQueries() {
    return await this.api.get('/library/popular');
  }

  async rateQuery(queryId, rating) {
    return await this.api.post(`/library/rate/${queryId}`, { rating });
  }

  // Data analysis and insights
  async getDataInsights(datasetId) {
    return await this.api.get(`/insights/${datasetId}`);
  }

  async getDataProfile(datasetId) {
    return await this.api.get(`/profile/${datasetId}`);
  }

  async detectAnomalies(datasetId) {
    return await this.api.get(`/anomalies/${datasetId}`);
  }

  async getCorrelationMatrix(datasetId) {
    return await this.api.get(`/correlation/${datasetId}`);
  }

  // Export and sharing
  async exportDataset(datasetId, format) {
    return await this.api.get(`/export/${datasetId}`, {
      params: { format },
      responseType: 'blob',
    });
  }

  async shareDataset(datasetId, shareOptions) {
    return await this.api.post(`/share/${datasetId}`, shareOptions);
  }

  async getSharedDatasets() {
    return await this.api.get('/shared');
  }

  // User management (if multi-user mode)
  async login(credentials) {
    const response = await this.api.post('/auth/login', credentials);
    if (response.access_token) {
      localStorage.setItem('auth_token', response.access_token);
    }
    return response;
  }

  async logout() {
    localStorage.removeItem('auth_token');
    return await this.api.post('/auth/logout');
  }

  async register(userData) {
    return await this.api.post('/auth/register', userData);
  }

  async getCurrentUser() {
    return await this.api.get('/auth/me');
  }

  async updateUserProfile(updates) {
    return await this.api.put('/auth/profile', updates);
  }

  // Advanced features
  async getQuerySuggestions(datasetId, partialQuery) {
    return await this.api.post('/query/suggestions', {
      dataset_id: datasetId,
      partial_query: partialQuery,
    });
  }

  async validateQuery(query, datasetId) {
    return await this.api.post('/query/validate', {
      query,
      dataset_id: datasetId,
    });
  }

  async getQueryExplanation(query) {
    return await this.api.post('/query/explain', { query });
  }

  async optimizeQuery(query, datasetId) {
    return await this.api.post('/query/optimize', {
      query,
      dataset_id: datasetId,
    });
  }

  // System administration
  async getSystemStats() {
    return await this.api.get('/admin/stats');
  }

  async getSystemHealth() {
    return await this.api.get('/admin/health');
  }

  async getSystemLogs() {
    return await this.api.get('/admin/logs');
  }

  async clearCache() {
    return await this.api.post('/admin/cache/clear');
  }
}

export const apiService = new ApiService();
export default apiService;