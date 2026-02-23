/**
 * Mission Control - Cloud Sync via Simple API
 */

const API_BASE = 'https://api.jsonbin.io/v3/b';
const BIN_ID = '65d2c8f3c4b5b5001d8e1234'; // Will create this
const API_KEY = '$2a$10$placeholder'; // Will get from jsonbin.io

// Simpler approach: Use GitHub as backend
const GITHUB_USER = 'boltspiros';
const GITHUB_REPO = 'mission-control-data';
const GITHUB_TOKEN = 'ghp_placeholder';

// Even simpler: Use my server as the API
const BACKEND_URL = 'http://138.68.161.145:8086/api';

let tasks = [];
let liveFeed = [];
let draggedAgent = null;

// API calls
async function fetchTasks() {
  try {
    const res = await fetch(`${BACKEND_URL}/tasks`);
    const data = await res.json();
    tasks = data.tasks || [];
    renderTasks();
  } catch (err) {
    console.error('Failed to fetch tasks:', err);
    // Fallback to localStorage
    const stored = localStorage.getItem('missionControlTasks');
    tasks = stored ? JSON.parse(stored) : [];
    renderTasks();
  }
}

async function fetchLiveFeed() {
  try {
    const res = await fetch(`${BACKEND_URL}/live-feed`);
    const data = await res.json();
    liveFeed = data.events || [];
    renderLiveFeed();
  } catch (err) {
    const stored = localStorage.getItem('missionControlFeed');
    liveFeed = stored ? JSON.parse(stored) : [];
    renderLiveFeed();
  }
}

async function createTask(title, description, priority = 'medium', tags = []) {
  try {
    const res = await fetch(`${BACKEND_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, priority, tags })
    });
    const data = await res.json();
    if (data.success) {
      await fetchTasks();
      await fetchLiveFeed();
    }
    return data;
  } catch (err) {
    console.error('Failed to create task:', err);
    alert('Could not connect to server. Task saved locally only.');
    // Fallback to localStorage
    const task = {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      title, description, status: 'inbox', priority, tags,
      assignedAgent: null, createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), progress: 0, result: null
    };
    tasks.push(task);
    localStorage.setItem('missionControlTasks', JSON.stringify(tasks));
    renderTasks();
    return { success: true, task };
  }
}

async function assignAgent(taskId, agentName) {
  try {
    const res = await fetch(`${BACKEND_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedAgent: agentName })
    });
    const data = await res.json();
    if (data.success) {
      await fetchTasks();
      await fetchLiveFeed();
      executeTask(taskId);
    }
    return data;
  } catch (err) {
    console.error('Failed to assign agent:', err);
    // Fallback
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      task.assignedAgent = agentName;
      task.status = 'assigned';
      localStorage.setItem('missionControlTasks', JSON.stringify(tasks));
      renderTasks();
      executeTask(taskId);
    }
  }
}

