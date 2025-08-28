
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
// FIX: The errors regarding 'Session' and 'User' not being exported, and methods not existing
// on the auth client, typically point to an issue with type resolution or a version mismatch.
// Using `import type` is safer and can resolve module resolution issues. AuthChangeEvent is also
// added for better typing of the listener.
import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { UserData } from '../types';

const defaultUserData: Omit<UserData, 'apiKey'> = {
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


interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // FIX: Using onAuthStateChange is the recommended way to handle auth state in v2.
    // It provides the initial session and listens for subsequent changes, removing the need for a separate getSession() call.
    // The loading state is set to false once the initial state is determined.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    // FIX: `signInWithPassword` is the correct method for email/password login in Supabase v2.
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signup = async (email: string, password: string) => {
    // FIX: `signUp` is the correct method for email/password signup in Supabase v2.
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
        // Create a profile for the new user
        const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            user_data: defaultUserData,
        });
        if (profileError) {
            // This is a problem, the user is created but their profile is not.
            // For simplicity, we just log it. A real app might need a cleanup process.
            console.error("Failed to create user profile:", profileError);
            throw new Error("Could not create your user profile. Please contact support.");
        }
    }
  };

  const logout = async () => {
    // FIX: `signOut` is the correct method in Supabase v2.
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    loading,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
