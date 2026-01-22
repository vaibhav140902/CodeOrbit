export const ProblemList = ({
  problemList,
}: {
  problemList: { id: string; problemName: string; tags: string[] }[];
}) => {
  const difficultyColors: { [key: string]: string } = {
    Easy: "bg-green-500",
    Medium: "bg-yellow-500",
    Hard: "bg-red-500",
  };

  const getDifficulty = (id: string) => {
    const num = parseInt(id);
    if (num % 3 === 0) return "Hard";
    if (num % 2 === 0) return "Medium";
    return "Easy";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
            💻 Problems
          </h1>
          <p className="text-gray-400 text-lg">
            Solve {problemList.length} coding challenges
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <div className="text-2xl font-bold">
                  {problemList.filter((p) => getDifficulty(p.id) === "Easy").length}
                </div>
                <div className="text-sm text-gray-400">Easy</div>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border border-yellow-500/30 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div>
                <div className="text-2xl font-bold">
                  {problemList.filter((p) => getDifficulty(p.id) === "Medium").length}
                </div>
                <div className="text-sm text-gray-400">Medium</div>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-600/20 to-red-800/20 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div>
                <div className="text-2xl font-bold">
                  {problemList.filter((p) => getDifficulty(p.id) === "Hard").length}
                </div>
                <div className="text-sm text-gray-400">Hard</div>
              </div>
            </div>
          </div>
        </div>

        {/* Problems Table */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
          {/* Table Header */}
          <div className="bg-gray-900/50 border-b border-gray-700 px-6 py-4">
            <div className="grid grid-cols-12 gap-4 font-semibold text-gray-400 text-sm uppercase">
              <div className="col-span-1">Status</div>
              <div className="col-span-5">Problem</div>
              <div className="col-span-2">Difficulty</div>
              <div className="col-span-4">Tags</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-700">
            {problemList.map((problem, index) => {
              const difficulty = getDifficulty(problem.id);
              const isSolved = index % 3 === 0; // Mock solved status

              return (
                <div
                  key={problem.id}
                  className="px-6 py-5 hover:bg-gray-900/50 transition-colors duration-200 group cursor-pointer"
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Status */}
                    <div className="col-span-1">
                      {isSolved ? (
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs">
                          ✓
                        </div>
                      ) : (
                        <div className="w-6 h-6 border-2 border-gray-600 rounded-full group-hover:border-purple-500 transition-colors"></div>
                      )}
                    </div>

                    {/* Problem Name */}
                    <div className="col-span-5">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 font-mono text-sm">
                          {problem.id}.
                        </span>
                        <span className="font-semibold text-lg group-hover:text-purple-400 transition-colors">
                          {problem.problemName}
                        </span>
                      </div>
                    </div>

                    {/* Difficulty */}
                    <div className="col-span-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          difficulty === "Easy"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : difficulty === "Medium"
                            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {difficulty}
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="col-span-4 flex flex-wrap gap-2">
                      {problem.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-medium hover:bg-blue-500/30 transition-colors"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Action */}
        <div className="mt-8 text-center">
          <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold text-lg shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-300">
            Load More Problems
          </button>
        </div>
      </div>
    </div>
  );
};