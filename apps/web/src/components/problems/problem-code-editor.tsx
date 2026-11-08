"use client";

import Editor, { type Monaco } from "@monaco-editor/react";
import type * as monacoEditor from "monaco-editor";
import { useEffect, useRef } from "react";
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
  onRun?: () => void;
  onSubmit?: () => void;
};

export function ProblemCodeEditor({
  code,
  language,
  theme,
  onChange,
  onReady,
  onRun,
  onSubmit,
}: ProblemCodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const onRunRef = useRef(onRun);
  const onSubmitRef = useRef(onSubmit);

  useEffect(() => {
    onRunRef.current = onRun;
    onSubmitRef.current = onSubmit;
  }, [onRun, onSubmit]);

  useEffect(() => {
    configureMonacoLoader();
  }, []);

  // Robust ResizeObserver to eliminate Mac Chrome and responsive layout freezes
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (editorRef.current) {
        editorRef.current.layout();
      }
    });
    observer.observe(containerRef.current);

    const handleWindowResize = () => {
      if (editorRef.current) {
        editorRef.current.layout();
      }
    };
    window.addEventListener("resize", handleWindowResize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);

  const handleMount = (editor: monacoEditor.editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;

    // Perform multiple layout passes to guarantee pixel-accurate rendering regardless of DOM delays
    editor.layout();
    setTimeout(() => editor.layout(), 60);
    setTimeout(() => editor.layout(), 250);

    // Cmd + Enter / Ctrl + Enter -> Run
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRunRef.current?.();
    });

    // Cmd + ' / Ctrl + ' -> Submit (Standard competitive programming keybinding)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Quote, () => {
      onSubmitRef.current?.();
    });

    // Cmd + Shift + Enter / Ctrl + Shift + Enter -> Submit (Alternate keybinding)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => {
      onSubmitRef.current?.();
    });

    onReady();
  };

  return (
    <div ref={containerRef} className="h-full w-full relative">
      <Editor
        height="100%"
        defaultLanguage="typescript"
        language={language}
        value={code}
        loading={
          <div className="flex h-full items-center justify-center text-sm text-slate-300">
            Loading Monaco editor...
          </div>
        }
        onMount={handleMount}
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
          folding: true,
          renderLineHighlight: "line",
          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
          tabSize: 2,
          formatOnPaste: true,
          formatOnType: true,
          cursorBlinking: "smooth",
          smoothScrolling: true,
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true },
        }}
      />
    </div>
  );
}
