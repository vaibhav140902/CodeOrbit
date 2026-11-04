export interface ProblemTestCase {
  id: string;
  name: string;
  stdin: string;
  expectedOutput: string;
  isHidden: boolean;
}

export const CANONICAL_TEST_SUITES: Record<string, ProblemTestCase[]> = {
  "two-sum": [
    {
      id: "two-sum-sample",
      name: "Sample 1",
      stdin: "2 7 11 15\n9",
      expectedOutput: "0 1",
      isHidden: false,
    },
    {
      id: "two-sum-hidden-1",
      name: "Hidden Test 1",
      stdin: "3 2 4\n6",
      expectedOutput: "1 2",
      isHidden: true,
    },
    {
      id: "two-sum-hidden-2",
      name: "Hidden Test 2",
      stdin: "3 3\n6",
      expectedOutput: "0 1",
      isHidden: true,
    },
  ],

  "reverse-string": [
    {
      id: "reverse-string-sample",
      name: "Sample 1",
      stdin: "hello",
      expectedOutput: "olleh",
      isHidden: false,
    },
    {
      id: "reverse-string-hidden-1",
      name: "Hidden Test 1",
      stdin: "CodeOrbit",
      expectedOutput: "tibrOedoC",
      isHidden: true,
    },
    {
      id: "reverse-string-hidden-2",
      name: "Hidden Test 2",
      stdin: "racecar",
      expectedOutput: "racecar",
      isHidden: true,
    },
  ],

  "valid-parentheses": [
    {
      id: "valid-parentheses-sample",
      name: "Sample 1",
      stdin: "()[]{}",
      expectedOutput: "true",
      isHidden: false,
    },
    {
      id: "valid-parentheses-hidden-1",
      name: "Hidden Test 1",
      stdin: "(]",
      expectedOutput: "false",
      isHidden: true,
    },
    {
      id: "valid-parentheses-hidden-2",
      name: "Hidden Test 2",
      stdin: "([{}])",
      expectedOutput: "true",
      isHidden: true,
    },
  ],

  "merge-intervals": [
    {
      id: "merge-intervals-sample",
      name: "Sample 1",
      stdin: "4\n1 3\n2 6\n8 10\n15 18",
      expectedOutput: "1 6\n8 10\n15 18",
      isHidden: false,
    },
    {
      id: "merge-intervals-hidden-1",
      name: "Hidden Test 1",
      stdin: "2\n1 4\n4 5",
      expectedOutput: "1 5",
      isHidden: true,
    },
  ],

  "binary-search": [
    {
      id: "binary-search-sample",
      name: "Sample 1",
      stdin: "-1 0 3 5 9 12\n9",
      expectedOutput: "4",
      isHidden: false,
    },
    {
      id: "binary-search-hidden-1",
      name: "Hidden Test 1",
      stdin: "-1 0 3 5 9 12\n2",
      expectedOutput: "-1",
      isHidden: true,
    },
    {
      id: "binary-search-hidden-2",
      name: "Hidden Test 2",
      stdin: "5\n5",
      expectedOutput: "0",
      isHidden: true,
    },
  ],

  "number-of-islands": [
    {
      id: "number-of-islands-sample",
      name: "Sample 1",
      stdin: "3 3\n110\n010\n101",
      expectedOutput: "3",
      isHidden: false,
    },
    {
      id: "number-of-islands-hidden-1",
      name: "Hidden Test 1",
      stdin: "4 5\n11110\n11010\n11000\n00000",
      expectedOutput: "1",
      isHidden: true,
    },
  ],

  "valid-anagram": [
    {
      id: "valid-anagram-sample",
      name: "Sample 1",
      stdin: "anagram\nnagaram",
      expectedOutput: "true",
      isHidden: false,
    },
    {
      id: "valid-anagram-hidden-1",
      name: "Hidden Test 1",
      stdin: "rat\ncar",
      expectedOutput: "false",
      isHidden: true,
    },
    {
      id: "valid-anagram-hidden-2",
      name: "Hidden Test 2",
      stdin: "a\na",
      expectedOutput: "true",
      isHidden: true,
    },
  ],

  "maximum-subarray": [
    {
      id: "maximum-subarray-sample",
      name: "Sample 1",
      stdin: "-2 1 -3 4 -1 2 1 -5 4",
      expectedOutput: "6",
      isHidden: false,
    },
    {
      id: "maximum-subarray-hidden-1",
      name: "Hidden Test 1",
      stdin: "5 4 -1 7 8",
      expectedOutput: "23",
      isHidden: true,
    },
  ],

  "longest-substring-without-repeating-characters": [
    {
      id: "longest-substring-sample",
      name: "Sample 1",
      stdin: "abcabcbb",
      expectedOutput: "3",
      isHidden: false,
    },
    {
      id: "longest-substring-hidden-1",
      name: "Hidden Test 1",
      stdin: "bbbbb",
      expectedOutput: "1",
      isHidden: true,
    },
    {
      id: "longest-substring-hidden-2",
      name: "Hidden Test 2",
      stdin: "pwwkew",
      expectedOutput: "3",
      isHidden: true,
    },
  ],

  "product-of-array-except-self": [
    {
      id: "product-of-array-sample",
      name: "Sample 1",
      stdin: "1 2 3 4",
      expectedOutput: "24 12 8 6",
      isHidden: false,
    },
    {
      id: "product-of-array-hidden-1",
      name: "Hidden Test 1",
      stdin: "-1 1 0 -3 3",
      expectedOutput: "0 0 9 0 0",
      isHidden: true,
    },
  ],

  "search-in-rotated-sorted-array": [
    {
      id: "rotated-search-sample",
      name: "Sample 1",
      stdin: "4 5 6 7 0 1 2\n0",
      expectedOutput: "4",
      isHidden: false,
    },
    {
      id: "rotated-search-hidden-1",
      name: "Hidden Test 1",
      stdin: "4 5 6 7 0 1 2\n3",
      expectedOutput: "-1",
      isHidden: true,
    },
  ],

  "top-k-frequent-elements": [
    {
      id: "top-k-sample",
      name: "Sample 1",
      stdin: "1 1 1 2 2 3\n2",
      expectedOutput: "1 2",
      isHidden: false,
    },
    {
      id: "top-k-hidden-1",
      name: "Hidden Test 1",
      stdin: "1\n1",
      expectedOutput: "1",
      isHidden: true,
    },
  ],

  "rotting-oranges": [
    {
      id: "rotting-oranges-sample",
      name: "Sample 1",
      stdin: "3 3\n2 1 1\n1 1 0\n0 1 1",
      expectedOutput: "4",
      isHidden: false,
    },
    {
      id: "rotting-oranges-hidden-1",
      name: "Hidden Test 1",
      stdin: "1 2\n0 2",
      expectedOutput: "0",
      isHidden: true,
    },
  ],

  "median-of-two-sorted-arrays": [
    {
      id: "median-sample",
      name: "Sample 1",
      stdin: "1 3\n2",
      expectedOutput: "2",
      isHidden: false,
    },
    {
      id: "median-hidden-1",
      name: "Hidden Test 1",
      stdin: "1 2\n3 4",
      expectedOutput: "2.5",
      isHidden: true,
    },
  ],
};

export function getProblemTestSuite(problemId: string): ProblemTestCase[] {
  return CANONICAL_TEST_SUITES[problemId] || [];
}
