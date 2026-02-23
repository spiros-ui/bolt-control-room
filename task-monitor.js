#!/usr/bin/env node

/**
 * Task Monitor - Watches tasks.json and sends WhatsApp notifications on changes
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const TASKS_FILE = path.join(__dirname, 'tasks.json');
const LIVE_FEED_FILE = path.join(__dirname, 'live-feed.json');
const SPIROS_NUMBER = '+306974153431';

let lastTaskState = {};

function loadTasks() {
  if (!fs.existsSync(TASKS_FILE)) return { tasks: [] };
  return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
}

function addLiveEvent(event) {
  let feed = { events: [] };
  if (fs.existsSync(LIVE_FEED_FILE)) {
    feed = JSON.parse(fs.readFileSync(LIVE_FEED_FILE, 'utf8'));
  }
  
  feed.events.unshift({
    ...event,
    timestamp: new Date().toISOString(),
    id: Date.now() + Math.random()
  });
  
  if (feed.events.length > 200) feed.events = feed.events.slice(0, 200);
  fs.writeFileSync(LIVE_FEED_FILE, JSON.stringify(feed, null, 2));
}

function sendWhatsAppNotification(message) {
  console.log(`📱 Sending WhatsApp notification: ${message}`);
  
  // Don't use the message tool - just log to live feed
  // WhatsApp replies will be automatic in the main thread
  addLiveEvent({
    type: 'notification',
    source: 'system',
    message: `📱 ${message}`,
    targetUser: SPIROS_NUMBER
  });
}

function checkTaskChanges() {
  const data = loadTasks();
  const tasks = data.tasks || [];
  
  tasks.forEach(task => {
    const prevState = lastTaskState[task.id];
    
    if (!prevState) {
      // New task
      lastTaskState[task.id] = task;
      sendWhatsAppNotification(`✅ New task created: "${task.title}"`);
      addLiveEvent({
        type: 'task_created',
        source: 'system',
        taskId: task.id,
        message: `New task: "${task.title}"`,
        priority: task.priority
      });
      return;
    }
    
    // Check for status changes
    if (prevState.status !== task.status) {
      const statusEmoji = {
        inbox: '📥',
        assigned: '👤',
        'in-progress': '⚡',
        'in_progress': '⚡',
        done: '✅'
      };
      
      sendWhatsAppNotification(
        `${statusEmoji[task.status] || '📌'} Task "${task.title}" → ${task.status.toUpperCase()}`
      );
      
      addLiveEvent({
        type: 'task_status_changed',
        source: 'system',
        taskId: task.id,
        message: `"${task.title}" → ${task.status}`,
        oldStatus: prevState.status,
        newStatus: task.status,
        agent: task.assignedAgent
      });
    }
    
    // Check for agent assignment
    if (prevState.assignedAgent !== task.assignedAgent && task.assignedAgent) {
      sendWhatsAppNotification(
        `👤 Task "${task.title}" assigned to ${task.assignedAgent}`
      );
      
      addLiveEvent({
        type: 'task_assigned',
        source: 'system',
        taskId: task.id,
        message: `"${task.title}" assigned to ${task.assignedAgent}`,
        agent: task.assignedAgent
      });
    }
    
    // Update state
    lastTaskState[task.id] = { ...task };
  });
  
  // Clean up deleted tasks
  Object.keys(lastTaskState).forEach(taskId => {
    if (!tasks.find(t => t.id === taskId)) {
      delete lastTaskState[taskId];
      addLiveEvent({
        type: 'task_deleted',
        source: 'system',
        taskId,
        message: `Task deleted: ${taskId}`
      });
    }
  });
}

// Initialize state
const initialData = loadTasks();
initialData.tasks.forEach(task => {
  lastTaskState[task.id] = task;
});

console.log('📊 Task monitor started');
console.log(`👀 Watching: ${TASKS_FILE}`);

// Watch for changes
fs.watch(TASKS_FILE, (eventType) => {
  if (eventType === 'change') {
    setTimeout(checkTaskChanges, 100); // Debounce
  }
});

// Keep alive
setInterval(() => {
  // Heartbeat
}, 60000);