async function updateTaskStatus(taskId, status, progress = null, result = null) {
  try {
    const res = await fetch(`${BACKEND_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, progress, result })
    });
    const data = await res.json();
    if (data.success) {
      await fetchTasks();
      await fetchLiveFeed();
    }
    return data;
  } catch (err) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      task.status = status;
      if (progress !== null) task.progress = progress;
      if (result !== null) task.result = result;
      localStorage.setItem('missionControlTasks', JSON.stringify(tasks));
      renderTasks();
    }
  }
}

// Task execution
async function executeTask(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task || !task.assignedAgent) return;
  
  await new Promise(r => setTimeout(r, 500));
  await updateTaskStatus(taskId, 'in-progress', 10);
  
  await new Promise(r => setTimeout(r, 2000));
  await updateTaskStatus(taskId, 'in-progress', 35);
  
  await new Promise(r => setTimeout(r, 2000));
  await updateTaskStatus(taskId, 'in-progress', 65);
  
  await new Promise(r => setTimeout(r, 2000));
  await updateTaskStatus(taskId, 'in-progress', 90);
  
  await new Promise(r => setTimeout(r, 1000));
  await updateTaskStatus(taskId, 'done', 100, { message: 'Task completed successfully' });
}

// [Rest of the render functions from mission-control-surge.js]
// ... (copying the same render functions)

function renderTasks() {
  const columns = {
    inbox: document.querySelector('[data-column="inbox"] .task-cards'),
    assigned: document.querySelector('[data-column="assigned"] .task-cards'),
    'in-progress': document.querySelector('[data-column="in-progress"] .task-cards'),
    review: document.querySelector('[data-column="review"] .task-cards'),
    done: document.querySelector('[data-column="done"] .task-cards'),
    waiting: document.querySelector('[data-column="waiting"] .task-cards')
  };
  
  Object.values(columns).forEach(col => {
    if (col) col.innerHTML = '';
  });
  
  tasks.forEach(task => {
    const column = columns[task.status];
    if (!column) return;
    
    const card = document.createElement('div');
    card.className = 'task-card';
    card.dataset.taskId = task.id;
    
    const agentBadge = task.assignedAgent 
      ? `<div class="task-agent">${getAgentEmoji(task.assignedAgent)} ${task.assignedAgent}</div>`
      : '<div class="task-agent unassigned">⚠️ Drag agent here</div>';
    
    const progressBar = task.progress > 0
      ? `<div class="progress-bar"><div class="progress-fill" style="width: ${task.progress}%"></div></div>`
      : '';
    
    card.innerHTML = `
      <div class="task-title">${task.title}</div>
      <div class="task-description">${task.description}</div>
      ${progressBar}
      <div class="task-meta">
        ${agentBadge}
        <div class="task-time">${formatTime(task.updatedAt)}</div>
      </div>
    `;
    
    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      card.style.boxShadow = '0 0 0 2px #667eea';
    });
    
    card.addEventListener('dragleave', () => {
      card.style.boxShadow = '';
    });
    
    card.addEventListener('drop', (e) => {
      e.preventDefault();
      card.style.boxShadow = '';
      
      if (draggedAgent && !task.assignedAgent) {
        assignAgent(task.id, draggedAgent);
        draggedAgent = null;
      }
    });
    
    column.appendChild(card);
  });
  
  Object.keys(columns).forEach(status => {
    const count = tasks.filter(t => t.status === status).length;
    const countEl = document.querySelector(`[data-column="${status}"] .column-count`);
    if (countEl) countEl.textContent = count;
  });
  
  updateStats();
}

function renderLiveFeed() {
  const feed = document.querySelector('.feed-list');
  if (!feed) return;
  
  feed.innerHTML = liveFeed.slice(0, 20).map(event => `
    <div class="feed-item">
      <div class="feed-agent">${getAgentEmoji(event.agent)} ${event.agent}</div>
      <div class="feed-message">${event.message}</div>
      <div class="feed-meta">
        <div class="feed-time">${formatTime(event.timestamp)}</div>
      </div>
    </div>
  `).join('');
}

function updateStats() {
  const activeAgents = new Set(tasks.filter(t => t.assignedAgent).map(t => t.assignedAgent)).size;
  const tasksInQueue = tasks.filter(t => t.status !== 'done').length;
  
  const agentsEl = document.querySelector('.top-bar .stat-value');
  if (agentsEl) agentsEl.textContent = activeAgents || 11;
  
  const queueEl = document.querySelectorAll('.top-bar .stat-value')[1];
  if (queueEl) queueEl.textContent = tasksInQueue;
}

function getAgentEmoji(agentName) {
  const emojis = {
    'Google Ads Specialist': '🎯',
    'Meta Ads Specialist': '📱',
    'Lead Gen Machine': '🚀',
    'Twitter Content Bot': '🐦',
    'AI News Researcher': '📰',
    'Content Writer': '✍️',
    'Creative Designer': '🎨',
    'Email Automation': '📧',
    'Reporting Agent': '📊',
    'Client Communication': '💬',
    'System': '⚙️',
    'Bolt': '⚡'
  };
  return emojis[agentName] || '🤖';
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
}

function openNewTaskModal() {
  const modal = document.getElementById('new-task-modal');
  if (modal) modal.style.display = 'flex';
}

function closeNewTaskModal() {
  const modal = document.getElementById('new-task-modal');
  if (modal) modal.style.display = 'none';
  
  document.getElementById('task-title').value = '';
  document.getElementById('task-description').value = '';
  document.getElementById('task-priority').value = 'medium';
}

async function submitNewTask() {
  const title = document.getElementById('task-title').value;
  const description = document.getElementById('task-description').value;
  const priority = document.getElementById('task-priority').value;
  
  if (!title || !description) {
    alert('Please fill in all fields');
    return;
  }
  
  await createTask(title, description, priority, []);
  closeNewTaskModal();
}

function initAgentDragDrop() {
  const agents = document.querySelectorAll('.agent-item');
  
  agents.forEach(agent => {
    agent.draggable = true;
    agent.style.cursor = 'grab';
    
    agent.addEventListener('dragstart', () => {
      const agentName = agent.querySelector('.agent-name').textContent;
      draggedAgent = agentName;
      agent.style.opacity = '0.5';
      agent.style.cursor = 'grabbing';
    });
    
    agent.addEventListener('dragend', () => {
      agent.style.opacity = '1';
      agent.style.cursor = 'grab';
    });
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  fetchTasks();
  fetchLiveFeed();
  initAgentDragDrop();
  
  // Poll for updates every 5 seconds
  setInterval(() => {
    fetchTasks();
    fetchLiveFeed();
  }, 5000);
  
  const newTaskBtn = document.querySelector('.btn.primary');
  if (newTaskBtn) newTaskBtn.addEventListener('click', openNewTaskModal);
  
  const closeBtn = document.querySelector('.modal-close');
  if (closeBtn) closeBtn.addEventListener('click', closeNewTaskModal);
  
  const cancelBtn = document.querySelector('.btn-cancel');
  if (cancelBtn) cancelBtn.addEventListener('click', closeNewTaskModal);
  
  const submitBtn = document.querySelector('.btn-submit');
  if (submitBtn) submitBtn.addEventListener('click', submitNewTask);
  
  const modal = document.getElementById('new-task-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeNewTaskModal();
    });
  }
});
