import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

dotenv.config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.APP_URL}/api/auth/google/callback`;

const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'snhu-compass-secret-key';
const db = new Database('database.sqlite');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    avatar TEXT,
    theme TEXT DEFAULT 'light',
    ai_personalization TEXT,
    ai_knowledge_base TEXT,
    ai_memory TEXT,
    ai_voice TEXT DEFAULT 'Kore',
    birthday TEXT
  );

  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    term_start_date TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    title TEXT NOT NULL,
    due_date TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    estimated_hours REAL NOT NULL,
    completed_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS user_tokens (
    user_id TEXT PRIMARY KEY,
    google_access_token TEXT,
    google_refresh_token TEXT,
    google_expiry_date INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Migrations
try {
  db.prepare('ALTER TABLE courses ADD COLUMN term_start_date TEXT').run();
} catch (e) {}

try {
  db.prepare('ALTER TABLE users ADD COLUMN ai_personalization TEXT').run();
} catch (e) {}

try {
  db.prepare('ALTER TABLE users ADD COLUMN ai_knowledge_base TEXT').run();
} catch (e) {}

try {
  db.prepare('ALTER TABLE users ADD COLUMN ai_memory TEXT').run();
} catch (e) {}

try {
  db.prepare('ALTER TABLE users ADD COLUMN avatar TEXT').run();
} catch (e) {}

try {
  db.prepare('ALTER TABLE users ADD COLUMN theme TEXT DEFAULT "light"').run();
} catch (e) {}

try {
  db.prepare('ALTER TABLE users ADD COLUMN ai_voice TEXT DEFAULT "Kore"').run();
} catch (e) {}

try {
  db.prepare('ALTER TABLE users ADD COLUMN birthday TEXT').run();
} catch (e) {}

try {
  db.prepare('ALTER TABLE assignments ADD COLUMN completed_at TEXT').run();
} catch (e) {}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: 'Forbidden' });
      req.user = user;
      next();
    });
  };

  // Google OAuth Routes
  app.get('/api/auth/google/url', (req, res) => {
    const { userId } = req.query;
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/tasks.readonly',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      state: userId as string,
    });
    res.json({ url: authUrl });
  });

  app.get('/api/auth/google/callback', async (req, res) => {
    const { code, state } = req.query;
    const userId = state as string;
    try {
      const { tokens } = await oauth2Client.getToken(code as string);
      
      // Store tokens in database
      db.prepare(`
        INSERT OR REPLACE INTO user_tokens (user_id, google_access_token, google_refresh_token, google_expiry_date)
        VALUES (?, ?, ?, ?)
      `).run(userId, tokens.access_token, tokens.refresh_token, tokens.expiry_date);

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      res.status(500).json({ error: 'Failed to authenticate' });
    }
  });

  // Helper to get authorized client
  const getAuthorizedClient = (userId: string) => {
    const tokenData: any = db.prepare('SELECT * FROM user_tokens WHERE user_id = ?').get(userId);
    if (!tokenData) throw new Error('No tokens found');
    
    const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    client.setCredentials({
      access_token: tokenData.google_access_token,
      refresh_token: tokenData.google_refresh_token,
      expiry_date: tokenData.google_expiry_date
    });
    return client;
  };

  app.get('/api/google/status', authenticateToken, (req: any, res) => {
    const tokenData = db.prepare('SELECT * FROM user_tokens WHERE user_id = ?').get(req.user.id);
    res.json({ connected: !!tokenData });
  });

  app.get('/api/google/calendar', authenticateToken, async (req: any, res) => {
    try {
      const client = getAuthorizedClient(req.user.id);
      const calendar = google.calendar({ version: 'v3', auth: client });
      
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      const events = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startOfMonth,
        timeMax: endOfMonth,
        singleEvents: true,
        orderBy: 'startTime',
      });
      res.json(events.data.items);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch calendar' });
    }
  });

  app.delete('/api/google/calendar/:eventId', authenticateToken, async (req: any, res) => {
    try {
      const client = getAuthorizedClient(req.user.id);
      const calendar = google.calendar({ version: 'v3', auth: client });
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: req.params.eventId,
      });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete calendar event' });
    }
  });

  app.get('/api/google/tasks', authenticateToken, async (req: any, res) => {
    try {
      const client = getAuthorizedClient(req.user.id);
      const tasks = google.tasks({ version: 'v1', auth: client });
      const taskList = await tasks.tasks.list({
        tasklist: '@default',
        showCompleted: false,
      });
      res.json(taskList.data.items);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  app.get('/api/google/drive', authenticateToken, async (req: any, res) => {
    try {
      const client = getAuthorizedClient(req.user.id);
      const drive = google.drive({ version: 'v3', auth: client });
      const files = await drive.files.list({
        pageSize: 5,
        fields: 'files(id, name, mimeType, webViewLink)',
        orderBy: 'modifiedTime desc',
      });
      res.json(files.data.files);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch drive files' });
    }
  });

  // Auth Routes
  app.post('/api/auth/register', async (req, res) => {
    const { email, password, name } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      db.prepare('INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)').run(id, email, hashedPassword, name);
      const token = jwt.sign({ id, email }, JWT_SECRET);
      res.json({ token, user: { id, email, name, theme: 'light' } });
    } catch (error) {
      res.status(400).json({ error: 'Email already exists' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        theme: user.theme,
        ai_personalization: user.ai_personalization,
        ai_knowledge_base: user.ai_knowledge_base,
        ai_memory: user.ai_memory,
        ai_voice: user.ai_voice,
        birthday: user.birthday
      } 
    });
  });

  app.get('/api/auth/me', authenticateToken, (req: any, res) => {
    const user: any = db.prepare('SELECT id, email, name, theme, ai_personalization, ai_knowledge_base, ai_memory, ai_voice, birthday FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });

  // User Settings Routes
  app.put('/api/user/settings', authenticateToken, (req: any, res) => {
    const { name, theme, ai_personalization, ai_knowledge_base, ai_memory, ai_voice, birthday } = req.body;
    db.prepare(`
      UPDATE users 
      SET name = ?, theme = ?, ai_personalization = ?, ai_knowledge_base = ?, ai_memory = ?, ai_voice = ?, birthday = ? 
      WHERE id = ?
    `).run(name, theme, ai_personalization, ai_knowledge_base, ai_memory, ai_voice, birthday, req.user.id);
    res.json({ success: true });
  });

  // Course Routes
  app.get('/api/courses', authenticateToken, (req: any, res) => {
    const courses = db.prepare('SELECT id, user_id, code, name, color, term_start_date as termStartDate FROM courses WHERE user_id = ?').all(req.user.id);
    res.json(courses);
  });

  app.post('/api/courses', authenticateToken, (req: any, res) => {
    const { id, code, name, color, termStartDate } = req.body;
    db.prepare('INSERT INTO courses (id, user_id, code, name, color, term_start_date) VALUES (?, ?, ?, ?, ?, ?)').run(id, req.user.id, code, name, color, termStartDate);
    res.json({ success: true });
  });

  app.delete('/api/courses/:id', authenticateToken, (req: any, res) => {
    db.prepare('DELETE FROM assignments WHERE course_id = ? AND user_id = ?').run(req.params.id, req.user.id);
    db.prepare('DELETE FROM courses WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ success: true });
  });

  // Assignment Routes
  app.get('/api/assignments', authenticateToken, (req: any, res) => {
    const assignments = db.prepare('SELECT * FROM assignments WHERE user_id = ?').all(req.user.id);
    res.json(assignments);
  });

  app.post('/api/assignments/bulk', authenticateToken, (req: any, res) => {
    const { assignments } = req.body;
    if (!Array.isArray(assignments)) return res.status(400).json({ error: 'Assignments must be an array' });

    const insert = db.prepare(`
      INSERT INTO assignments (id, user_id, course_id, title, due_date, type, status, estimated_hours) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((items) => {
      for (const item of items) {
        insert.run(
          item.id,
          req.user.id,
          item.course_id,
          item.title,
          item.due_date,
          item.type,
          item.status || 'todo',
          item.estimated_hours || 0
        );
      }
    });

    try {
      transaction(assignments);
      res.json({ success: true });
    } catch (error) {
      console.error('Bulk Insert Error:', error);
      res.status(500).json({ error: 'Failed to add assignments' });
    }
  });

  app.post('/api/assignments', authenticateToken, (req: any, res) => {
    const { id, course_id, title, due_date, type, status, estimated_hours } = req.body;
    db.prepare(`
      INSERT INTO assignments (id, user_id, course_id, title, due_date, type, status, estimated_hours) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user.id, course_id, title, due_date, type, status, estimated_hours);
    res.json({ success: true });
  });

  app.put('/api/assignments/:id', authenticateToken, (req: any, res) => {
    const { course_id, title, due_date, type, status, estimated_hours } = req.body;
    const completed_at = status === 'completed' ? new Date().toISOString() : null;
    db.prepare(`
      UPDATE assignments 
      SET course_id = ?, title = ?, due_date = ?, type = ?, status = ?, estimated_hours = ?, completed_at = ? 
      WHERE id = ? AND user_id = ?
    `).run(course_id, title, due_date, type, status, estimated_hours, completed_at, req.params.id, req.user.id);
    res.json({ success: true });
  });

  app.delete('/api/assignments/:id', authenticateToken, (req: any, res) => {
    db.prepare('DELETE FROM assignments WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ success: true });
  });

  // Chat Routes
  app.get('/api/chat/messages', authenticateToken, (req: any, res) => {
    const messages = db.prepare('SELECT id, role, content FROM chat_messages WHERE user_id = ? ORDER BY created_at ASC').all(req.user.id);
    res.json(messages);
  });

  app.post('/api/chat/messages', authenticateToken, (req: any, res) => {
    const { id, role, content } = req.body;
    db.prepare('INSERT INTO chat_messages (id, user_id, role, content) VALUES (?, ?, ?, ?)').run(id, req.user.id, role, content);
    res.json({ success: true });
  });

  app.delete('/api/chat/messages', authenticateToken, (req: any, res) => {
    db.prepare('DELETE FROM chat_messages WHERE user_id = ?').run(req.user.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(3000, '0.0.0.0', () => {
    console.log('Server running on http://localhost:3000');
  });
}

startServer();
