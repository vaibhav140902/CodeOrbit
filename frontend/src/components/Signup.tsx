// import { useState } from 'react';
// import { createUserWithEmailAndPassword } from 'firebase/auth';
// import { doc, setDoc } from 'firebase/firestore';
// import { auth, db } from '../utils/firebase';
// import { useNavigate, Link } from 'react-router-dom';

// export const Signup = () => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   const handleSignup = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (password !== confirmPassword) {
//       alert('Passwords do not match!');
//       return;
//     }

//     if (password.length < 6) {
//       alert('Password must be at least 6 characters!');
//       return;
//     }

//     setLoading(true);
//     try {
//       const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
//       // Create user document in Firestore
//       await setDoc(doc(db, 'users', userCredential.user.uid), {
//         email: email,
//         isAdmin: false,
//         points: 0,
//         createdAt: new Date()
//       });

//       alert('Account created successfully!');
//       navigate('/problems');
//     } catch (error: any) {
//       console.error('Error signing up:', error);
//       if (error.code === 'auth/email-already-in-use') {
//         alert('This email is already registered!');
//       } else if (error.code === 'auth/invalid-email') {
//         alert('Invalid email address!');
//       } else if (error.code === 'auth/weak-password') {
//         alert('Password is too weak!');
//       } else {
//         alert('Error: ' + error.message);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center p-6">
//       <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 p-8 rounded-2xl w-full max-w-md shadow-2xl">
//         <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
//           Create Account
//         </h1>
//         <p className="text-gray-400 mb-8">Join Vaibhav's Code today!</p>

//         <form onSubmit={handleSignup} className="space-y-6">
//           <div>
//             <label className="block text-gray-400 text-sm font-medium mb-2">
//               Email Address
//             </label>
//             <input
//               type="email"
//               placeholder="your.email@example.com"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
//               required
//             />
//           </div>

//           <div>
//             <label className="block text-gray-400 text-sm font-medium mb-2">
//               Password
//             </label>
//             <input
//               type="password"
//               placeholder="••••••••"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
//               required
//               minLength={6}
//             />
//             <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
//           </div>

//           <div>
//             <label className="block text-gray-400 text-sm font-medium mb-2">
//               Confirm Password
//             </label>
//             <input
//               type="password"
//               placeholder="••••••••"
//               value={confirmPassword}
//               onChange={(e) => setConfirmPassword(e.target.value)}
//               className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
//               required
//               minLength={6}
//             />
//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold text-lg shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {loading ? 'Creating Account...' : 'Sign Up'}
//           </button>
//         </form>

//         <div className="mt-6 text-center">
//           <p className="text-gray-400">
//             Already have an account?{' '}
//             <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
//               Sign In
//             </Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };