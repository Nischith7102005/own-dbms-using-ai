import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Star, 
  Copy, 
  Eye, 
  Code, 
  BookOpen,
  Lightbulb,
  TrendingUp,
  Database,
  BarChart3,
  Heart,
  ThumbsUp
} from 'lucide-react';

const QueryLibrary = ({ onQuerySelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedQuery, setSelectedQuery] = useState(null);

  const categories = [
    { id: 'all', label: 'All Queries', icon: Database },
    { id: 'basic', label: 'Basic', icon: BookOpen },
    { id: 'filtering', label: 'Filtering', icon: Filter },
    { id: 'analysis', label: 'Analysis', icon: TrendingUp },
    { id: 'visualization', label: 'Visualization', icon: BarChart3 }
  ];

  const queryLibrary = [
    {
      id: 1,
      title: 'Show All Data',
      query: 'Show me all data',
      description: 'Display all records from the dataset',
      category: 'basic',
      difficulty: 'beginner',
      rating: 4.8,
      likes: 156,
      examples: ['Show me all records', 'Display all data', 'Show everything']
    },
    {
      id: 2,
      title: 'Count Records',
      query: 'Count total records',
      description: 'Get the total number of records in the dataset',
      category: 'basic',
      difficulty: 'beginner',
      rating: 4.9,
      likes: 142,
      examples: ['Count all records', 'How many records are there', 'Total number of rows']
    },
    {
      id: 3,
      title: 'Filter by Value',
      query: 'Show customers where age is greater than 25',
      description: 'Filter records based on numeric conditions',
      category: 'filtering',
      difficulty: 'intermediate',
      rating: 4.7,
      likes: 98,
      examples: ['Show users where score > 80', 'Find products with price below 100']
    },
    {
      id: 4,
      title: 'Text Search',
      query: 'Find customers from New York',
      description: 'Search for records containing specific text',
      category: 'filtering',
      difficulty: 'intermediate',
      rating: 4.6,
      likes: 87,
      examples: ['Find products containing smartphone', 'Show orders from California']
    },
    {
      id: 5,
      title: 'Calculate Average',
      query: 'Calculate average sales by region',
      description: 'Compute average values grouped by category',
      category: 'analysis',
      difficulty: 'intermediate',
      rating: 4.8,
      likes: 134,
      examples: ['Average price by category', 'Mean score by department']
    },
    {
      id: 6,
      title: 'Sum by Group',
      query: 'Sum total revenue by month',
      description: 'Calculate totals grouped by time period',
      category: 'analysis',
      difficulty: 'intermediate',
      rating: 4.7,
      likes: 112,
      examples: ['Total sales by quarter', 'Sum expenses by category']
    },
    {
      id: 7,
      title: 'Bar Chart',
      query: 'Create bar chart of sales by region',
      description: 'Generate bar chart visualization',
      category: 'visualization',
      difficulty: 'advanced',
      rating: 4.9,
      likes: 203,
      examples: ['Bar chart of revenue by product', 'Sales by category bar chart']
    },
    {
      id: 8,
      title: 'Line Chart',
      query: 'Show line chart of monthly trends',
      description: 'Create line chart for time series data',
      category: 'visualization',
      difficulty: 'advanced',
      rating: 4.8,
      likes: 178,
      examples: ['Line graph of daily sales', 'Monthly revenue trend']
    }
  ];

  const filteredQueries = queryLibrary.filter(query => {
    const matchesSearch = query.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         query.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         query.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || query.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const copyQuery = (query) => {
    navigator.clipboard.writeText(query);
    // Toast notification would go here
  };

  const useQuery = (query) => {
    onQuerySelect(query);
    // Navigate to query editor would go here
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Query Library</h1>
        <p className="text-gray-600">Explore and learn from example queries</p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search queries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg border transition-colors flex items-center space-x-2 ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{category.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Query Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredQueries.map((query) => (
          <div key={query.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{query.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{query.description}</p>
                </div>
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span>{query.rating}</span>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2">
                  <Code className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-mono text-gray-700">{query.query}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(query.difficulty)}`}>
                    {query.difficulty}
                  </span>
                  <span className="text-xs text-gray-500">
                    {categories.find(c => c.id === query.category)?.label}
                  </span>
                </div>
                
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Heart className="h-4 w-4" />
                  <span>{query.likes}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => copyQuery(query.query)}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <Copy className="h-4 w-4" />
                  <span className="text-sm">Copy</span>
                </button>
                
                <button
                  onClick={() => setSelectedQuery(query)}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => useQuery(query.query)}
                  className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <Lightbulb className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Query Detail Modal */}
      {selectedQuery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">{selectedQuery.title}</h3>
                <button
                  onClick={() => setSelectedQuery(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Query</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <code className="text-sm text-gray-700">{selectedQuery.query}</code>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600">{selectedQuery.description}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Similar Examples</h4>
                  <div className="space-y-2">
                    {selectedQuery.examples.map((example, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <code className="text-sm text-gray-700">{example}</code>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 pt-4">
                  <button
                    onClick={() => copyQuery(selectedQuery.query)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy Query</span>
                  </button>
                  
                  <button
                    onClick={() => useQuery(selectedQuery.query)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Lightbulb className="h-4 w-4" />
                    <span>Use Query</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueryLibrary;