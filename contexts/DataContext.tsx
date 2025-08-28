
import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { UserData } from '../types';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const defaultUserData: UserData = {
  profile: {
    name: "New Learner",
    age: null,
    country: "",
    level: 'Beginner',
    learningStreak: 0,
    lastLogin: Date.now(),
    persona: {
      interests: [],
      summary: "A new English learner."
    }
  },
  settings: {
    spellingAutoAdvanceSeconds: 3,
  },
  stats: {
    wordsLearned: 0,
    grammarErrorsTracked: 0,
    quizzesCompleted: 0,
    quizAverageScore: 0,
    learningAbility: {
        correctedMistakes: 0,
        totalMistakes: 0,
    },
  },
  vocabulary: [],
  suggestedVocabulary: [],
  grammarErrors: [],
  assessmentHistory: [],
  quizHistory: [],
  chatHistory: [],
  recommendations: ["Take an assessment to determine your starting level.", "Start a conversation in the Chat page to practice.", "Try the Spelling Game to learn new words."],
  learningPlan: [],
};

interface DataContextType {
  userData: UserData | null;
  setUserData: React.Dispatch<React.SetStateAction<UserData | null>>;
  voiceURI: string | null;
  setVoiceURI: React.Dispatch<React.SetStateAction<string | null>>;
  resetUserData: () => Promise<void>;
  loading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [voiceURI, setVoiceURI] = useState<string | null>(() => window.localStorage.getItem('adaptive-learning-hub-voice'));
  const [loading, setLoading] = useState(true);
  
  const fetchProfile = useCallback(async () => {
    if (!user) return;
    try {
        setLoading(true);
        const { data, error, status } = await supabase
            .from('profiles')
            .select(`user_data`)
            .eq('id', user.id)
            .single();

        if (error && status !== 406) {
            throw error;
        }

        if (data) {
            setUserData(data.user_data);
        }
    } catch (error) {
        showNotification("Could not fetch your profile data.", 'error');
    } finally {
        setLoading(false);
    }
  }, [user, showNotification]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);
  
  useEffect(() => {
    if(!user || !userData) return;
    
    const updateProfile = async () => {
        const { error } = await supabase
            .from('profiles')
            .update({ user_data: userData })
            .eq('id', user.id);
        if (error) {
            showNotification('Could not sync your data.', 'error');
        }
    };
    // Debounce updates to avoid rapid writes
    const handler = setTimeout(() => {
        updateProfile();
    }, 1000);
    
    return () => {
        clearTimeout(handler);
    };

  }, [userData, user, showNotification]);

  useEffect(() => {
    // Persist voice URI to local storage as it's a device-specific preference
    if (voiceURI) {
        window.localStorage.setItem('adaptive-learning-hub-voice', voiceURI);
    } else {
        window.localStorage.removeItem('adaptive-learning-hub-voice');
    }
  }, [voiceURI]);


  const resetUserData = async () => {
    setUserData(defaultUserData); // Update local state immediately for responsiveness
    if(!user) return;
    const { error } = await supabase
        .from('profiles')
        .update({ user_data: defaultUserData })
        .eq('id', user.id);
    if (error) {
        showNotification('Failed to reset data in the cloud.', 'error');
        fetchProfile(); // Re-fetch to revert optimistic update
    } else {
        showNotification('Your data has been reset.', 'info');
    }
  };

  return (
    <DataContext.Provider value={{ userData, setUserData, voiceURI, setVoiceURI, resetUserData, loading }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  // This check ensures component using useData will not render if userData is null
  if (context.userData === null && !context.loading) {
    throw new Error('UserData is null, this should be handled by the component tree');
  }
  return context;
};
