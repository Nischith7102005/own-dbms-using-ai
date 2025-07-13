import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Database, 
  Users, 
  Globe, 
  Shield, 
  Palette, 
  Bell,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
  HelpCircle,
  Monitor,
  Smartphone,
  Moon,
  Sun
} from 'lucide-react';

const Settings = ({ config, onConfigUpdate }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [localConfig, setLocalConfig] = useState(config || {});
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  const handleConfigChange = (key, value) => {
    setLocalConfig(prev => ({
      ...prev,
      [key]: value
    }));
    setUnsavedChanges(true);
  };

  const saveConfig = () => {
    onConfigUpdate(localConfig);
    setUnsavedChanges(false);
  };

  const resetConfig = () => {
    setLocalConfig(config || {});
    setUnsavedChanges(false);
  };

  const GeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Application Mode
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="mode"
                  value="single"
                  checked={!localConfig.multi_user_mode}
                  onChange={(e) => handleConfigChange('multi_user_mode', false)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Single User</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="mode"
                  value="multi"
                  checked={localConfig.multi_user_mode}
                  onChange={(e) => handleConfigChange('multi_user_mode', true)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Multi User</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Single user mode disables authentication and user management
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Language
            </label>
            <select
              value={localConfig.default_language || 'en'}
              onChange={(e) => handleConfigChange('default_language', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Query Timeout (seconds)
            </label>
            <input
              type="number"
              value={localConfig.query_timeout || 30}
              onChange={(e) => handleConfigChange('query_timeout', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="10"
              max="300"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max File Size (MB)
            </label>
            <input
              type="number"
              value={parseInt(localConfig.max_file_size?.replace('MB', '')) || 100}
              onChange={(e) => handleConfigChange('max_file_size', `${e.target.value}MB`)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="1"
              max="1000"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const DatabaseSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Database Configuration</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Connection Status
            </label>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Connected to MongoDB</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Query History Retention (days)
            </label>
            <input
              type="number"
              value={localConfig.query_history_retention || 30}
              onChange={(e) => handleConfigChange('query_history_retention', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="1"
              max="365"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auto-backup
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={localConfig.auto_backup || false}
                onChange={(e) => handleConfigChange('auto_backup', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Enable automatic daily backups</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const UserSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">User Management</h3>
        
        {localConfig.multi_user_mode ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Registration
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={localConfig.allow_registration || false}
                  onChange={(e) => handleConfigChange('allow_registration', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Allow new user registration</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                value={localConfig.session_timeout || 60}
                onChange={(e) => handleConfigChange('session_timeout', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="5"
                max="480"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password Requirements
              </label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localConfig.require_strong_password || false}
                    onChange={(e) => handleConfigChange('require_strong_password', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Require strong passwords</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localConfig.require_2fa || false}
                    onChange={(e) => handleConfigChange('require_2fa', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Require two-factor authentication</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-700">
                User management is disabled in single-user mode
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const AppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Appearance</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  checked={localConfig.theme === 'light' || !localConfig.theme}
                  onChange={(e) => handleConfigChange('theme', 'light')}
                  className="mr-2"
                />
                <Sun className="h-4 w-4 mr-1" />
                <span className="text-sm text-gray-700">Light</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={localConfig.theme === 'dark'}
                  onChange={(e) => handleConfigChange('theme', 'dark')}
                  className="mr-2"
                />
                <Moon className="h-4 w-4 mr-1" />
                <span className="text-sm text-gray-700">Dark</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="theme"
                  value="auto"
                  checked={localConfig.theme === 'auto'}
                  onChange={(e) => handleConfigChange('theme', 'auto')}
                  className="mr-2"
                />
                <Monitor className="h-4 w-4 mr-1" />
                <span className="text-sm text-gray-700">Auto</span>
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Font Size
            </label>
            <select
              value={localConfig.font_size || 'medium'}
              onChange={(e) => handleConfigChange('font_size', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compact Mode
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={localConfig.compact_mode || false}
                onChange={(e) => handleConfigChange('compact_mode', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Use compact interface</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const NotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Query Notifications
            </label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={localConfig.notify_query_success || false}
                  onChange={(e) => handleConfigChange('notify_query_success', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Notify on successful queries</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={localConfig.notify_query_error || true}
                  onChange={(e) => handleConfigChange('notify_query_error', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Notify on query errors</span>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              System Notifications
            </label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={localConfig.notify_file_upload || false}
                  onChange={(e) => handleConfigChange('notify_file_upload', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Notify on file uploads</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={localConfig.notify_system_updates || false}
                  onChange={(e) => handleConfigChange('notify_system_updates', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Notify on system updates</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const SecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Security</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Encryption
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={localConfig.encrypt_data || false}
                onChange={(e) => handleConfigChange('encrypt_data', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Encrypt stored data</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audit Logging
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={localConfig.audit_logging || false}
                onChange={(e) => handleConfigChange('audit_logging', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Enable audit logging</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Access Control
            </label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={localConfig.require_auth || false}
                  onChange={(e) => handleConfigChange('require_auth', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Require authentication</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={localConfig.ip_whitelist || false}
                  onChange={(e) => handleConfigChange('ip_whitelist', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Enable IP whitelist</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings />;
      case 'database':
        return <DatabaseSettings />;
      case 'users':
        return <UserSettings />;
      case 'appearance':
        return <AppearanceSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'security':
        return <SecuritySettings />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your application preferences</p>
        </div>
        
        {unsavedChanges && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-orange-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Unsaved changes</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={resetConfig}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Reset
              </button>
              <button
                onClick={saveConfig}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
        
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;