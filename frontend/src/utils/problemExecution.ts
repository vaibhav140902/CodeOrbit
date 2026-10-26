export type PrimitiveValue = string | number | boolean | null;
export type JsonValue = PrimitiveValue | JsonValue[] | { [key: string]: JsonValue };

export interface FunctionParam {
  name: string;
  type: string;
}

export interface FunctionSignature {
  functionName: string;
  returnType: string;
  params: FunctionParam[];
  javaClassName?: string;
}

export interface JudgeCase {
  input: JsonValue[];
  output: JsonValue;
  explanation?: string;
}

export interface ProblemExecutionSpec {
  mode: "stdin" | "function";
  signature?: FunctionSignature;
  examples?: JudgeCase[];
  submitCases?: JudgeCase[];
  constraints?: string[];
}

const stripNonKeyChars = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, "");

export const normalizeProblemKey = (title: string): string => stripNonKeyChars(title);

const asJsonValue = (value: unknown): JsonValue | null => {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    const parsedItems: JsonValue[] = [];
    for (const item of value) {
      const parsedItem = asJsonValue(item);
      if (parsedItem === null && item !== null) {
        return null;
      }
      parsedItems.push(parsedItem);
    }
    return parsedItems;
  }

  if (typeof value === "object") {
    const parsedRecord: Record<string, JsonValue> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      const parsedEntry = asJsonValue(entry);
      if (parsedEntry === null && entry !== null) {
        return null;
      }
      parsedRecord[key] = parsedEntry;
    }
    return parsedRecord;
  }

  return null;
};

const parseCases = (value: unknown): JudgeCase[] | undefined => {
  if (!Array.isArray(value)) return undefined;

  const cases: JudgeCase[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const asRecord = entry as Record<string, unknown>;
    if (!Array.isArray(asRecord.input)) continue;

    const parsedInput: JsonValue[] = [];
    let canUseInput = true;

    for (const arg of asRecord.input) {
      const parsedArg = asJsonValue(arg);
      if (parsedArg === null && arg !== null) {
        canUseInput = false;
        break;
      }
      parsedInput.push(parsedArg);
    }

    if (!canUseInput) continue;

    const parsedOutput = asJsonValue(asRecord.output);
    if (parsedOutput === null && asRecord.output !== null) continue;

    cases.push({
      input: parsedInput,
      output: parsedOutput,
      explanation: typeof asRecord.explanation === "string" ? asRecord.explanation : undefined,
    });
  }

  return cases.length > 0 ? cases : undefined;
};

const parseConstraints = (value: unknown): string[] | undefined => {
  if (Array.isArray(value)) {
    const lines = value.map((entry) => String(entry).trim()).filter(Boolean);
    return lines.length > 0 ? lines : undefined;
  }

  if (typeof value === "string") {
    const lines = value
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .filter(Boolean);
    return lines.length > 0 ? lines : undefined;
  }

  return undefined;
};

const parseSignature = (value: unknown): FunctionSignature | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const asRecord = value as Record<string, unknown>;

  const functionName = typeof asRecord.functionName === "string" ? asRecord.functionName.trim() : "";
  const returnType = typeof asRecord.returnType === "string" ? asRecord.returnType.trim() : "";

  if (!functionName || !returnType || !Array.isArray(asRecord.params)) {
    return undefined;
  }

  const params: FunctionParam[] = asRecord.params
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as Record<string, unknown>;
      const name = typeof row.name === "string" ? row.name.trim() : "";
      const type = typeof row.type === "string" ? row.type.trim() : "";
      if (!name || !type) return null;
      return { name, type };
    })
    .filter((entry): entry is FunctionParam => entry !== null);

  if (params.length === 0) {
    return undefined;
  }

  return {
    functionName,
    returnType,
    params,
    javaClassName: typeof asRecord.javaClassName === "string" ? asRecord.javaClassName.trim() : undefined,
  };
};

interface RawProblemSpec {
  executionMode?: unknown;
  functionSignature?: unknown;
  exampleCases?: unknown;
  submitCases?: unknown;
  constraints?: unknown;
}

