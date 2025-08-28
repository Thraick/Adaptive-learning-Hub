
import React, { useState, useRef } from 'react';
import { KeyRound, Eye, EyeOff, UploadCloud, DownloadCloud, Trash2, AlertTriangle, Speaker, User, Save, Clock } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useSpeech } from '../hooks/useSpeech';
import { useNotification } from '../contexts/NotificationContext';

const SettingsPage: React.FC = () => {
    const { apiKey, setApiKey, userData, setUserData, resetUserData, voiceURI, setVoiceURI } = useData();
    const { showNotification } = useNotification();
    const [keyInput, setKeyInput] = useState(apiKey || '');
    const [showKey, setShowKey] = useState(false);
    const { voices, speak } = useSpeech();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [testPhrase, setTestPhrase] = useState("The quick brown fox jumps over the lazy dog.");
    const [profile, setProfile] = useState(userData.profile);
    const [settings, setSettings] = useState(userData.settings);


    const handleSaveKey = () => {
        if (keyInput.trim()) {
            setApiKey(keyInput.trim());
            showNotification('API Key saved successfully!', 'success');
        } else {
            showNotification('Please enter a valid API key.', 'error');
        }
    };
    
    const handleSaveProfile = () => {
        setUserData(prev => ({ ...prev, profile }));
        showNotification('Profile updated successfully!', 'success');
    };

    const handleSaveSettings = () => {
        setUserData(prev => ({ ...prev, settings }));
        showNotification('Settings saved successfully!', 'success');
    }

    const handleExport = () => {
        try {
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
                JSON.stringify(userData)
            )}`;
            const link = document.createElement("a");
            link.href = jsonString;
            link.download = "adaptive-learning-hub-data.json";
            link.click();
        } catch (error) {
            console.error("Error exporting data:", error);
            showNotification("Failed to export data.", 'error');
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    const importedData = JSON.parse(text);
                    // Basic validation
                    if (importedData.profile && importedData.stats && importedData.vocabulary) {
                        setUserData(importedData);
                        showNotification("Data imported successfully!", 'success');
                    } else {
                        throw new Error("Invalid data format.");
                    }
                }
            } catch (error) {
                console.error("Error importing data:", error);
                showNotification("Failed to import data. Please check the file format.", 'error');
            }
        };
        reader.readAsText(file);
    };
    
    const handleReset = () => {
        if (window.confirm("Are you sure you want to reset all your data? This action cannot be undone.")) {
            resetUserData();
            showNotification("Your data has been reset.", 'info');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <h1 className="text-3xl font-bold text-white text-center">Settings</h1>

            {!apiKey && (
                <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 p-4 rounded-lg flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="font-bold">Welcome to the Adaptive Learning Hub!</h3>
                        <p className="text-sm">Please enter your Google AI API key below to get started. The key is stored only in your browser and is required for all learning features.</p>
                    </div>
                </div>
            )}

             <div className="bg-gray-800 p-6 rounded-xl">
                <h2 className="text-xl font-semibold mb-4 text-white flex items-center"><User className="mr-2"/> User Profile</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="name" className="text-sm font-medium text-gray-400">Name</label>
                        <input id="name" type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="mt-1 w-full bg-gray-700 p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                    <div>
                        <label htmlFor="age" className="text-sm font-medium text-gray-400">Age</label>
                        <input id="age" type="number" value={profile.age || ''} onChange={e => setProfile({...profile, age: e.target.value ? parseInt(e.target.value) : null})} className="mt-1 w-full bg-gray-700 p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="country" className="text-sm font-medium text-gray-400">Country</label>
                        <input id="country" type="text" value={profile.country} onChange={e => setProfile({...profile, country: e.target.value})} className="mt-1 w-full bg-gray-700 p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                </div>
                 <button onClick={handleSaveProfile} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg flex items-center">
                    <Save className="mr-2 h-4 w-4" /> Save Profile
                </button>
            </div>


            <div className="bg-gray-800 p-6 rounded-xl">
                <h2 className="text-xl font-semibold mb-4 text-white flex items-center"><KeyRound className="mr-2"/> API Configuration</h2>
                <div className="space-y-2">
                    <label htmlFor="api-key" className="text-sm font-medium text-gray-400">Google AI API Key</label>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-grow">
                             <input
                                id="api-key"
                                type={showKey ? 'text' : 'password'}
                                value={keyInput}
                                onChange={(e) => setKeyInput(e.target.value)}
                                placeholder="Enter your API key here"
                                className="w-full bg-gray-700 p-3 pr-12 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white"
                                aria-label={showKey ? 'Hide API key' : 'Show API key'}
                            >
                                {showKey ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                            </button>
                        </div>
                        <button onClick={handleSaveKey} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">
                            Save
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl">
                <h2 className="text-xl font-semibold mb-4 text-white flex items-center"><Speaker className="mr-2"/> Voice Configuration</h2>
                <div className="space-y-4">
                     <div>
                        <label htmlFor="voice-select" className="text-sm font-medium text-gray-400">Text-to-Speech Voice</label>
                        <select 
                            id="voice-select"
                            value={voiceURI || ''}
                            onChange={(e) => setVoiceURI(e.target.value)}
                            className="w-full mt-1 bg-gray-700 p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={voices.length === 0}
                        >
                            {voices.length > 0 ? (
                                voices.map(voice => (
                                    <option key={voice.voiceURI} value={voice.voiceURI}>
                                        {voice.name} ({voice.lang})
                                    </option>
                                ))
                            ) : (
                                <option>Loading voices...</option>
                            )}
                        </select>
                     </div>
                     <div className="flex items-end gap-2">
                        <div className="flex-grow">
                            <label htmlFor="voice-test" className="text-sm font-medium text-gray-400">Test Phrase</label>
                            <input id="voice-test" type="text" value={testPhrase} onChange={(e) => setTestPhrase(e.target.value)} className="mt-1 w-full bg-gray-700 p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"/>
                        </div>
                        <button onClick={() => speak(testPhrase, voiceURI)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg flex items-center">
                            <Speaker className="mr-2 h-4 w-4"/> Test
                        </button>
                     </div>
                </div>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-xl">
                <h2 className="text-xl font-semibold mb-4 text-white flex items-center"><Clock className="mr-2"/> Game Settings</h2>
                <div className="space-y-2">
                    <label htmlFor="spelling-delay" className="text-sm font-medium text-gray-400">Spelling Game Auto-Advance Delay ({settings.spellingAutoAdvanceSeconds}s)</label>
                    <input
                        id="spelling-delay"
                        type="range"
                        min="1"
                        max="10"
                        value={settings.spellingAutoAdvanceSeconds}
                        onChange={(e) => setSettings({...settings, spellingAutoAdvanceSeconds: parseInt(e.target.value)})}
                        onMouseUp={handleSaveSettings}
                        onTouchEnd={handleSaveSettings}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl">
                <h2 className="text-xl font-semibold mb-4 text-white">Data Management</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button onClick={handleExport} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center">
                        <DownloadCloud className="mr-2"/> Export Data
                    </button>
                    <button onClick={handleImportClick} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center">
                        <UploadCloud className="mr-2"/> Import Data
                    </button>
                    <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <button onClick={handleReset} className="bg-red-800 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center">
                        <Trash2 className="mr-2"/> Reset All Data
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
