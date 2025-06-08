import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { IoRocket, IoSettings, IoInformationCircle } from 'react-icons/io5';
import { toast } from 'react-hot-toast';
import api from '../../api';
import { API_URLS } from '../../api/urls';

const AIConfigModal = ({ isOpen, onClose }) => {
    const { user } = useAuthStore();
    const [config, setConfig] = useState({
        offline_mode_enabled: false,
        offline_ai_message: '',
        ai_temperature: 0.7,
        ai_max_tokens: 1000
    });
    const [loading, setLoading] = useState(false);
    const [testMessage, setTestMessage] = useState('');
    const [testResponse, setTestResponse] = useState('');
    const [testing, setTesting] = useState(false);    useEffect(() => {
        const loadConfig = async () => {
            if (isOpen) {
                try {
                    const response = await api.get(API_URLS.AI_CONFIG);
                    setConfig({
                        offline_mode_enabled: response.data.offline_mode_enabled || false,
                        offline_ai_message: response.data.offline_ai_message || '',
                        ai_temperature: response.data.ai_temperature || 0.7,
                        ai_max_tokens: response.data.ai_max_tokens || 1000
                    });
                } catch (error) {
                    console.error('Failed to load AI configuration:', error);
                    // Fallback to user data if available
                    if (user) {
                        setConfig({
                            offline_mode_enabled: user.offline_mode_enabled || false,
                            offline_ai_message: user.offline_ai_message || '',
                            ai_temperature: user.ai_temperature || 0.7,
                            ai_max_tokens: user.ai_max_tokens || 1000
                        });
                    }
                }
            }
        };
        
        loadConfig();
    }, [isOpen, user]);

    const handleConfigChange = (field, value) => {
        setConfig(prev => ({
            ...prev,
            [field]: value
        }));
    };    const handleSaveConfig = async () => {
        setLoading(true);
        try {
            await api.post(API_URLS.AI_CONFIG, config);
            toast.success('AI configuration updated successfully');
            onClose();
        } catch (error) {
            toast.error('Failed to update AI configuration');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleTestAI = async () => {
        if (!testMessage.trim()) {
            toast.error('Please enter a test message');
            return;
        }

        setTesting(true);
        setTestResponse('');
        
        try {
            const response = await api.post(API_URLS.AI_CONFIG + 'test/', {
                message: testMessage,
                temperature: config.ai_temperature,
                max_tokens: config.ai_max_tokens,
                custom_message: config.offline_ai_message
            });
            
            setTestResponse(response.data.response);
        } catch (error) {
            toast.error('Failed to test AI response');
            console.error(error);
            setTestResponse('Error: Unable to get AI response. Please check your configuration.');
        } finally {
            setTesting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="AI Assistant Configuration">
            <div className="space-y-6">
                {/* Enable/Disable AI */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <IoRocket className="text-blue-500" size={24} />
                        <div>
                            <h3 className="font-medium text-gray-900">AI Assistant</h3>
                            <p className="text-sm text-gray-600">
                                Respond to messages when you're offline
                            </p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.offline_mode_enabled}
                            onChange={(e) => handleConfigChange('offline_mode_enabled', e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                {config.offline_mode_enabled && (
                    <>
                        {/* Custom Offline Message */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Custom Offline Message
                            </label>
                            <textarea
                                value={config.offline_ai_message}
                                onChange={(e) => handleConfigChange('offline_ai_message', e.target.value)}
                                placeholder="I'm currently offline, but my AI assistant will help you until I return..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                rows="3"
                            />
                            <p className="text-xs text-gray-500">
                                This message will be used to personalize AI responses
                            </p>
                        </div>

                        {/* AI Parameters */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-gray-700 flex items-center">
                                <IoSettings className="mr-2" size={16} />
                                AI Response Settings
                            </h4>
                            
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">
                                        Creativity Level: {config.ai_temperature}
                                    </label>
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="1.0"
                                        step="0.1"
                                        value={config.ai_temperature}
                                        onChange={(e) => handleConfigChange('ai_temperature', parseFloat(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>Conservative</span>
                                        <span>Creative</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">
                                        Response Length: {config.ai_max_tokens} tokens
                                    </label>
                                    <input
                                        type="range"
                                        min="100"
                                        max="2000"
                                        step="100"
                                        value={config.ai_max_tokens}
                                        onChange={(e) => handleConfigChange('ai_max_tokens', parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>Short</span>
                                        <span>Detailed</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Test AI Response */}
                        <div className="space-y-3 border-t pt-4">
                            <h4 className="text-sm font-medium text-gray-700">Test AI Response</h4>
                            <div className="flex space-x-2">
                                <Input
                                    placeholder="Enter a test message..."
                                    value={testMessage}
                                    onChange={(e) => setTestMessage(e.target.value)}
                                    fullWidth={false}
                                    className="flex-1"
                                />
                                <Button
                                    onClick={handleTestAI}
                                    disabled={testing || !testMessage.trim()}
                                    fullWidth={false}
                                    className="px-4"
                                >
                                    {testing ? 'Testing...' : 'Test'}
                                </Button>
                            </div>
                            
                            {testResponse && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-800 font-medium mb-1">AI Response:</p>
                                    <p className="text-sm text-blue-700">{testResponse}</p>
                                </div>
                            )}
                        </div>

                        {/* Information */}
                        <div className="flex items-start space-x-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <IoInformationCircle className="text-amber-600 mt-0.5" size={16} />
                            <div className="text-sm text-amber-800">
                                <p className="font-medium mb-1">How it works:</p>
                                <ul className="text-xs space-y-1">
                                    <li>• When you're offline, the AI will respond to messages on your behalf</li>
                                    <li>• Responses are generated using Google's Gemini AI model</li>
                                    <li>• Your custom message helps personalize the responses</li>
                                    <li>• AI responses are clearly marked as automated</li>
                                </ul>
                            </div>
                        </div>
                    </>
                )}

                {/* Save Button */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button
                        onClick={onClose}
                        variant="secondary"
                        fullWidth={false}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveConfig}
                        disabled={loading}
                        fullWidth={false}
                    >
                        {loading ? 'Saving...' : 'Save Configuration'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default AIConfigModal;