const LOCAL_PROBLEM_SPECS: Record<string, ProblemExecutionSpec> = {
  twosum: {
    mode: "function",
    signature: {
      functionName: "twoSum",
      returnType: "int[]",
      params: [
        { name: "nums", type: "int[]" },
        { name: "target", type: "int" },
      ],
      javaClassName: "Solution",
    },
    examples: [
      { input: [[2, 7, 11, 15], 9], output: [0, 1], explanation: "nums[0] + nums[1] == 9" },
      { input: [[3, 2, 4], 6], output: [1, 2] },
    ],
    submitCases: [
      { input: [[2, 7, 11, 15], 9], output: [0, 1] },
      { input: [[3, 2, 4], 6], output: [1, 2] },
      { input: [[3, 3], 6], output: [0, 1] },
      { input: [[-1, -2, -3, -4, -5], -8], output: [2, 4] },
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Exactly one valid answer exists.",
    ],
  },
  besttimetobuyandsellstock: {
    mode: "function",
    signature: {
      functionName: "maxProfit",
      returnType: "int",
      params: [{ name: "prices", type: "int[]" }],
      javaClassName: "Solution",
    },
    examples: [
      { input: [[7, 1, 5, 3, 6, 4]], output: 5 },
      { input: [[7, 6, 4, 3, 1]], output: 0 },
    ],
    submitCases: [
      { input: [[7, 1, 5, 3, 6, 4]], output: 5 },
      { input: [[7, 6, 4, 3, 1]], output: 0 },
      { input: [[2, 4, 1]], output: 2 },
      { input: [[2, 1, 2, 1, 0, 1, 2]], output: 2 },
    ],
    constraints: ["1 <= prices.length <= 10^5", "0 <= prices[i] <= 10^4"],
  },
  containsduplicate: {
    mode: "function",
    signature: {
      functionName: "containsDuplicate",
      returnType: "boolean",
      params: [{ name: "nums", type: "int[]" }],
      javaClassName: "Solution",
    },
    examples: [
      { input: [[1, 2, 3, 1]], output: true },
      { input: [[1, 2, 3, 4]], output: false },
    ],
    submitCases: [
      { input: [[1, 2, 3, 1]], output: true },
      { input: [[1, 2, 3, 4]], output: false },
      { input: [[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]], output: true },
      { input: [[42]], output: false },
    ],
    constraints: ["1 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9"],
  },
  validanagram: {
    mode: "function",
    signature: {
      functionName: "isAnagram",
      returnType: "boolean",
      params: [
        { name: "s", type: "String" },
        { name: "t", type: "String" },
      ],
      javaClassName: "Solution",
    },
    examples: [
      { input: ["anagram", "nagaram"], output: true },
      { input: ["rat", "car"], output: false },
    ],
    submitCases: [
      { input: ["anagram", "nagaram"], output: true },
      { input: ["rat", "car"], output: false },
      { input: ["listen", "silent"], output: true },
      { input: ["a", "ab"], output: false },
    ],
    constraints: ["1 <= s.length, t.length <= 5 * 10^4", "s and t consist of lowercase English letters."],
  },
  validparentheses: {
    mode: "function",
    signature: {
      functionName: "isValid",
      returnType: "boolean",
      params: [{ name: "s", type: "String" }],
      javaClassName: "Solution",
    },
    examples: [
      { input: ["()"], output: true },
      { input: ["()[]{}"], output: true },
      { input: ["(]"], output: false },
    ],
    submitCases: [
      { input: ["()"], output: true },
      { input: ["()[]{}"], output: true },
      { input: ["(]"], output: false },
      { input: ["([)]"], output: false },
      { input: ["{[]}"], output: true },
    ],
    constraints: ["1 <= s.length <= 10^4", "s contains only parentheses characters."],
  },
  binarysearch: {
    mode: "function",
    signature: {
      functionName: "search",
      returnType: "int",
      params: [
        { name: "nums", type: "int[]" },
        { name: "target", type: "int" },
      ],
      javaClassName: "Solution",
    },
    examples: [
      { input: [[-1, 0, 3, 5, 9, 12], 9], output: 4 },
      { input: [[-1, 0, 3, 5, 9, 12], 2], output: -1 },
    ],
    submitCases: [
      { input: [[-1, 0, 3, 5, 9, 12], 9], output: 4 },
      { input: [[-1, 0, 3, 5, 9, 12], 2], output: -1 },
      { input: [[1], 1], output: 0 },
      { input: [[1, 3], 3], output: 1 },
    ],
    constraints: ["1 <= nums.length <= 10^4", "nums is sorted in ascending order."],
  },
  searchinrotatedsortedarray: {
    mode: "function",
    signature: {
      functionName: "search",
      returnType: "int",
      params: [
        { name: "nums", type: "int[]" },
        { name: "target", type: "int" },
      ],
      javaClassName: "Solution",
    },
    examples: [
      { input: [[4, 5, 6, 7, 0, 1, 2], 0], output: 4 },
      { input: [[4, 5, 6, 7, 0, 1, 2], 3], output: -1 },
    ],
    submitCases: [
      { input: [[4, 5, 6, 7, 0, 1, 2], 0], output: 4 },
      { input: [[4, 5, 6, 7, 0, 1, 2], 3], output: -1 },
      { input: [[1], 0], output: -1 },
      { input: [[1, 3], 3], output: 1 },
    ],
    constraints: ["1 <= nums.length <= 5000", "All values in nums are unique."],
  },
  findminimuminrotatedsortedarray: {
    mode: "function",
    signature: {
      functionName: "findMin",
      returnType: "int",
      params: [{ name: "nums", type: "int[]" }],
      javaClassName: "Solution",
    },
    examples: [
      { input: [[3, 4, 5, 1, 2]], output: 1 },
      { input: [[4, 5, 6, 7, 0, 1, 2]], output: 0 },
    ],
    submitCases: [
      { input: [[3, 4, 5, 1, 2]], output: 1 },
      { input: [[4, 5, 6, 7, 0, 1, 2]], output: 0 },
      { input: [[11, 13, 15, 17]], output: 11 },
      { input: [[2, 1]], output: 1 },
    ],
    constraints: ["1 <= nums.length <= 5000", "nums is rotated between 1 and n times."],
  },
  maximumsubarray: {
    mode: "function",
    signature: {
      functionName: "maxSubArray",
      returnType: "int",
      params: [{ name: "nums", type: "int[]" }],
      javaClassName: "Solution",
    },
    examples: [
      { input: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], output: 6 },
      { input: [[1]], output: 1 },
    ],
    submitCases: [
      { input: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], output: 6 },
      { input: [[1]], output: 1 },
      { input: [[5, 4, -1, 7, 8]], output: 23 },
      { input: [[-1, -2, -3]], output: -1 },
    ],
    constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
  },
  productofarrayexceptself: {
    mode: "function",
    signature: {
      functionName: "productExceptSelf",
      returnType: "int[]",
      params: [{ name: "nums", type: "int[]" }],
      javaClassName: "Solution",
    },
    examples: [
      { input: [[1, 2, 3, 4]], output: [24, 12, 8, 6] },
      { input: [[-1, 1, 0, -3, 3]], output: [0, 0, 9, 0, 0] },
    ],
    submitCases: [
      { input: [[1, 2, 3, 4]], output: [24, 12, 8, 6] },
      { input: [[-1, 1, 0, -3, 3]], output: [0, 0, 9, 0, 0] },
      { input: [[2, 3, 4, 5]], output: [60, 40, 30, 24] },
      { input: [[0, 4, 0]], output: [0, 0, 0] },
    ],
    constraints: ["2 <= nums.length <= 10^5", "-30 <= nums[i] <= 30"],
  },
  coinchange: {
    mode: "function",
    signature: {
      functionName: "coinChange",
      returnType: "int",
      params: [
        { name: "coins", type: "int[]" },
        { name: "amount", type: "int" },
      ],
      javaClassName: "Solution",
    },
    examples: [
      { input: [[1, 2, 5], 11], output: 3 },
      { input: [[2], 3], output: -1 },
    ],
    submitCases: [
      { input: [[1, 2, 5], 11], output: 3 },
      { input: [[2], 3], output: -1 },
      { input: [[1], 0], output: 0 },
      { input: [[1, 3, 4], 6], output: 2 },
    ],
    constraints: ["1 <= coins.length <= 12", "0 <= amount <= 10^4"],
  },
  climbingstairs: {
    mode: "function",
    signature: {
      functionName: "climbStairs",
      returnType: "int",
      params: [{ name: "n", type: "int" }],
      javaClassName: "Solution",
    },
    examples: [
      { input: [2], output: 2 },
      { input: [3], output: 3 },
    ],
    submitCases: [
      { input: [2], output: 2 },
      { input: [3], output: 3 },
      { input: [5], output: 8 },
      { input: [8], output: 34 },
    ],
    constraints: ["1 <= n <= 45"],
  },
  houserobber: {
    mode: "function",
    signature: {
      functionName: "rob",
      returnType: "int",
      params: [{ name: "nums", type: "int[]" }],
      javaClassName: "Solution",
    },
    examples: [
      { input: [[1, 2, 3, 1]], output: 4 },
      { input: [[2, 7, 9, 3, 1]], output: 12 },
    ],
    submitCases: [
      { input: [[1, 2, 3, 1]], output: 4 },
      { input: [[2, 7, 9, 3, 1]], output: 12 },
      { input: [[2, 1, 1, 2]], output: 4 },
      { input: [[0]], output: 0 },
    ],
    constraints: ["1 <= nums.length <= 100", "0 <= nums[i] <= 400"],
  },
  jumpgame: {
    mode: "function",
    signature: {
      functionName: "canJump",
      returnType: "boolean",
      params: [{ name: "nums", type: "int[]" }],
      javaClassName: "Solution",
    },
    examples: [
      { input: [[2, 3, 1, 1, 4]], output: true },
      { input: [[3, 2, 1, 0, 4]], output: false },
    ],
    submitCases: [
      { input: [[2, 3, 1, 1, 4]], output: true },
      { input: [[3, 2, 1, 0, 4]], output: false },
      { input: [[0]], output: true },
      { input: [[2, 0, 0]], output: true },
    ],
    constraints: ["1 <= nums.length <= 10^4", "0 <= nums[i] <= 10^5"],
  },
  longestsubstringwithoutrepeatingcharacters: {
    mode: "function",
    signature: {
      functionName: "lengthOfLongestSubstring",
      returnType: "int",
      params: [{ name: "s", type: "String" }],
      javaClassName: "Solution",
    },
    examples: [
      { input: ["abcabcbb"], output: 3 },
      { input: ["bbbbb"], output: 1 },
      { input: ["pwwkew"], output: 3 },
    ],
    submitCases: [
      { input: ["abcabcbb"], output: 3 },
      { input: ["bbbbb"], output: 1 },
      { input: ["pwwkew"], output: 3 },
      { input: [""], output: 0 },
      { input: ["dvdf"], output: 3 },
    ],
    constraints: ["0 <= s.length <= 5 * 10^4", "s consists of ASCII symbols."],
  },
};

