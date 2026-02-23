#!/usr/bin/env node

/**
 * Chat Logger - Captures WhatsApp conversations and logs to live feed
 * Reads from OpenClaw session transcripts
 */

const fs = require('fs');
const path = require('path');

const LIVE_FEED_FILE = path.join(__dirname, 'live-feed.json');
const SESSION_TRANSCRIPTS_DIR = path.join(process.env.HOME, '.openclaw', 'agents', 'main', 'transcripts');

function addLiveEvent(event) {
  let feed = { events: [] };
  if (fs.existsSync(LIVE_FEED_FILE)) {
    feed = JSON.parse(fs.readFileSync(LIVE_FEED_FILE, 'utf8'));
  }
  
  feed.events.unshift({
    ...event,
    timestamp: event.timestamp || new Date().toISOString(),
    id: Date.now() + Math.random()
  });
  
  if (feed.events.length > 200) feed.events = feed.events.slice(0, 200);
  fs.writeFileSync(LIVE_FEED_FILE, JSON.stringify(feed, null, 2));
}

// Log WhatsApp message to feed
function logWhatsAppMessage(from, message, isUser = true) {
  addLiveEvent({
    type: 'chat_message',
    source: isUser ? 'user' : 'bot',
    from: from === '+306974153431' ? 'Spiros' : from,
    message: message.substring(0, 200), // Truncate long messages
    channel: 'whatsapp'
  });
}

// Log agent communication
function logAgentMessage(agent, action, message) {
  addLiveEvent({
    type: 'agent_message',
    source: 'agent',
    agent,
    action,
    message
  });
}

// Log video downloads
function logVideoDownload(filename, size) {
  addLiveEvent({
    type: 'video_download',
    source: 'system',
    message: `Video downloaded: ${filename}`,
    filename,
    size
  });
}

module.exports = {
  logWhatsAppMessage,
  logAgentMessage,
  logVideoDownload,
  addLiveEvent
};

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'chat') {
    const [from, message] = args.slice(1);
    logWhatsAppMessage(from, message, true);
  } else if (command === 'agent') {
    const [agent, action, message] = args.slice(1);
    logAgentMessage(agent, action, message);
  } else if (command === 'video') {
    const [filename, size] = args.slice(1);
    logVideoDownload(filename, size);
  }
}
