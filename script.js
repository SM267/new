const STORAGE_KEY = "devtrack.tasks.v1";
const THEME_KEY = "devtrack.theme";

const form = document.querySelector("#taskForm");
const titleInput = document.querySelector("#titleInput");
const descriptionInput = document.querySelector("#descriptionInput");
const priorityInput = document.querySelector("#priorityInput");
const dueInput = document.querySelector("#dueInput");
const taskList = document.querySelector("#taskList");
const emptyState = document.querySelector("#emptyState");
const searchInput = document.querySelector("#searchInput");
const filterInput = document.querySelector("#filterInput");
const themeBtn = document.querySelector("#themeBtn");

let tasks = loadTasks();

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function createTask(title, description, priority, due) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    title: title.trim(),
    description: description.trim(),
    priority,
    due,
    completed: false,
    createdAt: new Date().toISOString()
  };
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = titleInput.value.trim();
  if (!title) return;

  tasks.unshift(createTask(title, descriptionInput.value, priorityInput.value, dueInput.value));
  saveTasks();
  form.reset();
  priorityInput.value = "medium";
  render();
  titleInput.focus();
});

function render() {
  const query = searchInput.value.trim().toLowerCase();
  const filter = filterInput.value;

  const visible = tasks.filter((task) => {
    const matchesSearch = `${task.title} ${task.description}`.toLowerCase().includes(query);
    const matchesFilter = filter === "all"
      || (filter === "active" && !task.completed)
      || (filter === "completed" && task.completed)
      || (filter === "high" && task.priority === "high");
    return matchesSearch && matchesFilter;
  });

  taskList.replaceChildren(...visible.map(renderTask));
  emptyState.hidden = visible.length !== 0;
  document.querySelector("#taskCount").textContent = visible.length;
  updateStats();
}

function renderTask(task) {
  const node = document.querySelector("#taskTemplate").content.cloneNode(true);
  const item = node.querySelector(".task-item");
  const check = node.querySelector(".check-btn");
  const title = node.querySelector(".task-title");
  const description = node.querySelector(".task-description");
  const priority = node.querySelector(".priority");
  const due = node.querySelector(".due");
  const created = node.querySelector(".task-created");

  item.dataset.id = task.id;
  item.classList.toggle("completed", task.completed);
  title.textContent = task.title;
  description.textContent = task.description || "No description";
  description.hidden = !task.description;
  priority.textContent = task.priority;
  priority.classList.add(task.priority);
  due.textContent = task.due ? `Due ${formatDate(task.due)}` : "No due date";
  created.textContent = `Created ${formatDate(task.createdAt)}`;

  check.addEventListener("click", () => toggleTask(task.id));
  node.querySelector(".edit-btn").addEventListener("click", () => editTask(task.id));
  node.querySelector(".delete-btn").addEventListener("click", () => deleteTask(task.id));
  return item;
}

function toggleTask(id) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;
  task.completed = !task.completed;
  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  render();
}

function editTask(id) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;
  const nextTitle = prompt("Task title", task.title);
  if (nextTitle === null) return;
  const title = nextTitle.trim();
  if (!title) return;
  task.title = title;
  task.description = prompt("Description", task.description) ?? task.description;
  saveTasks();
  render();
}

function formatDate(value) {
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const active = total - completed;
  const high = tasks.filter((task) => task.priority === "high" && !task.completed).length;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  document.querySelector("#totalStat").textContent = total;
  document.querySelector("#doneStat").textContent = completed;
  document.querySelector("#activeStat").textContent = active;
  document.querySelector("#highStat").textContent = high;
  document.querySelector("#progressValue").textContent = `${percent}%`;
  document.querySelector("#progressRing").style.background = `conic-gradient(var(--accent) ${percent * 3.6}deg, var(--border) ${percent * 3.6}deg)`;
}

searchInput.addEventListener("input", render);
filterInput.addEventListener("change", render);

themeBtn.addEventListener("click", () => {
  const dark = document.documentElement.dataset.theme === "dark";
  document.documentElement.dataset.theme = dark ? "light" : "dark";
  localStorage.setItem(THEME_KEY, dark ? "light" : "dark");
  themeBtn.textContent = dark ? "☾" : "☀";
});

const savedTheme = localStorage.getItem(THEME_KEY);
if (savedTheme) {
  document.documentElement.dataset.theme = savedTheme;
  themeBtn.textContent = savedTheme === "dark" ? "☀" : "☾";
}

document.querySelector("#todayLabel").textContent = new Intl.DateTimeFormat(undefined, {
  weekday: "short", day: "numeric", month: "short"
}).format(new Date());

render();