const mergeUniqueCases = (primary?: JudgeCase[], secondary?: JudgeCase[]): JudgeCase[] | undefined => {
  const source = [...(primary ?? []), ...(secondary ?? [])];
  if (source.length === 0) return undefined;

  const seen = new Set<string>();
  const merged: JudgeCase[] = [];

  for (const entry of source) {
    const signature = `${stableStringify(entry.input)}=>${stableStringify(entry.output)}`;
    if (seen.has(signature)) continue;
    seen.add(signature);
    merged.push(entry);
  }

  return merged;
};

export const resolveProblemExecutionSpec = (
  problemTitle: string,
  rawSpec?: RawProblemSpec
): ProblemExecutionSpec => {
  const localSpec = LOCAL_PROBLEM_SPECS[normalizeProblemKey(problemTitle)] ?? { mode: "stdin" as const };

  const remoteMode = rawSpec?.executionMode === "function" ? "function" : rawSpec?.executionMode === "stdin" ? "stdin" : undefined;
  const remoteSignature = parseSignature(rawSpec?.functionSignature);
  const remoteExamples = parseCases(rawSpec?.exampleCases);
  const remoteSubmitCases = parseCases(rawSpec?.submitCases);
  const remoteConstraints = parseConstraints(rawSpec?.constraints);

  const mode = remoteMode ?? localSpec.mode;
  const signature = remoteSignature ?? localSpec.signature;
  const examples = mergeUniqueCases(remoteExamples, localSpec.examples);
  const submitCases = mergeUniqueCases(remoteSubmitCases, localSpec.submitCases ?? examples);
  const constraints = remoteConstraints ?? localSpec.constraints;

  if (mode === "function" && signature) {
    return {
      mode,
      signature,
      examples,
      submitCases,
      constraints,
    };
  }

  return {
    mode: "stdin",
    constraints,
  };
};

