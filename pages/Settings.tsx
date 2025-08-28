
import React, { useState, useRef, useEffect } from 'react';
import { KeyRound, Eye, EyeOff, UploadCloud, DownloadCloud, Trash2, AlertTriangle, Speaker, User, Save, Clock } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useSpeech } from '../hooks/useSpeech';
import { useNotification } from '../contexts/NotificationContext';
import { UserData } from '../types';

const SettingsPage: React.FC = () => {
    const { userData, setUserData, resetUserData, voiceURI, setVoiceURI } = useData();
    const { showNotification } = useNotification();
    const { voices, speak } = useSpeech();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [testPhrase, setTestPhrase] = useState("The quick brown fox jumps over the lazy dog.");
    
    // Local state to manage form inputs to avoid rapid context updates on every keystroke
    const [profile, setProfile] = useState(userData!.profile);
    const [settings, setSettings] = useState(userData!.settings);

    useEffect(() => {
        setProfile(userData!.profile);
        setSettings(userData!.settings);
    }, [userData]);
    
    const handleSaveProfile = () => {
        setUserData(prev => prev ? ({ ...prev, profile }) : null);
        showNotification('Profile updated successfully!', 'success');
    };

    const handleSaveSettings = () => {
        setUserData(prev => prev ? ({ ...prev, settings }) : null);
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
                    const importedData = JSON.parse(text) as UserData;
                    // Basic validation
                    if (importedData.profile && importedData.stats && importedData.vocabulary) {
                        setUserData(importedData);
                        showNotification("Data imported successfully! It will be saved to your account.", 'success');
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
        }
    };

    if (!userData) {
        return null; // Data is loading
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <h1 className="text-3xl font-bold text-white text-center">Settings</h1>

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
