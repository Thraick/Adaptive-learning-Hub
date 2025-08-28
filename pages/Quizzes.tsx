
import React, { useState, useEffect } from 'react';
import { Lightbulb, Search, Check, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { generateQuiz, updatePersonaAndRecommendations } from '../services/geminiService';
import Loader from '../components/Loader';
import { useNotification } from '../contexts/NotificationContext';

type Question = {
  question: string;
  options: string[];
  correctAnswer: string;
};

type QuizState = 'idle' | 'fetching' | 'in_progress' | 'results';

const Quizzes: React.FC = () => {
  const { userData, setUserData } = useData();
  const { showNotification } = useNotification();
  const [state, setState] = useState<QuizState>('idle');
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const saveQuizResult = () => {
    setUserData(prev => {
        const newHistory = [...prev.quizHistory, {
            topic,
            score,
            total: questions.length,
            timestamp: Date.now()
        }];

        const totalQuizzes = newHistory.length;
        const totalScore = newHistory.reduce((sum, q) => sum + (q.score / q.total), 0);
        const newAverage = totalQuizzes > 0 ? Math.round((totalScore / totalQuizzes) * 100) : 0;
        
        const updatedUserData = {
            ...prev,
            quizHistory: newHistory,
            stats: {
                ...prev.stats,
                quizzesCompleted: totalQuizzes,
                quizAverageScore: newAverage,
            },
            profile: {
                ...prev.profile,
                persona: {
                    ...prev.profile.persona,
                    interests: [...new Set([...prev.profile.persona.interests, topic])]
                }
            }
        };

        // Update persona and recommendations in the background
        updatePersonaAndRecommendations(updatedUserData).then(updates => {
            setUserData(current => ({
                ...current,
                profile: { ...current.profile, persona: updates.persona },
                recommendations: updates.recommendations
            }));
        }).catch(console.error); // Fire and forget
        
        return updatedUserData;
    });
  }

  const startQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      showNotification("Please enter a topic to start a quiz.", 'error');
      return;
    }
    setState('fetching');
    try {
      const fetchedQuestions = await generateQuiz(topic);
      if (fetchedQuestions.length > 0) {
        setQuestions(fetchedQuestions);
        setCurrentQuestion(0);
        setScore(0);
        setSelectedAnswer(null);
        setIsCorrect(null);
        setState('in_progress');
      } else {
        showNotification("Failed to generate a quiz for this topic. Please try another one.", 'error');
        setState('idle');
      }
    } catch (error) {
      showNotification("An error occurred while generating the quiz.", 'error');
      setState('idle');
    }
  };

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return; // Prevent answering twice

    const correct = answer === questions[currentQuestion].correctAnswer;
    let currentScore = score;
    if (correct) {
        setScore(prev => prev + 1);
        currentScore = score + 1;
    }
    setSelectedAnswer(answer);
    setIsCorrect(correct);

    setTimeout(() => {
      setSelectedAnswer(null);
      setIsCorrect(null);
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        setState('results');
      }
    }, 1500);
  };
  
  useEffect(() => {
    if(state === 'results') {
        saveQuizResult();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const resetQuiz = () => {
      setState('idle');
      setTopic('');
      setQuestions([]);
  };

  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;


  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-white text-center">Knowledge Quizzes</h1>
      <div className="bg-gray-800 p-8 rounded-xl shadow-lg min-h-[500px] flex flex-col justify-center items-center">
        
        {state === 'idle' && (
          <div className="text-center space-y-6 animate-fade-in">
             <Lightbulb className="h-16 w-16 text-yellow-400 mx-auto" />
            <p className="text-gray-300">Test your knowledge and reading comprehension on any topic.</p>
            <form onSubmit={startQuiz} className="flex w-full max-w-md mx-auto">
                <input 
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., 'The Roman Empire' or 'Quantum Physics'"
                    className="flex-grow bg-gray-700 p-3 rounded-l-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-r-lg"
                >
                    <Search />
                </button>
            </form>
          </div>
        )}
        
        {state === 'fetching' && <Loader text={`Generating quiz for "${topic}"...`} />}

        {state === 'in_progress' && questions.length > 0 && (
          <div className="w-full animate-fade-in">
            <div className="mb-4">
              <p className="text-sm text-gray-400">Question {currentQuestion + 1} of {questions.length}</p>
              <div className="w-full bg-gray-700 rounded-full h-2.5 mt-1">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.3s' }}></div>
              </div>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold mb-6 text-white text-center">{questions[currentQuestion].question}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questions[currentQuestion].options.map((option, index) => {
                const isSelected = selectedAnswer === option;
                const isCorrectAnswer = questions[currentQuestion].correctAnswer === option;
                let buttonClass = 'bg-gray-700 hover:bg-blue-600';
                if (selectedAnswer) {
                  if (isSelected) {
                    buttonClass = isCorrect ? 'bg-green-600' : 'bg-red-600';
                  } else if (isCorrectAnswer) {
                    buttonClass = 'bg-green-600';
                  } else {
                    buttonClass = 'bg-gray-700 opacity-50';
                  }
                }
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    disabled={!!selectedAnswer}
                    className={`text-left p-4 rounded-lg transition-all duration-300 relative ${buttonClass}`}
                  >
                    {option}
                    {isSelected && (isCorrect ? <Check className="absolute right-3 top-1/2 -translate-y-1/2" /> : <X className="absolute right-3 top-1/2 -translate-y-1/2" />)}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {state === 'results' && (
          <div className="text-center animate-fade-in w-full">
            <h2 className="text-2xl font-bold mb-2">Quiz Complete!</h2>
            <p className="text-lg mb-6">You scored</p>
            <p className="font-bold text-blue-400 text-5xl mb-8">{score} / {questions.length}</p>
            <p className="text-sm text-gray-400">Your persona and recommendations have been updated!</p>
            <button
              onClick={resetQuiz}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
            >
              Try Another Topic
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quizzes;
