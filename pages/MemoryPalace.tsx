
import React, { useState } from 'react';
import { BrainCircuit, RotateCcw, Lightbulb } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { generateMemoryCards } from '../services/geminiService';
import Loader from '../components/Loader';
import { useNotification } from '../contexts/NotificationContext';

interface Card {
  category: string;
  challenge: string;
  answer: string;
  hint: string;
}

const MemoryPalace: React.FC = () => {
  const { userData, setUserData, apiKey } = useData();
  const { showNotification } = useNotification();
  const [cards, setCards] = useState<Card[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | 'idle'>('idle');
  const [showHint, setShowHint] = useState(false);

  const fetchCards = async () => {
    if (!apiKey) {
        showNotification("Please set your API key in Settings.", 'error');
        return;
    }
    setIsLoading(true);
    setCurrentCardIndex(0);
    setFeedback('idle');
    setUserInput('');
    setShowHint(false);
    try {
      const generatedCards = await generateMemoryCards(apiKey, userData.grammarErrors, userData.vocabulary);
      if (generatedCards.length > 0) {
        setCards(generatedCards);
      } else {
        showNotification("Not enough data to generate cards. Practice more!", 'info');
      }
    } catch (error) {
      showNotification("An error occurred while generating cards.", 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCheckAnswer = () => {
      if (!userInput.trim()) return;
      const currentCard = cards[currentCardIndex];
      const isCorrect = userInput.trim().toLowerCase() === currentCard.answer.toLowerCase();
      
      if (currentCard.category === 'Grammar') {
          setUserData(prev => {
              const newStats = { ...prev.stats };
              newStats.learningAbility.totalMistakes += 1;
              if (isCorrect) {
                  newStats.learningAbility.correctedMistakes += 1;
              }
              return { ...prev, stats: newStats };
          });
      }

      setFeedback(isCorrect ? 'correct' : 'incorrect');
  };

  const handleNextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setFeedback('idle');
      setUserInput('');
      setShowHint(false);
    } else {
      // End of deck
      setCards([]);
    }
  };

  const progress = cards.length > 0 ? ((currentCardIndex + 1) / cards.length) * 100 : 0;
  
  const currentCard = cards[currentCardIndex];

  return (
    <div className="max-w-2xl mx-auto text-center">
      <h1 className="text-3xl font-bold text-white mb-6">Memory Palace</h1>
      <p className="text-gray-400 mb-8">Reinforce what you've learned with interactive challenges based on your recent activity.</p>

      <div className="bg-gray-800 p-8 rounded-xl shadow-lg min-h-[400px] flex flex-col justify-between">
        {isLoading && <Loader text="Building your memories..." />}
        
        {!isLoading && cards.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full">
            <BrainCircuit className="h-16 w-16 text-blue-500 mb-4" />
            <p className="text-lg mb-4">Ready to strengthen your memory?</p>
            <button
              onClick={fetchCards}
              disabled={userData.grammarErrors.length === 0 && userData.vocabulary.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Generate 5 Challenges
            </button>
             {(userData.grammarErrors.length === 0 && userData.vocabulary.length === 0) && (
                <p className="text-xs text-gray-500 mt-2">Practice more to unlock this feature.</p>
            )}
          </div>
        )}

        {!isLoading && currentCard && (
          <div className="flex flex-col h-full animate-fade-in text-left">
            <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
            </div>
            
            <div className="flex-1 flex flex-col justify-center">
              <span className={`text-xs px-2 py-1 rounded self-start mb-4 ${currentCard.category === 'Grammar' ? 'bg-red-500/50 text-red-300' : 'bg-green-500/50 text-green-300'}`}>{currentCard.category}</span>
              <p className="text-2xl font-semibold mb-6">{currentCard.challenge}</p>
              
              <div className="flex gap-2">
                 <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && feedback === 'idle' && handleCheckAnswer()}
                  placeholder="Your answer..."
                  disabled={feedback !== 'idle'}
                  className={`flex-grow bg-gray-700 p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70 ${
                      feedback === 'correct' ? 'ring-2 ring-green-500' : feedback === 'incorrect' ? 'ring-2 ring-red-500' : ''
                  }`}
                />
                {feedback === 'idle' && <button onClick={handleCheckAnswer} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">Check</button>}
                {feedback !== 'idle' && <button onClick={handleNextCard} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg">Next</button>}
              </div>

              {feedback === 'incorrect' && (
                <p className="text-green-400 mt-4 text-center">Correct answer: <span className="font-bold">{currentCard.answer}</span></p>
              )}
               {feedback === 'correct' && (
                <p className="text-green-400 mt-4 text-center font-bold">Correct!</p>
              )}

              <div className="mt-6 text-center">
                <button onClick={() => setShowHint(!showHint)} className="text-sm text-gray-400 hover:text-yellow-400 flex items-center mx-auto">
                    <Lightbulb className="h-4 w-4 mr-1" /> {showHint ? 'Hide' : 'Show'} Hint
                </button>
                {showHint && <p className="text-xs text-gray-500 mt-2 bg-gray-700/50 p-2 rounded">{currentCard.hint}</p>}
              </div>

            </div>
          </div>
        )}
      </div>
       {cards.length > 0 && !isLoading && <button onClick={fetchCards} className="mt-4 text-sm text-gray-400 hover:text-white flex items-center mx-auto"><RotateCcw className="h-4 w-4 mr-1"/>Start Over</button>}
    </div>
  );
};

export default MemoryPalace;
