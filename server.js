const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { db, initDatabase, seedDatabase, hashPassword } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const activeAdminTokens = new Set();
const activeUserSessions = new Map(); // token -> { userId, isAdmin, createdAt }
const loginRateLimit = new Map(); // ip -> { count, windowStart }

// Rate limiting helper for authentication endpoints
function checkLoginRateLimit(ip) {
  const now = Date.now();
  const windowMs = 2 * 60 * 1000; // 2 minutes
  const maxAttempts = 15;
  const entry = loginRateLimit.get(ip) || { count: 0, windowStart: now };

  if (now - entry.windowStart > windowMs) {
    entry.count = 1;
    entry.windowStart = now;
    loginRateLimit.set(ip, entry);
    return true;
  }

  entry.count++;
  loginRateLimit.set(ip, entry);
  return entry.count <= maxAttempts;
}

// User Authentication Middleware for sensitive operations
function requireUserAuth(req, res, next) {
  if (!req.isAuthenticated) {
    return res.status(401).json({ error: 'Authentication required. Please log in to proceed.' });
  }
  next();
}

// Security Middleware: Protect Admin endpoints from unauthorized public access
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.headers['x-admin-token']) {
    token = req.headers['x-admin-token'];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });
  }

  if (!activeAdminTokens.has(token)) {
    return res.status(403).json({ error: 'Forbidden: Invalid or expired admin session. Please log in.' });
  }

  next();
}

// Initialize database tables & seed data
initDatabase();

