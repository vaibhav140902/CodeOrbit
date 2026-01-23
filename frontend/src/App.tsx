import { auth } from "./utils/firebase";
//import { initializeApp } from "firebase/app";
import { Signin } from "./components/Signin";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { RecoilRoot, useRecoilState } from "recoil";
import { userAtom } from "./store/atoms/user";
import { Topbar } from "./components/Topbar";
import { ProblemList } from "./components/ProblemList";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { About } from "./components/About";
import { Landing } from "./components/Landing";
import { Submissions } from "./components/Submissions";
import { Leaderboard } from "./components/LeaderBoard";
import { AdminPage } from "./components/AdminPage";

// const firebaseConfig = {
//   apiKey: "AIzaSyAjjsbl9eSDWSmfrWpFPap2uGuwONZ2N4g",
//   authDomain: "leetcode-clone-c39eb.firebaseapp.com",
//   projectId: "leetcode-clone-c39eb",
//   storageBucket: "leetcode-clone-c39eb.appspot.com",
//   messagingSenderId: "66814187798",
//   appId: "1:66814187798:web:a6b3702e191448722dd837",
//   measurementId: "G-ET5FNB5WCN"
// };

// // Initialize Firebase
// export const app = initializeApp(firebaseConfig);
// export const auth = getAuth(app);

function App() {
  return (
    <RecoilRoot>
      <StoreApp />
    </RecoilRoot>
  );
}

function StoreApp() {
  const [user, setUser] = useRecoilState(userAtom);
  const [leaderboardData, setLeaderboardData] = useState<
    { image: string; name: string; points: number; id: string }[]
  >([]);

  useEffect(() => {
    onAuthStateChanged(auth, function (user) {
      if (user && user.email) {
        setUser({
          loading: false,
          user: {
            email: user.email,
          },
        });
      } else {
        setUser({
          loading: false,
        });
        console.log("There is no logged in user");
      }
    });

    // Load leaderboard data (mock data for now)
    // Replace this with Firebase Firestore call later
    const mockLeaderboard = [
      {
        id: "user001",
        name: "Vaibhav Maurya",
        points: 2500,
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Vaibhav"
      },
      {
        id: "user002",
        name: "Rahul Kumar",
        points: 2200,
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul"
      },
      {
        id: "user003",
        name: "Priya Sharma",
        points: 2100,
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya"
      },
      {
        id: "user004",
        name: "Amit Patel",
        points: 1950,
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amit"
      },
      {
        id: "user005",
        name: "Sneha Gupta",
        points: 1800,
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha"
      },
      {
        id: "user006",
        name: "Rohan Verma",
        points: 1650,
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan"
      },
      {
        id: "user007",
        name: "Anjali Singh",
        points: 1500,
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali"
      }
    ];

    // Sort by points in descending order
    const sorted = mockLeaderboard.sort((a, b) => b.points - a.points);
    setLeaderboardData(sorted);
  }, [setUser]);

  if (user.loading) {
    return <div>loading ...</div>;
  }
  
  if (!user.user) {
    return <div><Signin /></div>
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Router>
        <Topbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/activity" element={<Submissions />} />
                      <Route path="/problems" element={<ProblemList />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/leaderboard" element={<Leaderboard leaderboard={leaderboardData} />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;