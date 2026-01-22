import { Link } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { userAtom } from "../store/atoms/user";

export const Landing = () => {
  const user = useRecoilValue(userAtom);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center space-y-8">
          {/* Welcome Message */}
          <div className="space-y-4">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse">
              Welcome, {user.user?.email?.split('@')[0] || 'Coder'}!
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Master algorithms, ace interviews, and become a better developer
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300">
              <div className="text-4xl font-bold">150+</div>
              <div className="text-blue-200 mt-2">Problems</div>
            </div>
            <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-6 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300">
              <div className="text-4xl font-bold">1000+</div>
              <div className="text-purple-200 mt-2">Solutions</div>
            </div>
            <div className="bg-gradient-to-br from-pink-600 to-pink-800 p-6 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300">
              <div className="text-4xl font-bold">500+</div>
              <div className="text-pink-200 mt-2">Users</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex justify-center gap-4 mt-12">
            <Link
              to="/problems"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold text-lg shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-300"
            >
              Start Coding →
            </Link>
            <Link
              to="/leaderboard"
              className="px-8 py-4 bg-gray-800 border-2 border-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-700 transform hover:scale-105 transition-all duration-300"
            >
              View Rankings
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: "🎯",
              title: "Practice",
              desc: "Solve coding problems daily"
            },
            {
              icon: "🏆",
              title: "Compete",
              desc: "Climb the leaderboard"
            },
            {
              icon: "📊",
              title: "Track",
              desc: "Monitor your progress"
            },
            {
              icon: "💡",
              title: "Learn",
              desc: "Master algorithms"
            }
          ].map((feature, idx) => (
            <div
              key={idx}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 p-6 rounded-xl hover:border-purple-500 transition-all duration-300 group"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold mb-8 text-center">Recent Activity</h2>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 max-w-3xl mx-auto">
            <div className="space-y-4">
              {[
                { user: "You", problem: "Two Sum", time: "2 hours ago", status: "Solved" },
                { user: "Rahul", problem: "Reverse String", time: "3 hours ago", status: "Solved" },
                { user: "Priya", problem: "Merge Intervals", time: "5 hours ago", status: "Attempted" }
              ].map((activity, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-bold">
                      {activity.user[0]}
                    </div>
                    <div>
                      <div className="font-semibold">{activity.user}</div>
                      <div className="text-sm text-gray-400">{activity.problem}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${
                      activity.status === "Solved" ? "text-green-400" : "text-yellow-400"
                    }`}>
                      {activity.status}
                    </div>
                    <div className="text-sm text-gray-500">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};