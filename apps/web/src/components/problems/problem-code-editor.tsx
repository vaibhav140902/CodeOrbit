"use client";

import Editor, { type Monaco } from "@monaco-editor/react";
import { useEffect } from "react";
import { configureMonacoLoader } from "@/lib/monaco-loader";

const defineThemes = (monaco: Monaco) => {
  monaco.editor.defineTheme("codeorbit-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#0b1020",
      "editor.lineHighlightBackground": "#11182d",
      "editorLineNumber.foreground": "#64748b",
      "editorLineNumber.activeForeground": "#cbd5e1",
      "editorCursor.foreground": "#38bdf8",
      "editor.selectionBackground": "#164e63",
      "editor.inactiveSelectionBackground": "#0f172a",
      "editorGutter.background": "#0d1326",
    },
  });

  monaco.editor.defineTheme("codeorbit-light", {
    base: "vs",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#ffffff",
      "editor.lineHighlightBackground": "#f8fafc",
      "editorLineNumber.foreground": "#94a3b8",
      "editorLineNumber.activeForeground": "#0f172a",
      "editorCursor.foreground": "#0369a1",
      "editor.selectionBackground": "#bae6fd",
      "editor.inactiveSelectionBackground": "#e2e8f0",
      "editorGutter.background": "#f8fafc",
    },
  });
};

type ProblemCodeEditorProps = {
  code: string;
  language: string;
  theme: string;
  onChange: (value: string) => void;
  onReady: () => void;
};

export function ProblemCodeEditor({ code, language, theme, onChange, onReady }: ProblemCodeEditorProps) {
  useEffect(() => {
    configureMonacoLoader();
  }, []);

  return (
    <Editor
      height="100%"
      defaultLanguage="typescript"
      language={language}
      value={code}
      loading={
        <div className="flex h-full items-center justify-center text-sm text-slate-300">
          Loading secure editor...
        </div>
      }
      onMount={() => {
        onReady();
      }}
      onChange={(value) => onChange(value ?? "")}
      beforeMount={defineThemes}
      theme={theme}
      options={{
        automaticLayout: true,
        minimap: { enabled: false },
        fontFamily: "IBM Plex Mono, monospace",
        fontSize: 14,
        lineHeight: 24,
        scrollBeyondLastLine: false,
        roundedSelection: false,
        padding: { top: 12, bottom: 12 },
        glyphMargin: false,
        folding: false,
        renderLineHighlight: "line",
      }}
    />
  );
}
