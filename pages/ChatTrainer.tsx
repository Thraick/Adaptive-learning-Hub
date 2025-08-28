
import React, { useState, useEffect, useRef } from 'react';
import { Send, AlertCircle, Mic, Volume2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { getChatResponse, updatePersonaAndRecommendations } from '../services/geminiService';
import Loader from '../components/Loader';
import { GrammarError, UserData } from '../types';
import { useSpeech } from '../hooks/useSpeech';
import { Content } from '@google/genai';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const ChatTrainer: React.FC = () => {
  const { userData, setUserData, voiceURI } = useData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isListening, transcript, startListening, stopListening, speak, hasSpeechSupport } = useSpeech();

  useEffect(() => {
    // Sync messages with global state on load
    setMessages(userData.chatHistory.map(h => ({
        role: h.role,
        text: h.parts[0].text
    })));
  }, []);
  
  useEffect(() => {
    if (transcript) {
        setUserInput(transcript);
    }
  }, [transcript]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(scrollToBottom, [messages]);
  
  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const newUserMessage: Message = { role: 'user', text: userInput };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);
    
    const currentInput = userInput;
    setUserInput('');
    
    try {
        // FIX: Removed explicit `Content[]` type to allow for stricter type inference on `role`, matching UserData.
        const geminiHistory = [...userData.chatHistory, {role: 'user' as const, parts: [{text: currentInput}]}];
        const { response, corrections } = await getChatResponse(geminiHistory, userData);

        const newAiMessage: Message = { role: 'model', text: response };
        setMessages(prev => [...prev, newAiMessage]);
        
        const newHistory = [
            ...geminiHistory,
            {role: 'model' as const, parts: [{text: response}]}
        ];

        let newGrammarErrors: GrammarError[] = [];
        if (corrections && corrections.length > 0) {
            newGrammarErrors = corrections.map(c => ({
                ...c,
                id: `err-${Date.now()}-${Math.random()}`,
                timestamp: Date.now()
            }));
        }

        const updatedUserData = {
            ...userData,
            chatHistory: newHistory,
            grammarErrors: [...userData.grammarErrors, ...newGrammarErrors],
            stats: {
                ...userData.stats,
                grammarErrorsTracked: userData.stats.grammarErrorsTracked + newGrammarErrors.length
            }
        };

        setUserData(updatedUserData);
        
        // After every 5 user messages, update persona and recommendations
        const userMessageCount = newHistory.filter(m => m.role === 'user').length;
        if (userMessageCount > 0 && userMessageCount % 5 === 0) {
            updatePersonaAndRecommendations(updatedUserData).then(updates => {
                setUserData(prev => ({
                    ...prev,
                    profile: { ...prev.profile, persona: updates.persona },
                    recommendations: updates.recommendations,
                }));
            }).catch(console.error); // Fire-and-forget
        }


    } catch (error) {
      console.error(error);
      const errorMessage: Message = { role: 'model', text: 'Sorry, I encountered an error. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const recentErrors = userData.grammarErrors.slice(-3).reverse();

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-4rem)]">
      <h1 className="text-3xl font-bold text-white mb-4 text-center">Conversation Practice</h1>
      <div className="flex-1 bg-gray-800 rounded-t-xl p-4 overflow-y-auto flex flex-col">
        <div className="flex-1 space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'model' && hasSpeechSupport && (
                <button onClick={() => speak(msg.text, voiceURI)} className="p-1.5 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 self-center">
                    <Volume2 size={16}/>
                </button>
              )}
              <div className={`max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
              <div className="flex justify-start">
                   <div className="max-w-md p-3 rounded-lg bg-gray-700">
                      <Loader text="Alex is typing..."/>
                  </div>
              </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="mt-4 border-t border-gray-700 pt-4">
          <div className="flex items-center gap-2">
            {hasSpeechSupport && (
                <button onClick={isListening ? stopListening : startListening} className={`p-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-600 hover:bg-gray-500'}`}>
                    <Mic className="h-5 w-5"/>
                </button>
            )}
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
              placeholder={isListening ? "Listening..." : "Type your message here..."}
              className="flex-1 bg-gray-700 p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !userInput.trim()}
              className="p-3 rounded-lg bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center hover:bg-blue-700">
                <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      
      {recentErrors.length > 0 && (
          <div className="bg-gray-800 rounded-b-xl p-4 border-t border-gray-700">
              <h3 className="font-semibold text-sm mb-2 flex items-center"><AlertCircle className="h-4 w-4 mr-2 text-yellow-400"/> Recent Corrections</h3>
              <div className="space-y-2 text-xs">
                  {recentErrors.map(error => (
                      <div key={error.id}>
                          <p className="text-red-400 line-through">{error.error}</p>
                          <p className="text-green-400">{error.correction}</p>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};

// FIX: Add default export to make the component available for import.
export default ChatTrainer;
