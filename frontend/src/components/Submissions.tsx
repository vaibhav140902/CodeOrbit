import { useState, useEffect } from "react";
import { useRecoilValue } from "recoil";
import { userAtom } from "../store/atoms/user";

interface Submission {
  id: string;
  problemName: string;
  status: "Accepted" | "Wrong Answer" | "Time Limit Exceeded" | "Runtime Error";
  language: string;
  timestamp: string;
  runtime: string;
  memory: string;
}

export const Submissions = () => {
  const user = useRecoilValue(userAtom);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filter, setFilter] = useState<"all" | "accepted" | "failed">("all");

  useEffect(() => {
    // Mock submissions data
    const mockSubmissions: Submission[] = [
      {
        id: "1",
        problemName: "Two Sum",
        status: "Accepted",
        language: "JavaScript",
        timestamp: "2 hours ago",
        runtime: "68ms",
        memory: "42.1 MB"
      },
      {
        id: "2",
        problemName: "Reverse String",
        status: "Accepted",
        language: "Python",
        timestamp: "5 hours ago",
        runtime: "45ms",
        memory: "38.5 MB"
      },
      {
        id: "3",
        problemName: "Palindrome Check",
        status: "Wrong Answer",
        language: "JavaScript",
        timestamp: "1 day ago",
        runtime: "N/A",
        memory: "N/A"
      },
      {
        id: "4",
        problemName: "Merge Intervals",
        status: "Accepted",
        language: "TypeScript",
        timestamp: "2 days ago",
        runtime: "102ms",
        memory: "51.2 MB"
      },
      {
        id: "5",
        problemName: "Binary Search",
        status: "Time Limit Exceeded",
        language: "Java",
        timestamp: "3 days ago",
        runtime: "N/A",
        memory: "N/A"
      },
      {
        id: "6",
        problemName: "Valid Parentheses",
        status: "Accepted",
        language: "C++",
        timestamp: "4 days ago",
        runtime: "0ms",
        memory: "6.2 MB"
      }
    ];

    setSubmissions(mockSubmissions);
  }, []);

  const getStatusColor = (status: Submission["status"]) => {
    switch (status) {
      case "Accepted":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Wrong Answer":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "Time Limit Exceeded":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "Runtime Error":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    }
  };

  const getStatusIcon = (status: Submission["status"]) => {
    switch (status) {
      case "Accepted":
        return "✓";
      case "Wrong Answer":
        return "✗";
      case "Time Limit Exceeded":
        return "⏱";
      case "Runtime Error":
        return "⚠";
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    if (filter === "accepted") return sub.status === "Accepted";
    if (filter === "failed") return sub.status !== "Accepted";
    return true;
  });

  const acceptedCount = submissions.filter((s) => s.status === "Accepted").length;
  const totalCount = submissions.length;
  const successRate = totalCount > 0 ? Math.round((acceptedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
            📊 My Activity
          </h1>
          <p className="text-gray-400 text-lg">
            Track your coding journey, {user.user?.email?.split('@')[0] || 'Coder'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-6 backdrop-blur-sm">
            <div className="text-3xl font-bold">{totalCount}</div>
            <div className="text-sm text-gray-400 mt-1">Total Submissions</div>
          </div>
          <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-xl p-6 backdrop-blur-sm">
            <div className="text-3xl font-bold text-green-400">{acceptedCount}</div>
            <div className="text-sm text-gray-400 mt-1">Accepted</div>
          </div>
          <div className="bg-gradient-to-br from-red-600/20 to-red-800/20 border border-red-500/30 rounded-xl p-6 backdrop-blur-sm">
            <div className="text-3xl font-bold text-red-400">{totalCount - acceptedCount}</div>
            <div className="text-sm text-gray-400 mt-1">Failed</div>
          </div>
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-xl p-6 backdrop-blur-sm">
            <div className="text-3xl font-bold text-purple-400">{successRate}%</div>
            <div className="text-sm text-gray-400 mt-1">Success Rate</div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-2 mb-6 flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              filter === "all"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setFilter("accepted")}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              filter === "accepted"
                ? "bg-green-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            Accepted ({acceptedCount})
          </button>
          <button
            onClick={() => setFilter("failed")}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              filter === "failed"
                ? "bg-red-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            Failed ({totalCount - acceptedCount})
          </button>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
          <div className="divide-y divide-gray-700">
            {filteredSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="p-6 hover:bg-gray-900/50 transition-colors duration-200 group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={`w-12 h-12 rounded-xl ${getStatusColor(
                        submission.status
                      )} border flex items-center justify-center text-2xl font-bold`}
                    >
                      {getStatusIcon(submission.status)}
                    </div>

                    <div className="flex-1">
                      <div className="font-semibold text-lg group-hover:text-purple-400 transition-colors">
                        {submission.problemName}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>{submission.timestamp}</span>
                        <span>•</span>
                        <span className="text-blue-400">{submission.language}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`inline-block px-4 py-2 rounded-lg border font-semibold mb-2 ${getStatusColor(
                        submission.status
                      )}`}
                    >
                      {submission.status}
                    </div>
                    {submission.status === "Accepted" && (
                      <div className="flex gap-4 text-sm text-gray-400">
                        <div>
                          <span className="text-green-400">⚡ {submission.runtime}</span>
                        </div>
                        <div>
                          <span className="text-blue-400">💾 {submission.memory}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};