
import React, { useState, useRef } from 'react';
import { Check, ArrowRight, Upload, Volume2, X, FileText, Image as ImageIcon } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { getAssessmentQuestions, analyzeAssessment, extractTextFromImage, generateVocabularyFromContext, generateAssessmentFromContext } from '../services/geminiService';
import Loader from '../components/Loader';
import { useSpeech } from '../hooks/useSpeech';
import { useNotification } from '../contexts/NotificationContext';

type Question = {
  question: string;
  options: string[];
  correctAnswer: string;
};

type AssessmentState = 'idle' | 'context_entry' | 'fetching' | 'in_progress' | 'analyzing' | 'results';

const Assessment: React.FC = () => {
  const { userData, setUserData, voiceURI } = useData();
  const { showNotification } = useNotification();
  const [state, setState] = useState<AssessmentState>('idle');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<any>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [contextText, setContextText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { speak, hasSpeechSupport } = useSpeech();

  const resetToIdle = () => {
    setState('idle');
    setQuestions([]);
    setContextText('');
    setResult(null);
  }

  const startGeneralAssessment = async () => {
    setState('fetching');
    try {
      const fetchedQuestions = await getAssessmentQuestions(userData.assessmentHistory);
      if (fetchedQuestions.length > 0) {
        setQuestions(fetchedQuestions);
        setCurrentQuestion(0);
        setAnswers({});
        setResult(null);
        setSelectedAnswer(null);
        setIsCorrect(null);
        setState('in_progress');
      } else {
        showNotification("Failed to fetch questions. Please try again.", 'error');
        resetToIdle();
      }
    } catch (error) {
      showNotification("An error occurred while fetching questions.", 'error');
      resetToIdle();
    }
  };

  const handleContextAssessment = async (context: string) => {
    if (!context.trim()) return;
    setIsLoadingContext(true);
    try {
        const [generatedQuestions, vocab] = await Promise.all([
            generateAssessmentFromContext(context, userData.profile.level),
            generateVocabularyFromContext(context, userData.profile.level)
        ]);
        
        if (vocab.length > 0) {
            setUserData(prev => ({
              ...prev,
              suggestedVocabulary: [...prev.suggestedVocabulary, ...vocab.map(v => ({...v, level: prev.profile.level, addedDate: Date.now()}))]
            }));
            showNotification(`Extracted ${vocab.length} new words for the Spelling Game!`, 'success');
        }

        if (generatedQuestions.length > 0) {
            setQuestions(generatedQuestions);
            setCurrentQuestion(0);
            setAnswers({});
            setResult(null);
            setSelectedAnswer(null);
            setIsCorrect(null);
            setState('in_progress');
        } else {
            showNotification("Could not generate a quiz from the provided text.", 'error');
            setState('context_entry');
        }

    } catch (err) {
        console.error(err);
        showNotification("Failed to process the text. Please try again.", 'error');
    } finally {
        setIsLoadingContext(false);
    }
  };
  
  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return;

    const correct = answer === questions[currentQuestion].correctAnswer;
    setSelectedAnswer(answer);
    setIsCorrect(correct);
    const newAnswers = { ...answers, [currentQuestion]: answer };
    setAnswers(newAnswers);

    setTimeout(() => {
      setSelectedAnswer(null);
      setIsCorrect(null);
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        if (questions.length > 5) { // Heuristic for general assessment
            finishGeneralAssessment(newAnswers);
        } else {
            const score = Object.values(newAnswers).filter((ans, i) => ans === questions[i].correctAnswer).length;
            setResult({ contextual: true, score, total: questions.length });
            setState('results');
        }
      }
    }, 1500);
  };
  
  const finishGeneralAssessment = async (finalAnswers: Record<number, string>) => {
    setState('analyzing');
    try {
      const analysis = await analyzeAssessment(finalAnswers);
      setResult(analysis);
      setUserData(prev => ({
        ...prev,
        profile: { ...prev.profile, level: analysis.level },
        assessmentHistory: [...prev.assessmentHistory, { ...analysis, timestamp: Date.now() }]
      }));
      setState('results');
    } catch (error) {
      showNotification("An error occurred while analyzing your results.", 'error');
      setState('in_progress');
    }
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoadingContext(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64String = (e.target?.result as string).split(',')[1];
          const extractedText = await extractTextFromImage(file.type, base64String);
          if (extractedText) {
            handleContextAssessment(extractedText);
          } else {
             showNotification("Could not extract any text from the image.", 'error');
             setIsLoadingContext(false);
          }
        } catch (err) {
            console.error(err);
            showNotification("Failed to process the image. Please try again.", 'error');
            setIsLoadingContext(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
        console.error("Error reading file:", error);
        showNotification("Failed to read the file.", 'error');
        setIsLoadingContext(false);
    }
  };

  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  const renderContent = () => {
    switch (state) {
        case 'idle':
            return (
              <div className="text-center space-y-6 w-full max-w-md">
                <p className="text-gray-300">Choose how you'd like to be assessed today.</p>
                <button onClick={startGeneralAssessment} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-transform hover:scale-105">
                    Start General Adaptive Test
                </button>
                <button onClick={() => setState('context_entry')} className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold py-3 px-6 rounded-lg flex items-center justify-center">
                    <FileText className="mr-2 h-5 w-5"/> Assess from Text or Image
                </button>
              </div>
            );
        case 'context_entry':
            return (
                 <div className="text-center space-y-6 w-full max-w-lg animate-fade-in">
                    <h2 className="text-2xl font-bold">Assess Your Understanding</h2>
                    <p className="text-gray-400">Paste any text or upload a screenshot to generate a custom quiz and extract vocabulary.</p>
                    <textarea 
                        value={contextText}
                        onChange={(e) => setContextText(e.target.value)}
                        placeholder="Paste an article, an email, or any text here..."
                        className="w-full h-40 p-3 bg-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoadingContext}
                    />
                    <div className="flex items-center justify-center gap-4">
                        <button onClick={() => handleContextAssessment(contextText)} disabled={isLoadingContext || !contextText.trim()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-wait">
                            {isLoadingContext ? <Loader text="" /> : "Generate Quiz"}
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} disabled={isLoadingContext} className="bg-gray-600 hover:bg-gray-500 text-gray-300 font-bold py-3 px-6 rounded-lg flex items-center disabled:opacity-50 disabled:cursor-wait">
                            <ImageIcon className="mr-2 h-5 w-5"/> Upload Screenshot
                        </button>
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    </div>
                    <button onClick={resetToIdle} className="text-sm text-gray-500 hover:text-white mt-4">Cancel</button>
                </div>
            )
        case 'fetching':
        case 'analyzing':
            return <Loader text={state === 'fetching' ? 'Generating questions...' : 'Analyzing your results...'} />;
        case 'in_progress':
             return (
              <div className="w-full animate-fade-in">
                <div className="mb-4">
                  <p className="text-sm text-gray-400">Question {currentQuestion + 1} of {questions.length}</p>
                  <div className="w-full bg-gray-700 rounded-full h-2.5 mt-1">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.3s' }}></div>
                  </div>
                </div>
                <div className="flex items-center justify-center space-x-4 mb-6">
                  <h2 className="text-xl md:text-2xl font-semibold text-white text-center">{questions[currentQuestion].question}</h2>
                  {hasSpeechSupport && <button onClick={() => speak(questions[currentQuestion].question, voiceURI)} className="p-2 rounded-full bg-blue-500/20 hover:bg-blue-500/40 text-blue-300"><Volume2 /></button>}
                </div>
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
                      <button key={index} onClick={() => handleAnswer(option)} disabled={!!selectedAnswer} className={`text-left p-4 rounded-lg transition-all duration-300 relative ${buttonClass}`}>
                        {option}
                        {isSelected && (isCorrect ? <Check className="absolute right-3 top-1/2 -translate-y-1/2" /> : <X className="absolute right-3 top-1/2 -translate-y-1/2" />)}
                      </button>
                    )
                  })}
                </div>
              </div>
            );
        case 'results':
            return (
              <div className="text-center animate-fade-in w-full">
                {result.contextual ? (
                  <>
                    <h2 className="text-2xl font-bold mb-2">Quiz Complete!</h2>
                    <p className="text-lg mb-6">You scored</p>
                    <p className="font-bold text-blue-400 text-5xl mb-8">{result.score} / {result.total}</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold mb-2">Assessment Complete!</h2>
                    <p className="text-lg mb-6">Your estimated level is: <span className="font-bold text-blue-400 text-2xl">{result.level}</span></p>
                    <div className="text-left grid md:grid-cols-2 gap-6 my-6">
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <h3 className="font-semibold text-green-400 mb-2">Strengths</h3>
                        <ul className="list-disc list-inside text-gray-300">{result.strengths.map((s:string, i:number) => <li key={i}>{s}</li>)}</ul>
                      </div>
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <h3 className="font-semibold text-red-400 mb-2">Areas for Improvement</h3>
                        <ul className="list-disc list-inside text-gray-300">{result.weaknesses.map((w:string, i:number) => <li key={i}>{w}</li>)}</ul>
                      </div>
                    </div>
                  </>
                )}
                <button onClick={resetToIdle} className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg">Done</button>
              </div>
            );
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-white text-center">Proficiency Assessment</h1>
      <div className="bg-gray-800 p-8 rounded-xl shadow-lg min-h-[500px] flex flex-col justify-center items-center">
        {isLoadingContext && <Loader text="Processing..."/>}
        {!isLoadingContext && renderContent()}
      </div>
    </div>
  );
};

export default Assessment;