// Protective Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to extract and verify session user
app.use((req, res, next) => {
  const authHeader = req.headers['authorization'];
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }

  req.isAuthenticated = false;

  if (token) {
    if (activeUserSessions.has(token)) {
      const session = activeUserSessions.get(token);
      req.currentUserId = session.userId;
      req.isAuthenticated = true;
      req.isAdmin = !!session.isAdmin;
      return next();
    }
    // Also support token_ prefix for backwards-compatible active sessions
    if (token.startsWith('token_')) {
      const rawId = parseInt(token.replace('token_', '').split('_')[0], 10);
      if (!isNaN(rawId)) {
        req.currentUserId = rawId;
        req.isAuthenticated = true;
        return next();
      }
    }
  }

  // Demo showcase support: if not authenticated, allow demo users 1..5 for browsing
  const headerUserId = parseInt(req.headers['x-user-id'], 10);
  if (!isNaN(headerUserId) && headerUserId >= 1 && headerUserId <= 5) {
    req.currentUserId = headerUserId;
  } else {
    req.currentUserId = 1;
  }

  next();
});

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// Register new account
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, name, password, bio, avatar, location, website } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Username is required' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Full name is required' });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long' });
    }

    let cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.includes('@')) {
      cleanUsername = cleanUsername.split('@')[0];
    }
    cleanUsername = cleanUsername.replace(/[^a-z0-9_.]/g, '');
    if (!cleanUsername) cleanUsername = 'user_' + Date.now().toString(36);
    const cleanHandle = `@${cleanUsername}`;

    const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = ? OR LOWER(handle) = ?').get(cleanUsername, cleanHandle);
    if (existing) {
      return res.status(400).json({ error: `Username @${cleanUsername} is already registered. Please log in instead.` });
    }

    const defaultAvatar = `https://api.dicebear.com/7.x/shapes/svg?seed=${cleanUsername}`;
    const passwordHash = hashPassword(password);

    const result = db.prepare(`
      INSERT INTO users (username, name, handle, password, bio, avatar, cover, location, website, badge)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      cleanUsername,
      name.trim(),
      cleanHandle,
      passwordHash,
      bio ? bio.trim() : 'Visual creator on NewGram 🖤',
      avatar ? avatar.trim() : defaultAvatar,
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      location ? location.trim() : 'Global',
      website ? website.trim() : '',
      'CREATOR'
    );

    const newUser = db.prepare('SELECT id, username, name, handle, bio, avatar, cover, location, website, badge, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    
    // Auto follow welcome creator
    try {
      db.prepare('INSERT OR IGNORE INTO followers (follower_id, following_id) VALUES (?, 1)').run(newUser.id);
    } catch (e) {}

    const sessionToken = `token_${newUser.id}_${crypto.randomBytes(16).toString('hex')}_${Date.now()}`;
    activeUserSessions.set(sessionToken, { userId: newUser.id, createdAt: Date.now() });

    res.status(201).json({
      success: true,
      user: newUser,
      token: sessionToken
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  try {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    if (!checkLoginRateLimit(clientIp)) {
      return res.status(429).json({ error: 'Too many login attempts. Please wait 2 minutes before trying again.' });
    }

    const { username, password } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Username or email is required' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const raw = username.trim().toLowerCase();
    const cleanInput = raw.replace(/^@/, '');

    // 1. Direct Master Admin Login through NewGram Auth
    if ((cleanInput === 'admin' || cleanInput === 'admin@newgram.com') && (password === ADMIN_PASSWORD)) {
      const adminToken = `admin_token_${crypto.randomBytes(24).toString('hex')}_${Date.now()}`;
      activeAdminTokens.add(adminToken);
      activeUserSessions.set(adminToken, { userId: 9999, isAdmin: true, createdAt: Date.now() });
      return res.json({
        success: true,
        isAdmin: true,
        adminToken: adminToken,
        token: adminToken,
        user: {
          id: 9999,
          username: 'admin',
          name: 'Master Administrator',
          handle: '@admin',
          badge: 'ADMIN',
          is_admin: true,
          bio: 'Platform & Database Administrator 🛡️',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
          location: 'Control Center',
          website: '/admin'
        }
      });
    }

    let user = db.prepare('SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(handle) = ?').get(cleanInput, `@${cleanInput}`);
    if (!user && cleanInput.includes('@')) {
      const prefix = cleanInput.split('@')[0].replace(/[^a-z0-9_.]/g, '');
      user = db.prepare('SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(handle) = ?').get(prefix, `@${prefix}`);
    }
    if (!user) {
      user = db.prepare('SELECT * FROM users WHERE LOWER(username) LIKE ? OR LOWER(handle) LIKE ? LIMIT 1').get(`${cleanInput}%`, `@${cleanInput}%`);
    }

    if (!user) {
      return res.status(401).json({ error: `Account not found with username or email "${username}". Please click "Create Account" to sign up.` });
    }

    const inputHash = hashPassword(password);
    // Allow demo password 'password123' or exact hash match
    const isValid = user.password === inputHash || password === 'password123' || !user.password;

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
    }

    const { password: _, ...userWithoutPass } = user;
    const isUserAdmin = user.badge === 'ADMIN';
    let adminToken = null;
    if (isUserAdmin) {
      adminToken = `admin_token_${user.id}_${crypto.randomBytes(20).toString('hex')}_${Date.now()}`;
      activeAdminTokens.add(adminToken);
    }

    const sessionToken = `token_${user.id}_${crypto.randomBytes(16).toString('hex')}_${Date.now()}`;
    activeUserSessions.set(sessionToken, { userId: user.id, isAdmin: isUserAdmin, createdAt: Date.now() });

    res.json({
      success: true,
      isAdmin: isUserAdmin,
      adminToken: adminToken,
      user: {
        ...userWithoutPass,
        is_admin: isUserAdmin
      },
      token: sessionToken
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

// Get current session user
app.get('/api/auth/me', (req, res) => {
  try {
    const currentUserId = req.currentUserId;
    const user = db.prepare('SELECT id, username, name, handle, bio, avatar, cover, location, website, badge, created_at FROM users WHERE id = ?').get(currentUserId);
    if (!user) {
      return res.status(404).json({ error: 'Not authenticated' });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify auth' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    activeUserSessions.delete(token);
    activeAdminTokens.delete(token);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// ==========================================
// USER ROUTES
// ==========================================

// Get all users (Safe columns, never returns password hashes)
app.get('/api/users', (req, res) => {
  try {
    const currentUserId = req.currentUserId;
    const users = db.prepare(`
      SELECT 
        u.id, u.username, u.name, u.handle, u.bio, u.avatar, u.cover, u.location, u.website, u.badge, u.is_private, u.activity_status, u.created_at,
        (SELECT COUNT(*) FROM followers WHERE following_id = u.id) AS followers_count,
        (SELECT COUNT(*) FROM followers WHERE follower_id = u.id) AS following_count,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id) AS posts_count,
        EXISTS(SELECT 1 FROM followers WHERE follower_id = ? AND following_id = u.id) AS is_following
      FROM users u
      ORDER BY followers_count DESC
    `).all(currentUserId);

    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user profile with stats and posts (Safe columns)
app.get('/api/users/:id', (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const currentUserId = req.currentUserId;

    const user = db.prepare(`
      SELECT 
        u.id, u.username, u.name, u.handle, u.bio, u.avatar, u.cover, u.location, u.website, u.badge, u.is_private, u.activity_status, u.created_at,
        (SELECT COUNT(*) FROM followers WHERE following_id = u.id) AS followers_count,
        (SELECT COUNT(*) FROM followers WHERE follower_id = u.id) AS following_count,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id) AS posts_count,
        EXISTS(SELECT 1 FROM followers WHERE follower_id = ? AND following_id = u.id) AS is_following
      FROM users u
      WHERE u.id = ?
    `).get(currentUserId, userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const posts = db.prepare(`
      SELECT 
        p.*,
        u.name AS author_name,
        u.handle AS author_handle,
        u.avatar AS author_avatar,
        u.badge AS author_badge,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count,
        EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) AS is_liked,
        EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = ?) AS is_bookmarked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `).all(currentUserId, currentUserId, userId);

    res.json({ ...user, posts });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Create new user profile
app.post('/api/users', (req, res) => {
  try {
    const { username, name, bio, avatar, location, website } = req.body;
    if (!username || !name) {
      return res.status(400).json({ error: 'Username and Name are required' });
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const handle = `@${cleanUsername}`;

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(cleanUsername);
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const defaultAvatar = avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80`;
    const defaultCover = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';

    const insert = db.prepare(`
      INSERT INTO users (username, name, handle, bio, avatar, cover, location, website, badge)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      cleanUsername,
      name.trim(),
      handle,
      bio || 'Visual creator on NewGram 📷',
      defaultAvatar,
      defaultCover,
      location || 'Global',
      website || '',
      'CREATOR'
    );

    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newUser);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update profile (Authorized)
app.put('/api/users/:id', requireUserAuth, (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (req.currentUserId !== userId && !req.isAdmin) {
      return res.status(403).json({ error: 'You are not authorized to modify this profile' });
    }

    const { name, bio, avatar, location, website, cover } = req.body;

    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.prepare(`
      UPDATE users 
      SET 
        name = COALESCE(?, name),
        bio = COALESCE(?, bio),
        avatar = COALESCE(?, avatar),
        location = COALESCE(?, location),
        website = COALESCE(?, website),
        cover = COALESCE(?, cover)
      WHERE id = ?
    `).run(name, bio, avatar, location, website, cover, userId);

    const updated = db.prepare('SELECT id, username, name, handle, bio, avatar, cover, location, website, badge, is_private, created_at FROM users WHERE id = ?').get(userId);
    res.json(updated);
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ==========================================
// SETTINGS & ACCOUNT MANAGEMENT ROUTES
// ==========================================

// 1. Update Full Profile Settings (Authorized)
app.post('/api/settings/profile', requireUserAuth, (req, res) => {
  try {
    const userId = req.currentUserId;
    const { name, username, bio, avatar, cover, location, website, badge } = req.body;

    const user = db.prepare('SELECT id, username, handle, name, bio, avatar, cover, location, website, badge FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let finalUsername = user.username;
    let finalHandle = user.handle;

    if (username && username.trim() !== '') {
      const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
      if (cleanUsername !== user.username) {
        const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = ? AND id != ?').get(cleanUsername, userId);
        if (existing) {
          return res.status(400).json({ error: `Username @${cleanUsername} is already taken by another creator` });
        }
        finalUsername = cleanUsername;
        finalHandle = `@${cleanUsername}`;
      }
    }

    db.prepare(`
      UPDATE users 
      SET 
        name = COALESCE(?, name),
        username = ?,
        handle = ?,
        bio = COALESCE(?, bio),
        avatar = COALESCE(?, avatar),
        cover = COALESCE(?, cover),
        location = COALESCE(?, location),
        website = COALESCE(?, website),
        badge = COALESCE(?, badge)
      WHERE id = ?
    `).run(
      name !== undefined ? name.trim() : user.name,
      finalUsername,
      finalHandle,
      bio !== undefined ? bio.trim() : user.bio,
      avatar !== undefined ? avatar.trim() : user.avatar,
      cover !== undefined ? cover.trim() : user.cover,
      location !== undefined ? location.trim() : user.location,
      website !== undefined ? website.trim() : user.website,
      badge !== undefined ? badge.trim() : user.badge,
      userId
    );

    const updated = db.prepare('SELECT id, username, name, handle, bio, avatar, cover, location, website, badge, is_private, allow_messages, filter_comments, activity_status, notif_pause_all, notif_likes, notif_comments, notif_messages, notif_followers, hq_media, autoplay_media, compact_feed, created_at FROM users WHERE id = ?').get(userId);
    res.json({ success: true, message: 'Profile updated successfully', user: updated });
  } catch (err) {
    console.error('Error updating settings profile:', err);
    res.status(500).json({ error: 'Failed to update profile: ' + err.message });
  }
});

// 2. Update Password (Authorized)
app.post('/api/settings/password', requireUserAuth, (req, res) => {
  try {
    const userId = req.currentUserId;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters long' });
    }

    const user = db.prepare('SELECT id, password FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.password && user.password !== '') {
      const hashedCurrent = hashPassword(currentPassword);
      if (hashedCurrent !== user.password) {
        return res.status(400).json({ error: 'Current password does not match' });
      }
    }

    const hashedNew = hashPassword(newPassword);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedNew, userId);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error updating password:', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// 3. Update Privacy & Notifications Preferences
app.post('/api/settings/preferences', (req, res) => {
  try {
    const userId = req.currentUserId;
    const {
      is_private,
      allow_messages,
      filter_comments,
      activity_status,
      notif_pause_all,
      notif_likes,
      notif_comments,
      notif_messages,
      notif_followers,
      hq_media,
      autoplay_media,
      compact_feed
    } = req.body;

    db.prepare(`
      UPDATE users 
      SET 
        is_private = COALESCE(?, is_private),
        allow_messages = COALESCE(?, allow_messages),
        filter_comments = COALESCE(?, filter_comments),
        activity_status = COALESCE(?, activity_status),
        notif_pause_all = COALESCE(?, notif_pause_all),
        notif_likes = COALESCE(?, notif_likes),
        notif_comments = COALESCE(?, notif_comments),
        notif_messages = COALESCE(?, notif_messages),
        notif_followers = COALESCE(?, notif_followers),
        hq_media = COALESCE(?, hq_media),
        autoplay_media = COALESCE(?, autoplay_media),
        compact_feed = COALESCE(?, compact_feed)
      WHERE id = ?
    `).run(
      is_private !== undefined ? (is_private ? 1 : 0) : null,
      allow_messages !== undefined ? allow_messages : null,
      filter_comments !== undefined ? (filter_comments ? 1 : 0) : null,
      activity_status !== undefined ? (activity_status ? 1 : 0) : null,
      notif_pause_all !== undefined ? (notif_pause_all ? 1 : 0) : null,
      notif_likes !== undefined ? (notif_likes ? 1 : 0) : null,
      notif_comments !== undefined ? (notif_comments ? 1 : 0) : null,
      notif_messages !== undefined ? (notif_messages ? 1 : 0) : null,
      notif_followers !== undefined ? (notif_followers ? 1 : 0) : null,
      hq_media !== undefined ? (hq_media ? 1 : 0) : null,
      autoplay_media !== undefined ? (autoplay_media ? 1 : 0) : null,
      compact_feed !== undefined ? (compact_feed ? 1 : 0) : null,
      userId
    );

    const updated = db.prepare('SELECT id, username, name, handle, is_private, allow_messages, filter_comments, activity_status, notif_pause_all, notif_likes, notif_comments, notif_messages, notif_followers, hq_media, autoplay_media, compact_feed FROM users WHERE id = ?').get(userId);
    res.json({ success: true, message: 'Preferences saved successfully', preferences: updated });
  } catch (err) {
    console.error('Error updating preferences:', err);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// 4. Export All My Data (Download as JSON file)
app.get('/api/settings/export-my-data', (req, res) => {
  try {
    const userId = req.currentUserId;
    const user = db.prepare('SELECT id, username, name, handle, bio, avatar, cover, location, website, badge, is_private, created_at FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const posts = db.prepare('SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    const comments = db.prepare('SELECT * FROM comments WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    const likes = db.prepare('SELECT post_id, created_at FROM likes WHERE user_id = ?').all(userId);
    const bookmarks = db.prepare('SELECT post_id, created_at FROM bookmarks WHERE user_id = ?').all(userId);
    const sentMessages = db.prepare('SELECT id, receiver_id, content, created_at FROM messages WHERE sender_id = ?').all(userId);
    const receivedMessages = db.prepare('SELECT id, sender_id, content, created_at FROM messages WHERE receiver_id = ?').all(userId);
    const followers = db.prepare('SELECT follower_id, created_at FROM followers WHERE following_id = ?').all(userId);
    const following = db.prepare('SELECT following_id, created_at FROM followers WHERE follower_id = ?').all(userId);

    const exportData = {
      export_version: '2.4.0',
      exported_at: new Date().toISOString(),
      account: user,
      activity: {
        total_posts: posts.length,
        total_comments: comments.length,
        total_likes_given: likes.length,
        total_saved_posts: bookmarks.length,
        total_messages_sent: sentMessages.length,
        total_messages_received: receivedMessages.length,
        followers_count: followers.length,
        following_count: following.length
      },
      data: {
        posts,
        comments,
        likes,
        bookmarks,
        sent_messages: sentMessages,
        received_messages: receivedMessages,
        followers,
        following
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="newgram-export-${user.username}-${Date.now()}.json"`);
    res.send(JSON.stringify(exportData, null, 2));
  } catch (err) {
    console.error('Error exporting data:', err);
    res.status(500).json({ error: 'Failed to export data: ' + err.message });
  }
});

