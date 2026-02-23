#!/usr/bin/env node

/**
 * Mission Control Task Management Server
 * Handles task creation, assignment, execution, and real-time updates
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { checkAuth, sendAuthPage } = require('./auth-middleware');

const PORT = process.env.PORT || 8086;
const TASKS_FILE = path.join(__dirname, 'tasks.json');
const LIVE_FEED_FILE = path.join(__dirname, 'live-feed.json');
const COST_DATA_FILE = path.join(__dirname, 'cost-tracking-data.json');
const LEAD_GEN_FILE = path.join(__dirname, 'lead-gen-data.json');

// Initialize files
if (!fs.existsSync(TASKS_FILE)) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify({ tasks: [], lastUpdated: new Date().toISOString() }));
}
if (!fs.existsSync(LIVE_FEED_FILE)) {
  fs.writeFileSync(LIVE_FEED_FILE, JSON.stringify({ events: [] }));
}

// Task management functions
function getTasks() {
  return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
}

function saveTasks(data) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(data, null, 2));
}

function getLiveFeed() {
  return JSON.parse(fs.readFileSync(LIVE_FEED_FILE, 'utf8'));
}

function addLiveEvent(event) {
  const feed = getLiveFeed();
  feed.events.unshift({
    ...event,
    timestamp: new Date().toISOString(),
    id: Date.now() + Math.random()
  });
  // Keep only last 100 events
  if (feed.events.length > 100) feed.events = feed.events.slice(0, 100);
  fs.writeFileSync(LIVE_FEED_FILE, JSON.stringify(feed, null, 2));
}

function createTask(title, description, priority = "medium", tags = [], recurring = false) {
  const data = getTasks();
  const task = {
    id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    title,
    description,
    status: 'inbox',
    priority,
    tags,
    assignedAgent: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    recurring,
    progress: 0,
    result: null
  };
  data.tasks.push(task);
  data.lastUpdated = new Date().toISOString();
  saveTasks(data);
  
  addLiveEvent({
    agent: 'System',
    action: 'Task created',
    message: `New task: "${title}"`,
    taskId: task.id
  });
  
  return task;
}

function assignAgent(taskId, agentName) {
  const data = getTasks();
  const task = data.tasks.find(t => t.id === taskId);
  if (!task) return null;
  
  task.assignedAgent = agentName;
  task.status = 'assigned';
  task.updatedAt = new Date().toISOString();
  saveTasks(data);
  
  addLiveEvent({
    agent: agentName,
    action: 'Task assigned',
    message: `Assigned to: "${task.title}"`,
    taskId: task.id
  });
  
  return task;
}

function updateTaskStatus(taskId, status, progress = null, result = null) {
  const data = getTasks();
  const task = data.tasks.find(t => t.id === taskId);
  if (!task) return null;
  
  task.status = status;
  if (progress !== null) task.progress = progress;
  if (result !== null) task.result = result;
  task.updatedAt = new Date().toISOString();
  saveTasks(data);
  
  addLiveEvent({
    agent: task.assignedAgent || 'System',
    action: `Status: ${status}`,
    message: `"${task.title}" → ${status} ${progress !== null ? `(${progress}%)` : ''}`,
    taskId: task.id
  });
  
  return task;
}

// Cost tracking functions
function getCostData() {
  if (!fs.existsSync(COST_DATA_FILE)) {
    return {
      agents: [
        { id: 1, name: 'AdWords Pro', fullName: 'Google Ads Specialist', model: 'claude-code', status: 'building', totalCalls: 0, totalCost: 0, tasksCompleted: 0 },
        { id: 2, name: 'Meta Maven', fullName: 'Meta Ads Specialist', model: 'claude-code', status: 'building', totalCalls: 0, totalCost: 0, tasksCompleted: 0 },
        { id: 3, name: 'Lead Hunter', fullName: 'Lead Gen Machine', model: 'claude-code', status: 'active', totalCalls: 12, totalCost: 0.024, tasksCompleted: 5 },
        { id: 5, name: 'News Scout', fullName: 'AI News Researcher', model: 'claude-code', status: 'active', totalCalls: 8, totalCost: 0.016, tasksCompleted: 3 },
        { id: 10, name: 'Inbox Ninja', fullName: 'Inbox Whisperer', model: 'sonnet', status: 'building', totalCalls: 0, totalCost: 0, tasksCompleted: 0 },
        { id: 11, name: 'Video Wizard', fullName: 'Creative Designer', model: 'runway', status: 'active', totalCalls: 13, totalCost: 1.04, tasksCompleted: 2 }
      ],
      usage: [
        { date: '2026-02-19', agent: 'Video Wizard', task: 'Maldives 32-second video', model: 'runway-veo3.1_fast', calls: 8, cost: 0.64, timestamp: '2026-02-19T05:28:00.000Z' },
        { date: '2026-02-19', agent: 'Video Wizard', task: 'ClickThrive 20-second promo', model: 'runway-veo3.1_fast', calls: 5, cost: 0.40, timestamp: '2026-02-19T20:41:00.000Z' },
        { date: '2026-02-19', agent: 'Lead Hunter', task: 'Miami dentist campaigns (5 emails)', model: 'claude-code', calls: 12, cost: 0.024, timestamp: '2026-02-19T07:42:00.000Z' },
        { date: '2026-02-19', agent: 'News Scout', task: 'Morning AI briefing', model: 'claude-code', calls: 8, cost: 0.016, timestamp: '2026-02-19T04:30:00.000Z' }
      ],
      totals: { totalCost: 1.12, totalCalls: 33, totalTasks: 10, avgCostPerTask: 0.112, todayCost: 1.12, monthCost: 1.12 },
      lastUpdated: new Date().toISOString()
    };
  }
  return JSON.parse(fs.readFileSync(COST_DATA_FILE, 'utf8'));
}

function saveCostData(data) {
  fs.writeFileSync(COST_DATA_FILE, JSON.stringify(data, null, 2));
}

// HTTP Server
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Cache-busting headers
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Authentication check for HTML pages (skip for API endpoints and static assets)
  if (!url.pathname.startsWith('/api/') && !url.pathname.match(/\.(js|css|json|png|jpg|mp4)$/)) {
    if (!checkAuth(req, res)) {
      sendAuthPage(res);
      return;
    }
  }
  
  // API Routes - Tasks
  if (url.pathname === '/api/tasks' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getTasks()));
    return;
  }
  
  if (url.pathname === '/api/tasks' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { title, description, priority, tags, recurring } = JSON.parse(body);
        const task = createTask(title, description, priority, tags, recurring);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, task }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }
  
  if (url.pathname.startsWith('/api/tasks/') && req.method === 'PUT') {
    const taskId = url.pathname.split('/')[3];
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const updates = JSON.parse(body);
        let task = null;
        
        if (updates.assignedAgent !== undefined) {
          task = assignAgent(taskId, updates.assignedAgent);
        }
        if (updates.status !== undefined) {
          task = updateTaskStatus(taskId, updates.status, updates.progress, updates.result);
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, task }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }
  
  
  if (url.pathname.startsWith('/api/tasks/') && req.method === 'DELETE') {
    const taskId = url.pathname.split('/')[3];
    try {
      const data = getTasks();
      const taskIndex = data.tasks.findIndex(t => t.id === taskId);
      
      if (taskIndex === -1) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Task not found' }));
        return;
      }
      
      const deletedTask = data.tasks[taskIndex];
      data.tasks.splice(taskIndex, 1);
      data.lastUpdated = new Date().toISOString();
      saveTasks(data);
      
      addLiveEvent({
        agent: 'System',
        action: 'Task deleted',
        message: `Deleted: "${deletedTask.title}"`,
        taskId: taskId
      });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }
  if (url.pathname === '/api/live-feed' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getLiveFeed()));
    return;
  }
  
  // API Routes - Cost Tracking
  if (url.pathname === '/api/cost-tracking' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getCostData()));
    return;
  }
  
  if (url.pathname === '/api/agent-model' && req.method === 'PUT') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { agentId, model } = JSON.parse(body);
        
        // Update cost tracking data
        const costData = getCostData();
        const agent = costData.agents.find(a => a.id === agentId);
        if (!agent) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Agent not found' }));
          return;
        }
        
        agent.model = model;
        saveCostData(costData);
        
        // Update agent models config
        const modelsConfigPath = path.join(__dirname, 'agent-models.json');
        let modelsConfig = { agents: {} };
        if (fs.existsSync(modelsConfigPath)) {
          modelsConfig = JSON.parse(fs.readFileSync(modelsConfigPath, 'utf8'));
        }
        
        const agentKey = String(agentId);
        if (modelsConfig.agents[agentKey]) {
          modelsConfig.agents[agentKey].model = model;
          
          // If agent uses LLM and has a cron job, update the cron job
          if (modelsConfig.agents[agentKey].usesLLM && modelsConfig.agents[agentKey].cronJobId) {
            const cronJobId = modelsConfig.agents[agentKey].cronJobId;
            
            // Update cron job payload with new model via file-based approach
            const modelAlias = modelsConfig.modelAliases[model] || model;
            const cronListCmd = `openclaw cron list --json`;
            
            exec(cronListCmd, (listErr, listStdout, listStderr) => {
              if (listErr) {
                console.error(`⚠️ Failed to list cron jobs:`, listErr.message);
                return;
              }
              
              try {
                const cronJobs = JSON.parse(listStdout);
                const targetJob = cronJobs.jobs?.find(j => j.id === cronJobId);
                
                if (targetJob && targetJob.payload) {
                  // Add model to payload
                  targetJob.payload.model = modelAlias;
                  
                  // Write patch to temp file
                  const tempPatchFile = path.join(__dirname, `temp-patch-${cronJobId}.json`);
                  fs.writeFileSync(tempPatchFile, JSON.stringify({ payload: targetJob.payload }, null, 2));
                  
                  const updateCmd = `openclaw cron update ${cronJobId} --patch-file="${tempPatchFile}"`;
                  
                  exec(updateCmd, (err, stdout, stderr) => {
                    // Clean up temp file
                    if (fs.existsSync(tempPatchFile)) {
                      fs.unlinkSync(tempPatchFile);
                    }
                    
                    if (err) {
                      console.error(`⚠️ Failed to update cron job ${cronJobId}:`, stderr || err.message);
                      addLiveEvent({
                        agent: 'System',
                        action: 'Model switch warning',
                        message: `Model updated in config but cron job update failed for ${agent.name}`
                      });
                    } else {
                      console.log(`✅ Updated cron job ${cronJobId} to use ${modelAlias}`);
                      addLiveEvent({
                        agent: 'System',
                        action: 'Model switched',
                        message: `${agent.name} now uses ${model} (cron job updated)`
                      });
                    }
                  });
                }
              } catch (parseErr) {
                console.error(`⚠️ Failed to parse cron jobs:`, parseErr.message);
              }
            });
          } else {
            addLiveEvent({
              agent: 'System',
              action: 'Model switched',
              message: `${agent.name} model preference set to ${model}`
            });
          }
          
          fs.writeFileSync(modelsConfigPath, JSON.stringify(modelsConfig, null, 2));
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          agent,
          message: `Model switched to ${model}. ${modelsConfig.agents[agentKey]?.usesLLM ? 'Will take effect on next agent run.' : 'Note: This agent uses external APIs, not LLM.'}` 
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }
  

  // Lead Gen API endpoints
  if (url.pathname === '/lead-gen-data.json' && req.method === 'GET') {
    if (!fs.existsSync(LEAD_GEN_FILE)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify([]));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(fs.readFileSync(LEAD_GEN_FILE, 'utf8'));
    return;
  }

  if (url.pathname === '/api/lead-gen/update' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { email, status, lastContact } = JSON.parse(body);
        
        let leads = [];
        if (fs.existsSync(LEAD_GEN_FILE)) {
          leads = JSON.parse(fs.readFileSync(LEAD_GEN_FILE, 'utf8'));
        }
        
        const lead = leads.find(l => l.email === email);
        if (lead) {
          lead.status = status;
          lead.lastContact = lastContact;
          fs.writeFileSync(LEAD_GEN_FILE, JSON.stringify(leads, null, 2));
          
          addLiveEvent({
            type: 'lead_update',
            source: 'Lead Hunter',
            message: `${lead.businessName || lead.firstName}: ${status}`,
            email: email.split('@')[0] + '@***'
          });
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Newsletter subscription endpoint
  if (url.pathname === '/api/newsletter-subscribe' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { email } = JSON.parse(body);
        
        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid email' }));
          return;
        }
        
        // Save subscriber
        const subscribersFile = path.join(__dirname, 'newsletter-subscribers.json');
        let data = { subscribers: [], lastUpdated: null };
        if (fs.existsSync(subscribersFile)) {
          data = JSON.parse(fs.readFileSync(subscribersFile, 'utf8'));
        }
        
        // Check if already subscribed
        if (data.subscribers.find(s => s.email === email)) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Already subscribed' }));
          return;
        }
        
        // Add subscriber
        data.subscribers.push({
          email,
          subscribedAt: new Date().toISOString(),
          source: 'youtube_landing',
          confirmed: false
        });
        data.lastUpdated = new Date().toISOString();
        
        fs.writeFileSync(subscribersFile, JSON.stringify(data, null, 2));
        
        // Log to live feed
        addLiveEvent({
          type: 'newsletter_signup',
          source: 'system',
          message: `New newsletter subscriber: ${email}`,
          email: email.split('@')[0] + '@***'  // Anonymize in logs
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Subscribed successfully' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Static file serving
  let filePath;
  if (url.pathname.startsWith('/agents/')) {
    // Serve from workspace agents directory
    filePath = path.join(__dirname, '..', url.pathname);
  } else {
    filePath = path.join(__dirname, url.pathname === '/' ? 'index.html' : url.pathname);
  }
  
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  
  const ext = path.extname(filePath);
  const contentTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.mp4': 'video/mp4',
    '.jpg': 'image/jpeg',
    '.png': 'image/png'
  };
  
  res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Mission Control server running on http://localhost:${PORT}`);
  console.log(`📊 Task API: http://localhost:${PORT}/api/tasks`);
  console.log(`📡 Live Feed: http://localhost:${PORT}/api/live-feed`);
  console.log(`💰 Cost Tracking: http://localhost:${PORT}/api/cost-tracking`);
});
