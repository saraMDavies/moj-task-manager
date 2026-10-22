import type { components } from "./generated";

export type TaskStatus = components["schemas"]["TaskStatus"];
export type Task = components["schemas"]["Task"];
export type TaskInput = components["schemas"]["TaskRequest"];

const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}
export const api = {
  list: () => request<Task[]>("/api/tasks"),
  create: (input: TaskInput) =>
    request<Task>("/api/tasks", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: number, input: TaskInput) =>
    request<Task>(`/api/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  status: (id: number, status: TaskStatus) =>
    request<Task>(`/api/tasks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  remove: (id: number) =>
    request<void>(`/api/tasks/${id}`, { method: "DELETE" }),
};