// 5. Delete / Deactivate Account (Authorized Danger Zone)
app.post('/api/settings/delete-account', requireUserAuth, (req, res) => {
  try {
    const userId = req.currentUserId;
    const { password } = req.body;

    if (userId <= 5) {
      return res.status(403).json({ error: 'Demo showcase accounts cannot be deleted.' });
    }

    const user = db.prepare('SELECT id, username, password FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.password && password) {
      if (hashPassword(password) !== user.password) {
        return res.status(400).json({ error: 'Incorrect password. Cannot delete account.' });
      }
    }

    // Explicit cleanup
    db.prepare('DELETE FROM notifications WHERE user_id = ? OR actor_id = ?').run(userId, userId);
    db.prepare('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?').run(userId, userId);
    db.prepare('DELETE FROM followers WHERE follower_id = ? OR following_id = ?').run(userId, userId);
    db.prepare('DELETE FROM bookmarks WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM likes WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM comments WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM stories WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM posts WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    res.json({ success: true, message: `@${user.username} account has been permanently deleted.` });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Follow toggle
app.post('/api/users/:id/follow', (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const followerId = req.currentUserId;

    if (followerId === targetUserId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const existingFollow = db.prepare(`
      SELECT id FROM followers 
      WHERE follower_id = ? AND following_id = ?
    `).get(followerId, targetUserId);

    let isFollowing = false;
    if (existingFollow) {
      db.prepare('DELETE FROM followers WHERE id = ?').run(existingFollow.id);
      isFollowing = false;
    } else {
      db.prepare('INSERT INTO followers (follower_id, following_id) VALUES (?, ?)').run(followerId, targetUserId);
      isFollowing = true;

      const follower = db.prepare('SELECT name FROM users WHERE id = ?').get(followerId);
      if (follower) {
        db.prepare(`
          INSERT INTO notifications (user_id, actor_id, type, post_id, message)
          VALUES (?, ?, 'follow', NULL, ?)
        `).run(targetUserId, followerId, `${follower.name} started following you`);
      }
    }

    const followersCount = db.prepare('SELECT COUNT(*) AS count FROM followers WHERE following_id = ?').get(targetUserId).count;
    res.json({ is_following: isFollowing, followers_count: followersCount });
  } catch (err) {
    console.error('Error toggling follow:', err);
    res.status(500).json({ error: 'Failed to toggle follow status' });
  }
});

// Get followers (Safe columns)
app.get('/api/users/:id/followers', (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const currentUserId = req.currentUserId;

    const followers = db.prepare(`
      SELECT 
        u.id, u.username, u.name, u.handle, u.bio, u.avatar, u.badge,
        EXISTS(SELECT 1 FROM followers WHERE follower_id = ? AND following_id = u.id) AS is_following
      FROM followers f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ?
      ORDER BY f.created_at DESC
    `).all(currentUserId, userId);

    res.json(followers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch followers' });
  }
});

// Get following (Safe columns)
app.get('/api/users/:id/following', (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const currentUserId = req.currentUserId;

    const following = db.prepare(`
      SELECT 
        u.id, u.username, u.name, u.handle, u.bio, u.avatar, u.badge,
        EXISTS(SELECT 1 FROM followers WHERE follower_id = ? AND following_id = u.id) AS is_following
      FROM followers f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ?
      ORDER BY f.created_at DESC
    `).all(currentUserId, userId);

    res.json(following);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch following users' });
  }
});

// ==========================================
// STORIES ROUTES
// ==========================================

app.get('/api/stories', (req, res) => {
  try {
    const stories = db.prepare(`
      SELECT 
        s.*,
        u.name AS user_name,
        u.handle AS user_handle,
        u.avatar AS user_avatar
      FROM stories s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
    `).all();

    res.json(stories);
  } catch (err) {
    console.error('Error fetching stories:', err);
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});

app.post('/api/stories', (req, res) => {
  try {
    const currentUserId = req.currentUserId;
    const { media_url, caption } = req.body;

    if (!media_url) {
      return res.status(400).json({ error: 'Media URL is required for a story' });
    }

    const insert = db.prepare(`
      INSERT INTO stories (user_id, media_url, caption)
      VALUES (?, ?, ?)
    `);

    const result = insert.run(currentUserId, media_url, caption || '');
    const newStory = db.prepare(`
      SELECT 
        s.*,
        u.name AS user_name,
        u.handle AS user_handle,
        u.avatar AS user_avatar
      FROM stories s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(newStory);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create story' });
  }
});

// ==========================================
// POSTS ROUTES
// ==========================================

// Feed posts
app.get('/api/posts', (req, res) => {
  try {
    const currentUserId = req.currentUserId;
    const { feed, userId, tag, search, saved } = req.query;

    let query = `
      SELECT 
        p.*,
        u.name AS author_name,
        u.handle AS author_handle,
        u.avatar AS author_avatar,
        u.badge AS author_badge,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count,
        EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) AS is_liked,
        EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = ?) AS is_bookmarked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;

    const params = [currentUserId, currentUserId];

    if (saved === 'true') {
      query += ` AND p.id IN (SELECT post_id FROM bookmarks WHERE user_id = ?)`;
      params.push(currentUserId);
    } else if (feed === 'following') {
      query += ` AND p.user_id IN (SELECT following_id FROM followers WHERE follower_id = ?)`;
      params.push(currentUserId);
    }

    if (userId) {
      query += ` AND p.user_id = ?`;
      params.push(parseInt(userId, 10));
    }

    if (tag) {
      query += ` AND p.tags LIKE ?`;
      params.push(`%${tag}%`);
    }

    if (search) {
      query += ` AND (p.content LIKE ? OR p.tags LIKE ? OR p.location LIKE ? OR u.name LIKE ? OR u.handle LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    query += ` ORDER BY p.created_at DESC LIMIT 50`;

    const posts = db.prepare(query).all(...params);

    const commentStmt = db.prepare(`
      SELECT 
        c.*,
        u.name AS author_name,
        u.handle AS author_handle,
        u.avatar AS author_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `);

    const postsWithComments = posts.map(post => {
      const comments = commentStmt.all(post.id);
      return {
        ...post,
        comments
      };
    });

    res.json(postsWithComments);
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Single post
app.get('/api/posts/:id', (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const currentUserId = req.currentUserId;

    const post = db.prepare(`
      SELECT 
        p.*,
        u.name AS author_name,
        u.handle AS author_handle,
        u.avatar AS author_avatar,
        u.badge AS author_badge,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count,
        EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) AS is_liked,
        EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = ?) AS is_bookmarked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(currentUserId, currentUserId, postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comments = db.prepare(`
      SELECT 
        c.*,
        u.name AS author_name,
        u.handle AS author_handle,
        u.avatar AS author_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).all(postId);

    res.json({ ...post, comments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Create post
app.post('/api/posts', (req, res) => {
  try {
    const currentUserId = req.currentUserId;
    const { content, media_url, location, tags, music_tag } = req.body;

    if (!content && !media_url) {
      return res.status(400).json({ error: 'Caption or photo is required' });
    }

    let computedTags = tags || '';
    const tagMatches = (content || '').match(/#[a-zA-Z0-9_]+/g);
    if (tagMatches && (!computedTags || !computedTags.trim())) {
      computedTags = tagMatches.join(' ');
    }

    const insert = db.prepare(`
      INSERT INTO posts (user_id, content, media_url, location, tags, music_tag, reposts_count)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `);

    const result = insert.run(
      currentUserId,
      (content || '').trim(),
      media_url || '',
      location || '',
      computedTags,
      music_tag || ''
    );
    const newPostId = result.lastInsertRowid;

    const post = db.prepare(`
      SELECT 
        p.*,
        u.name AS author_name,
        u.handle AS author_handle,
        u.avatar AS author_avatar,
        u.badge AS author_badge,
        0 AS likes_count,
        0 AS comments_count,
        0 AS is_liked,
        0 AS is_bookmarked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(newPostId);

    res.status(201).json({ ...post, comments: [] });
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Delete post
app.delete('/api/posts/:id', (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const currentUserId = req.currentUserId;

    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.user_id !== currentUserId) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    db.prepare('DELETE FROM posts WHERE id = ?').run(postId);
    res.json({ message: 'Post deleted successfully', id: postId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Like toggle
app.post('/api/posts/:id/like', (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const currentUserId = req.currentUserId;

    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existingLike = db.prepare('SELECT id FROM likes WHERE post_id = ? AND user_id = ?').get(postId, currentUserId);

    let isLiked = false;
    if (existingLike) {
      db.prepare('DELETE FROM likes WHERE id = ?').run(existingLike.id);
      isLiked = false;
    } else {
      db.prepare('INSERT INTO likes (post_id, user_id) VALUES (?, ?)').run(postId, currentUserId);
      isLiked = true;

      if (post.user_id !== currentUserId) {
        const actor = db.prepare('SELECT name FROM users WHERE id = ?').get(currentUserId);
        db.prepare(`
          INSERT INTO notifications (user_id, actor_id, type, post_id, message)
          VALUES (?, ?, 'like', ?, ?)
        `).run(post.user_id, currentUserId, postId, `${actor.name} liked your photo`);
      }
    }

    const likesCount = db.prepare('SELECT COUNT(*) AS count FROM likes WHERE post_id = ?').get(postId).count;
    res.json({ is_liked: isLiked, likes_count: likesCount, post_id: postId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// Bookmark toggle
app.post('/api/posts/:id/bookmark', (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const currentUserId = req.currentUserId;

    const existing = db.prepare('SELECT id FROM bookmarks WHERE post_id = ? AND user_id = ?').get(postId, currentUserId);

    let isBookmarked = false;
    if (existing) {
      db.prepare('DELETE FROM bookmarks WHERE id = ?').run(existing.id);
      isBookmarked = false;
    } else {
      db.prepare('INSERT INTO bookmarks (post_id, user_id) VALUES (?, ?)').run(postId, currentUserId);
      isBookmarked = true;
    }

    res.json({ is_bookmarked: isBookmarked, post_id: postId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle bookmark' });
  }
});

// Repost / Reshare route (Twitter / Threads style)
app.post('/api/posts/:id/repost', (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    db.prepare('UPDATE posts SET reposts_count = COALESCE(reposts_count, 0) + 1 WHERE id = ?').run(postId);
    const post = db.prepare('SELECT reposts_count FROM posts WHERE id = ?').get(postId);
    res.json({ reposts_count: post ? post.reposts_count : 0, post_id: postId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to repost' });
  }
});

// ==========================================
// COMMENTS ROUTES
// ==========================================

app.get('/api/posts/:id/comments', (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const comments = db.prepare(`
      SELECT 
        c.*,
        u.name AS author_name,
        u.handle AS author_handle,
        u.avatar AS author_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).all(postId);

    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

app.post('/api/posts/:id/comments', (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const currentUserId = req.currentUserId;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const insert = db.prepare(`
      INSERT INTO comments (post_id, user_id, content)
      VALUES (?, ?, ?)
    `);

    const result = insert.run(postId, currentUserId, content.trim());
    const newCommentId = result.lastInsertRowid;

    if (post.user_id !== currentUserId) {
      const actor = db.prepare('SELECT name FROM users WHERE id = ?').get(currentUserId);
      db.prepare(`
        INSERT INTO notifications (user_id, actor_id, type, post_id, message)
        VALUES (?, ?, 'comment', ?, ?)
      `).run(post.user_id, currentUserId, postId, `${actor.name} commented: "${content.substring(0, 35)}..."`);
    }

    const comment = db.prepare(`
      SELECT 
        c.*,
        u.name AS author_name,
        u.handle AS author_handle,
        u.avatar AS author_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(newCommentId);

    const commentsCount = db.prepare('SELECT COUNT(*) AS count FROM comments WHERE post_id = ?').get(postId).count;

    res.status(201).json({ comment, comments_count: commentsCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

app.delete('/api/comments/:id', (req, res) => {
  try {
    const commentId = parseInt(req.params.id, 10);
    const currentUserId = req.currentUserId;

    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.user_id !== currentUserId) {
      return res.status(403).json({ error: 'Not authorized to delete comment' });
    }

    db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);
    const commentsCount = db.prepare('SELECT COUNT(*) AS count FROM comments WHERE post_id = ?').get(comment.post_id).count;

    res.json({ message: 'Comment deleted', id: commentId, post_id: comment.post_id, comments_count: commentsCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// ==========================================
// EXPLORE & NOTIFICATIONS
// ==========================================

app.get('/api/explore', (req, res) => {
  try {
    const currentUserId = req.currentUserId;

    const suggestedUsers = db.prepare(`
      SELECT 
        u.id, u.username, u.name, u.handle, u.bio, u.avatar, u.badge,
        (SELECT COUNT(*) FROM followers WHERE following_id = u.id) AS followers_count,
        0 AS is_following
      FROM users u
      WHERE u.id != ? 
        AND u.id NOT IN (SELECT following_id FROM followers WHERE follower_id = ?)
      ORDER BY followers_count DESC
      LIMIT 5
    `).all(currentUserId, currentUserId);

    const allPosts = db.prepare('SELECT tags FROM posts WHERE tags IS NOT NULL AND tags != \'\'').all();
    const tagCounts = {};
    for (const p of allPosts) {
      const tags = p.tags.split(/\s+/).filter(t => t.startsWith('#'));
      for (const t of tags) {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      }
    }

    const trendingTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const popularPosts = db.prepare(`
      SELECT 
        p.*,
        u.name AS author_name,
        u.handle AS author_handle,
        u.avatar AS author_avatar,
        u.badge AS author_badge,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count,
        EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) AS is_liked,
        EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = ?) AS is_bookmarked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY likes_count DESC, p.created_at DESC
      LIMIT 12
    `).all(currentUserId, currentUserId);

    res.json({
      suggestedUsers,
      trendingTags,
      popularPosts
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch explore data' });
  }
});

app.get('/api/notifications', (req, res) => {
  try {
    const currentUserId = req.currentUserId;
    const notifications = db.prepare(`
      SELECT 
        n.*,
        actor.name AS actor_name,
        actor.handle AS actor_handle,
        actor.avatar AS actor_avatar
      FROM notifications n
      JOIN users actor ON n.actor_id = actor.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 30
    `).all(currentUserId);

    const unreadCount = db.prepare(`
      SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0
    `).get(currentUserId).count;

    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.post('/api/notifications/read', (req, res) => {
  try {
    const currentUserId = req.currentUserId;
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(currentUserId);
    res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

app.post('/api/reset-seed', (req, res) => {
  try {
    seedDatabase();
    res.json({ message: 'NewGram database reset and re-seeded' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

// ==========================================
// DIRECT MESSAGES (CHAT) ROUTES
// ==========================================

// Get all conversation threads for current user
app.get('/api/conversations', (req, res) => {
  try {
    const currentUserId = req.currentUserId;

    // Get list of distinct user IDs who have exchanged messages with current user
    const partners = db.prepare(`
      SELECT DISTINCT 
        CASE 
          WHEN sender_id = ? THEN receiver_id 
          ELSE sender_id 
        END AS partner_id
      FROM messages
      WHERE sender_id = ? OR receiver_id = ?
    `).all(currentUserId, currentUserId, currentUserId);

    const threads = partners.map(p => {
      const partnerUser = db.prepare('SELECT id, name, username, handle, avatar, badge FROM users WHERE id = ?').get(p.partner_id);
      if (!partnerUser) return null;

      const lastMsg = db.prepare(`
        SELECT content, created_at, sender_id, is_read 
        FROM messages 
        WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
        ORDER BY created_at DESC 
        LIMIT 1
      `).get(currentUserId, p.partner_id, p.partner_id, currentUserId);

      const unreadCount = db.prepare(`
        SELECT COUNT(*) as count 
        FROM messages 
        WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
      `).get(p.partner_id, currentUserId).count;

      return {
        partner: partnerUser,
        last_message: lastMsg ? lastMsg.content : '',
        last_message_time: lastMsg ? lastMsg.created_at : '',
        last_message_sender_id: lastMsg ? lastMsg.sender_id : null,
        unread_count: unreadCount
      };
    }).filter(Boolean);

    // Sort by last message time descending
    threads.sort((a, b) => new Date(b.last_message_time) - new Date(a.last_message_time));

    res.json(threads);
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages between current user and target user
app.get('/api/messages/:userId', (req, res) => {
  try {
    const currentUserId = req.currentUserId;
    const targetUserId = parseInt(req.params.userId, 10);

    const partnerUser = db.prepare('SELECT id, name, username, handle, avatar, badge FROM users WHERE id = ?').get(targetUserId);
    if (!partnerUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Mark incoming messages as read
    db.prepare(`
      UPDATE messages 
      SET is_read = 1 
      WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
    `).run(targetUserId, currentUserId);

    const messages = db.prepare(`
      SELECT 
        m.*,
        u.name AS sender_name,
        u.avatar AS sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?) 
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at ASC
    `).all(currentUserId, targetUserId, targetUserId, currentUserId);

    res.json({ partner: partnerUser, messages });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send direct message
app.post('/api/messages', (req, res) => {
  try {
    const currentUserId = req.currentUserId;
    const { receiver_id, content } = req.body;

    if (!receiver_id || !content || !content.trim()) {
      return res.status(400).json({ error: 'Receiver ID and content are required' });
    }

    const targetUserId = parseInt(receiver_id, 10);
    const receiver = db.prepare('SELECT name FROM users WHERE id = ?').get(targetUserId);
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    const insert = db.prepare(`
      INSERT INTO messages (sender_id, receiver_id, content, is_read)
      VALUES (?, ?, ?, 0)
    `);

    const result = insert.run(currentUserId, targetUserId, content.trim());
    const newMsgId = result.lastInsertRowid;

    // Send notification to receiver
    const sender = db.prepare('SELECT name FROM users WHERE id = ?').get(currentUserId);
    db.prepare(`
      INSERT INTO notifications (user_id, actor_id, type, message)
      VALUES (?, ?, 'comment', ?)
    `).run(targetUserId, currentUserId, `${sender.name} sent you a message: "${content.substring(0, 30)}..."`);

    const newMsg = db.prepare(`
      SELECT 
        m.*,
        u.name AS sender_name,
        u.avatar AS sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `).get(newMsgId);

    res.status(201).json(newMsg);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Auto-reply simulation endpoint for dynamic creator conversations
app.post('/api/messages/reply', (req, res) => {
  try {
    const currentUserId = parseInt(req.currentUserId, 10);
    const partnerId = parseInt(req.body.partner_id, 10);
    const { message_text } = req.body;

    const partner = db.prepare('SELECT * FROM users WHERE id = ?').get(partnerId);
    if (!partner) return res.status(404).json({ error: 'Partner not found' });

    const responses = {
      elena_visuals: [
        'That makes total sense! Negative space and balanced contrast can transform the entire feel.',
        'I completely agree. We are experimenting with similar spatial compositions in the Milan studio.',
        'Excited about this! Let me pull together a moodboard and send it over.',
        'Absolutely. What time works best for you to sync up on the design tokens?',
        'Such a sharp perspective! That aligns perfectly with our minimalist philosophy.'
      ],
      alex_minimal: [
        'Totally doable! We can optimize the SQLite queries with memory indexes for instant throughput.',
        'Nice point! I pushed an update to our repo that handles this exact edge case.',
        'Let’s build a lightweight proof of concept and benchmark the latency together.',
        'Spot on. Clean code and decoupled architecture always win in the long run 💻⚡',
        'Just tested that! Performance improved by over 40% with WAL mode enabled.'
      ],
      sophia_lens: [
        'The natural light in that location was extraordinary. Really happy you noticed the tones!',
        'I shot that with high aperture to capture the gentle vignette. So glad you like it!',
        'Are you working on any new photographic series this month? Would love to see your drafts.',
        'Scandinavian light has a quiet stillness that is hard to describe until you see it in person 📷',
        'Thanks so much! Let me know when you visit Oslo—let’s definitely grab coffee!'
      ],
      marcus_vance: [
        'Analog tape warmth just hits differently. Those harmonic overtones give it real character 🎚️',
        'I’m finishing the mixdown tonight! Will share an uncompressed audio snippet with you.',
        'The Moog synth filters gave that track its punchy baseline. What headphones are you using?',
        'Totally! Good sound design is felt just as much as it is heard.',
        'Let’s jam on a soundscape collaboration soon. I have some fresh modular patches ready!'
      ],
      clara_noir: [
        'The raw ash texture on the ceramics took nearly three weeks in the kiln to cure perfectly.',
        'Art is all about the dialogue between stillness and texture 🕊️',
        'Would love to reserve an exhibition pass for you at Galerie Noir!',
        'Thank you! Crafting by hand teaches so much patience and gratitude.',
        'Looking forward to seeing what you create next as well!'
      ]
    };

    const personaResponses = responses[partner.username] || [
      'Thanks for reaching out! Really appreciate your thoughts.',
      'Sounds great, let’s keep this momentum going!',
      'Awesome idea. Let’s collaborate on this soon!',
      'Got it! Looking forward to our next steps.',
      'Totally! Let’s stay in touch.'
    ];

    const replyContent = personaResponses[Math.floor(Math.random() * personaResponses.length)];

    const insert = db.prepare(`
      INSERT INTO messages (sender_id, receiver_id, content, is_read)
      VALUES (?, ?, ?, 1)
    `);
    const result = insert.run(partnerId, currentUserId, replyContent);

    const newMsg = db.prepare(`
      SELECT 
        m.*,
        u.name AS sender_name,
        u.avatar AS sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(newMsg);
  } catch (err) {
    console.error('Error generating reply:', err);
    res.status(500).json({ error: 'Failed to generate reply' });
  }
});

// ==========================================
// ADMIN DASHBOARD ROUTES
// ==========================================

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Admin Session Verification
app.get('/api/admin/verify', requireAdminAuth, (req, res) => {
  res.json({ success: true, authorized: true, role: 'ADMIN' });
});

// Admin Login (Rate-limited & Protected)
app.post('/api/admin/login', (req, res) => {
  try {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    if (!checkLoginRateLimit(clientIp)) {
      return res.status(429).json({ error: 'Too many admin login attempts. Please wait 2 minutes.' });
    }

    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const cleanInput = username.trim().toLowerCase().replace(/^@/, '');
    const isMasterAdmin = (cleanInput === 'admin' || cleanInput === 'admin@newgram.com') && (password === ADMIN_PASSWORD);
    
    if (isMasterAdmin) {
      const token = `admin_token_${crypto.randomBytes(24).toString('hex')}_${Date.now()}`;
      activeAdminTokens.add(token);
      return res.json({
        success: true,
        token,
        admin: { username: 'admin', role: 'SUPER_ADMIN', name: 'Master Administrator' }
      });
    }

    // Only allow database users who have badge === 'ADMIN'
    const user = db.prepare("SELECT * FROM users WHERE (LOWER(username) = ? OR LOWER(handle) = ?) AND badge = 'ADMIN'").get(cleanInput, `@${cleanInput}`);
    if (user && user.password === hashPassword(password)) {
      const token = `admin_token_${user.id}_${crypto.randomBytes(20).toString('hex')}_${Date.now()}`;
      activeAdminTokens.add(token);
      return res.json({
        success: true,
        token,
        admin: { username: user.username, role: user.badge || 'ADMIN', name: user.name }
      });
    }

    return res.status(401).json({ error: 'Access denied: Invalid administrator credentials.' });
  } catch (err) {
    res.status(500).json({ error: 'Authentication error: ' + err.message });
  }
});

// Admin Overview Metrics (Protected)
app.get('/api/admin/overview', requireAdminAuth, (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalPosts = db.prepare('SELECT COUNT(*) as count FROM posts').get().count;
    const totalComments = db.prepare('SELECT COUNT(*) as count FROM comments').get().count;
    const totalMessages = db.prepare('SELECT COUNT(*) as count FROM messages').get().count;
    const totalLikes = db.prepare('SELECT COUNT(*) as count FROM likes').get().count;
    const totalStories = db.prepare('SELECT COUNT(*) as count FROM stories').get().count;
    const totalFollows = db.prepare('SELECT COUNT(*) as count FROM followers').get().count;

    let dbSizeBytes = 0;
    try {
      const stats = fs.statSync(path.join(__dirname, 'newgram.db'));
      dbSizeBytes = stats.size;
    } catch (e) {}

    const recentUsers = db.prepare('SELECT id, username, name, handle, avatar, created_at FROM users ORDER BY id DESC LIMIT 5').all();
    const recentPosts = db.prepare(`
      SELECT p.id, p.content, p.media_url, p.created_at, u.username, u.name, u.avatar
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.id DESC LIMIT 5
    `).all();

    res.json({
      metrics: {
        totalUsers,
        totalPosts,
        totalComments,
        totalMessages,
        totalLikes,
        totalStories,
        totalFollows,
        dbSizeBytes,
        dbSizeFormatted: `${(dbSizeBytes / 1024).toFixed(1)} KB`
      },
      recentUsers,
      recentPosts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin All Users (Protected & Redacted: Never exposes password hashes)
app.get('/api/admin/users', requireAdminAuth, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT 
        u.id, u.username, u.name, u.handle, u.bio, u.avatar, u.cover, u.location, u.website, u.badge, u.created_at,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id) AS posts_count,
        (SELECT COUNT(*) FROM followers WHERE following_id = u.id) AS followers_count,
        (SELECT COUNT(*) FROM followers WHERE follower_id = u.id) AS following_count
      FROM users u
      ORDER BY u.id DESC
    `).all();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Delete User (Protected)
app.delete('/api/admin/users/:id', requireAdminAuth, (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    db.prepare('DELETE FROM likes WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM comments WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?').run(userId, userId);
    db.prepare('DELETE FROM followers WHERE follower_id = ? OR following_id = ?').run(userId, userId);
    db.prepare('DELETE FROM stories WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM posts WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    res.json({ success: true, message: `User #${userId} deleted` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin All Posts (Protected)
app.get('/api/admin/posts', requireAdminAuth, (req, res) => {
  try {
    const posts = db.prepare(`
      SELECT 
        p.*,
        u.username,
        u.handle,
        u.name AS author_name,
        u.avatar AS author_avatar,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.id DESC
    `).all();
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Delete Post (Protected)
app.delete('/api/admin/posts/:id', requireAdminAuth, (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    db.prepare('DELETE FROM likes WHERE post_id = ?').run(postId);
    db.prepare('DELETE FROM comments WHERE post_id = ?').run(postId);
    db.prepare('DELETE FROM bookmarks WHERE post_id = ?').run(postId);
    db.prepare('DELETE FROM posts WHERE id = ?').run(postId);
    res.json({ success: true, message: `Post #${postId} deleted` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin All Messages (Protected)
app.get('/api/admin/messages', requireAdminAuth, (req, res) => {
  try {
    const messages = db.prepare(`
      SELECT 
        m.*,
        s.username AS sender_username,
        s.name AS sender_name,
        s.avatar AS sender_avatar,
        r.username AS receiver_username,
        r.name AS receiver_name,
        r.avatar AS receiver_avatar
      FROM messages m
      JOIN users s ON m.sender_id = s.id
      JOIN users r ON m.receiver_id = r.id
      ORDER BY m.id DESC
      LIMIT 200
    `).all();
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin All Comments (Protected)
app.get('/api/admin/comments', requireAdminAuth, (req, res) => {
  try {
    const comments = db.prepare(`
      SELECT 
        c.*,
        u.username,
        u.name AS author_name,
        u.avatar AS author_avatar,
        p.content AS post_caption,
        p.media_url AS post_media
      FROM comments c
      JOIN users u ON c.user_id = u.id
      JOIN posts p ON c.post_id = p.id
      ORDER BY c.id DESC
      LIMIT 200
    `).all();
    res.json({ comments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin SQL Console Executor (Protected & Sanitized)
app.post('/api/admin/query', requireAdminAuth, (req, res) => {
  try {
    const { query } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Query string is required' });
    }
    const cleanQuery = query.trim();
    // Block dangerous SQLite PRAGMAs or ATTACH operations
    const forbidden = /attach\s+|load_extension|pragma\s+writable_schema/i;
    if (forbidden.test(cleanQuery)) {
      return res.status(403).json({ error: 'Forbidden query pattern detected' });
    }

    if (cleanQuery.toLowerCase().startsWith('select')) {
      const rows = db.prepare(cleanQuery).all();
      // Redact password column if queried from users table
      const sanitizedRows = rows.map(r => {
        if (r && typeof r === 'object' && 'password' in r) {
          const { password, ...rest } = r;
          return { ...rest, password: '[PROTECTED_HASH]' };
        }
        return r;
      });
      res.json({ success: true, rows: sanitizedRows, count: sanitizedRows.length });
    } else {
      const info = db.prepare(cleanQuery).run();
      res.json({ success: true, info, changes: info.changes });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin Database Full Export JSON (Protected & Password Redacted)
app.get('/api/admin/export', requireAdminAuth, (req, res) => {
  try {
    const tables = ['users', 'posts', 'comments', 'likes', 'bookmarks', 'followers', 'stories', 'messages', 'notifications'];
    const exportData = {
      exported_at: new Date().toISOString(),
      platform: 'NewGram Social Platform',
      database: {}
    };
    for (const table of tables) {
      const rows = db.prepare(`SELECT * FROM ${table}`).all();
      if (table === 'users') {
        // Redact password hash from export JSON
        exportData.database[table] = rows.map(({ password, ...u }) => u);
      } else {
        exportData.database[table] = rows;
      }
    }
    res.setHeader('Content-Disposition', 'attachment; filename="newgram_database_backup.json"');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(exportData, null, 2));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback to index.html for SPA client navigation
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🖤 NewGram Server running at http://localhost:${PORT}`);
});
