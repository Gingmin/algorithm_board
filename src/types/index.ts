export interface Category {
  id: string;
  name: string;
  order: number;
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
}

export interface Problem {
  id: string;
  categoryId: string;
  title: string;
  content: string;
  language: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  timeLimit: number;
  performanceLimit: number;
  template: string;
  testCases: TestCase[];
  bookmarked: boolean;
  memo: string;
  createdAt: string;
}

export interface TestResult {
  testCaseId: string;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  executionTime: number;
  error?: string;
}

export interface Attempt {
  id: string;
  problemId: string;
  attemptNumber: number;
  code: string;
  timeSpent: number;
  executionTime: number;
  passed: boolean;
  testResults: TestResult[];
  submittedAt: string;
}

export interface RunResult {
  testResults: TestResult[];
  allPassed: boolean;
  totalExecutionTime: number;
}

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: '매우 쉬움',
  2: '쉬움',
  3: '보통',
  4: '어려움',
  5: '매우 어려움',
};

export const DIFFICULTY_COLORS: Record<number, string> = {
  1: 'text-green-500',
  2: 'text-emerald-500',
  3: 'text-yellow-500',
  4: 'text-orange-500',
  5: 'text-red-500',
};
