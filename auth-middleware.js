/**
 * Simple passcode authentication middleware
 */

const PASSCODE = process.env.PASSCODE || 'spiros';

function checkAuth(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // Check if already authenticated via cookie
  const cookies = parseCookies(req.headers.cookie || '');
  if (cookies.auth === PASSCODE) {
    return true;
  }
  
  // Check if passcode provided in query
  const providedPasscode = url.searchParams.get('passcode');
  if (providedPasscode === PASSCODE) {
    // Set cookie for future requests
    res.setHeader('Set-Cookie', `auth=${PASSCODE}; Path=/; Max-Age=86400; SameSite=Strict`);
    return true;
  }
  
  return false;
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    cookies[parts[0].trim()] = parts[1]?.trim() || '';
  });
  
  return cookies;
}

function sendAuthPage(res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bolt's Control Room - Login</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #e2e8f0;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .login-box {
      background: #1e293b;
      padding: 3rem;
      border-radius: 15px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
      max-width: 400px;
      width: 90%;
      text-align: center;
    }
    h1 {
      color: #60a5fa;
      margin-bottom: 0.5rem;
      font-size: 2rem;
    }
    p {
      color: #94a3b8;
      margin-bottom: 2rem;
    }
    input {
      width: 100%;
      padding: 1rem;
      font-size: 1rem;
      background: #0f172a;
      border: 2px solid #334155;
      border-radius: 8px;
      color: #e2e8f0;
      margin-bottom: 1.5rem;
      transition: border-color 0.3s;
    }
    input:focus {
      outline: none;
      border-color: #60a5fa;
    }
    button {
      width: 100%;
      padding: 1rem;
      font-size: 1rem;
      font-weight: 600;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.3s;
    }
    button:hover {
      background: #2563eb;
    }
    .error {
      color: #ef4444;
      margin-top: 1rem;
      display: none;
    }
  </style>
</head>
<body>
  <div class="login-box">
    <h1>⚡ Bolt's Control Room</h1>
    <p>Enter passcode to access</p>
    <form id="loginForm">
      <input 
        type="password" 
        id="passcode" 
        placeholder="Enter passcode"
        autocomplete="off"
        autofocus
      />
      <button type="submit">Access Control Room</button>
      <div class="error" id="error">Incorrect passcode</div>
    </form>
  </div>
  
  <script>
    document.getElementById('loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const passcode = document.getElementById('passcode').value;
      window.location.href = '/?passcode=' + encodeURIComponent(passcode);
    });
    
    // Check if redirected due to wrong passcode
    if (window.location.search.includes('error=auth')) {
      document.getElementById('error').style.display = 'block';
    }
  </script>
</body>
</html>
  `);
}

module.exports = { checkAuth, sendAuthPage };