export const supportsFunctionJudgeLanguage = (languageId: string): boolean => {
  return languageId === "javascript" || languageId === "typescript" || languageId === "python" || languageId === "java";
};

const mapToTypeScriptType = (type: string): string => {
  const normalized = type.replace(/\s+/g, "").toLowerCase();

  if (normalized.endsWith("[]")) {
    const dimensions = (normalized.match(/\[\]/g) ?? []).length;
    const base = normalized.replace(/\[\]/g, "");
    const mappedBase = mapToTypeScriptType(base);
    return `${mappedBase}${"[]".repeat(dimensions)}`;
  }

  if (["int", "integer", "long", "double", "float", "number"].includes(normalized)) return "number";
  if (["bool", "boolean"].includes(normalized)) return "boolean";
  if (["string", "char"].includes(normalized)) return "string";

  if (normalized.startsWith("list<")) {
    const inner = type.slice(type.indexOf("<") + 1, type.lastIndexOf(">"));
    return `${mapToTypeScriptType(inner)}[]`;
  }

  return "any";
};

const defaultReturnForTypeScript = (type: string): string => {
  const mapped = mapToTypeScriptType(type);
  if (mapped === "number") return "0";
  if (mapped === "boolean") return "false";
  if (mapped === "string") return "\"\"";
  if (mapped.endsWith("[]")) return "[]";
  return "null";
};

