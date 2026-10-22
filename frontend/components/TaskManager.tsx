"use client";
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import Add from "@mui/icons-material/Add";
import ArrowDropDown from "@mui/icons-material/ArrowDropDown";
import Delete from "@mui/icons-material/Delete";
import Edit from "@mui/icons-material/Edit";
import { api, Task, TaskInput, TaskStatus } from "@/lib/api/client";
// Mirrors the maxLength constraints in openapi/openapi.yaml
const TITLE_MAX_LENGTH = 50;
const DESCRIPTION_MAX_LENGTH = 255;
const labels: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};
const statusColors: Record<TaskStatus, "default" | "info" | "success"> = {
  TODO: "default",
  IN_PROGRESS: "info",
  DONE: "success",
};
export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]),
    [filter, setFilter] = useState<"ALL" | TaskStatus>("ALL"),
    [search, setSearch] = useState(""),
    [open, setOpen] = useState(false),
    [editing, setEditing] = useState<Task | null>(null),
    [error, setError] = useState("");
  const showError = (e: unknown) => setError((e as Error).message);
  useEffect(() => {
    api.list().then(setTasks).catch(showError);
  }, []);
  const visible = tasks.filter(
    (t) =>
      (filter === "ALL" || t.status === filter) &&
      `${t.title} ${t.description ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const save = async (input: TaskInput) => {
    try {
      const task = editing
        ? await api.update(editing.id, input)
        : await api.create(input);
      setTasks((x) =>
        editing ? x.map((t) => (t.id === task.id ? task : t)) : [task, ...x],
      );
      setOpen(false);
      setEditing(null);
    } catch (e) {
      showError(e);
    }
  };
  const remove = async (id: number) => {
    if (!confirm("Delete this task?")) return;
    try {
      await api.remove(id);
      setTasks((x) => x.filter((t) => t.id !== id));
    } catch (e) {
      showError(e);
    }
  };
  const changeStatus = async (task: Task, status: TaskStatus) => {
    try {
      const updated = await api.status(task.id, status);
      setTasks((x) => x.map((t) => (t.id === updated.id ? updated : t)));
    } catch (e) {
      showError(e);
    }
  };
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f6f7f9" }}>
      <Toolbar
        sx={{
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
          px: { xs: 2, md: 4 },
        }}
      >
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
          Task Manager
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          New task
        </Button>
      </Toolbar>
      <Box sx={{ maxWidth: 1100, mx: "auto", p: { xs: 2, md: 4 } }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <TextField
            fullWidth
            size="small"
            label="Search tasks"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            size="small"
            value={filter}
            onChange={(e) => setFilter(e.target.value as "ALL" | TaskStatus)}
          >
            <MenuItem value="ALL">All</MenuItem>
            {(Object.keys(labels) as TaskStatus[]).map((s) => (
              <MenuItem key={s} value={s}>
                {labels[s]}
              </MenuItem>
            ))}
          </Select>
        </Stack>
        <Stack spacing={2}>
          {visible.map((task) => (
            <Card key={task.id}>
              <CardContent>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  alignItems={{ sm: "center" }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6">{task.title}</Typography>
                    {task.description && (
                      <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                        {task.description}
                      </Typography>
                    )}
                    {task.due && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        Due {new Date(task.due).toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                  <StatusChip
                    status={task.status}
                    onChange={(status) => void changeStatus(task, status)}
                  />
                  <IconButton
                    aria-label="edit"
                    onClick={() => {
                      setEditing(task);
                      setOpen(true);
                    }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    aria-label="delete"
                    color="error"
                    onClick={() => void remove(task.id)}
                  >
                    <Delete />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
        {visible.length === 0 && (
          <Typography
            color="text.secondary"
            sx={{ textAlign: "center", py: 8 }}
          >
            No tasks found.
          </Typography>
        )}
      </Box>
      <TaskDialog
        open={open}
        task={editing}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSave={save}
      />
      <Snackbar
        open={!!error}
        autoHideDuration={5000}
        onClose={() => setError("")}
      >
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
function TaskDialog({
  open,
  task,
  onClose,
  onSave,
}: {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: (input: TaskInput) => Promise<void>;
}) {
  const [title, setTitle] = useState(""),
    [description, setDescription] = useState(""),
    [status, setStatus] = useState<TaskStatus>("TODO"),
    [due, setDue] = useState("");
  const titleTooLong = title.length > TITLE_MAX_LENGTH;
  const descriptionTooLong = description.length > DESCRIPTION_MAX_LENGTH;
  const canSave =
    title.trim() !== "" && due !== "" && !titleTooLong && !descriptionTooLong;
  useEffect(() => {
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setStatus(task?.status ?? "TODO");
    setDue(task?.due ? task.due.slice(0, 16) : "");
  }, [task, open]);
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{task ? "Edit task" : "Create task"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            autoFocus
            required
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={titleTooLong}
            helperText={`${title.length}/${TITLE_MAX_LENGTH}`}
          />
          <TextField
            label="Description"
            multiline
            minRows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={descriptionTooLong}
            helperText={`${description.length}/${DESCRIPTION_MAX_LENGTH}`}
          />
          <FormControl>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
            >
              {Object.keys(labels).map((s) => (
                <MenuItem key={s} value={s}>
                  {labels[s as TaskStatus]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            required
            label="Due date and time"
            type="datetime-local"
            InputLabelProps={{ shrink: true }}
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!canSave}
          onClick={() =>
            onSave({
              title: title.trim(),
              description: description.trim() || null,
              status,
              due: new Date(due).toISOString(),
            })
          }
        >
          {task ? "Save" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
function StatusChip({
  status,
  onChange,
}: {
  status: TaskStatus;
  onChange: (status: TaskStatus) => void;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const close = () => setAnchor(null);
  return (
    <>
      <Chip
        label={labels[status]}
        color={statusColors[status]}
        deleteIcon={<ArrowDropDown />}
        onDelete={(e) => setAnchor(e.currentTarget.parentElement)}
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
      />
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close}>
        {(Object.keys(labels) as TaskStatus[]).map((s) => (
          <MenuItem
            key={s}
            selected={s === status}
            onClick={() => {
              close();
              if (s !== status) onChange(s);
            }}
          >
            {labels[s]}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
