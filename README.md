# 🖤 NewGram — High-Performance Visual Social Network

A modern, minimalist visual social platform inspired by **Instagram, Threads & Bento UI**, engineered with pure **HTML5, Vanilla CSS3 (Glassmorphism + Neumorphism accents), and Modular JavaScript** on the frontend, powered by **Express.js with SQLite3 (WAL mode)** on the backend.

---

## ⚡ Quick Start & Running Locally

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** (included with Node.js)

### 2. Installation & Launch
```bash
# Clone the repository and navigate into the directory
cd "Social Media-CA"

# Install dependencies (express, better-sqlite3, cors)
npm install

# Start the application server
npm start
```
The server will start at: **`http://localhost:3000`**

---

## 🔑 Demo & Admin Credentials

Anyone inspecting or testing the application can log in immediately using the following accounts:

### 🛡️ Master Administrator Account
| Parameter | Value | Details |
| :--- | :--- | :--- |
| **Username** | `admin` *(or `admin@newgram.com`)* | Super Admin credentials |
| **Password** | `admin123` | Configurable via `ADMIN_PASSWORD` environment variable |
| **Access** | Full Admin Console | Reveals **Admin Console** in NewGram More Menu and unlocks `/admin` |

> [!TIP]
> **Production Note:** When deploying live, set `ADMIN_PASSWORD=your_secure_password node server.js` to change the master admin password securely without touching code.

---

### 🎨 Demo Creator Accounts
All demo accounts come pre-seeded with profile bios, avatars, cover photos, high-resolution visual posts, reels, and stories:

| Creator Name | Handle / Username | Password | Specialty & Bio |
| :--- | :--- | :--- | :--- |
| **Elena Rostova** | `elena` (`@elena_visuals`) | `password123` | Architectural & Minimalist Photographer (Milan) |
| **Alex Rivera** | `alex` (`@alex_minimal`) | `password123` | Design Systems & Brutalist UI Designer (Tokyo) |
| **Sophia Kim** | `sophia` (`@sophia_lens`) | `password123` | Analog & Ambient Film Creator (Oslo) |
| **Marcus Vance** | `marcus` (`@marcus_vance`) | `password123` | Modular Synth & Sound Designer (Berlin) |
| **Clara Oswald** | `clara` (`@clara_noir`) | `password123` | Ceramicist & Gallery Curator (Paris) |

> [!NOTE]
> You can also click **"Create Free Account"** inside the authentication dialog to register an authentic new user account with custom avatar, handle, bio, and password.

---

## 🔒 Security & Data Leak Prevention Architecture

NewGram is engineered with enterprise-grade data protection to ensure safe live deployment without risk of data leaks:

1. **Role-Based Visibility (Admin Console Privacy):**
   - For regular users and unauthenticated guests, all **Admin Console** navigation items (in the sidebar "More" dropdown and in Settings) are **completely hidden**.
   - Admin options are dynamically revealed **only** when an authorized Admin account (`admin` or accounts with `ADMIN` badge) logs in.

2. **Strict API Endpoint Protection:**
   - Every `/api/admin/*` endpoint is locked behind `requireAdminAuth` middleware.
   - Any unauthenticated public requests or regular user requests are rejected immediately with **`401 Unauthorized`** or **`403 Forbidden`**.

3. **Zero Password Leakage:**
   - Password hashes are **never returned** by `/api/admin/users` or any user querying endpoint. Column projection explicitly sanitizes and redacts credential fields.
   - User passwords in `newgram.db` are hashed using cryptographic **Salted SHA-256** digests.

4. **Hardened Admin Gate (`/admin`):**
   - Removed any hardcoded credential pre-fills and removed 1-click bypass buttons.
   - Requires cryptographic session token verification via `/api/admin/verify`.
   - Admin sessions feature Single Sign-On (SSO): logging in as `admin` on the main NewGram portal unlocks the `/admin` portal simultaneously.

---

## 🌟 Core Application Features

### 1. 📸 Visual Social Feed & Interactive Cards
- **High-Contrast Photography**: Optimized edge-to-edge layout with location metadata and ambient tags.
- **Double-Tap to Like**: Instant heart pop-up animation and real-time like counter synchronization.
- **In-Feed Quick Composer**: Post moments, thoughts, custom photo URLs, and music tags (`🎵 Track Title`) directly from the top of the feed without opening modals.
- **Feed Subtabs**: Toggle seamlessly between **"All Visuals"** and **"Following"** feed streams.
- **Inline Comments Drawer**: Expandable comment threads with instantaneous posting and timestamp formatting.

### 2. 🎬 Full-Screen Vertical Reels
- **Immersive Video/Visual Reels**: High-impact vertical format with smooth scrolling between creator moments.
- **Keyboard & Navigation Controls**: Navigate effortlessly using `ArrowUp` / `ArrowDown` or `J` / `K` keys, or the floating control buttons.
- **Interactive Audio**: Audio badge with mute/unmute simulation and sound waveform indicator.
- **Reels Engagement**: Like counter, comments drawer, and direct creator follow button directly in the overlay.

### 3. ⭕ Stories Carousel & Animated Story Viewer
- Horizontal creator circles with gradient story rings and unread status.
- **"+ Your Story"**: Quick story uploader with preset aesthetic images or custom photo URL.
- **Immersive Viewer Modal**: Auto-advancing animated progress bar, creator avatar, timestamp, and captions.

