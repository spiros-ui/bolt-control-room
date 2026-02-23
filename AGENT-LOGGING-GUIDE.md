# Agent Communication Logging Guide

## Overview
The Mission Control dashboard now displays agent-to-agent communication in real-time. When agents talk to each other, send tasks, share data, or take actions, it all shows up in the **LIVE** feed.

## What Gets Logged

### 1. Agent-to-Agent Messages
When one agent sends a message to another agent:
```javascript
logAgentMessage('Lead Gen Machine', 'Email Automation', 'Found 3 qualified leads - need nurture sequence');
```

**Displays as:**
```
🚀 Lead Gen Machine → 📧 Email Automation
Found 3 qualified leads - need nurture sequence
[MESSAGE]
```

### 2. Agent Actions
When an agent performs an action:
```javascript
logAgentAction('AI News Researcher', 'Scraped 12 stories', 'OpenClaw v2.7, Claude 4.6, Runway API updates');
```

**Displays as:**
```
📰 AI News Researcher
Scraped 12 stories
OpenClaw v2.7, Claude 4.6, Runway API updates
```

### 3. Communication Types
You can specify the type of communication:
- `message` - General message
- `task-assignment` - Assigning a task
- `status-update` - Reporting status
- `data-share` - Sharing data/results

```javascript
logAgentMessage('Google Ads Specialist', 'Reporting Agent', 'Campaign ready for report', 'status-update');
```

## How to Use

### From Command Line
```bash
# Log a message
node agent-logger.js message "From Agent" "To Agent" "Message text"

# Log an action
node agent-logger.js action "Agent Name" "Action Name" "Details"
```

### From Node.js Scripts
```javascript
const { logAgentMessage, logAgentAction } = require('./agent-logger');

// Log agent communication
logAgentMessage('Creative Designer', 'Twitter Bot', 'Generated 5 images for campaign');

// Log agent action
logAgentAction('Lead Gen Machine', 'Found 10 prospects', 'Florida dentists, $5K budget range');
```

### From Python Scripts
```python
import subprocess
import json

def log_agent_message(from_agent, to_agent, message):
    subprocess.run([
        'node',
        '/home/moltbot/.openclaw/workspace/mission-control/agent-logger.js',
        'message',
        from_agent,
        to_agent,
        message
    ])

def log_agent_action(agent, action, details):
    subprocess.run([
        'node',
        '/home/moltbot/.openclaw/workspace/mission-control/agent-logger.js',
        'action',
        agent,
        action,
        details
    ])
```

### From Shell Scripts
```bash
#!/bin/bash
LOGGER="/home/moltbot/.openclaw/workspace/mission-control/agent-logger.js"

# Log message
node $LOGGER message "Agent 1" "Agent 2" "Message content"

# Log action
node $LOGGER action "Agent Name" "Action" "Details"
```

## Integration Examples

### Agent 3: Lead Gen Machine
When sending emails:
```javascript
// After sending email
logAgentAction('Lead Gen Machine', 'Sent email', `To: ${prospect.email}, Subject: Google Ads Proposal`);

// When booking occurs
logAgentMessage('Lead Gen Machine', 'Bolt', `New booking: ${prospect.businessName} scheduled for consultation`);
```

### Agent 5: AI News Researcher
When scraping news:
```javascript
// Start scraping
logAgentAction('AI News Researcher', 'Starting news scrape', `Sources: ${sources.join(', ')}`);

// After scraping
logAgentMessage('AI News Researcher', 'Bolt', `Found ${stories.length} high-relevance stories - briefing sent`);
```

### Agent 11: Creative Designer
When generating videos:
```javascript
// Starting generation
logAgentAction('Creative Designer', 'Generating video', 'Maldives luxury resort promo, 32 seconds');

// When complete
logAgentMessage('Creative Designer', 'Bolt', `Video ready: maldives-promo.mp4 (30MB, $0.64 cost)`);
```

### Inter-Agent Workflows
Example: Lead Gen → Email → Reporting flow:
```javascript
// Lead Gen finds prospects
logAgentMessage('Lead Gen Machine', 'Email Automation', 'Found 5 qualified leads - starting sequence');

// Email Automation responds
logAgentMessage('Email Automation', 'Lead Gen Machine', 'Sequence initiated - first emails sent');

// Reporting tracks results
logAgentMessage('Email Automation', 'Reporting Agent', '5 emails sent, 2 opened, 1 clicked');
```

## Best Practices

### 1. Log Key Communications
Don't log every tiny detail, but do log:
- Task handoffs between agents
- Important results/findings
- Status updates
- Errors or issues
- Completions

### 2. Be Descriptive
❌ Bad: `logAgentMessage('A', 'B', 'Done')`  
✅ Good: `logAgentMessage('Lead Gen', 'Email', 'Generated 3 mockups for Florida dentists - ready for outreach')`

### 3. Use Communication Types
```javascript
logAgentMessage('Agent1', 'Agent2', 'Here is the data', 'data-share');
logAgentMessage('Agent1', 'Agent2', 'Please handle this task', 'task-assignment');
logAgentMessage('Agent1', 'Agent2', 'Task 50% complete', 'status-update');
```

### 4. Log Both Sides
When agents communicate, log both the request and response:
```javascript
// Request
logAgentMessage('Bolt', 'Lead Gen', 'Find 10 prospects in Miami');

// Response (later)
logAgentMessage('Lead Gen', 'Bolt', 'Found 10 prospects - mockups generated');
```

## Dashboard Display

### Communication Events
Shown with purple gradient background and left border:
- From agent → To agent (with emojis)
- Message content
- Communication type badge

### Action Events
Shown with green gradient background and left border:
- Agent name with emoji
- Action name (bold)
- Details (smaller text)

### Regular Events
Standard format (backwards compatible):
- Agent name
- Message
- Timestamp

## Live Feed Polling

The dashboard polls the live feed every **3 seconds** to show real-time updates. When agents communicate, it appears instantly (within 3 seconds).

## Future Enhancements

- [ ] Filter feed by agent
- [ ] Filter feed by communication type
- [ ] Search/filter messages
- [ ] Export feed to CSV
- [ ] WebSocket for instant updates (no polling)
- [ ] Agent conversation threads
- [ ] Message threading (show related messages grouped)

## Files

- `/mission-control/agent-logger.js` - Logging utility
- `/mission-control/live-feed.json` - Feed data (auto-updated)
- `/mission-control/mission-control.js` - Frontend display logic
- `/mission-control/index.html` - Dashboard HTML + CSS

## Testing

Test the system:
```bash
cd /home/moltbot/.openclaw/workspace/mission-control

# Add test messages
node agent-logger.js message "Test Agent 1" "Test Agent 2" "Hello from agent 1"
node agent-logger.js message "Test Agent 2" "Test Agent 1" "Reply from agent 2"
node agent-logger.js action "Test Agent 1" "Completed task" "Test action with details"

# View in browser
# http://138.68.161.145:8086
# Scroll to LIVE section on the right
```

## Status

✅ **READY FOR PRODUCTION**

All agents should now integrate this logging to provide full transparency into the multi-agent system operations.

---

**Last Updated:** 2026-02-19 06:35 UTC  
**Author:** Bolt
