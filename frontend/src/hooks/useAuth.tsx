import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../utils/firebase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setIsAdmin(userDoc.data()?.isAdmin || false);
          } else {
            // Create user document on first login (bypasses permission issue)
            try {
              await setDoc(userDocRef, {
                email: currentUser.email,
                isAdmin: false,
                points: 0,
                createdAt: new Date(),
                displayName: currentUser.email?.split('@')[0] || 'User'
              });
              console.log('✅ User document created on first login');
              setIsAdmin(false);
            } catch (err) {
              console.log('Could not create user document, continuing anyway');
              setIsAdmin(false);
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, isAdmin, loading };
};