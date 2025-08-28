
export type UserLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Proficient';

export interface GrammarError {
  id: string;
  error: string;
  correction: string;
  explanation: string;
  timestamp: number;
}

export interface VocabularyWord {
  word: string;
  definition: string;
  example: string;
  level: UserLevel;
  addedDate: number;
}

export interface AssessmentResult {
  level: UserLevel;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  timestamp: number;
}

export interface QuizResult {
  topic: string;
  score: number;
  total: number;
  timestamp: number;
}

export interface LearningRecommendation {
  id: string;
  type: 'quiz' | 'spelling' | 'chat_topic';
  title: string;
  description: string;
  completed: boolean;
}

export interface UserData {
  profile: {
    name: string;
    age: number | null;
    country: string;
    level: UserLevel;
    learningStreak: number;
    lastLogin: number;
    persona: {
      interests: string[];
      summary: string;
    }
  };
  settings: {
      spellingAutoAdvanceSeconds: number;
  };
  stats: {
    wordsLearned: number;
    grammarErrorsTracked: number;
    quizzesCompleted: number;
    quizAverageScore: number;
    learningAbility: {
        correctedMistakes: number;
        totalMistakes: number;
    };
  };
  vocabulary: VocabularyWord[];
  suggestedVocabulary: VocabularyWord[];
  grammarErrors: GrammarError[];
  assessmentHistory: AssessmentResult[];
  quizHistory: QuizResult[];
  chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[];
  recommendations: string[];
  learningPlan: LearningRecommendation[];
}
