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
  Database
} from 'lucide-react';

const Tutorial = ({ progress, onProgressUpdate }) => {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentLesson, setCurrentLesson] = useState(1);
  const [completedLessons, setCompletedLessons] = useState(new Set());

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
          content: 'Sankalp is a natural language query system that lets you ask questions about your data in plain English. No need to learn complex SQL syntax!'
        },
        {
          id: 2,
          title: 'Basic Queries',
          description: 'Learn to ask simple questions',
          content: 'Start with simple queries like "Show me all data" or "Count total records"'
        },
        {
          id: 3,
          title: 'Understanding Results',
          description: 'How to interpret query results',
          content: 'Query results can be tables, metrics, or visualizations depending on what you ask.'
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
          title: 'Basic Filtering',
          description: 'Filter data with conditions',
          content: 'Use queries like "Show customers where age is greater than 25" or "Find products with price below 100"'
        },
        {
          id: 2,
          title: 'Text Filtering',
          description: 'Search text fields',
          content: 'Filter text data with "Show customers from New York" or "Find products containing smartphone"'
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
          content: 'Use queries like "Calculate average sales" or "Sum total revenue by region"'
        },
        {
          id: 2,
          title: 'Grouping Data',
          description: 'Group data by categories',
          content: 'Group your analysis with "Average sales by region" or "Count customers by city"'
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
          content: 'Create visualizations with "Create bar chart of sales by region" or "Show line chart of monthly trends"'
        },
        {
          id: 2,
          title: 'Advanced Visualizations',
          description: 'Pie charts and scatter plots',
          content: 'Use "Generate pie chart of category distribution" or "Create scatter plot of price vs sales"'
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tutorial</h1>
        <p className="text-gray-600">Learn Sankalp query language step by step</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Level Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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
                  
                  {/* Interactive Example */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2">Try it yourself:</h5>
                    <div className="bg-white rounded border border-gray-200 p-3">
                      <div className="flex items-center space-x-2">
                        <Code className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-mono text-gray-700">
                          Show me all data
                        </span>
                      </div>
                    </div>
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select a level to start learning</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tutorial;