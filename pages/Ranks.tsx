
import React, { useState } from 'react';
import { Trophy, Globe, MapPin } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const placeholderData = {
  global: [
    { rank: 1, name: 'Haruki', country: 'Japan', score: 15400 },
    { rank: 2, name: 'Lena', country: 'Germany', score: 14950 },
    { rank: 3, name: 'Carlos', country: 'Spain', score: 14800 },
    { rank: 4, name: 'Mei', country: 'China', score: 14200 },
    { rank: 5, name: 'Adem', country: 'Turkey', score: 13900 },
    { rank: 6, name: 'Fatima', country: 'Egypt', score: 13500 },
    { rank: 7, name: 'John', country: 'USA', score: 13250 },
    { rank: 8, name: 'Anika', country: 'India', score: 12800 },
    { rank: 9, name: 'Dmitri', country: 'Russia', score: 12500 },
    { rank: 10, name: 'Chloe', country: 'France', score: 12200 },
  ],
  country: [
    { rank: 1, name: 'You', country: 'Your Country', score: 9850 },
    { rank: 2, name: 'User_482', country: 'Your Country', score: 9500 },
    { rank: 3, name: 'User_101', country: 'Your Country', score: 9200 },
    { rank: 4, name: 'User_734', country: 'Your Country', score: 8800 },
    { rank: 5, name: 'User_245', country: 'Your Country', score: 8500 },
  ],
};


const Ranks: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'global' | 'country'>('global');
  const { userData } = useData();
  
  const countryName = userData.profile.country || 'your country';
  placeholderData.country.forEach(p => p.country = countryName);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-white">Leaderboards</h1>
        <p className="text-gray-400 mt-2">See how you rank against other learners.</p>
      </div>

      <div className="bg-gray-800 p-2 rounded-xl flex justify-center gap-2 max-w-sm mx-auto">
        <button
          onClick={() => setActiveTab('global')}
          className={`w-full font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 ${activeTab === 'global' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
        >
          <Globe size={16} /> Global
        </button>
        <button
          onClick={() => setActiveTab('country')}
          className={`w-full font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 ${activeTab === 'country' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
        >
          <MapPin size={16} /> {countryName}
        </button>
      </div>
      
      <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-700/50">
                    <tr>
                        <th className="p-4 font-semibold">Rank</th>
                        <th className="p-4 font-semibold">Name</th>
                        {activeTab === 'global' && <th className="p-4 font-semibold">Country</th>}
                        <th className="p-4 font-semibold text-right">Score</th>
                    </tr>
                </thead>
                <tbody>
                    {placeholderData[activeTab].map((user, index) => (
                        <tr key={index} className={`border-t border-gray-700 ${user.name === 'You' ? 'bg-blue-900/50' : ''}`}>
                            <td className="p-4 font-bold text-lg w-20">{user.rank}</td>
                            <td className="p-4">{user.name}</td>
                            {activeTab === 'global' && <td className="p-4 text-gray-400">{user.country}</td>}
                            <td className="p-4 text-right font-mono">{user.score.toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      <div className="text-center text-xs text-gray-500 p-4 bg-gray-800/50 rounded-lg">
        <strong>Note:</strong> Leaderboards are for demonstration purposes only. A full implementation requires a backend server and database to track user scores globally.
      </div>
    </div>
  );
};

export default Ranks;