const defaultReturnForPython = (type: string): string => {
  const normalized = type.replace(/\s+/g, "").toLowerCase();
  if (["int", "integer", "long", "double", "float", "number"].includes(normalized)) return "0";
  if (["bool", "boolean"].includes(normalized)) return "False";
  if (["string", "char"].includes(normalized)) return "\"\"";
  if (normalized.endsWith("[]") || normalized.startsWith("list<")) return "[]";
  return "None";
};

const escapeJavaString = (value: string): string => {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\"/g, "\\\"")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
};

const defaultReturnForJava = (type: string): string => {
  const normalized = type.replace(/\s+/g, "");
  const lower = normalized.toLowerCase();

  if (["int", "integer", "long", "double", "float", "short", "byte"].includes(lower)) {
    return "0";
  }

  if (lower === "boolean" || lower === "bool") {
    return "false";
  }

  if (lower === "char") {
    return "'\\0'";
  }

  if (lower === "string") {
    return "\"\"";
  }

  if (normalized.endsWith("[]")) {
    const dimensions = (normalized.match(/\[\]/g) ?? []).length;
    const baseType = normalized.replace(/\[\]/g, "");
    const zeros = Array.from({ length: dimensions }, () => "0").join("][");
    return `new ${baseType}[${zeros}]`;
  }

  return "null";
};

export const buildFunctionStarterCode = (
  languageId: string,
  signature: FunctionSignature
): string | null => {
  const params = signature.params.map((param) => param.name).join(", ");

  if (languageId === "javascript") {
    return `function ${signature.functionName}(${params}) {\n  // Write your solution here.\n  return null;\n}\n`;
  }

  if (languageId === "typescript") {
    const tsParams = signature.params
      .map((param) => `${param.name}: ${mapToTypeScriptType(param.type)}`)
      .join(", ");

    return `function ${signature.functionName}(${tsParams}): ${mapToTypeScriptType(signature.returnType)} {\n  // Write your solution here.\n  return ${defaultReturnForTypeScript(signature.returnType)};\n}\n`;
  }

  if (languageId === "python") {
    return `def ${signature.functionName}(${params}):\n    # Write your solution here.\n    return ${defaultReturnForPython(signature.returnType)}\n`;
  }

  if (languageId === "java") {
    const javaParams = signature.params.map((param) => `${param.type} ${param.name}`).join(", ");
    const className = signature.javaClassName?.trim() || "Solution";

    return `import java.util.*;\n\nclass ${className} {\n    public ${signature.returnType} ${signature.functionName}(${javaParams}) {\n        // Write your solution here.\n        return ${defaultReturnForJava(signature.returnType)};\n    }\n}\n`;
  }

  return null;
};

