
import React, { createContext, useContext, ReactNode } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { UserData } from '../types';

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
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  apiKey: string | null;
  setApiKey: React.Dispatch<React.SetStateAction<string | null>>;
  voiceURI: string | null;
  setVoiceURI: React.Dispatch<React.SetStateAction<string | null>>;
  resetUserData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useLocalStorage<UserData>('adaptive-learning-hub-data', defaultUserData);
  const [apiKey, setApiKey] = useLocalStorage<string | null>('adaptive-learning-hub-apikey', null);
  const [voiceURI, setVoiceURI] = useLocalStorage<string | null>('adaptive-learning-hub-voice', null);


  const resetUserData = () => {
    setUserData(defaultUserData);
  };

  return (
    <DataContext.Provider value={{ userData, setUserData, apiKey, setApiKey, voiceURI, setVoiceURI, resetUserData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
