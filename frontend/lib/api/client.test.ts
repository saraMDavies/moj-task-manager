import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, Task } from './client';

const task: Task = { id: 1, title: 'Call client', description: null, status: 'TODO', due: '2026-10-23T08:00:00Z' };

function respond(status: number, body?: unknown) {
  return { ok: status < 400, status, json: async () => body };
}

describe('api client', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('lists tasks from the tasks endpoint', async () => {
    fetchMock.mockResolvedValue(respond(200, [task]));

    await expect(api.list()).resolves.toEqual([task]);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/tasks',
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }),
    );
  });

  it('creates a task by posting the input as JSON', async () => {
    fetchMock.mockResolvedValue(respond(201, task));
    const input = { title: 'Call client', status: 'TODO' as const, due: '2026-10-23T08:00:00Z' };

    await expect(api.create(input)).resolves.toEqual(task);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/tasks',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(input) }),
    );
  });

  it('changes status with a patch to the status endpoint', async () => {
    fetchMock.mockResolvedValue(respond(200, { ...task, status: 'DONE' }));

    await api.status(1, 'DONE');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/tasks/1/status',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ status: 'DONE' }) }),
    );
  });

  it('resolves with nothing when the server returns no content', async () => {
    const json = vi.fn();
    fetchMock.mockResolvedValue({ ok: true, status: 204, json });

    await expect(api.remove(1)).resolves.toBeUndefined();
    expect(json).not.toHaveBeenCalled();
  });

  it('throws the message from an error response body', async () => {
    fetchMock.mockResolvedValue(respond(400, { message: 'title size must be between 1 and 50' }));

    await expect(api.create({ title: '', status: 'TODO', due: '2026-10-23T08:00:00Z' })).rejects.toThrow('title size must be between 1 and 50');
  });

  it('falls back to the status code when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => { throw new Error('not json'); } });

    await expect(api.list()).rejects.toThrow('Request failed (500)');
  });
});
