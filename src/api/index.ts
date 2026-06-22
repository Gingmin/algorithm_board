import type { Category, Problem, Attempt } from '../types';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  // Categories
  getCategories: () => request<Category[]>('/categories?_sort=order'),
  createCategory: (data: Omit<Category, 'id'>) =>
    request<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: Partial<Category>) =>
    request<Category>(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCategory: (id: string) =>
    request<void>(`/categories/${id}`, { method: 'DELETE' }),

  // Problems
  getProblems: () => request<Problem[]>('/problems'),
  getProblemsByCategory: (categoryId: string) =>
    request<Problem[]>(`/problems?categoryId=${categoryId}`),
  getProblem: (id: string) => request<Problem>(`/problems/${id}`),
  createProblem: (data: Omit<Problem, 'id'>) =>
    request<Problem>('/problems', { method: 'POST', body: JSON.stringify(data) }),
  updateProblem: (id: string, data: Partial<Problem>) =>
    request<Problem>(`/problems/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProblem: (id: string) =>
    request<void>(`/problems/${id}`, { method: 'DELETE' }),

  // Attempts
  getAttempts: () => request<Attempt[]>('/attempts'),
  getAttemptsByProblem: (problemId: string) =>
    request<Attempt[]>(`/attempts?problemId=${problemId}&_sort=attemptNumber`),
  createAttempt: (data: Omit<Attempt, 'id'>) =>
    request<Attempt>('/attempts', { method: 'POST', body: JSON.stringify(data) }),
  deleteAttempt: (id: string) =>
    request<void>(`/attempts/${id}`, { method: 'DELETE' }),

  // Export all data
  exportAll: async () => {
    const [categories, problems, attempts] = await Promise.all([
      request<Category[]>('/categories'),
      request<Problem[]>('/problems'),
      request<Attempt[]>('/attempts'),
    ]);
    return { categories, problems, attempts };
  },
};
