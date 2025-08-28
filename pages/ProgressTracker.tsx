
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useData } from '../contexts/DataContext';
import { Award, BookOpen, CheckCircle, PieChart as PieChartIcon } from 'lucide-react';

const StatCard: React.FC<{ icon: React.ElementType, title: string, value: string | number, color: string }> = ({ icon: Icon, title, value, color }) => (
  <div className={`bg-gray-800 p-6 rounded-xl border-l-4 border-${color}-500 flex items-center space-x-4`}>
    <div className={`p-3 rounded-full bg-${color}-500/20 text-${color}-400`}>
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <p className="text-gray-400 text-sm">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </div>
);

const ProgressTracker: React.FC = () => {
  const { userData } = useData();

  // Process data for charts
  const errorTypes: { [key: string]: number } = userData.grammarErrors.reduce((acc, err) => {
    const type = err.explanation.toLowerCase().includes('tense') ? 'Tense' :
                 err.explanation.toLowerCase().includes('punctuation') ? 'Punctuation' :
                 err.explanation.toLowerCase().includes('article') ? 'Article' :
                 err.explanation.toLowerCase().includes('preposition') ? 'Preposition' :
                 'Other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const errorChartData = Object.entries(errorTypes).map(([name, value]) => ({ name, count: value }));

  let cumulativeWords = 0;
  const cumulativeLearningData = userData.vocabulary.map(word => ({
    date: new Date(word.addedDate).toLocaleDateString(),
    words: 1
  })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  .map(d => {
    cumulativeWords += d.words;
    return { date: d.date, "Words Learned": cumulativeWords };
  });

  const lastAssessment = userData.assessmentHistory.slice(-1)[0];
  
  const learningAbilityScore = userData.stats.learningAbility.totalMistakes > 0
    ? Math.round((userData.stats.learningAbility.correctedMistakes / userData.stats.learningAbility.totalMistakes) * 100)
    : 100;

  const quizPerformanceByTopic = userData.quizHistory.reduce((acc, quiz) => {
      if (!acc[quiz.topic]) {
          acc[quiz.topic] = { scores: [], count: 0 };
      }
      acc[quiz.topic].scores.push(quiz.score / quiz.total);
      acc[quiz.topic].count++;
      return acc;
  }, {} as Record<string, { scores: number[], count: number }>);

  const quizChartData = Object.entries(quizPerformanceByTopic).map(([topic, data]) => ({
      name: topic,
      "Average Score": Math.round((data.scores.reduce((a, b) => a + b, 0) / data.count) * 100),
  }));

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white">My Progress</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Award} title="Quizzes Completed" value={userData.stats.quizzesCompleted} color="blue" />
        <StatCard icon={CheckCircle} title="Avg. Quiz Score" value={`${userData.stats.quizAverageScore}%`} color="green" />
        <StatCard icon={BookOpen} title="Words in Dictionary" value={userData.vocabulary.length} color="yellow" />
        <StatCard icon={PieChartIcon} title="Learning Ability" value={`${learningAbilityScore}%`} color="purple" />
      </div>

      {lastAssessment && (
        <div className="bg-gray-800 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4 text-white">Latest Assessment Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="font-semibold text-green-400 mb-2">Strengths</h3>
                    <ul className="space-y-2">
                        {lastAssessment.strengths.map((s, i) => <li key={i} className="flex items-center text-gray-300"><span className="h-2 w-2 bg-green-400 rounded-full mr-3"></span>{s}</li>)}
                    </ul>
                </div>
                <div>
                    <h3 className="font-semibold text-red-400 mb-2">Areas to Improve</h3>
                    <ul className="space-y-2">
                        {lastAssessment.weaknesses.map((w, i) => <li key={i} className="flex items-center text-gray-300"><span className="h-2 w-2 bg-red-400 rounded-full mr-3"></span>{w}</li>)}
                    </ul>
                </div>
            </div>
        </div>
      )}

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-800 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4 text-white">Quiz Performance by Topic</h2>
            {quizChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                <BarChart data={quizChartData} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                    <XAxis type="number" domain={[0, 100]} stroke="#9CA3AF" />
                    <YAxis type="category" dataKey="name" stroke="#9CA3AF" width={80} />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                    <Legend />
                    <Bar dataKey="Average Score" fill="#3B82F6" background={{ fill: '#374151' }} />
                </BarChart>
                </ResponsiveContainer>
            ) : (
                <p className="text-gray-400 text-center py-10">Complete quizzes to see your performance.</p>
            )}
        </div>
        <div className="bg-gray-800 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4 text-white">Common Mistake Patterns</h2>
            {errorChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                <BarChart data={errorChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                    <Legend />
                    <Bar dataKey="count" fill="#EF4444" name="Mistakes" />
                </BarChart>
                </ResponsiveContainer>
            ) : (
                <p className="text-gray-400 text-center py-10">Your mistake patterns will be analyzed here.</p>
            )}
        </div>
      </div>
      
      <div className="bg-gray-800 p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-4 text-white">Vocabulary Growth</h2>
        {cumulativeLearningData.length > 1 ? (
            <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cumulativeLearningData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                <Legend />
                <Line type="monotone" dataKey="Words Learned" stroke="#FBBF24" strokeWidth={2} />
            </LineChart>
            </ResponsiveContainer>
        ) : (
            <p className="text-gray-400 text-center py-10">Learn more words to see your journey over time.</p>
        )}
      </div>

    </div>
  );
};

export default ProgressTracker;
