export const getFirebaseAuthMessage = (error: unknown) => {
  const code =
    typeof error === "object" && error !== null && "code" in error ? String((error as { code?: string }).code) : "";
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: string }).message)
      : "Authentication failed.";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-login-credentials":
      return "Email or password is incorrect.";
    case "auth/email-already-in-use":
      return "That email is already registered. Try signing in instead.";
    case "auth/weak-password":
      return "Use a stronger password with at least 6 characters.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many attempts right now. Please wait a bit and try again.";
    case "auth/popup-closed-by-user":
      return "Google sign-in was closed before it finished.";
    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in popup. Allow popups and try again.";
    case "auth/cancelled-popup-request":
      return "Google sign-in was interrupted. Please try again.";
    case "auth/operation-not-allowed":
      return "Google sign-in is not enabled in Firebase Auth yet.";
    case "auth/unauthorized-domain":
      return "This Vercel domain is not authorized in Firebase Auth. Add it in Firebase console.";
    default:
      return message;
  }
};
