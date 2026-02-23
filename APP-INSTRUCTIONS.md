# Bolt's Control Room - Standalone App

Real-time AI operations dashboard that can be installed as a native-like app on any device.

## 🚀 Quick Access

**Web URL:** http://138.68.161.145:8086/app.html

Open this URL on any device with internet access.

---

## 📱 Install on Mobile (iOS/Android)

### iPhone/iPad:
1. Open Safari and go to: http://138.68.161.145:8086/app.html
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **"Add"**
5. App icon appears on home screen!

### Android:
1. Open Chrome and go to: http://138.68.161.145:8086/app.html
2. Tap the **three dots** menu (⋮)
3. Tap **"Add to Home screen"** or **"Install app"**
4. Tap **"Install"**
5. App icon appears on home screen!

---

## 💻 Install on Desktop

### Chrome/Edge/Brave:
1. Open browser and go to: http://138.68.161.145:8086/app.html
2. Look for the **install icon** (➕) in the address bar
3. Click it and select **"Install"**
4. App opens in its own window!

### Firefox:
1. Go to: http://138.68.161.145:8086/app.html
2. Bookmark the page for quick access
3. Or use the launcher script below

---

## 🖥️ Linux/Mac Launch Script

Run the included launcher:

```bash
cd /home/moltbot/.openclaw/workspace/mission-control
./launch-app.sh
```

This will:
- Check if server is running (start it if not)
- Open Control Room in app mode (Chrome/Chromium)
- Or open in default browser

---

## ✨ Features

- **Real-time updates** - Live feed refreshes every 2 seconds
- **Full dashboard access** - All Control Room features
- **Works offline** - Shows cached data when connection lost
- **Status indicator** - Green = connected, Red = offline
- **Quick refresh** - Manual refresh button always available
- **Native-like** - Looks and feels like a native app

---

## 🔧 Technical Details

**App Type:** Progressive Web App (PWA)
**Backend:** Node.js server on port 8086
**Frontend:** Embedded iframe with real-time dashboard
**Connection:** Checks server status every 30 seconds
**Manifest:** Supports "Add to Home Screen" on all platforms

---

## 📊 What You Can See

- **Stats** - Total tasks, agents, completed, costs
- **Active Agents** - All 7 agents with model selection
- **Task Pipeline** - Inbox → Assigned → In Progress → Completed
- **Creative Assets** - Videos with download buttons
- **Cost Analysis** - Per-agent and per-task breakdown
- **Live Activity Feed** - Real-time updates on all actions

---

## 🆘 Troubleshooting

**"Offline" status showing:**
- Check internet connection
- Verify server is running: `ps aux | grep "node.*server.js"`
- Restart server: `cd /home/moltbot/.openclaw/workspace/mission-control && node server.js &`

**App not installing:**
- Some browsers block PWA installs from HTTP (need HTTPS)
- Use "Add to Home Screen" method instead
- Or bookmark the page for quick access

**Blank screen:**
- Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- Clear browser cache
- Check if http://138.68.161.145:8086/ is accessible

---

## 🔄 Auto-Updates

- Dashboard refreshes data every 30 seconds
- Live feed updates every 2 seconds
- Connection status checked continuously
- No manual refresh needed (but button available)

---

## 🎯 Best Practices

1. **Install on all your devices** - Access from anywhere
2. **Keep it open** - Background updates keep you informed
3. **Use quick refresh** - If you need immediate update
4. **Check status indicator** - Ensure you're connected
5. **Monitor live feed** - See all system activity in real-time

---

**Built by Bolt ⚡ for Spiros**
