import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskManager from './TaskManager';
import { api, Task } from '@/lib/api/client';

vi.mock('@/lib/api/client', () => ({
  api: { list: vi.fn(), create: vi.fn(), update: vi.fn(), status: vi.fn(), remove: vi.fn() },
}));

const mockedApi = vi.mocked(api);

const first: Task = { id: 1, title: 'Review case notes', description: 'Check outstanding actions', status: 'TODO', due: '2026-10-22T09:00:00Z' };
const second: Task = { id: 2, title: 'Contact housing officer', description: null, status: 'DONE', due: '2026-10-23T09:00:00Z' };

describe('TaskManager', () => {
  beforeEach(() => {
    mockedApi.list.mockResolvedValue([first, second]);
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows the tasks returned by the API', async () => {
    render(<TaskManager />);

    expect(await screen.findByText('Review case notes')).toBeInTheDocument();
    expect(screen.getByText('Contact housing officer')).toBeInTheDocument();
    expect(screen.getByText('Check outstanding actions')).toBeInTheDocument();
  });

  it('shows an empty state when there are no tasks', async () => {
    mockedApi.list.mockResolvedValue([]);

    render(<TaskManager />);

    expect(await screen.findByText('No tasks found.')).toBeInTheDocument();
  });

  it('filters tasks by the search text', async () => {
    const user = userEvent.setup();
    render(<TaskManager />);
    await screen.findByText('Review case notes');

    await user.type(screen.getByRole('textbox', { name: /search tasks/i }), 'housing');

    expect(screen.getByText('Contact housing officer')).toBeInTheDocument();
    expect(screen.queryByText('Review case notes')).not.toBeInTheDocument();
  });

  it('shows an error when loading fails', async () => {
    mockedApi.list.mockRejectedValue(new Error('Request failed (500)'));

    render(<TaskManager />);

    expect(await screen.findByText('Request failed (500)')).toBeInTheDocument();
  });

  it('creates a task through the dialog', async () => {
    const due = '2026-10-23T09:00';
    const created: Task = { id: 3, title: 'Walk the dog', description: null, status: 'TODO', due: new Date(due).toISOString() };
    mockedApi.create.mockResolvedValue(created);
    const user = userEvent.setup();
    render(<TaskManager />);
    await screen.findByText('Review case notes');

    await user.click(screen.getByRole('button', { name: /new task/i }));
    await user.type(screen.getByRole('textbox', { name: /title/i }), 'Walk the dog');
    fireEvent.change(screen.getByLabelText(/due date and time/i), { target: { value: due } });
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(mockedApi.create).toHaveBeenCalledWith({
      title: 'Walk the dog',
      description: null,
      status: 'TODO',
      due: new Date(due).toISOString(),
    });
    expect(await screen.findByText('Walk the dog')).toBeInTheDocument();
  });

  it('blocks saving without a due date', async () => {
    const user = userEvent.setup();
    render(<TaskManager />);
    await screen.findByText('Review case notes');

    await user.click(screen.getByRole('button', { name: /new task/i }));
    await user.type(screen.getByRole('textbox', { name: /title/i }), 'No due date');

    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
    expect(mockedApi.create).not.toHaveBeenCalled();
  });

  it('blocks saving when the title is over fifty characters', async () => {
    const user = userEvent.setup();
    render(<TaskManager />);
    await screen.findByText('Review case notes');

    await user.click(screen.getByRole('button', { name: /new task/i }));
    await user.click(screen.getByRole('textbox', { name: /title/i }));
    await user.paste('x'.repeat(51));

    expect(screen.getByText('51/50')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
    expect(mockedApi.create).not.toHaveBeenCalled();
  });

  it('blocks saving when the description is over 255 characters', async () => {
    const user = userEvent.setup();
    render(<TaskManager />);
    await screen.findByText('Review case notes');

    await user.click(screen.getByRole('button', { name: /new task/i }));
    await user.type(screen.getByRole('textbox', { name: /title/i }), 'Fine');
    await user.click(screen.getByRole('textbox', { name: /description/i }));
    await user.paste('x'.repeat(256));

    expect(screen.getByText('256/255')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
  });

  it('changes a task status from the status chip menu', async () => {
    mockedApi.status.mockResolvedValue({ ...first, status: 'DONE' });
    const user = userEvent.setup();
    render(<TaskManager />);
    await screen.findByText('Review case notes');

    await user.click(screen.getByRole('button', { name: 'To do' }));
    await user.click(screen.getByRole('menuitem', { name: 'Done' }));

    expect(mockedApi.status).toHaveBeenCalledWith(1, 'DONE');
    expect(await screen.findAllByRole('button', { name: 'Done' })).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'To do' })).not.toBeInTheDocument();
  });

  it('deletes a task after confirmation', async () => {
    mockedApi.remove.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<TaskManager />);
    await screen.findByText('Review case notes');

    await user.click(screen.getAllByRole('button', { name: 'delete' })[0]);

    expect(mockedApi.remove).toHaveBeenCalledWith(1);
    await waitFor(() => expect(screen.queryByText('Review case notes')).not.toBeInTheDocument());
    expect(screen.getByText('Contact housing officer')).toBeInTheDocument();
  });

  it('does not delete when the confirmation is declined', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false));
    const user = userEvent.setup();
    render(<TaskManager />);
    await screen.findByText('Review case notes');

    await user.click(screen.getAllByRole('button', { name: 'delete' })[0]);

    expect(mockedApi.remove).not.toHaveBeenCalled();
    expect(screen.getByText('Review case notes')).toBeInTheDocument();
  });
});
