
import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Sparkles, Check, X, BookOpen, Trash2, ArrowRight } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { getSpellingWord } from '../services/geminiService';
import Loader from '../components/Loader';
import { VocabularyWord } from '../types';
import { useSpeech } from '../hooks/useSpeech';
import { useNotification } from '../contexts/NotificationContext';

interface CurrentWord extends Omit<VocabularyWord, 'addedDate' | 'level'> {
  source: 'ai' | 'user';
}

const SpellingGame: React.FC = () => {
  const { userData, setUserData, apiKey, voiceURI } = useData();
  const { showNotification } = useNotification();
  const [currentWord, setCurrentWord] = useState<CurrentWord | null>(null);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [answered, setAnswered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { speak } = useSpeech();
  const nextWordTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNewWord = async (isInitial = false) => {
    if (!apiKey) return;
    setIsLoading(true);
    setFeedback(null);
    setUserInput('');
    setAnswered(false);

    try {
      let wordData: CurrentWord | null = null;
      if (userData.suggestedVocabulary.length > 0) {
        const nextWord = userData.suggestedVocabulary[0];
        wordData = { ...nextWord, source: 'user' };
        setUserData(prev => ({
          ...prev,
          suggestedVocabulary: prev.suggestedVocabulary.slice(1)
        }));
      } else {
        const fetchedWord = await getSpellingWord(apiKey, userData.profile.level);
        if (fetchedWord && fetchedWord.word) {
            wordData = { ...fetchedWord, source: 'ai'};
        }
      }

      setCurrentWord(wordData);
      if (wordData) {
          // Don't auto-pronounce on the very first load of the component
          if(!isInitial) speak(wordData.word, voiceURI);
      }

    } catch (error) {
      showNotification("Failed to fetch a new word.", 'error');
      setCurrentWord(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNewWord(true); // isInitial = true
    
    return () => {
        if(nextWordTimeoutRef.current) {
            clearTimeout(nextWordTimeoutRef.current);
        }
    }
    // eslint-disable-next-line react-hooks-exhaustive-deps
  }, [apiKey]);
  
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading, currentWord]);
  
  const playAudio = () => {
    if (currentWord) {
      speak(currentWord.word, voiceURI);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWord || !userInput.trim() || answered) return;
    
    if(nextWordTimeoutRef.current) clearTimeout(nextWordTimeoutRef.current);
    setAnswered(true);

    if (userInput.trim().toLowerCase() === currentWord.word.toLowerCase()) {
      setFeedback('correct');
      const isNewWord = !userData.vocabulary.some(v => v.word.toLowerCase() === currentWord.word.toLowerCase());
      if (isNewWord) {
        setUserData(prev => ({
          ...prev,
          stats: { ...prev.stats, wordsLearned: prev.stats.wordsLearned + 1 },
          vocabulary: [...prev.vocabulary, { ...currentWord, level: prev.profile.level, addedDate: Date.now() }]
        }));
      }
      // Auto advance to next word
      nextWordTimeoutRef.current = setTimeout(handleNextWord, userData.settings.spellingAutoAdvanceSeconds * 1000);

    } else {
      setFeedback('incorrect');
    }
  };
  
  const handleNextWord = () => {
    if(nextWordTimeoutRef.current) clearTimeout(nextWordTimeoutRef.current);
    fetchNewWord();
  };
  
  const getMaskedExample = () => {
    if (!currentWord) return '';
    const regex = new RegExp(`\\b${currentWord.word}\\b`, 'gi');
    return currentWord.example.replace(regex, '*****');
  };

  const removeSuggestedWord = (wordToRemove: string) => {
     setUserData(prev => ({
          ...prev,
          suggestedVocabulary: prev.suggestedVocabulary.filter(v => v.word !== wordToRemove)
        }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-white text-center">Spelling Game</h1>

      <div className="bg-gray-800 p-8 rounded-xl shadow-lg min-h-[300px] flex justify-center items-center">
        {isLoading && <Loader text="Getting new word..." />}
        {!currentWord && !isLoading && (
            <p className="text-gray-400">No more words to practice. Upload a screenshot on the assessment page to find more!</p>
        )}
        {currentWord && !isLoading && (
          <div className="text-center animate-fade-in w-full">
            <button onClick={playAudio} className="mb-4 bg-blue-600/20 text-blue-400 p-3 rounded-full hover:bg-blue-600/40 transition">
              <Volume2 size={32} />
            </button>
            <p className="text-lg text-gray-400 mb-2 italic">"{currentWord.definition}"</p>
            <p className="text-gray-400 mb-6">e.g., "{getMaskedExample()}"</p>
            
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <div className="relative w-full max-w-sm">
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Type the word here"
                  disabled={answered}
                  className={`w-full text-center text-2xl p-3 rounded-lg bg-gray-700 border-2 transition-all disabled:opacity-70 ${
                    feedback === 'correct' ? 'border-green-500' :
                    feedback === 'incorrect' ? 'border-red-500' : 'border-gray-600 focus:border-blue-500'
                  } outline-none`}
                />
                 {feedback === 'correct' && <Check className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />}
                 {feedback === 'incorrect' && <X className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />}
              </div>
              {!answered ? (
                <button type="submit" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-lg">Check Spelling</button>
              ) : (
                <button type="button" onClick={handleNextWord} className="w-full sm:w-auto bg-gray-600 hover:bg-gray-500 text-white font-bold py-3.5 px-6 rounded-lg flex items-center justify-center">
                    Next Word <ArrowRight className="ml-2 h-5 w-5"/>
                </button>
              )}
            </form>
            {feedback === 'incorrect' && (
              <p className="text-red-400 mt-4">Not quite. The correct spelling is: <span className="font-bold">{currentWord.word}</span></p>
            )}
             {feedback === 'correct' && (
              <p className="text-green-400 mt-4 font-bold">Correct! Added to your dictionary.</p>
            )}
          </div>
        )}
      </div>

       {userData.suggestedVocabulary.length > 0 && (
          <div className="bg-gray-800 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4 flex items-center"><BookOpen className="mr-2 text-green-400"/> My Practice List</h2>
            <p className="text-sm text-gray-400 mb-4">These words were extracted from your uploaded text. They will be added to your spelling game queue.</p>
            <div className="flex flex-wrap gap-2">
                {userData.suggestedVocabulary.map(v => (
                    <div key={v.word} className="bg-gray-700 p-2 rounded-lg flex items-center gap-2">
                        <span className="font-medium text-white">{v.word}</span>
                        <button onClick={() => removeSuggestedWord(v.word)} className="text-gray-500 hover:text-red-400">
                           <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
          </div>
       )}

      <div className="bg-gray-800 p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-4 flex items-center"><Sparkles className="mr-2 text-yellow-400"/> My Personal Dictionary</h2>
        {userData.vocabulary.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userData.vocabulary.slice().reverse().map(vocab => (
              <div key={vocab.word} className="bg-gray-700 p-4 rounded-lg">
                <h3 className="font-bold text-lg text-white">{vocab.word}</h3>
                <p className="text-sm text-gray-300">{vocab.definition}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4">Your learned words will appear here.</p>
        )}
      </div>
    </div>
  );
};

export default SpellingGame;