### 4. 🧭 Bento Grid Explore & Discovery Hub
- **Bento Grid Layout**: Asymmetric, visually balanced grid featuring trending visual highlights.
- **Daily Dialogue Poll**: Interactive community poll with live percentage calculation.
- **Trending Hashtags**: Clickable hashtag pills (`#minimalism`, `#monochrome`, `#streetlife`, `#design`) that instantly filter the feed.
- **Instant Search**: Real-time search by creator name, handle, or caption keywords.

### 5. 💬 Direct Messaging & Chat System
- **Split-Screen Chat Layout**: Conversation threads with unread counters, online status, and timestamp formatting.
- **Continuous Auto-Reply Simulation**: Chat partners dynamically auto-reply to messages matching their persona and specialty, creating an engaging, living social environment.
- **Floating Messages Dock**: Quick-access bottom dock showing unread message count.
- **Quick Reactions**: Tap reaction emojis (`❤️`, `🔥`, `👏`, `✨`) to reply quickly.
- **Creator Search & Shelf**: Search any creator in the network to start a new direct conversation.

### 6. 👤 Creator Profiles & 3x3 Grid
- Detailed profile showcase with cover photo, avatar, verified specialty badges, follower stats, and website links.
- **Grid vs Feed Toggle**: Switch between classic **3x3 Photo Grid** (with hover stats for likes & comments) and full-card feed view.
- **Followers & Following Modals**: Inspect network connections with interactive follow/unfollow buttons.
- **Highlight Circles**: Curated visual collections (*Moments*, *Studio*, *Archive*).

### 7. ⚙️ Settings Hub
- **Edit Profile**: Update display name, bio (with 150-char counter), specialty badge, location, website, avatar URL, and cover image.
- **Security**: Update password securely and toggle 2FA protection simulation.
- **Privacy Controls**: Private account toggle, message request permissions, offensive comment filters, and activity status.
- **Notification Preferences**: Pause all notifications, or customize likes, comments, and messages alerts.
- **Appearance & Theme**: Instant toggle between **Obsidian Black Mode (OLED)** and **Pristine White Mode**, plus compact feed option.
- **Data & Storage**: One-click **Download Your Information** export (structured JSON backup of all account records).

### 8. 🛠️ Dedicated Admin Console (`/admin`)
- **System Metrics Overview**: Live database size counter, total counts for users, posts, comments, likes, messages, and stories.
- **User Management**: View all registered users, inspection modal, and one-click account deletion with cascade cleanup.
- **Post Moderation**: View all community posts with full metadata and delete offensive content.
- **Message & Comment Audit**: Live monitoring of discussions and comments.
- **Direct SQL Terminal**: Execute ad-hoc queries directly against `newgram.db` with query execution timer and table output.
- **Database Backup Export**: Authenticated JSON export of the entire database state.

---

## 📂 Project Directory Structure

```text
Social Media-CA/
├── newgram.db            # SQLite database file (WAL mode)
├── package.json          # Node dependencies & start scripts
├── server.js             # Express API backend, auth middleware & routes
├── db.js                 # SQLite schema initialization, table setups & seed data
├── view-db.js            # CLI utility script to inspect database tables
├── README.md             # Project documentation & credentials guide
└── public/
    ├── index.html        # Main NewGram social media application interface
    ├── admin.html        # Dedicated Database & Admin Control Center
    ├── style.css         # Complete Glassmorphism, Neumorphism & dark theme styles
    └── app.js            # Frontend client-side state machine & API handlers
```

---

## 🛠️ API Endpoints Summary

### Authentication & Account
- `POST /api/auth/register` — Register a new account
- `POST /api/auth/login` — Log in as creator or master admin
- `GET  /api/auth/me` — Verify current session user
- `POST /api/auth/logout` — Terminate session

### Social Interactions
- `GET    /api/feed` — Get paginated/filtered feed posts
- `POST   /api/posts` — Create a new post
- `DELETE /api/posts/:id` — Delete user's own post
- `POST   /api/posts/:id/like` — Toggle like state
- `POST   /api/posts/:id/bookmark` — Toggle save/bookmark state
- `POST   /api/posts/:id/comments` — Add comment to post
- `GET    /api/stories` — Get active stories
- `POST   /api/stories` — Publish a new story
- `GET    /api/conversations` — Get chat threads
- `POST   /api/messages` — Send direct message
- `POST   /api/messages/reply` — Trigger automated partner reply

### Admin Management *(Protected by `requireAdminAuth`)*
- `POST /api/admin/login` — Authenticate master administrator
- `GET  /api/admin/verify` — Validate active admin session token
- `GET  /api/admin/overview` — System & database health metrics
- `GET  /api/admin/users` — List all users (passwords redacted)
- `DELETE /api/admin/users/:id` — Delete user and cascaded data
- `GET  /api/admin/posts` — List all community posts
- `DELETE /api/admin/posts/:id` — Delete any post as admin
- `POST /api/admin/query` — Execute direct SQL query
- `GET  /api/admin/export` — Download full database export archive

---

## 📄 License
This project is open-source and free for educational and portfolio demonstration purposes.
All visual photography assets are dynamically sourced from Unsplash with permissible licenses.
