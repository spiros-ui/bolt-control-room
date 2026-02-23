/**
 * Mission Control - Interactive Task Management
 */

// State
let tasks = [];
let liveFeed = [];
let draggedAgent = null;

// API calls
async function fetchTasks() {
  const res = await fetch('/api/tasks');
  const data = await res.json();
  tasks = data.tasks || [];
  renderTasks();
}

async function fetchLiveFeed() {
  const res = await fetch('/api/live-feed');
  const data = await res.json();
  liveFeed = data.events || [];
  renderLiveFeed();
}

async function createTask(title, description, priority = 'medium', tags = []) {
  const res = await fetch('/api/tasks', {
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
}

async function assignAgent(taskId, agentName) {
  const res = await fetch(`/api/tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assignedAgent: agentName })
  });
  const data = await res.json();
  if (data.success) {
    await fetchTasks();
    await fetchLiveFeed();
    // Start executing the task
    executeTask(taskId);
  }
  return data;
}

async function updateTaskStatus(taskId, status, progress = null, result = null) {
  const res = await fetch(`/api/tasks/${taskId}`, {
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
}

// Task execution simulation
async function executeTask(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task || !task.assignedAgent) return;
  
  // Move to in-progress
  await updateTaskStatus(taskId, 'in-progress', 10);
  
  // Simulate work with progress updates
  await new Promise(r => setTimeout(r, 2000));
  await updateTaskStatus(taskId, 'in-progress', 35);
  
  await new Promise(r => setTimeout(r, 2000));
  await updateTaskStatus(taskId, 'in-progress', 65);
  
  await new Promise(r => setTimeout(r, 2000));
  await updateTaskStatus(taskId, 'in-progress', 90);
  
  await new Promise(r => setTimeout(r, 1000));
  await updateTaskStatus(taskId, 'done', 100, { message: 'Task completed successfully' });
}

// Render functions
function renderTasks() {
  const columns = {
    inbox: document.querySelector('[data-column="inbox"] .task-cards'),
    assigned: document.querySelector('[data-column="assigned"] .task-cards'),
    'in-progress': document.querySelector('[data-column="in-progress"] .task-cards'),
    review: document.querySelector('[data-column="review"] .task-cards'),
    done: document.querySelector('[data-column="done"] .task-cards'),
    waiting: document.querySelector('[data-column="waiting"] .task-cards')
  };
  
  // Clear all columns
  Object.values(columns).forEach(col => {
    if (col) col.innerHTML = '';
  });
  
  // Add tasks to columns
  tasks.forEach(task => {
    const column = columns[task.status];
    if (!column) return;
    
    const card = document.createElement('div');
    card.className = 'task-card';
    card.dataset.taskId = task.id;
    card.draggable = false;
    
    const agentBadge = task.assignedAgent 
      ? `<div class="task-agent">${getAgentEmoji(task.assignedAgent)} ${task.assignedAgent}</div>`
      : '<div class="task-agent unassigned">⚠️ Unassigned</div>';
    
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
    
    // Make card a drop zone for agents
    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      card.style.boxShadow = '0 0 0 2px #667eea';
    });
    
    card.addEventListener('dragleave', () => {
      card.style.boxShadow = '';
    });
    
    card.addEventListener('drop', async (e) => {
      e.preventDefault();
      card.style.boxShadow = '';
      
      if (draggedAgent) {
        await assignAgent(task.id, draggedAgent);
        draggedAgent = null;
      }
    });
    
    column.appendChild(card);
  });
  
  // Update column counts
  Object.keys(columns).forEach(status => {
    const count = tasks.filter(t => t.status === status).length;
    const countEl = document.querySelector(`[data-column="${status}"] .column-count`);
    if (countEl) countEl.textContent = count;
  });
}

function renderLiveFeed() {
  const feed = document.querySelector('.feed-list');
  if (!feed) return;
  
  feed.innerHTML = liveFeed.slice(0, 20).map(event => {
    if (event.type === 'agent-communication') {
      // Agent-to-agent communication
      return `
        <div class="feed-item feed-item-communication">
          <div class="feed-communication">
            <div class="feed-from">
              ${getAgentEmoji(event.fromAgent)} ${event.fromAgent}
              <span class="feed-arrow">→</span>
              ${getAgentEmoji(event.toAgent)} ${event.toAgent}
            </div>
            <div class="feed-message">${event.message}</div>
            <div class="feed-comm-type">${event.communicationType}</div>
          </div>
          <div class="feed-meta">
            <div class="feed-time">${formatTime(event.timestamp)}</div>
          </div>
        </div>
      `;
    } else if (event.type === 'agent-action') {
      // Agent action
      return `
        <div class="feed-item feed-item-action">
          <div class="feed-agent">${getAgentEmoji(event.agent)} ${event.agent}</div>
          <div class="feed-action">
            <strong>${event.action}</strong>
            <div class="feed-details">${event.details}</div>
          </div>
          <div class="feed-meta">
            <div class="feed-time">${formatTime(event.timestamp)}</div>
          </div>
        </div>
      `;
    } else {
      // Regular event (backwards compatible)
      return `
        <div class="feed-item">
          <div class="feed-agent">${getAgentEmoji(event.agent)} ${event.agent}</div>
          <div class="feed-message">${event.message}</div>
          <div class="feed-meta">
            <div class="feed-time">${formatTime(event.timestamp)}</div>
          </div>
        </div>
      `;
    }
  }).join('');
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

// Modal handling
function openNewTaskModal() {
  const modal = document.getElementById('new-task-modal');
  if (modal) modal.style.display = 'flex';
}

function closeNewTaskModal() {
  const modal = document.getElementById('new-task-modal');
  if (modal) modal.style.display = 'none';
  
  // Reset form
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

// Drag and drop for agents
function initAgentDragDrop() {
  const agents = document.querySelectorAll('.agent-item');
  
  agents.forEach(agent => {
    agent.draggable = true;
    agent.style.cursor = 'grab';
    
    agent.addEventListener('dragstart', (e) => {
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
  // Initial fetch
  fetchTasks();
  fetchLiveFeed();
  
  // Poll for updates
  setInterval(() => {
    fetchTasks();
    fetchLiveFeed();
  }, 3000);
  
  // Set up drag and drop
  initAgentDragDrop();
  
  // New task button
  const newTaskBtn = document.querySelector('.btn.primary');
  if (newTaskBtn) {
    newTaskBtn.addEventListener('click', openNewTaskModal);
  }
  
  // Modal close handlers
  const closeBtn = document.querySelector('.modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeNewTaskModal);
  }
  
  const cancelBtn = document.querySelector('.btn-cancel');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeNewTaskModal);
  }
  
  const submitBtn = document.querySelector('.btn-submit');
  if (submitBtn) {
    submitBtn.addEventListener('click', submitNewTask);
  }
  
  // Click outside modal to close
  const modal = document.getElementById('new-task-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeNewTaskModal();
    });
  }
});
