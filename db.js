const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(__dirname, 'newgram.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for high performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function hashPassword(password) {
  return crypto.createHash('sha256').update((password || 'password123') + '_newgram_salt').digest('hex');
}

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      handle TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL DEFAULT '',
      bio TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      cover TEXT DEFAULT '',
      location TEXT DEFAULT '',
      website TEXT DEFAULT '',
      badge TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      media_url TEXT DEFAULT '',
      location TEXT DEFAULT '',
      tags TEXT DEFAULT '',
      music_tag TEXT DEFAULT '',
      reposts_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS stories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      media_url TEXT NOT NULL,
      caption TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(post_id, user_id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(post_id, user_id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS followers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(follower_id, following_id),
      FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      actor_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      post_id INTEGER,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Safe migrations for columns added in NewGram 2.0
  try {
    db.prepare("ALTER TABLE posts ADD COLUMN music_tag TEXT DEFAULT ''").run();
  } catch (e) {}
  try {
    db.prepare("ALTER TABLE posts ADD COLUMN reposts_count INTEGER DEFAULT 0").run();
  } catch (e) {}
  try {
    db.prepare("ALTER TABLE users ADD COLUMN password TEXT DEFAULT ''").run();
  } catch (e) {}

  const defaultHash = hashPassword('password123');
  try {
    db.prepare("UPDATE users SET password = ? WHERE password IS NULL OR password = ''").run(defaultHash);
  } catch (e) {}

  // Safe migrations for user preferences & settings
  const settingsCols = [
    "ALTER TABLE users ADD COLUMN is_private INTEGER DEFAULT 0",
    "ALTER TABLE users ADD COLUMN allow_messages TEXT DEFAULT 'everyone'",
    "ALTER TABLE users ADD COLUMN filter_comments INTEGER DEFAULT 1",
    "ALTER TABLE users ADD COLUMN activity_status INTEGER DEFAULT 1",
    "ALTER TABLE users ADD COLUMN notif_pause_all INTEGER DEFAULT 0",
    "ALTER TABLE users ADD COLUMN notif_likes INTEGER DEFAULT 1",
    "ALTER TABLE users ADD COLUMN notif_comments INTEGER DEFAULT 1",
    "ALTER TABLE users ADD COLUMN notif_messages INTEGER DEFAULT 1",
    "ALTER TABLE users ADD COLUMN notif_followers INTEGER DEFAULT 1",
    "ALTER TABLE users ADD COLUMN hq_media INTEGER DEFAULT 1",
    "ALTER TABLE users ADD COLUMN autoplay_media INTEGER DEFAULT 1",
    "ALTER TABLE users ADD COLUMN compact_feed INTEGER DEFAULT 0"
  ];
  for (const sql of settingsCols) {
    try {
      db.prepare(sql).run();
    } catch (e) {}
  }

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    seedDatabase();
  }
}

