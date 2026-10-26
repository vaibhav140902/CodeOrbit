import { useEffect, useState } from "react";

export const ConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    const markOnline = () => {
      setIsOnline(true);
      setShowPulse(true);
    };
    const markOffline = () => {
      setIsOnline(false);
      setShowPulse(false);
    };

    window.addEventListener("online", markOnline);
    window.addEventListener("offline", markOffline);
    return () => {
      window.removeEventListener("online", markOnline);
      window.removeEventListener("offline", markOffline);
    };
  }, []);

  useEffect(() => {
    if (!isOnline || !showPulse) return;
    const timeout = window.setTimeout(() => setShowPulse(false), 3500);
    return () => window.clearTimeout(timeout);
  }, [isOnline, showPulse]);

  return (
    <div
      className={`fixed right-3 top-[78px] z-50 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur sm:right-4 ${
        isOnline
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
          : "border-rose-500/40 bg-rose-500/10 text-rose-300"
      }`}
    >
      {isOnline ? (showPulse ? "Back online" : "Online") : "Offline mode"}
    </div>
  );
};
