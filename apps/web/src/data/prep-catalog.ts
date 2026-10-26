export type PrepDifficulty = "Easy" | "Medium" | "Hard";

export interface PrepQuestion {
  slug: string;
  title: string;
  difficulty: PrepDifficulty;
  topics: string[];
  companies: string[];
  priority: "Core" | "Advanced";
}

export const PREP_QUESTIONS: PrepQuestion[] = [
  { slug: "two-sum", title: "Two Sum", difficulty: "Easy", topics: ["Array", "Hash Table"], companies: ["Amazon", "Google", "Meta", "Microsoft"], priority: "Core" },
  { slug: "reverse-string", title: "Reverse String", difficulty: "Easy", topics: ["String", "Two Pointers"], companies: ["TCS", "Infosys", "Amazon"], priority: "Core" },
  { slug: "valid-parentheses", title: "Valid Parentheses", difficulty: "Easy", topics: ["Stack", "String"], companies: ["Amazon", "Meta", "Google", "Infosys"], priority: "Core" },
  { slug: "binary-search", title: "Binary Search", difficulty: "Easy", topics: ["Binary Search", "Array"], companies: ["Google", "Microsoft", "Amazon", "TCS"], priority: "Core" },
  { slug: "valid-anagram", title: "Valid Anagram", difficulty: "Easy", topics: ["String", "Hash Table"], companies: ["Infosys", "Wipro", "Amazon"], priority: "Core" },
  { slug: "merge-intervals", title: "Merge Intervals", difficulty: "Medium", topics: ["Interval", "Sorting"], companies: ["Amazon", "Google", "Meta"], priority: "Core" },
  { slug: "number-of-islands", title: "Number of Islands", difficulty: "Medium", topics: ["Graph", "DFS", "Matrix"], companies: ["Amazon", "Meta", "Google", "UPSC-style"], priority: "Core" },
  { slug: "median-of-two-sorted-arrays", title: "Median of Two Sorted Arrays", difficulty: "Hard", topics: ["Binary Search", "Divide and Conquer"], companies: ["Google", "Apple", "Meta"], priority: "Advanced" },
  { slug: "best-time-to-buy-and-sell-stock", title: "Best Time to Buy and Sell Stock", difficulty: "Easy", topics: ["Array", "Dynamic Programming"], companies: ["Amazon", "Meta", "Microsoft"], priority: "Core" },
  { slug: "contains-duplicate", title: "Contains Duplicate", difficulty: "Easy", topics: ["Array", "Hash Table"], companies: ["Amazon", "Meta", "Infosys"], priority: "Core" },
  { slug: "product-of-array-except-self", title: "Product of Array Except Self", difficulty: "Medium", topics: ["Array", "Prefix Sum"], companies: ["Amazon", "Google", "Meta"], priority: "Core" },
  { slug: "maximum-subarray", title: "Maximum Subarray", difficulty: "Medium", topics: ["Array", "Dynamic Programming"], companies: ["Amazon", "Microsoft", "Goldman Sachs"], priority: "Core" },
  { slug: "3sum", title: "3Sum", difficulty: "Medium", topics: ["Array", "Two Pointers", "Sorting"], companies: ["Amazon", "Meta", "Apple"], priority: "Core" },
  { slug: "group-anagrams", title: "Group Anagrams", difficulty: "Medium", topics: ["String", "Hash Table", "Sorting"], companies: ["Amazon", "Meta", "Microsoft", "Google"], priority: "Core" },
  { slug: "longest-substring-without-repeating-characters", title: "Longest Substring Without Repeating Characters", difficulty: "Medium", topics: ["String", "Sliding Window"], companies: ["Amazon", "Meta", "Google"], priority: "Core" },
  { slug: "minimum-window-substring", title: "Minimum Window Substring", difficulty: "Hard", topics: ["String", "Sliding Window"], companies: ["Google", "Meta", "Uber"], priority: "Advanced" },
  { slug: "min-stack", title: "Min Stack", difficulty: "Medium", topics: ["Stack", "Design"], companies: ["Amazon", "Microsoft", "Bloomberg"], priority: "Core" },
  { slug: "search-in-rotated-sorted-array", title: "Search in Rotated Sorted Array", difficulty: "Medium", topics: ["Binary Search", "Array"], companies: ["Amazon", "Meta", "Google"], priority: "Core" },
  { slug: "find-minimum-in-rotated-sorted-array", title: "Find Minimum in Rotated Sorted Array", difficulty: "Medium", topics: ["Binary Search", "Array"], companies: ["Amazon", "Meta", "Microsoft"], priority: "Core" },
  { slug: "reverse-linked-list", title: "Reverse Linked List", difficulty: "Easy", topics: ["Linked List"], companies: ["Amazon", "Meta", "Microsoft", "TCS"], priority: "Core" },
  { slug: "merge-two-sorted-lists", title: "Merge Two Sorted Lists", difficulty: "Easy", topics: ["Linked List", "Recursion"], companies: ["Amazon", "Meta", "Microsoft"], priority: "Core" },
  { slug: "linked-list-cycle", title: "Linked List Cycle", difficulty: "Easy", topics: ["Linked List", "Two Pointers"], companies: ["Amazon", "Meta", "Microsoft"], priority: "Core" },
  { slug: "lru-cache", title: "LRU Cache", difficulty: "Medium", topics: ["Linked List", "Hash Table", "Design"], companies: ["Amazon", "Google", "Microsoft"], priority: "Advanced" },
  { slug: "invert-binary-tree", title: "Invert Binary Tree", difficulty: "Easy", topics: ["Tree", "DFS", "BFS"], companies: ["Google", "Meta", "Amazon"], priority: "Core" },
  { slug: "binary-tree-level-order-traversal", title: "Binary Tree Level Order Traversal", difficulty: "Medium", topics: ["Tree", "BFS"], companies: ["Amazon", "Meta", "Microsoft"], priority: "Core" },
  { slug: "validate-binary-search-tree", title: "Validate Binary Search Tree", difficulty: "Medium", topics: ["Tree", "DFS", "BST"], companies: ["Google", "Amazon", "Meta"], priority: "Core" },
  { slug: "top-k-frequent-elements", title: "Top K Frequent Elements", difficulty: "Medium", topics: ["Heap", "Hash Table"], companies: ["Amazon", "Meta", "Microsoft"], priority: "Core" },
  { slug: "combination-sum", title: "Combination Sum", difficulty: "Medium", topics: ["Backtracking"], companies: ["Amazon", "Meta", "Microsoft"], priority: "Core" },
  { slug: "subsets", title: "Subsets", difficulty: "Medium", topics: ["Backtracking", "Bit Manipulation"], companies: ["Amazon", "Meta", "Google"], priority: "Core" },
  { slug: "permutations", title: "Permutations", difficulty: "Medium", topics: ["Backtracking"], companies: ["Amazon", "Meta", "Microsoft"], priority: "Core" },
  { slug: "course-schedule", title: "Course Schedule", difficulty: "Medium", topics: ["Graph", "Topological Sort"], companies: ["Amazon", "Google", "Meta"], priority: "Core" },
  { slug: "coin-change", title: "Coin Change", difficulty: "Medium", topics: ["Dynamic Programming"], companies: ["Amazon", "Google", "Microsoft"], priority: "Core" },
  { slug: "house-robber", title: "House Robber", difficulty: "Medium", topics: ["Dynamic Programming"], companies: ["Amazon", "Google", "Apple"], priority: "Core" },
  { slug: "climbing-stairs", title: "Climbing Stairs", difficulty: "Easy", topics: ["Dynamic Programming"], companies: ["Amazon", "Google", "Adobe", "Infosys"], priority: "Core" },
  { slug: "insert-interval", title: "Insert Interval", difficulty: "Medium", topics: ["Interval"], companies: ["Google", "Amazon", "Meta"], priority: "Core" },
  { slug: "jump-game", title: "Jump Game", difficulty: "Medium", topics: ["Greedy", "Dynamic Programming"], companies: ["Amazon", "Google", "Meta"], priority: "Core" },
  { slug: "set-matrix-zeroes", title: "Set Matrix Zeroes", difficulty: "Medium", topics: ["Matrix"], companies: ["Amazon", "Meta", "Google"], priority: "Advanced" },
  { slug: "trapping-rain-water", title: "Trapping Rain Water", difficulty: "Hard", topics: ["Two Pointers", "Stack"], companies: ["Amazon", "Google", "Meta"], priority: "Advanced" },
];

export const TOPIC_ORDER = [
  "Array",
  "String",
  "Hash Table",
  "Two Pointers",
  "Sliding Window",
  "Stack",
  "Binary Search",
  "Linked List",
  "Tree",
  "Graph",
  "Dynamic Programming",
  "Backtracking",
  "Heap",
  "Interval",
  "Greedy",
  "Matrix",
];

export const COMPANY_ORDER = [
  "TCS",
  "Infosys",
  "Amazon",
  "Google",
  "Meta",
  "Microsoft",
  "Apple",
  "UPSC-style",
  "Uber",
  "Adobe",
];
