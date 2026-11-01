"use client";

import { loader } from "@monaco-editor/react";

let configured = false;

export const configureMonacoLoader = () => {
  if (configured || typeof window === "undefined") {
    return;
  }

  loader.config({
    paths: {
      vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs",
    },
  });
  configured = true;
};

// Eagerly configure in client browser context before Editor component mounts
if (typeof window !== "undefined") {
  configureMonacoLoader();
}
