import { useState, useEffect } from "react";
import { db } from "../utils/firebase";
import { collection, getDocs } from "firebase/firestore";

interface Problem {
  id: string;
  problemName: string;
  tags: string[];
  difficulty?: "Easy" | "Medium" | "Hard";
}

export const ProblemList = () => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
  try {
    console.log("Fetching problems...");
    const querySnapshot = await getDocs(collection(db, "problems"));
    console.log("Query snapshot size:", querySnapshot.size);
    
    const problemsData = querySnapshot.docs.map(doc => {
      console.log("Document data:", doc.id, doc.data());
      return {
        id: doc.id,
        ...doc.data()
      } as Problem;
    });
    
    console.log("Problems fetched:", problemsData);
    setProblems(problemsData);
  } catch (error) {
    console.error("Error fetching problems:", error);
    // Log the full error object
    console.error("Full error:", JSON.stringify(error, null, 2));
  } finally {
    setLoading(false);
  }
};

  const getDifficulty = (problem: Problem) => {
    return problem.difficulty || "Easy";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading problems...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
            💻 Problems
          </h1>
          <p className="text-gray-400 text-lg">
            Solve {problems.length} coding challenges
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <div className="text-2xl font-bold">
                  {problems.filter((p) => getDifficulty(p) === "Easy").length}
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
                  {problems.filter((p) => getDifficulty(p) === "Medium").length}
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
                  {problems.filter((p) => getDifficulty(p) === "Hard").length}
                </div>
                <div className="text-sm text-gray-400">Hard</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-gray-900/50 border-b border-gray-700 px-6 py-4">
            <div className="grid grid-cols-12 gap-4 font-semibold text-gray-400 text-sm uppercase">
              <div className="col-span-1">Status</div>
              <div className="col-span-5">Problem</div>
              <div className="col-span-2">Difficulty</div>
              <div className="col-span-4">Tags</div>
            </div>
          </div>

          <div className="divide-y divide-gray-700">
            {problems.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-2xl text-gray-400 mb-2">No problems yet</p>
                <p className="text-gray-500">Admin can add problems from the Admin page</p>
              </div>
            ) : (
              problems.map((problem, index) => {
                const difficulty = getDifficulty(problem);
                const isSolved = index % 3 === 0;

                return (
                  <div
                    key={problem.id}
                    className="px-6 py-5 hover:bg-gray-900/50 transition-colors duration-200 group cursor-pointer"
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-1">
                        {isSolved ? (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs">
                            ✓
                          </div>
                        ) : (
                          <div className="w-6 h-6 border-2 border-gray-600 rounded-full group-hover:border-purple-500 transition-colors"></div>
                        )}
                      </div>

                      <div className="col-span-5">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-500 font-mono text-sm">
                            {index + 1}.
                          </span>
                          <span className="font-semibold text-lg group-hover:text-purple-400 transition-colors">
                            {problem.problemName}
                          </span>
                        </div>
                      </div>

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
              })
            )}
          </div>
        </div>

        {problems.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={fetchProblems}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold text-lg shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-300"
            >
              Refresh Problems
            </button>
          </div>
        )}
      </div>
    </div>
  );
};