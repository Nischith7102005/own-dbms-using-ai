
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Play, 
  CheckCircle, 
  ArrowRight, 
  Award,
  Star,
  Lock,
  Unlock,
  Brain,
  Target,
  Lightbulb,
  Code,
  BarChart3,
  Database,
  Copy,
  CheckCheck
} from 'lucide-react';
import { apiService } from '../services/api';

const Tutorial = ({ progress, onProgressUpdate }) => {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentLesson, setCurrentLesson] = useState(1);
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [queryExamples, setQueryExamples] = useState([]);
  const [copiedQuery, setCopiedQuery] = useState(null);

  useEffect(() => {
    loadQueryExamples();
  }, []);

  const loadQueryExamples = async () => {
    try {
      const examples = await apiService.getQueryExamples();
      setQueryExamples(examples);
    } catch (error) {
      console.error('Error loading query examples:', error);
    }
  };

  const copyQuery = (query) => {
    navigator.clipboard.writeText(query);
    setCopiedQuery(query);
    setTimeout(() => setCopiedQuery(null), 2000);
  };

  const tutorialLevels = [
    {
      id: 1,
      title: 'Getting Started',
      description: 'Learn the basics of Sankalp query language',
      icon: BookOpen,
      color: 'blue',
      lessons: [
        {
          id: 1,
          title: 'What is Sankalp?',
          description: 'Introduction to natural language database queries',
          content: 'Sankalp is a natural language query system that lets you ask questions about your data in plain English. No need to learn complex SQL syntax! Just type what you want to know about your data.'
        },
        {
          id: 2,
          title: 'Basic Data Operations',
          description: 'Learn fundamental data viewing commands',
          content: 'Start with simple queries to explore your data. You can view all data, count records, see columns, and get basic information about your dataset.'
        },
        {
          id: 3,
          title: 'Understanding Results',
          description: 'How to interpret query results',
          content: 'Query results can be tables, metrics, charts, or simple values depending on what you ask. Each result includes helpful information about what was found.'
        }
      ]
    },
    {
      id: 2,
      title: 'Data Filtering',
      description: 'Learn to filter and search your data',
      icon: Database,
      color: 'green',
      lessons: [
        {
          id: 1,
          title: 'Comparison Filters',
          description: 'Filter data with comparison operations',
          content: 'Use natural language to filter your data with conditions like "greater than", "less than", or "equal to". Perfect for finding specific ranges or exact matches.'
        },
        {
          id: 2,
          title: 'Text Search',
          description: 'Search within text fields',
          content: 'Find records containing specific text or phrases. Use "contains" to search within text fields or exact matches for precise filtering.'
        }
      ]
    },
    {
      id: 3,
      title: 'Data Analysis',
      description: 'Perform calculations and aggregations',
      icon: Brain,
      color: 'purple',
      lessons: [
        {
          id: 1,
          title: 'Basic Calculations',
          description: 'Calculate averages, sums, and counts',
          content: 'Perform mathematical operations on your data. Calculate averages, sums, find maximum and minimum values, or count records that meet certain criteria.'
        },
        {
          id: 2,
          title: 'Grouping Data',
          description: 'Group data by categories for analysis',
          content: 'Group your analysis by categories or dimensions. For example, calculate average sales by region or count customers by city to understand patterns in your data.'
        }
      ]
    },
    {
      id: 4,
      title: 'Data Visualization',
      description: 'Create charts and graphs',
      icon: BarChart3,
      color: 'orange',
      lessons: [
        {
          id: 1,
          title: 'Basic Charts',
          description: 'Create bar charts and line graphs',
          content: 'Visualize your data with charts and graphs. Create bar charts for categorical data, line charts for trends over time, and more.'
        },
        {
          id: 2,
          title: 'Advanced Visualizations',
          description: 'Pie charts and scatter plots',
          content: 'Create more sophisticated visualizations like pie charts for distributions and scatter plots to explore relationships between variables.'
        }
      ]
    }
  ];

  const currentLevelData = tutorialLevels.find(level => level.id === currentLevel);
  const currentLessonData = currentLevelData?.lessons.find(lesson => lesson.id === currentLesson);

  const completeLesson = () => {
    const lessonKey = `${currentLevel}-${currentLesson}`;
    setCompletedLessons(prev => new Set([...prev, lessonKey]));
    
    // Move to next lesson or level
    if (currentLesson < currentLevelData.lessons.length) {
      setCurrentLesson(currentLesson + 1);
    } else if (currentLevel < tutorialLevels.length) {
      setCurrentLevel(currentLevel + 1);
      setCurrentLesson(1);
    }
  };

  const isLessonCompleted = (levelId, lessonId) => {
    return completedLessons.has(`${levelId}-${lessonId}`);
  };

  const isLevelUnlocked = (levelId) => {
    if (levelId === 1) return true;
    
    // Check if previous level is completed
    const previousLevel = tutorialLevels.find(level => level.id === levelId - 1);
    if (!previousLevel) return false;
    
    return previousLevel.lessons.every(lesson => 
      isLessonCompleted(levelId - 1, lesson.id)
    );
  };

  const getLevelProgress = (levelId) => {
    const level = tutorialLevels.find(l => l.id === levelId);
    if (!level) return 0;
    
    const completedCount = level.lessons.filter(lesson => 
      isLessonCompleted(levelId, lesson.id)
    ).length;
    
    return (completedCount / level.lessons.length) * 100;
  };

  const LevelCard = ({ level }) => {
    const Icon = level.icon;
    const isUnlocked = isLevelUnlocked(level.id);
    const progress = getLevelProgress(level.id);
    const isCompleted = progress === 100;

    return (
      <div className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
        currentLevel === level.id 
          ? `border-${level.color}-500 bg-${level.color}-50` 
          : 'border-gray-200 hover:border-gray-300'
      } ${!isUnlocked ? 'opacity-50' : ''}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-${level.color}-100`}>
                <Icon className={`h-6 w-6 text-${level.color}-600`} />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">{level.title}</h3>
                <p className="text-sm text-gray-600">{level.description}</p>
              </div>
            </div>
            {isCompleted ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : !isUnlocked ? (
              <Lock className="h-6 w-6 text-gray-400" />
            ) : (
              <Unlock className="h-6 w-6 text-gray-400" />
            )}
          </div>
          
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`bg-${level.color}-500 h-2 rounded-full transition-all duration-300`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            {level.lessons.map((lesson) => (
              <div
                key={lesson.id}
                className={`flex items-center space-x-2 text-sm ${
                  isLessonCompleted(level.id, lesson.id)
                    ? 'text-green-600'
                    : 'text-gray-600'
                }`}
              >
                {isLessonCompleted(level.id, lesson.id) ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-gray-300" />
                )}
                <span>{lesson.title}</span>
              </div>
            ))}
          </div>
          
          {isUnlocked && (
            <button
              onClick={() => setCurrentLevel(level.id)}
              className={`w-full mt-4 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentLevel === level.id
                  ? `bg-${level.color}-600 text-white`
                  : `bg-${level.color}-100 text-${level.color}-700 hover:bg-${level.color}-200`
              }`}
            >
              {currentLevel === level.id ? 'Continue' : 'Start Level'}
            </button>
          )}
        </div>
      </div>
    );
  };

  const QueryExampleCard = ({ category, queries }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">{category}</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {queries.map((example, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Code className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-mono text-gray-700">{example.query}</span>
                </div>
                <button
                  onClick={() => copyQuery(example.query)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Copy query"
                >
                  {copiedQuery === example.query ? (
                    <CheckCheck className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-600">{example.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tutorial</h1>
        <p className="text-gray-600">Learn Sankalp query language step by step</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Level Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Learning Path</h3>
            <div className="space-y-4">
              {tutorialLevels.map((level) => (
                <LevelCard key={level.id} level={level} />
              ))}
            </div>
          </div>
        </div>

        {/* Lesson Content */}
        <div className="lg:col-span-2">
          {currentLevelData && currentLessonData ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {currentLevelData.title} - Lesson {currentLesson}
                    </h3>
                    <p className="text-sm text-gray-600">{currentLessonData.title}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {currentLesson} of {currentLevelData.lessons.length}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">
                      {currentLessonData.title}
                    </h4>
                    <p className="text-gray-600 leading-relaxed">
                      {currentLessonData.content}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center space-x-2">
                      {isLessonCompleted(currentLevel, currentLesson) ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border border-gray-300" />
                      )}
                      <span className="text-sm text-gray-600">
                        {isLessonCompleted(currentLevel, currentLesson) ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                    
                    <button
                      onClick={completeLesson}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                    >
                      <span>Complete Lesson</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center mb-6">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select a level to start learning</p>
            </div>
          )}

          {/* Query Examples */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Sankalp Query Language Reference</h2>
            <p className="text-gray-600 mb-6">Complete list of supported queries and their operations</p>
            
            {queryExamples.length > 0 ? (
              queryExamples.map((category, index) => (
                <QueryExampleCard
                  key={index}
                  category={category.category}
                  queries={category.queries}
                />
              ))
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <Code className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Loading query examples...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
