export const Leaderboard = ({
  leaderboard,
}: {
  leaderboard: { image: string; name: string; points: number; id: string }[];
}) => {
  const getRankBadge = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  const getRankColor = (index: number) => {
    if (index === 0) return "from-yellow-400 to-yellow-600";
    if (index === 1) return "from-gray-300 to-gray-500";
    if (index === 2) return "from-orange-400 to-orange-600";
    return "from-blue-500 to-purple-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-12 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
            🏆 Leaderboard
          </h1>
          <p className="text-gray-400 text-lg">Top performers this month</p>
        </div>

        {/* Leaderboard Container */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
          {leaderboard.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-2xl text-gray-400 mb-2">No users on the leaderboard yet</p>
              <p className="text-gray-500">Be the first to solve problems!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Top 3 Podium */}
              {leaderboard.slice(0, 3).length === 3 && (
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {/* 2nd Place */}
                  <div className="order-1 pt-12">
                    <div className="bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl p-6 text-center transform hover:scale-105 transition-all shadow-xl">
                      <div className="text-4xl mb-2">🥈</div>
                      <img
                        src={leaderboard[1].image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leaderboard[1].id}`}
                        alt={leaderboard[1].name}
                        className="w-20 h-20 rounded-full mx-auto mb-3 border-4 border-gray-300"
                      />
                      <div className="font-bold text-lg">{leaderboard[1].name}</div>
                      <div className="text-2xl font-bold mt-2">{leaderboard[1].points}</div>
                      <div className="text-sm text-gray-200">points</div>
                    </div>
                  </div>

                  {/* 1st Place */}
                  <div className="order-2">
                    <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl p-6 text-center transform hover:scale-105 transition-all shadow-2xl">
                      <div className="text-5xl mb-2">👑</div>
                      <img
                        src={leaderboard[0].image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leaderboard[0].id}`}
                        alt={leaderboard[0].name}
                        className="w-24 h-24 rounded-full mx-auto mb-3 border-4 border-yellow-300"
                      />
                      <div className="font-bold text-xl text-gray-900">{leaderboard[0].name}</div>
                      <div className="text-3xl font-bold mt-2 text-gray-900">{leaderboard[0].points}</div>
                      <div className="text-sm text-gray-800">points</div>
                    </div>
                  </div>

                  {/* 3rd Place */}
                  <div className="order-3 pt-12">
                    <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl p-6 text-center transform hover:scale-105 transition-all shadow-xl">
                      <div className="text-4xl mb-2">🥉</div>
                      <img
                        src={leaderboard[2].image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leaderboard[2].id}`}
                        alt={leaderboard[2].name}
                        className="w-20 h-20 rounded-full mx-auto mb-3 border-4 border-orange-300"
                      />
                      <div className="font-bold text-lg">{leaderboard[2].name}</div>
                      <div className="text-2xl font-bold mt-2">{leaderboard[2].points}</div>
                      <div className="text-sm text-gray-200">points</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Rest of the rankings */}
              <div className="space-y-3 mt-8">
                {leaderboard.slice(3).map((user, idx) => {
                  const actualIndex = idx + 3;
                  return (
                    <div
                      key={user.id}
                      className="bg-gray-900/50 border border-gray-700 rounded-xl p-5 hover:bg-gray-900 hover:border-purple-500 transition-all duration-300 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          {/* Rank */}
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${getRankColor(actualIndex)} flex items-center justify-center font-bold text-lg shadow-lg`}>
                            #{actualIndex + 1}
                          </div>

                          {/* Avatar */}
                          <img
                            src={user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                            alt={user.name}
                            className="w-12 h-12 rounded-full border-2 border-gray-600 group-hover:border-purple-500 transition-colors"
                          />

                          {/* User Info */}
                          <div className="flex-1">
                            <div className="font-semibold text-lg">{user.name}</div>
                            <div className="text-sm text-gray-500">ID: {user.id}</div>
                          </div>
                        </div>

                        {/* Points */}
                        <div className="text-right">
                          <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                            {user.points}
                          </div>
                          <div className="text-sm text-gray-500">points</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="text-2xl font-bold text-blue-400">{leaderboard.length}</div>
            <div className="text-sm text-gray-400">Total Users</div>
          </div>
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="text-2xl font-bold text-purple-400">
              {leaderboard.reduce((sum, u) => sum + u.points, 0)}
            </div>
            <div className="text-sm text-gray-400">Total Points</div>
          </div>
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="text-2xl font-bold text-green-400">
              {leaderboard.length > 0 ? Math.round(leaderboard.reduce((sum, u) => sum + u.points, 0) / leaderboard.length) : 0}
            </div>
            <div className="text-sm text-gray-400">Avg Points</div>
          </div>
        </div>
      </div>
    </div>
  );
};