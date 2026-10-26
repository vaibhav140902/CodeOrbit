import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../utils/firebase';

const isPermissionDeniedError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  return (error as { code?: string }).code === "permission-denied";
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setIsAdmin(Boolean(userDoc.data()?.isAdmin));
        } else {
          await setDoc(
            userDocRef,
            {
              email: currentUser.email,
              isAdmin: false,
              points: 0,
              createdAt: serverTimestamp(),
              displayName: currentUser.email?.split("@")[0] || "User",
            },
            { merge: true }
          );
          setIsAdmin(false);
        }
      } catch (error) {
        if (!isPermissionDeniedError(error)) {
          console.error("Error fetching user data:", error);
        }
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, isAdmin, loading };
};
