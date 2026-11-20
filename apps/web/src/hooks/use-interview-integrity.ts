"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface IntegrityViolation {
  type: "tab_blur" | "visibility_hidden" | "excessive_paste";
  timestampIso: string;
  count: number;
}

export interface UseInterviewIntegrityOptions {
  maxViolations?: number;
  onViolation?: (violation: IntegrityViolation) => void;
  onTerminated?: (reason: string) => void;
  enabled?: boolean;
}

export function useInterviewIntegrity({
  maxViolations = 3,
  onViolation,
  onTerminated,
  enabled = true,
}: UseInterviewIntegrityOptions = {}) {
  const [violations, setViolations] = useState<IntegrityViolation[]>([]);
  const [isTerminated, setIsTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState<string | null>(null);
  const violationCountRef = useRef(0);

  const triggerViolation = useCallback(
    (type: IntegrityViolation["type"]) => {
      if (!enabled || isTerminated) return;

      violationCountRef.current += 1;
      const count = violationCountRef.current;
      const violation: IntegrityViolation = {
        type,
        timestampIso: new Date().toISOString(),
        count,
      };

      setViolations((prev) => [...prev, violation]);
      onViolation?.(violation);

      if (count >= maxViolations) {
        setIsTerminated(true);
        const reason = "TERMINATED_INTEGRITY_VIOLATION: Multiple unauthorized tab switches or clipboard anomalies detected.";
        setTerminationReason(reason);
        onTerminated?.(reason);
      }
    },
    [enabled, isTerminated, maxViolations, onTerminated, onViolation]
  );

  useEffect(() => {
    if (!enabled || isTerminated) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        triggerViolation("visibility_hidden");
      }
    };

    const handleWindowBlur = () => {
      triggerViolation("tab_blur");
    };

    const handlePaste = (e: ClipboardEvent) => {
      const pastedText = e.clipboardData?.getData("text") || "";
      if (pastedText.length > 40) {
        e.preventDefault();
        triggerViolation("excessive_paste");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("paste", handlePaste);
    };
  }, [enabled, isTerminated, triggerViolation]);

  const resetIntegrity = useCallback(() => {
    violationCountRef.current = 0;
    setViolations([]);
    setIsTerminated(false);
    setTerminationReason(null);
  }, []);

  return {
    violationsCount: violations.length,
    violations,
    isTerminated,
    terminationReason,
    resetIntegrity,
  };
}