const toBase64 = (value: string): string => {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
};

const javaElementType = (type: string): { baseType: string; dimensions: number } => {
  const trimmed = type.replace(/\s+/g, "");
  const dimensions = (trimmed.match(/\[\]/g) ?? []).length;
  const baseType = trimmed.replace(/\[\]/g, "");
  return { baseType, dimensions };
};

const toJavaLiteral = (value: JsonValue, type: string): string => {
  const { baseType, dimensions } = javaElementType(type);

  if (dimensions > 0) {
    if (!Array.isArray(value)) {
      return `new ${baseType}${"[]".repeat(dimensions)}{}`;
    }

    const childType = `${baseType}${"[]".repeat(dimensions - 1)}`;
    const members = value.map((entry) => toJavaLiteral(entry, childType)).join(", ");
    return `new ${baseType}${"[]".repeat(dimensions)}{${members}}`;
  }

  const normalizedType = baseType.toLowerCase();

  if (value === null) return "null";

  if (normalizedType === "string") {
    return `\"${escapeJavaString(String(value))}\"`;
  }

  if (normalizedType === "char") {
    const asString = String(value);
    const firstChar = asString.length > 0 ? asString[0] : "\\0";
    const escaped = firstChar === "'" ? "\\'" : firstChar === "\\" ? "\\\\" : firstChar;
    return `'${escaped}'`;
  }

  if (normalizedType === "boolean" || normalizedType === "bool") {
    return Boolean(value) ? "true" : "false";
  }

  if (normalizedType === "long") {
    return `${Math.trunc(Number(value))}L`;
  }

  if (["int", "integer", "short", "byte"].includes(normalizedType)) {
    return `${Math.trunc(Number(value))}`;
  }

  if (["double", "float"].includes(normalizedType)) {
    return `${Number(value)}`;
  }

  if (typeof value === "number") {
    return `${value}`;
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return `\"${escapeJavaString(String(value))}\"`;
};

const javaJsonPrinter = `
static class JsonPrinter {
    static String stringify(Object value) {
        if (value == null) return "null";

        if (value instanceof String || value instanceof Character) {
            return "\"" + escape(String.valueOf(value)) + "\"";
        }

        if (value instanceof Number || value instanceof Boolean) {
            return String.valueOf(value);
        }

        Class<?> cls = value.getClass();
        if (cls.isArray()) {
            int length = java.lang.reflect.Array.getLength(value);
            StringBuilder sb = new StringBuilder();
            sb.append("[");
            for (int i = 0; i < length; i++) {
                if (i > 0) sb.append(",");
                sb.append(stringify(java.lang.reflect.Array.get(value, i)));
            }
            sb.append("]");
            return sb.toString();
        }

        if (value instanceof Iterable<?>) {
            StringBuilder sb = new StringBuilder();
            sb.append("[");
            boolean first = true;
            for (Object item : (Iterable<?>) value) {
                if (!first) sb.append(",");
                first = false;
                sb.append(stringify(item));
            }
            sb.append("]");
            return sb.toString();
        }

        if (value instanceof java.util.Map<?, ?>) {
            StringBuilder sb = new StringBuilder();
            sb.append("{");
            boolean first = true;
            for (java.util.Map.Entry<?, ?> entry : ((java.util.Map<?, ?>) value).entrySet()) {
                if (!first) sb.append(",");
                first = false;
                sb.append("\"").append(escape(String.valueOf(entry.getKey()))).append("\":");
                sb.append(stringify(entry.getValue()));
            }
            sb.append("}");
            return sb.toString();
        }

        return "\"" + escape(String.valueOf(value)) + "\"";
    }

    private static String escape(String value) {
        return value
            .replace("\\\\", "\\\\\\\\")
            .replace("\"", "\\\\\"")
            .replace("\n", "\\\\n")
            .replace("\r", "\\\\r")
            .replace("\t", "\\\\t");
    }
}
`;

export const buildFunctionWrappedSource = (
  languageId: string,
  signature: FunctionSignature,
  userCode: string,
  args: JsonValue[]
): string | null => {
  if (languageId === "javascript") {
    const argsEncoded = toBase64(JSON.stringify(args));
    return `${userCode}\n\nconst __args = JSON.parse(Buffer.from("${argsEncoded}", "base64").toString("utf8"));\nif (typeof ${signature.functionName} !== "function") {\n  throw new Error("Expected function '${signature.functionName}' in your code.");\n}\nconst __result = ${signature.functionName}(...__args);\nprocess.stdout.write(JSON.stringify(__result));\n`;
  }

  if (languageId === "typescript") {
    const argsEncoded = toBase64(JSON.stringify(args));
    return `${userCode}\n\nconst __args = JSON.parse(Buffer.from("${argsEncoded}", "base64").toString("utf8"));\nconst __fn = (globalThis as Record<string, (...params: unknown[]) => unknown>)["${signature.functionName}"];\nif (typeof __fn !== "function") {\n  throw new Error("Expected function '${signature.functionName}' in your code.");\n}\nconst __result = __fn(...__args);\nprocess.stdout.write(JSON.stringify(__result));\n`;
  }

  if (languageId === "python") {
    const argsEncoded = toBase64(JSON.stringify(args));
    return `import base64\nimport json\nimport sys\n\n${userCode}\n\n__args = json.loads(base64.b64decode("${argsEncoded}").decode("utf-8"))\nif "${signature.functionName}" not in globals():\n    raise Exception("Expected function '${signature.functionName}' in your code.")\n__result = globals()["${signature.functionName}"](*__args)\nsys.stdout.write(json.dumps(__result, separators=(",", ":")))\n`;
  }

  if (languageId === "java") {
    const className = signature.javaClassName?.trim() || "Solution";
    const callArgs = signature.params
      .map((param, index) => {
        const arg = args[index] ?? null;
        return toJavaLiteral(arg, param.type);
      })
      .join(", ");

    return `import java.util.*;\n\n${userCode}\n\npublic class Main {\n    public static void main(String[] args) {\n        ${className} __solution = new ${className}();\n        Object __result = __solution.${signature.functionName}(${callArgs});\n        System.out.print(JsonPrinter.stringify(__result));\n    }\n\n    ${javaJsonPrinter}\n}\n`;
  }

  return null;
};

export const parseArgsJson = (value: string): JsonValue[] => {
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("Input arguments must be a JSON array. Example: [[2,7,11,15],9]");
  }

  const mapped = parsed.map((entry) => {
    const parsedEntry = asJsonValue(entry);
    if (parsedEntry === null && entry !== null) {
      throw new Error("Input arguments support JSON values only.");
    }
    return parsedEntry;
  });

  return mapped;
};

