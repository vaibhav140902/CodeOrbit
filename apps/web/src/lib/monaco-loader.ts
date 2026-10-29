"use client";

import { loader } from "@monaco-editor/react";

let configured = false;

export const configureMonacoLoader = () => {
  if (configured || typeof window === "undefined") {
    return;
  }

  loader.config({
    paths: {
      vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.0/min/vs",
    },
  });
  configured = true;
};
