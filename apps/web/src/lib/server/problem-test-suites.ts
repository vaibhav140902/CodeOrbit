export interface ProblemTestCase {
  id: string;
  name: string;
  stdin: string;
  expectedOutput: string;
  isHidden: boolean;
}


const EXTENDED_TEST_SUITES: Record<string, ProblemTestCase[]> = {
  "best-time-to-buy-and-sell-stock": [
    {
        "id": "stock-sample",
        "name": "Sample 1",
        "stdin": "7 1 5 3 6 4",
        "expectedOutput": "5",
        "isHidden": false
    },
    {
        "id": "stock-h1",
        "name": "Hidden Test 1",
        "stdin": "7 6 4 3 1",
        "expectedOutput": "0",
        "isHidden": true
    },
    {
        "id": "stock-h2",
        "name": "Hidden Test 2",
        "stdin": "2 4 1",
        "expectedOutput": "2",
        "isHidden": true
    }
],
  "contains-duplicate": [
    {
        "id": "dup-sample",
        "name": "Sample 1",
        "stdin": "1 2 3 1",
        "expectedOutput": "true",
        "isHidden": false
    },
    {
        "id": "dup-h1",
        "name": "Hidden Test 1",
        "stdin": "1 2 3 4",
        "expectedOutput": "false",
        "isHidden": true
    },
    {
        "id": "dup-h2",
        "name": "Hidden Test 2",
        "stdin": "1 1 1 3 3 4 3 2 4 2",
        "expectedOutput": "true",
        "isHidden": true
    }
],
  "group-anagrams": [
    {
        "id": "ga-sample",
        "name": "Sample 1",
        "stdin": "eat tea tan ate nat bat",
        "expectedOutput": "ate eat tea\nbat\nnat tan",
        "isHidden": false
    },
    {
        "id": "ga-h1",
        "name": "Hidden Test 1",
        "stdin": "a",
        "expectedOutput": "a",
        "isHidden": true
    },
    {
        "id": "ga-h2",
        "name": "Hidden Test 2",
        "stdin": "cab tin pew duh may tin buy bar cab duh pew",
        "expectedOutput": "bar\nbuy\ncab cab\nduh duh\nmay\npew pew\ntin tin",
        "isHidden": true
    }
],
  "encode-and-decode-strings": [
    {
        "id": "enc-sample",
        "name": "Sample 1",
        "stdin": "lint code love you",
        "expectedOutput": "lint code love you",
        "isHidden": false
    },
    {
        "id": "enc-h1",
        "name": "Hidden Test 1",
        "stdin": "we say yes",
        "expectedOutput": "we say yes",
        "isHidden": true
    },
    {
        "id": "enc-h2",
        "name": "Hidden Test 2",
        "stdin": "hello world",
        "expectedOutput": "hello world",
        "isHidden": true
    }
],
  "majority-element": [
    {
        "id": "maj-sample",
        "name": "Sample 1",
        "stdin": "3 2 3",
        "expectedOutput": "3",
        "isHidden": false
    },
    {
        "id": "maj-h1",
        "name": "Hidden Test 1",
        "stdin": "2 2 1 1 1 2 2",
        "expectedOutput": "2",
        "isHidden": true
    },
    {
        "id": "maj-h2",
        "name": "Hidden Test 2",
        "stdin": "1",
        "expectedOutput": "1",
        "isHidden": true
    }
],
  "3sum": [
    {
        "id": "3sum-sample",
        "name": "Sample 1",
        "stdin": "-1 0 1 2 -1 -4",
        "expectedOutput": "-1 -1 2\n-1 0 1",
        "isHidden": false
    },
    {
        "id": "3sum-h1",
        "name": "Hidden Test 1",
        "stdin": "0 1 1",
        "expectedOutput": "",
        "isHidden": true
    },
    {
        "id": "3sum-h2",
        "name": "Hidden Test 2",
        "stdin": "0 0 0",
        "expectedOutput": "0 0 0",
        "isHidden": true
    }
],
  "container-with-most-water": [
    {
        "id": "water-sample",
        "name": "Sample 1",
        "stdin": "1 8 6 2 5 4 8 3 7",
        "expectedOutput": "49",
        "isHidden": false
    },
    {
        "id": "water-h1",
        "name": "Hidden Test 1",
        "stdin": "1 1",
        "expectedOutput": "1",
        "isHidden": true
    },
    {
        "id": "water-h2",
        "name": "Hidden Test 2",
        "stdin": "4 3 2 1 4",
        "expectedOutput": "16",
        "isHidden": true
    }
],
  "trapping-rain-water": [
    {
        "id": "trap-sample",
        "name": "Sample 1",
        "stdin": "0 1 0 2 1 0 1 3 2 1 2 1",
        "expectedOutput": "6",
        "isHidden": false
    },
    {
        "id": "trap-h1",
        "name": "Hidden Test 1",
        "stdin": "4 2 0 3 2 5",
        "expectedOutput": "9",
        "isHidden": true
    },
    {
        "id": "trap-h2",
        "name": "Hidden Test 2",
        "stdin": "3 0 2 0 4",
        "expectedOutput": "7",
        "isHidden": true
    }
],
  "valid-palindrome": [
    {
        "id": "pal-sample",
        "name": "Sample 1",
        "stdin": "A man, a plan, a canal: Panama",
        "expectedOutput": "true",
        "isHidden": false
    },
    {
        "id": "pal-h1",
        "name": "Hidden Test 1",
        "stdin": "race a car",
        "expectedOutput": "false",
        "isHidden": true
    },
    {
        "id": "pal-h2",
        "name": "Hidden Test 2",
        "stdin": " ",
        "expectedOutput": "true",
        "isHidden": true
    }
],
  "minimum-window-substring": [
    {
        "id": "mws-sample",
        "name": "Sample 1",
        "stdin": "ADOBECODEBANC\nABC",
        "expectedOutput": "BANC",
        "isHidden": false
    },
    {
        "id": "mws-h1",
        "name": "Hidden Test 1",
        "stdin": "a\na",
        "expectedOutput": "a",
        "isHidden": true
    },
    {
        "id": "mws-h2",
        "name": "Hidden Test 2",
        "stdin": "a\naa",
        "expectedOutput": "",
        "isHidden": true
    }
],
  "longest-repeating-character-replacement": [
    {
        "id": "lrc-sample",
        "name": "Sample 1",
        "stdin": "ABAB\n2",
        "expectedOutput": "4",
        "isHidden": false
    },
    {
        "id": "lrc-h1",
        "name": "Hidden Test 1",
        "stdin": "AABABBA\n1",
        "expectedOutput": "4",
        "isHidden": true
    },
    {
        "id": "lrc-h2",
        "name": "Hidden Test 2",
        "stdin": "AAAA\n2",
        "expectedOutput": "4",
        "isHidden": true
    }
],
  "permutation-in-string": [
    {
        "id": "perm-sample",
        "name": "Sample 1",
        "stdin": "ab\neidbaooo",
        "expectedOutput": "true",
        "isHidden": false
    },
    {
        "id": "perm-h1",
        "name": "Hidden Test 1",
        "stdin": "ab\neidboaoo",
        "expectedOutput": "false",
        "isHidden": true
    },
    {
        "id": "perm-h2",
        "name": "Hidden Test 2",
        "stdin": "adc\ndcda",
        "expectedOutput": "true",
        "isHidden": true
    }
],
  "daily-temperatures": [
    {
        "id": "temp-sample",
        "name": "Sample 1",
        "stdin": "73 74 75 71 69 72 76 73",
        "expectedOutput": "1 1 4 2 1 1 0 0",
        "isHidden": false
    },
    {
        "id": "temp-h1",
        "name": "Hidden Test 1",
        "stdin": "30 40 50 60",
        "expectedOutput": "1 1 1 0",
        "isHidden": true
    },
    {
        "id": "temp-h2",
        "name": "Hidden Test 2",
        "stdin": "30 60 90",
        "expectedOutput": "1 1 0",
        "isHidden": true
    }
],
  "car-fleet": [
    {
        "id": "car-sample",
        "name": "Sample 1",
        "stdin": "12\n10 8 0 5 3\n2 4 1 1 3",
        "expectedOutput": "3",
        "isHidden": false
    },
    {
        "id": "car-h1",
        "name": "Hidden Test 1",
        "stdin": "10\n3\n3",
        "expectedOutput": "1",
        "isHidden": true
    },
    {
        "id": "car-h2",
        "name": "Hidden Test 2",
        "stdin": "100\n0 2 4\n4 2 1",
        "expectedOutput": "1",
        "isHidden": true
    }
],
  "largest-rectangle-in-histogram": [
    {
        "id": "rect-sample",
        "name": "Sample 1",
        "stdin": "2 1 5 6 2 3",
        "expectedOutput": "10",
        "isHidden": false
    },
    {
        "id": "rect-h1",
        "name": "Hidden Test 1",
        "stdin": "2 4",
        "expectedOutput": "4",
        "isHidden": true
    },
    {
        "id": "rect-h2",
        "name": "Hidden Test 2",
        "stdin": "1",
        "expectedOutput": "1",
        "isHidden": true
    }
],
  "koko-eating-bananas": [
    {
        "id": "koko-sample",
        "name": "Sample 1",
        "stdin": "3 6 7 11\n8",
        "expectedOutput": "4",
        "isHidden": false
    },
    {
        "id": "koko-h1",
        "name": "Hidden Test 1",
        "stdin": "30 11 23 4 20\n5",
        "expectedOutput": "30",
        "isHidden": true
    },
    {
        "id": "koko-h2",
        "name": "Hidden Test 2",
        "stdin": "30 11 23 4 20\n6",
        "expectedOutput": "23",
        "isHidden": true
    }
],
  "search-a-2d-matrix": [
    {
        "id": "m2d-sample",
        "name": "Sample 1",
        "stdin": "3 4\n1 3 5 7\n10 11 16 20\n23 30 34 60\n3",
        "expectedOutput": "true",
        "isHidden": false
    },
    {
        "id": "m2d-h1",
        "name": "Hidden Test 1",
        "stdin": "3 4\n1 3 5 7\n10 11 16 20\n23 30 34 60\n13",
        "expectedOutput": "false",
        "isHidden": true
    },
    {
        "id": "m2d-h2",
        "name": "Hidden Test 2",
        "stdin": "1 1\n1\n1",
        "expectedOutput": "true",
        "isHidden": true
    }
],
  "find-minimum-in-rotated-sorted-array": [
    {
        "id": "fmin-sample",
        "name": "Sample 1",
        "stdin": "3 4 5 1 2",
        "expectedOutput": "1",
        "isHidden": false
    },
    {
        "id": "fmin-h1",
        "name": "Hidden Test 1",
        "stdin": "4 5 6 7 0 1 2",
        "expectedOutput": "0",
        "isHidden": true
    },
    {
        "id": "fmin-h2",
        "name": "Hidden Test 2",
        "stdin": "11 13 15 17",
        "expectedOutput": "11",
        "isHidden": true
    }
],
  "reverse-linked-list": [
    {
        "id": "rll-sample",
        "name": "Sample 1",
        "stdin": "1 2 3 4 5",
        "expectedOutput": "5 4 3 2 1",
        "isHidden": false
    },
    {
        "id": "rll-h1",
        "name": "Hidden Test 1",
        "stdin": "1 2",
        "expectedOutput": "2 1",
        "isHidden": true
    },
    {
        "id": "rll-h2",
        "name": "Hidden Test 2",
        "stdin": "1",
        "expectedOutput": "1",
        "isHidden": true
    }
],
  "merge-two-sorted-lists": [
    {
        "id": "m2l-sample",
        "name": "Sample 1",
        "stdin": "1 2 4\n1 3 4",
        "expectedOutput": "1 1 2 3 4 4",
        "isHidden": false
    },
    {
        "id": "m2l-h1",
        "name": "Hidden Test 1",
        "stdin": "\n0",
        "expectedOutput": "0",
        "isHidden": true
    },
    {
        "id": "m2l-h2",
        "name": "Hidden Test 2",
        "stdin": "5\n1 2 3",
        "expectedOutput": "1 2 3 5",
        "isHidden": true
    }
],
  "lru-cache": [
    {
        "id": "lru-sample",
        "name": "Sample 1",
        "stdin": "2\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2\nput 4 4\nget 1\nget 3\nget 4",
        "expectedOutput": "1 -1 -1 3 4",
        "isHidden": false
    },
    {
        "id": "lru-h1",
        "name": "Hidden Test 1",
        "stdin": "1\nput 2 1\nget 2\nput 3 2\nget 2\nget 3",
        "expectedOutput": "1 -1 2",
        "isHidden": true
    },
    {
        "id": "lru-h2",
        "name": "Hidden Test 2",
        "stdin": "2\nput 2 1\nput 1 1\nput 2 3\nput 4 1\nget 1\nget 2",
        "expectedOutput": "-1 3",
        "isHidden": true
    }
],
  "invert-binary-tree": [
    {
        "id": "inv-sample",
        "name": "Sample 1",
        "stdin": "4 2 7 1 3 6 9",
        "expectedOutput": "4 7 2 9 6 3 1",
        "isHidden": false
    },
    {
        "id": "inv-h1",
        "name": "Hidden Test 1",
        "stdin": "2 1 3",
        "expectedOutput": "2 3 1",
        "isHidden": true
    },
    {
        "id": "inv-h2",
        "name": "Hidden Test 2",
        "stdin": "1",
        "expectedOutput": "1",
        "isHidden": true
    }
],
  "binary-tree-level-order-traversal": [
    {
        "id": "lo-sample",
        "name": "Sample 1",
        "stdin": "3 9 20 null null 15 7",
        "expectedOutput": "3\n9 20\n15 7",
        "isHidden": false
    },
    {
        "id": "lo-h1",
        "name": "Hidden Test 1",
        "stdin": "1",
        "expectedOutput": "1",
        "isHidden": true
    },
    {
        "id": "lo-h2",
        "name": "Hidden Test 2",
        "stdin": "1 2 3 4 5",
        "expectedOutput": "1\n2 3\n4 5",
        "isHidden": true
    }
],
  "validate-binary-search-tree": [
    {
        "id": "vbst-sample",
        "name": "Sample 1",
        "stdin": "2 1 3",
        "expectedOutput": "true",
        "isHidden": false
    },
    {
        "id": "vbst-h1",
        "name": "Hidden Test 1",
        "stdin": "5 1 4 null null 3 6",
        "expectedOutput": "false",
        "isHidden": true
    },
    {
        "id": "vbst-h2",
        "name": "Hidden Test 2",
        "stdin": "10 5 15 null null 6 20",
        "expectedOutput": "false",
        "isHidden": true
    }
],
  "lowest-common-ancestor-of-a-binary-search-tree": [
    {
        "id": "lca-sample",
        "name": "Sample 1",
        "stdin": "6 2 8 0 4 7 9 null null 3 5\n2 8",
        "expectedOutput": "6",
        "isHidden": false
    },
    {
        "id": "lca-h1",
        "name": "Hidden Test 1",
        "stdin": "6 2 8 0 4 7 9 null null 3 5\n2 4",
        "expectedOutput": "2",
        "isHidden": true
    },
    {
        "id": "lca-h2",
        "name": "Hidden Test 2",
        "stdin": "2 1\n2 1",
        "expectedOutput": "2",
        "isHidden": true
    }
],
  "climbing-stairs": [
    {
        "id": "cs-sample",
        "name": "Sample 1",
        "stdin": "2",
        "expectedOutput": "2",
        "isHidden": false
    },
    {
        "id": "cs-h1",
        "name": "Hidden Test 1",
        "stdin": "3",
        "expectedOutput": "3",
        "isHidden": true
    },
    {
        "id": "cs-h2",
        "name": "Hidden Test 2",
        "stdin": "5",
        "expectedOutput": "8",
        "isHidden": true
    }
],
  "house-robber": [
    {
        "id": "rob-sample",
        "name": "Sample 1",
        "stdin": "1 2 3 1",
        "expectedOutput": "4",
        "isHidden": false
    },
    {
        "id": "rob-h1",
        "name": "Hidden Test 1",
        "stdin": "2 7 9 3 1",
        "expectedOutput": "12",
        "isHidden": true
    },
    {
        "id": "rob-h2",
        "name": "Hidden Test 2",
        "stdin": "2 1 1 2",
        "expectedOutput": "4",
        "isHidden": true
    }
],
  "longest-increasing-subsequence": [
    {
        "id": "lis-sample",
        "name": "Sample 1",
        "stdin": "10 9 2 5 3 7 101 18",
        "expectedOutput": "4",
        "isHidden": false
    },
    {
        "id": "lis-h1",
        "name": "Hidden Test 1",
        "stdin": "0 1 0 3 2 3",
        "expectedOutput": "4",
        "isHidden": true
    },
    {
        "id": "lis-h2",
        "name": "Hidden Test 2",
        "stdin": "7 7 7 7 7 7 7",
        "expectedOutput": "1",
        "isHidden": true
    }
],
  "clone-graph": [
    {
        "id": "cg-sample",
        "name": "Sample 1",
        "stdin": "4\n2 4\n1 3\n2 4\n1 3",
        "expectedOutput": "2 4\n1 3\n2 4\n1 3",
        "isHidden": false
    },
    {
        "id": "cg-h1",
        "name": "Hidden Test 1",
        "stdin": "1\n",
        "expectedOutput": "",
        "isHidden": true
    },
    {
        "id": "cg-h2",
        "name": "Hidden Test 2",
        "stdin": "2\n2\n1",
        "expectedOutput": "2\n1",
        "isHidden": true
    }
],
  "course-schedule": [
    {
        "id": "csched-sample",
        "name": "Sample 1",
        "stdin": "2\n1\n1 0",
        "expectedOutput": "true",
        "isHidden": false
    },
    {
        "id": "csched-h1",
        "name": "Hidden Test 1",
        "stdin": "2\n2\n1 0\n0 1",
        "expectedOutput": "false",
        "isHidden": true
    },
    {
        "id": "csched-h2",
        "name": "Hidden Test 2",
        "stdin": "3\n2\n0 1\n1 2",
        "expectedOutput": "true",
        "isHidden": true
    }
],
};

export const CANONICAL_TEST_SUITES: Record<string, ProblemTestCase[]> = {
  ...EXTENDED_TEST_SUITES,
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