export const parseOutputJson = (value: string): JsonValue => {
  const parsed = JSON.parse(value) as unknown;
  const mapped = asJsonValue(parsed);
  if (mapped === null && parsed !== null) {
    throw new Error("Output was not a valid JSON value.");
  }
  return mapped;
};

export const prettyJson = (value: JsonValue): string => JSON.stringify(value, null, 2);

export const stableStringify = (value: JsonValue): string => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }

  const entries = Object.keys(value)
    .sort((a, b) => a.localeCompare(b))
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`);

  return `{${entries.join(",")}}`;
};

export const areJsonValuesEqual = (left: JsonValue, right: JsonValue): boolean => {
  if (left === right) return true;

  if (typeof left !== typeof right) return false;

  if (left === null || right === null) return left === right;

  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) return false;
    for (let index = 0; index < left.length; index += 1) {
      if (!areJsonValuesEqual(left[index], right[index])) {
        return false;
      }
    }
    return true;
  }

  if (!Array.isArray(left) && !Array.isArray(right) && typeof left === "object" && typeof right === "object") {
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();

    if (leftKeys.length !== rightKeys.length) return false;

    for (let index = 0; index < leftKeys.length; index += 1) {
      if (leftKeys[index] !== rightKeys[index]) return false;
      const key = leftKeys[index];
      if (!areJsonValuesEqual(left[key], right[key])) {
        return false;
      }
    }

    return true;
  }

  return false;
};
