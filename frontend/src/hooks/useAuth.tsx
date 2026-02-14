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
        const profilePayload = {
          email: currentUser.email,
          displayName: currentUser.displayName || currentUser.email?.split("@")[0] || "User",
          emailVerified: currentUser.emailVerified,
          providerIds: currentUser.providerData.map((provider) => provider.providerId),
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        if (userDoc.exists()) {
          await setDoc(userDocRef, profilePayload, { merge: true });
          setIsAdmin(Boolean(userDoc.data()?.isAdmin));
        } else {
          await setDoc(
            userDocRef,
            {
              ...profilePayload,
              isAdmin: false,
              points: 0,
              role: "user",
              status: "active",
              createdAt: serverTimestamp(),
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
