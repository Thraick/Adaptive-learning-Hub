
import React, { useState, useEffect } from 'react';
import { Award, Book, AlertTriangle, Calendar, Lightbulb, User, RefreshCw } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { updatePersonaAndRecommendations } from '../services/geminiService';
import Loader from '../components/Loader';

const StatCard: React.FC<{ icon: React.ElementType, title: string, value: string | number, color: string }> = ({ icon: Icon, title, value, color }) => (
  <div className="bg-gray-800 p-6 rounded-xl flex items-center space-x-4 transition-transform hover:scale-105">
    <div className={`p-3 rounded-full bg-${color}-500/20 text-${color}-400`}>
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <p className="text-gray-400 text-sm">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { userData, setUserData, apiKey } = useData();
  const [isLoading, setIsLoading] = useState(false);

  const fetchRecs = async () => {
      if (!apiKey) return;
      setIsLoading(true);
      try {
        const updates = await updatePersonaAndRecommendations(apiKey, userData);
        setUserData(prev => ({
            ...prev,
            profile: { ...prev.profile, persona: updates.persona },
            recommendations: updates.recommendations,
        }));
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    // Fetch recommendations on initial load if there are none or they are the default ones.
    if (userData.recommendations.length <= 3) {
        fetchRecs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);
  
  const recentErrors = userData.grammarErrors.slice(-5).reverse();

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-white">Welcome back, {userData.profile.name}!</h1>
      
      <div className="bg-gray-800 p-6 rounded-xl flex items-center space-x-4">
         <div className="p-3 rounded-full bg-blue-500/20 text-blue-400">
            <User className="h-6 w-6" />
        </div>
        <div>
            <p className="text-gray-400 text-sm">Your AI Persona</p>
            <p className="font-semibold text-white">{userData.profile.persona.summary}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Award} title="Current Level" value={userData.profile.level} color="blue" />
        <StatCard icon={Book} title="Words Learned" value={userData.stats.wordsLearned} color="green" />
        <StatCard icon={AlertTriangle} title="Grammar Errors" value={userData.stats.grammarErrorsTracked} color="red" />
        <StatCard icon={Calendar} title="Learning Streak" value={`${userData.profile.learningStreak} days`} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-800 p-6 rounded-xl">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Personal Recommendations</h2>
                <button onClick={fetchRecs} disabled={isLoading} className="text-sm text-gray-400 hover:text-white flex items-center disabled:opacity-50 disabled:cursor-wait">
                    <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`}/> Refresh
                </button>
            </div>
            {isLoading ? <Loader text="Generating tips..."/> : (
              <ul className="space-y-3">
                {userData.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <Lightbulb className="h-5 w-5 text-yellow-400 mt-1 flex-shrink-0" />
                    <p className="text-gray-300">{rec}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4 text-white">Recent Grammar Errors</h2>
          {recentErrors.length > 0 ? (
            <div className="space-y-4">
              {recentErrors.map(error => (
                <div key={error.id}>
                  <p className="text-red-400 line-through text-sm">{error.error}</p>
                  <p className="text-green-400 text-sm">{error.correction}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">No errors tracked yet. Start a chat or take an assessment!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
