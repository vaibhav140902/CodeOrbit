import { useState, useEffect } from "react";
import { db } from "../utils/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";

interface Problem {
  id: string;
  problemName: string;
  tags: string[];
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  examples: string;
  constraints: string;
}

interface User {
  id: string;
  email: string;
  isAdmin: boolean;
  points: number;
  createdAt?: any;
  lastLoginAt?: any;
  displayName?: string;
  status?: string;
  role?: string;
  emailVerified?: boolean;
}

export const AdminPage = () => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<"problems" | "users">("problems");
  const [usersError, setUsersError] = useState<string | null>(null);
  
  // Form states
  const [problemName, setProblemName] = useState("");
  const [tags, setTags] = useState("");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Easy");
  const [description, setDescription] = useState("");
  const [examples, setExamples] = useState("");
  const [constraints, setConstraints] = useState("");
  const [loading, setLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [showAdminsOnly, setShowAdminsOnly] = useState(false);

  useEffect(() => {
    fetchProblems();
    fetchUsers();
  }, []);

  const fetchProblems = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "problems"));
      const problemsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Problem));
      setProblems(problemsData);
    } catch (error) {
      console.error("Error fetching problems:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersError(null);
      const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(usersQuery);
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
      setUsers(usersData);
    } catch (error: unknown) {
      const errorCode = (error as { code?: string })?.code;
      if (errorCode === "permission-denied") {
        setUsersError("Permission denied for users list. Deploy Firestore rules, then refresh this page.");
        return;
      }
      console.error("Error fetching users:", error);
      setUsersError("Failed to fetch users.");
    }
  };

  const openAdminSetupGuide = () => {
    alert(
      "Admin setup:\n\n1) Create a normal user from Sign Up.\n2) Copy that user's uid from Firebase Authentication.\n3) Run this script:\n\ncd frontend/src/admin-scripts\nnode makeAdmin.js <uid>\n\nTo seed starter problems:\nnode seedProblems.js\n\nTo backfill registry from Firebase Auth:\nnode syncUsersFromAuth.js\n\nTo rebuild leaderboard from existing submissions:\nnode rebuildLeaderboard.js\n\nThis keeps users registry and ranking data production-ready."
    );
  };

  const formatTimestamp = (value: unknown) => {
    if (!value || typeof value !== "object") return "N/A";
    if (typeof (value as { toDate?: () => Date }).toDate === "function") {
      return (value as { toDate: () => Date }).toDate().toLocaleString();
    }
    return "N/A";
  };

  const filteredUsers = users.filter((user) => {
    const email = String(user.email || "").toLowerCase();
    const displayName = String(user.displayName || "").toLowerCase();
    const searchTerm = userSearch.toLowerCase();
    const matchesSearch = email.includes(searchTerm) || displayName.includes(searchTerm);
    const matchesAdminFilter = !showAdminsOnly || user.isAdmin;
    return matchesSearch && matchesAdminFilter;
  });

  const recentlyActiveUsers = users.filter((user) => {
    const ts = user.lastLoginAt;
    if (!ts || typeof ts !== "object" || typeof ts.toDate !== "function") return false;
    const lastLogin = ts.toDate().getTime();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return lastLogin >= sevenDaysAgo;
  }).length;

  const handleAddProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, "problems"), {
        problemName,
        tags: tags.split(",").map(tag => tag.trim()),
        difficulty,
        description,
        examples,
        constraints,
        createdAt: serverTimestamp()
      });

      alert("Problem added successfully!");
      setProblemName("");
      setTags("");
      setDifficulty("Easy");
      setDescription("");
      setExamples("");
      setConstraints("");
      fetchProblems();
    } catch (error) {
      console.error("Error adding problem:", error);
      alert("Failed to add problem");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProblem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this problem?")) return;

    try {
      await deleteDoc(doc(db, "problems", id));
      alert("Problem deleted!");
      fetchProblems();
    } catch (error) {
      console.error("Error deleting problem:", error);
      alert("Failed to delete problem");
    }
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        isAdmin: !currentStatus,
        role: !currentStatus ? "admin" : "user",
        updatedAt: serverTimestamp(),
      });
      alert("User admin status updated!");
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* ADMIN SETUP HELP */}
        <button 
          onClick={openAdminSetupGuide}
          className="fixed top-24 right-8 bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 rounded-xl font-bold shadow-2xl hover:shadow-green-500/50 transform hover:scale-105 transition-all z-50"
        >
          🔐 Admin Setup Help
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent mb-4">
            🔐 Admin Dashboard
          </h1>
          <p className="text-gray-400 text-lg">Manage problems and users</p>
        </div>

        {/* Tabs */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-2 mb-8 flex gap-2">
          <button
            onClick={() => setActiveTab("problems")}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              activeTab === "problems"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            📝 Problems ({problems.length})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              activeTab === "users"
                ? "bg-purple-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            👥 Users ({users.length})
          </button>
        </div>

        {/* Problems Tab */}
        {activeTab === "problems" && (
          <div className="space-y-8">
            {/* Add Problem Form */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-6">Add New Problem</h2>
              <form onSubmit={handleAddProblem} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-400 text-sm font-medium mb-2">
                      Problem Name *
                    </label>
                    <input
                      type="text"
                      value={problemName}
                      onChange={(e) => setProblemName(e.target.value)}
                      placeholder="Two Sum"
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm font-medium mb-2">
                      Difficulty *
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as any)}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm font-medium mb-2">
                    Tags (comma separated) *
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Array, Hash Table, Two Pointers"
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm font-medium mb-2">
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Given an array of integers..."
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm font-medium mb-2">
                    Examples
                  </label>
                  <textarea
                    value={examples}
                    onChange={(e) => setExamples(e.target.value)}
                    placeholder="Example 1: Input: [2,7,11,15], target = 9..."
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm font-medium mb-2">
                    Constraints
                  </label>
                  <textarea
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value)}
                    placeholder="1 <= nums.length <= 10^4..."
                    rows={2}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold text-lg shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Adding..." : "Add Problem"}
                </button>
              </form>
            </div>

            {/* Problems List */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-6">All Problems</h2>
              <div className="space-y-4">
                {problems.map((problem) => (
                  <div
                    key={problem.id}
                    className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 hover:border-purple-500 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">{problem.problemName}</h3>
                        <div className="flex gap-2 mb-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            problem.difficulty === "Easy"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : problem.difficulty === "Medium"
                              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}>
                            {problem.difficulty}
                          </span>
                          {problem.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <p className="text-gray-400 text-sm">{problem.description}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteProblem(problem.id)}
                        className="ml-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {problems.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No problems yet. Add your first problem above!</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6">Registered Users</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4">
                <p className="text-sm text-gray-400">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4">
                <p className="text-sm text-gray-400">Admins</p>
                <p className="text-2xl font-bold">{users.filter((user) => user.isAdmin).length}</p>
              </div>
              <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4">
                <p className="text-sm text-gray-400">Active Last 7 Days</p>
                <p className="text-2xl font-bold">{recentlyActiveUsers}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <input
                type="text"
                placeholder="Search by email or display name..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
              />
              <label className="flex items-center gap-3 bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3">
                <input
                  type="checkbox"
                  checked={showAdminsOnly}
                  onChange={(e) => setShowAdminsOnly(e.target.checked)}
                />
                <span className="text-gray-300">Show admins only</span>
              </label>
            </div>

            {usersError && (
              <p className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {usersError}
              </p>
            )}
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 hover:border-purple-500 transition-all"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-bold text-xl">
                        {String(user.email || "?")[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <div className="font-semibold text-lg flex items-center gap-2">
                          {user.email || "Unknown Email"}
                          {user.isAdmin && (
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-bold">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
                          <span>Name: {user.displayName || "N/A"}</span>
                          <span>Points: {user.points || 0}</span>
                          <span>Status: {user.status || "active"}</span>
                          <span>Email Verified: {user.emailVerified ? "Yes" : "No"}</span>
                          <span>Registered: {formatTimestamp(user.createdAt)}</span>
                          <span>Last Login: {formatTimestamp(user.lastLoginAt)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        user.isAdmin
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {user.isAdmin ? "Remove Admin" : "Make Admin"}
                    </button>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <p className="text-center text-gray-500 py-8">No users found for current filters.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