function seedDatabase() {
  console.log('Seeding NewGram visual social media data...');
  
  db.exec(`
    DELETE FROM notifications;
    DELETE FROM messages;
    DELETE FROM followers;
    DELETE FROM bookmarks;
    DELETE FROM likes;
    DELETE FROM comments;
    DELETE FROM stories;
    DELETE FROM posts;
    DELETE FROM users;
    DELETE FROM sqlite_sequence;
  `);

  const defaultPass = hashPassword('password123');
  const insertUser = db.prepare(`
    INSERT INTO users (username, name, handle, password, bio, avatar, cover, location, website, badge)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const usersData = [
    {
      username: 'elena_visuals',
      name: 'Elena Rostova',
      handle: '@elena_visuals',
      bio: 'Architectural & Spatial Designer 🖤 Minimalist monochrome aesthetics. Capturing structural lines and studio lighting.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      cover: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      location: 'Milan & Berlin',
      website: 'https://elenarostova.studio',
      badge: 'ARCHITECT'
    },
    {
      username: 'alex_minimal',
      name: 'Alex Rivera',
      handle: '@alex_minimal',
      bio: 'Creative Technologist & Monolith Dev ⚡ Building next-gen visual computing interfaces and monochrome workspaces.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      cover: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
      location: 'Tokyo, Japan',
      website: 'https://alexrivera.io',
      badge: 'ENGINEER'
    },
    {
      username: 'sophia_lens',
      name: 'Sophia Kim',
      handle: '@sophia_lens',
      bio: 'Fine Art & Editorial Photographer 📷 Leica M11 enthusiast. Black & white contrast, street shadows, Scandinavian silence.',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      cover: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80',
      location: 'Oslo, Norway',
      website: 'https://sophiakim.gallery',
      badge: 'PHOTOGRAPHER'
    },
    {
      username: 'marcus_vance',
      name: 'Marcus Vance',
      handle: '@marcus_vance',
      bio: 'Analog Sound & Studio Curator 🎧 Vinyl collector, acoustic sculpture, and monochrome visual art.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      cover: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80',
      location: 'London, UK',
      website: 'https://marcusvance.co',
      badge: 'PRODUCER'
    },
    {
      username: 'clara_noir',
      name: 'Clara Oswald',
      handle: '@clara_noir',
      bio: 'Editorial Director & Ceramic Artist 🕊️ Modern ceramics, brutalist gallery spaces, quiet luxury.',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      cover: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
      location: 'Paris, France',
      website: 'https://claraoswald.fr',
      badge: 'CURATOR'
    }
  ];

  const userIds = [];
  for (const u of usersData) {
    const res = insertUser.run(u.username, u.name, u.handle, defaultPass, u.bio, u.avatar, u.cover, u.location, u.website, u.badge);
    userIds.push(res.lastInsertRowid);
  }

  // Insert Stories
  const insertStory = db.prepare(`
    INSERT INTO stories (user_id, media_url, caption, created_at)
    VALUES (?, ?, ?, datetime('now', ?))
  `);

  insertStory.run(userIds[0], 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', 'Morning light in the studio 🏛️', '-2 hours');
  insertStory.run(userIds[1], 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80', 'New hardware arrived ⚙️', '-4 hours');
  insertStory.run(userIds[2], 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80', 'Fjord shadows at dusk 🏔️', '-6 hours');
  insertStory.run(userIds[3], 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80', 'Reel to reel master tapes 🎚️', '-8 hours');
  insertStory.run(userIds[4], 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80', 'Handcrafted matte porcelain 🏺', '-12 hours');

  // Insert Followers
  const insertFollower = db.prepare('INSERT INTO followers (follower_id, following_id) VALUES (?, ?)');
  insertFollower.run(userIds[0], userIds[1]);
  insertFollower.run(userIds[0], userIds[2]);
  insertFollower.run(userIds[0], userIds[3]);
  insertFollower.run(userIds[1], userIds[0]);
  insertFollower.run(userIds[1], userIds[2]);
  insertFollower.run(userIds[1], userIds[4]);
  insertFollower.run(userIds[2], userIds[0]);
  insertFollower.run(userIds[2], userIds[3]);
  insertFollower.run(userIds[3], userIds[1]);
  insertFollower.run(userIds[4], userIds[0]);
  insertFollower.run(userIds[4], userIds[2]);

  // Insert Rich Visual Posts (Instagram + Twitter + Threads style)
  const insertPost = db.prepare(`
    INSERT INTO posts (user_id, content, media_url, location, tags, music_tag, reposts_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  const postsData = [
    {
      userId: userIds[0], // Elena
      content: 'Minimalism is not a lack of something. It is simply the perfect amount of everything. Designed this contemporary concrete pavilion focusing on negative space and pure natural shadows.',
      mediaUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      location: 'Milan Design District',
      tags: '#architecture #minimalism #design #studio',
      musicTag: '🎵 Max Richter • Infra 5',
      repostsCount: 14,
      timeOffset: '-3 hours'
    },
    {
      userId: userIds[2], // Sophia
      content: 'Street silhouetting in Oslo. The golden hour in late autumn turns the entire street into high-contrast monochrome geometry. Shot with 35mm f/1.4.',
      mediaUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80',
      location: 'Oslo, Norway',
      tags: '#photography #bnw #editorial #monochrome',
      musicTag: '🎵 Olafur Arnalds • Saman',
      repostsCount: 8,
      timeOffset: '-5 hours'
    },
    {
      userId: userIds[1], // Alex
      content: 'Desk setup iteration 04. Cable-free, mechanical click, natural linen desk pad, and ultra-wide matte black monitor. Clean workspace equals clean thinking.',
      mediaUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
      location: 'Shibuya, Tokyo',
      tags: '#workspace #setup #minimaltech #coding',
      musicTag: '🎵 Tycho • Awake',
      repostsCount: 23,
      timeOffset: '-7 hours'
    },
    {
      userId: userIds[4], // Clara
      content: 'New exhibition preview: "Forms of Stillness". Hand-thrown stoneware finished with raw ash glaze. Opening this Friday at Galerie Noir.',
      mediaUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
      location: 'Le Marais, Paris',
      tags: '#ceramics #artgallery #sculpture #paris',
      musicTag: '🎵 Nils Frahm • Says',
      repostsCount: 5,
      timeOffset: '-9 hours'
    },
    {
      userId: userIds[3], // Marcus
      content: 'Restoring a vintage 1978 analog tape console. The mechanical switches and weighted dials provide a sensory feedback that touchscreen glass will never replicate.',
      mediaUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80',
      location: 'Soho Studio, London',
      tags: '#analog #soundstudio #vinyl #audiophile',
      musicTag: '🎵 Marcus Vance • Tape Saturation',
      repostsCount: 31,
      timeOffset: '-12 hours'
    }
  ];

  const postIds = [];
  for (const p of postsData) {
    const res = insertPost.run(p.userId, p.content, p.mediaUrl, p.location, p.tags, p.musicTag, p.repostsCount, p.timeOffset);
    postIds.push(res.lastInsertRowid);
  }

  // Insert Likes
  const insertLike = db.prepare('INSERT INTO likes (post_id, user_id, created_at) VALUES (?, ?, datetime(\'now\', ?))');
  insertLike.run(postIds[0], userIds[1], '-2 hours');
  insertLike.run(postIds[0], userIds[2], '-2 hours');
  insertLike.run(postIds[0], userIds[3], '-1 hour');
  insertLike.run(postIds[0], userIds[4], '-30 minutes');

  insertLike.run(postIds[1], userIds[0], '-4 hours');
  insertLike.run(postIds[1], userIds[3], '-3 hours');
  insertLike.run(postIds[1], userIds[4], '-1 hour');

  insertLike.run(postIds[2], userIds[0], '-6 hours');
  insertLike.run(postIds[2], userIds[2], '-5 hours');

  insertLike.run(postIds[3], userIds[0], '-8 hours');
  insertLike.run(postIds[3], userIds[1], '-7 hours');

  // Insert Bookmarks
  const insertBookmark = db.prepare('INSERT INTO bookmarks (post_id, user_id) VALUES (?, ?)');
  insertBookmark.run(postIds[0], userIds[1]);
  insertBookmark.run(postIds[1], userIds[0]);

  // Insert Comments
  const insertComment = db.prepare(`
    INSERT INTO comments (post_id, user_id, content, created_at)
    VALUES (?, ?, ?, datetime('now', ?))
  `);

  insertComment.run(postIds[0], userIds[2], 'The shadow falloff along that cantilever is sublime Elena.', '-2 hours');
  insertComment.run(postIds[0], userIds[1], 'Absolute architectural masterclass. Are those board-formed concrete slabs?', '-1 hour');
  insertComment.run(postIds[1], userIds[0], 'The contrast range is stunning Sophia. High dynamic range perfection.', '-4 hours');
  insertComment.run(postIds[2], userIds[0], 'Love that desk pad texture Alex. Where did you source the linen?', '-5 hours');
  insertComment.run(postIds[3], userIds[2], 'Will be there on opening night! The ash glaze texture looks poetic.', '-7 hours');

  // Insert Notifications for Elena
  const insertNotification = db.prepare(`
    INSERT INTO notifications (user_id, actor_id, type, post_id, message, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now', ?))
  `);

  insertNotification.run(userIds[0], userIds[2], 'like', postIds[0], 'liked your photo from Milan Design District', '-2 hours');
  insertNotification.run(userIds[0], userIds[1], 'comment', postIds[0], 'commented: "Absolute architectural masterclass..."', '-1 hour');
  insertNotification.run(userIds[0], userIds[4], 'follow', null, 'started following you', '-3 hours');

  // Insert Direct Messages between creators
  const insertMessage = db.prepare(`
    INSERT INTO messages (sender_id, receiver_id, content, is_read, created_at)
    VALUES (?, ?, ?, ?, datetime('now', ?))
  `);

  // Conversation between Elena (0) and Alex (1)
  insertMessage.run(userIds[1], userIds[0], 'Hey Elena! Loved your architectural shoot from Milan.', 1, '-3 hours');
  insertMessage.run(userIds[0], userIds[1], 'Thanks Alex! We spent three weeks perfecting the natural light angle.', 1, '-2 hours');
  insertMessage.run(userIds[1], userIds[0], 'It really shows. Are you available for a 3D collaboration next week?', 0, '-45 minutes');

  // Conversation between Elena (0) and Sophia (2)
  insertMessage.run(userIds[2], userIds[0], 'Elena, are you traveling to Norway for the winter exhibition?', 1, '-5 hours');
  insertMessage.run(userIds[0], userIds[2], 'Yes! Flying in on Thursday. We should grab coffee in Oslo ☕', 1, '-4 hours');

  // Conversation between Alex (1) and Marcus (3)
  insertMessage.run(userIds[3], userIds[1], 'Hey Alex, that modular setup audio track is exported in 24-bit 96kHz.', 1, '-6 hours');
  insertMessage.run(userIds[1], userIds[3], 'Awesome Marcus! Syncing it to our prototype now.', 1, '-5 hours');

  console.log('NewGram database seeded successfully with users, stories, posts, likes, comments, bookmarks, and messages.');
}

module.exports = {
  db,
  initDatabase,
  seedDatabase,
  hashPassword
};
