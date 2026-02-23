#!/usr/bin/env node

/**
 * Agent Communication Logger
 * Logs agent-to-agent messages and actions to Mission Control live feed
 */

const fs = require('fs');
const path = require('path');

const LIVE_FEED_FILE = path.join(__dirname, 'live-feed.json');

function logAgentMessage(fromAgent, toAgent, message, type = 'message') {
  const feed = JSON.parse(fs.readFileSync(LIVE_FEED_FILE, 'utf8'));
  
  const event = {
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    type: 'agent-communication',
    fromAgent,
    toAgent,
    message,
    communicationType: type, // 'message', 'task-assignment', 'status-update', 'data-share'
    agent: fromAgent // For backwards compatibility with existing feed
  };
  
  feed.events.unshift(event);
  
  // Keep only last 100 events
  if (feed.events.length > 100) {
    feed.events = feed.events.slice(0, 100);
  }
  
  fs.writeFileSync(LIVE_FEED_FILE, JSON.stringify(feed, null, 2));
}

function logAgentAction(agent, action, details) {
  const feed = JSON.parse(fs.readFileSync(LIVE_FEED_FILE, 'utf8'));
  
  const event = {
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    type: 'agent-action',
    agent,
    action,
    details,
    message: `${action}: ${details}`
  };
  
  feed.events.unshift(event);
  
  if (feed.events.length > 100) {
    feed.events = feed.events.slice(0, 100);
  }
  
  fs.writeFileSync(LIVE_FEED_FILE, JSON.stringify(feed, null, 2));
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'message') {
    const [, fromAgent, toAgent, message] = args;
    logAgentMessage(fromAgent, toAgent, message);
    console.log(`✅ Logged: ${fromAgent} → ${toAgent}: ${message}`);
  } else if (command === 'action') {
    const [, agent, action, details] = args;
    logAgentAction(agent, action, details);
    console.log(`✅ Logged: ${agent} - ${action}`);
  } else {
    console.log('Usage:');
    console.log('  node agent-logger.js message <from> <to> <message>');
    console.log('  node agent-logger.js action <agent> <action> <details>');
  }
}

module.exports = { logAgentMessage, logAgentAction };
