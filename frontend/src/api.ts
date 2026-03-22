import type { Project, ProjectCreate, Row } from './types';

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data.error || res.statusText);
  }

  return res.json() as Promise<T>;
}

const get = <T>(path: string) => request<T>('GET', path);
const post = <T>(path: string, body: unknown) => request<T>('POST', path, body);
const patch = <T>(path: string, body: unknown) => request<T>('PATCH', path, body);
const put = <T>(path: string, body: unknown) => request<T>('PUT', path, body);
const del = <T>(path: string) => request<T>('DELETE', path);

export const api = {
  // Auth
  status: () => get<{ needsSetup: boolean }>('/api/auth/status'),
  setup: (password: string) => post<{ ok: boolean }>('/api/auth/setup', { password }),
  login: (password: string) => post<{ ok: boolean }>('/api/auth/login', { password }),
  logout: () => post<{ ok: boolean }>('/api/auth/logout', {}),
  me: () => get<{ authenticated: boolean }>('/api/auth/me'),

  // Rows
  getRows: () => get<Row[]>('/api/rows'),
  createRow: () => post<Row>('/api/rows', {}),
  updateRow: (id: number, data: Partial<Row>) => patch<Row>(`/api/rows/${id}`, data),
  deleteRow: (id: number) => del<{ ok: boolean }>(`/api/rows/${id}`),
  reorderRows: (items: { id: number; sort_order: number }[]) =>
    put<{ ok: boolean }>('/api/rows/reorder', items),

  // Projects
  getProjects: () => get<Project[]>('/api/projects'),
  createProject: (data: ProjectCreate) => post<Project>('/api/projects', data),
  updateProject: (id: number, data: Partial<ProjectCreate>) =>
    patch<Project>(`/api/projects/${id}`, data),
  deleteProject: (id: number) => del<{ ok: boolean }>(`/api/projects/${id}`),
};

export { ApiError };
