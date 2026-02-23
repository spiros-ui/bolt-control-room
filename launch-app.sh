#!/bin/bash

# Bolt's Control Room App Launcher
# Launches the Control Room as a standalone app window

PORT=8086
URL="http://138.68.161.145:${PORT}/app.html"

echo "🚀 Launching Bolt's Control Room..."

# Check if server is running
if ! curl -s http://138.68.161.145:${PORT}/ > /dev/null 2>&1; then
    echo "⚠️  Control Room server not running. Starting..."
    cd /home/moltbot/.openclaw/workspace/mission-control
    node server.js > server.log 2>&1 &
    sleep 2
fi

# Try different methods to launch as standalone app
if command -v google-chrome &> /dev/null; then
    echo "📱 Opening with Chrome (App Mode)..."
    google-chrome --app=$URL --window-size=1200,800 &
elif command -v chromium-browser &> /dev/null; then
    echo "📱 Opening with Chromium (App Mode)..."
    chromium-browser --app=$URL --window-size=1200,800 &
elif command -v firefox &> /dev/null; then
    echo "📱 Opening with Firefox..."
    firefox --new-window $URL &
else
    echo "📱 Opening in default browser..."
    xdg-open $URL || open $URL
fi

echo "✅ Control Room launched!"
echo "📊 Access at: $URL"
echo ""
echo "💡 To install as an app:"
echo "   Mobile: Tap 'Add to Home Screen' in browser menu"
echo "   Desktop: Click install icon in address bar"
