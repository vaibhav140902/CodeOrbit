export interface LanguageOption {
  id: string;
  label: string;
  pistonLanguage: string;
  fallbackVersion: string;
  aliases: string[];
  starterCode: string;
}

export interface RuntimeRecord {
  language: string;
  version: string;
  aliases?: string[];
  runtime?: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    id: "javascript",
    label: "JavaScript",
    pistonLanguage: "javascript",
    fallbackVersion: "18.15.0",
    aliases: ["javascript", "js", "node-javascript"],
    starterCode: `function solve(input) {
  // Write your logic here.
  // "input" is raw stdin text.
  return input.trim();
}

const fs = require("fs");
const input = fs.readFileSync(0, "utf8");
const result = solve(input);
if (result !== undefined) {
  process.stdout.write(String(result));
}
`,
  },
  {
    id: "typescript",
    label: "TypeScript",
    pistonLanguage: "typescript",
    fallbackVersion: "5.0.3",
    aliases: ["typescript", "ts"],
    starterCode: `function solve(input: string): string {
  // Write your logic here.
  return input.trim();
}

import * as fs from "fs";
const input = fs.readFileSync(0, "utf8");
const result = solve(input);
if (result !== undefined) {
  process.stdout.write(String(result));
}
`,
  },
  {
    id: "python",
    label: "Python",
    pistonLanguage: "python",
    fallbackVersion: "3.10.0",
    aliases: ["python", "py", "python3"],
    starterCode: `def solve(input_data: str) -> str:
    # Write your logic here.
    return input_data.strip()

if __name__ == "__main__":
    import sys
    data = sys.stdin.read()
    result = solve(data)
    if result is not None:
        sys.stdout.write(str(result))
`,
  },
  {
    id: "java",
    label: "Java",
    pistonLanguage: "java",
    fallbackVersion: "15.0.2",
    aliases: ["java"],
    starterCode: `import java.io.*;

public class Main {
    static String solve(String input) {
        // Write your logic here.
        return input.trim();
    }

    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            sb.append(line).append("\\n");
        }
        String result = solve(sb.toString());
        if (result != null) {
            System.out.print(result);
        }
    }
}
`,
  },
  {
    id: "cpp",
    label: "C++",
    pistonLanguage: "cpp",
    fallbackVersion: "10.2.0",
    aliases: ["cpp", "c++", "g++"],
    starterCode: `#include <bits/stdc++.h>
using namespace std;

string solve(const string& input) {
    // Write your logic here.
    return input;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string input((istreambuf_iterator<char>(cin)), istreambuf_iterator<char>());
    string result = solve(input);
    cout << result;
    return 0;
}
`,
  },
  {
    id: "c",
    label: "C",
    pistonLanguage: "c",
    fallbackVersion: "10.2.0",
    aliases: ["c", "gcc"],
    starterCode: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
    // Write your logic here.
    char buffer[1024];
    if (fgets(buffer, sizeof(buffer), stdin) != NULL) {
        printf("%s", buffer);
    }
    return 0;
}
`,
  },
  {
    id: "csharp",
    label: "C#",
    pistonLanguage: "csharp",
    fallbackVersion: "6.12.0",
    aliases: ["csharp", "cs", "c#"],
    starterCode: `using System;

public class Program
{
    public static string Solve(string input)
    {
        // Write your logic here.
        return input.Trim();
    }

    public static void Main()
    {
        string input = Console.In.ReadToEnd();
        string result = Solve(input);
        if (result != null)
        {
            Console.Write(result);
        }
    }
}
`,
  },
  {
    id: "go",
    label: "Go",
    pistonLanguage: "go",
    fallbackVersion: "1.20.2",
    aliases: ["go", "golang"],
    starterCode: `package main

import (
  "fmt"
  "io"
  "os"
  "strings"
)

func solve(input string) string {
  // Write your logic here.
  return strings.TrimSpace(input)
}

func main() {
  data, _ := io.ReadAll(os.Stdin)
  result := solve(string(data))
  if result != "" {
    fmt.Print(result)
  }
}
`,
  },
  {
    id: "rust",
    label: "Rust",
    pistonLanguage: "rust",
    fallbackVersion: "1.68.2",
    aliases: ["rust", "rs"],
    starterCode: `use std::io::{self, Read};

fn solve(input: &str) -> String {
    // Write your logic here.
    input.trim().to_string()
}

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    let result = solve(&input);
    if !result.is_empty() {
        print!("{}", result);
    }
}
`,
  },
  {
    id: "kotlin",
    label: "Kotlin",
    pistonLanguage: "kotlin",
    fallbackVersion: "1.8.20",
    aliases: ["kotlin", "kt"],
    starterCode: `fun solve(input: String): String {
    // Write your logic here.
    return input.trim()
}

fun main() {
    val input = generateSequence(::readLine).joinToString("\\n")
    val result = solve(input)
    if (result.isNotEmpty()) {
        print(result)
    }
}
`,
  },
  {
    id: "swift",
    label: "Swift",
    pistonLanguage: "swift",
    fallbackVersion: "5.3.3",
    aliases: ["swift"],
    starterCode: `import Foundation

func solve(_ input: String) -> String {
    // Write your logic here.
    return input.trimmingCharacters(in: .whitespacesAndNewlines)
}

let data = String(data: FileHandle.standardInput.readDataToEndOfFile(), encoding: .utf8) ?? ""
let result = solve(data)
if !result.isEmpty {
    print(result, terminator: "")
}
`,
  },
  {
    id: "php",
    label: "PHP",
    pistonLanguage: "php",
    fallbackVersion: "8.2.3",
    aliases: ["php"],
    starterCode: `<?php
function solve(string $input): string {
    // Write your logic here.
    return trim($input);
}

$input = file_get_contents("php://stdin");
$result = solve($input);
if ($result !== null) {
    echo $result;
}
?>`,
  },
  {
    id: "ruby",
    label: "Ruby",
    pistonLanguage: "ruby",
    fallbackVersion: "3.0.1",
    aliases: ["ruby", "rb"],
    starterCode: `def solve(input)
  # Write your logic here.
  input.strip
end

input = STDIN.read
result = solve(input)
print result unless result.nil?
`,
  },
  {
    id: "dart",
    label: "Dart",
    pistonLanguage: "dart",
    fallbackVersion: "2.19.6",
    aliases: ["dart"],
    starterCode: `import 'dart:io';

String solve(String input) {
  // Write your logic here.
  return input.trim();
}

void main() {
  final input = stdin.readLineSync() ?? '';
  final result = solve(input);
  stdout.write(result);
}
`,
  },
];

export const getLanguageById = (id: string): LanguageOption => {
  return LANGUAGE_OPTIONS.find((option) => option.id === id) ?? LANGUAGE_OPTIONS[0];
};

export const resolveRuntimeVersion = (
  language: LanguageOption,
  runtimes: RuntimeRecord[]
): string => {
  const matches = runtimes.filter((runtime) => {
    const runtimeAliases = [runtime.language, ...(runtime.aliases ?? [])].map((entry) =>
      entry.toLowerCase()
    );
    return runtimeAliases.some((entry) =>
      language.aliases.map((alias) => alias.toLowerCase()).includes(entry)
    );
  });

  if (matches.length === 0) {
    return language.fallbackVersion;
  }

  const sorted = [...matches].sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
  return sorted[0].version;
};

export const editorStorageKey = (userId: string, problemId: string, languageId: string): string => {
  return `workspace:${userId}:${problemId}:${languageId}`;
};
