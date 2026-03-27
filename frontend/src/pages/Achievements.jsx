import { useEffect, useState } from "react";
import axios from "../services/api";
import { toast } from "react-hot-toast";
import Skeleton from "../components/Skeleton";

const Achievements = () => {
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lbRes, statsRes] = await Promise.all([
          axios.get("/achievements/leaderboard"),
          axios.get("/achievements/stats")
        ]);
        setLeaderboard(lbRes.data);
        setStats(statsRes.data);
      } catch (err) {
        console.error("Failed to fetch achievements", err);
        toast.error("Failed to load achievements data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-[calc(100vh-90px)] p-6 md:p-10 space-y-8">
        <Skeleton height="8rem" className="rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton height="20rem" className="rounded-2xl" />
          <Skeleton height="20rem" className="rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-90px)] p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* GLOBAL PULSE SECTION */}
        <div className="bg-[#6a0026] text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
               <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
             </svg>
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-around items-center gap-8 text-center">
            <div>
              <p className="text-pink-200 text-sm font-medium uppercase tracking-wider">Total Units Collected</p>
              <h2 className="text-4xl md:text-5xl font-bold mt-1">{stats?.global?.totalUnits || 0}</h2>
            </div>
            <div className="h-16 w-[1px] bg-white/20 hidden md:block"></div>
            <div>
              <p className="text-pink-200 text-sm font-medium uppercase tracking-wider">Lives Potentially Saved</p>
              <h2 className="text-4xl md:text-5xl font-bold mt-1">{stats?.global?.totalLivesSaved || 0}</h2>
            </div>
            <div className="h-16 w-[1px] bg-white/20 hidden md:block"></div>
            <div>
              <p className="text-pink-200 text-sm font-medium uppercase tracking-wider">Active Lifesavers</p>
              <h2 className="text-4xl md:text-5xl font-bold mt-1">{stats?.global?.totalDonors || 0}</h2>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* CLUB LEADERBOARD */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              🏆 Club Leaderboard
            </h3>
            
            <div className="space-y-6">
              {leaderboard.map((club, index) => (
                <div key={club.name} className={`flex items-center p-4 rounded-2xl transition-all ${index === 0 ? 'bg-yellow-50/50 border border-yellow-100' : 'hover:bg-gray-50'}`}>
                  <div className="w-10 h-10 flex items-center justify-center font-bold text-lg">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </div>
                  
                  <div className="ml-4 flex-1">
                    <h4 className="font-bold text-gray-900">{club.name}</h4>
                    <p className="text-xs text-gray-500 uppercase tracking-tighter">{club.members} Members</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{club.units} Units</p>
                    <p className="text-xs text-blue-600 font-medium">{club.livesSaved} Lives Saved</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-100 italic text-sm text-blue-700">
              "Great job {leaderboard[0]?.name}! You are leading the charge this month."
            </div>
          </div>

          {/* MY ACHIEVEMENTS */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              🏅 My Achievements
            </h3>

            <div className="mb-8">
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <p className="text-sm text-gray-500">Your Impact</p>
                        <h4 className="text-3xl font-bold text-[#6a0026]">{stats?.personal?.livesSaved} Lives Saved</h4>
                    </div>
                    <p className="text-sm font-medium text-gray-600">{stats?.personal?.totalDonations} Donations</p>
                </div>
                {stats?.personal?.nextMilestone && (
                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                        <div 
                            className="bg-[#6a0026] h-full transition-all duration-1000"
                            style={{ width: `${(stats.personal.totalDonations / stats.personal.nextMilestone) * 100}%` }}
                        ></div>
                    </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                    {stats?.personal?.nextMilestone 
                        ? `${stats.personal.nextMilestone - stats.personal.totalDonations} more donations to reach your next milestone!`
                        : "You've reached the highest legend tier!"}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
               {stats?.personal?.badges.length > 0 ? (
                 stats.personal.badges.map(badge => (
                   <div key={badge.id} className="p-4 border border-gray-100 rounded-2xl text-center hover:shadow-md transition-shadow group">
                     <span className="text-4xl block mb-2 group-hover:scale-110 transition-transform">{badge.icon}</span>
                     <h5 className="font-bold text-sm text-gray-900">{badge.name}</h5>
                     <p className="text-[10px] text-gray-400 uppercase tracking-widest">{badge.level}</p>
                   </div>
                 ))
               ) : (
                 <div className="col-span-2 py-10 text-center text-gray-400">
                    <p>No badges yet. Start donating to unlock your first badge!</p>
                 </div>
               )}
            </div>
          </div>

        </div>

        {/* MONTHLY REPORT MOCKUP */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">📊 Monthly Insights</h3>
                <p className="text-gray-500">How the community is performing this month</p>
              </div>
              <div className="flex gap-2">
                 <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">Growing +12%</span>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Most Active Club</p>
                  <p className="text-xl font-bold">{leaderboard[0]?.name || "NSS"}</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Top Blood Group</p>
                  <p className="text-xl font-bold">O Positive (34%)</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Urgent Responses</p>
                  <p className="text-xl font-bold">24 Successful</p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Achievements;
