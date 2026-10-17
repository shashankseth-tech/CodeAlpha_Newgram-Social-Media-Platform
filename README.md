# 🖤 NewGram — A Modern Visual Social Network

NewGram is a modern, minimalist social media platform inspired by visual storytelling, community interaction, and contemporary UI design. It combines a premium glassmorphism interface with social networking features to deliver an engaging user experience.

## ✨ Features

### 📸 Social Feed
- Create and share posts with text and images.
- Like and unlike posts with interactive feedback.
- Comment on posts and participate in discussions.
- Switch between all posts and content from followed users.

### 👤 User Profiles
- User registration, login, and profile management.
- Custom profile pictures, bios, cover images, and profile details.
- View user posts, followers, and following.
- Follow and unfollow other users.
- Search for creators and discover new profiles.

### 🎬 Stories & Reels
- Interactive stories carousel and story viewer.
- Vertical reels-style browsing experience.
- Creator interactions directly from reels.

### 💬 Messaging
- Direct messaging interface.
- Conversation lists and unread message indicators.
- Quick emoji reactions.

### 🧭 Explore & Discovery
- Bento Grid-inspired Explore page.
- Trending hashtags and user search.
- Daily community poll.
- Discover content and creators.

### ⚙️ Settings & Personalization
- Edit profile information and appearance.
- Dark and light themes.
- Privacy and notification preferences.
- Download account information as JSON.

### 🛡️ Admin Dashboard
- Dedicated administration interface.
- User management and account moderation.
- Post and comment moderation.
- Platform statistics and database overview.
- Database export functionality.

## 🎨 UI & Design

- Modern glassmorphism design with subtle neumorphism accents.
- Minimalist visual layout and responsive components.
- Dark and light themes.
- Smooth transitions and interactive animations.
- Responsive experience for desktop and mobile screens.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| HTML5 | Application structure |
| CSS3 | Styling, responsive layouts, and visual effects |
| Vanilla JavaScript | Frontend interactions and API integration |
| Node.js | JavaScript runtime |
| Express.js | Backend server and REST API |
| SQLite3 | Relational SQL database |
| better-sqlite3 | SQLite database integration |
| Crypto module | Password hashing and token generation |

## 📂 Project Structure

```text
Social Media-CA/
├── public/
│   ├── index.html
│   ├── admin.html
│   ├── style.css
│   └── app.js
├── server.js
├── db.js
├── view-db.js
├── newgram.db
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

*Note: The directory structure above reflects the documented project layout. Some files may vary depending on your current version.*

## 🚀 Getting Started

### Prerequisites

Install the following:

- [Node.js](https://nodejs.org/) — version 18 or higher recommended.
- npm — included with Node.js.

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/codealpha_project.git
cd codealpha_project
```

Replace `YOUR_USERNAME` with your GitHub username.

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

Create a `.env` file if your application is configured to use environment variables. Keep secrets out of version control.

If an `.env.example` file is provided, use it as the configuration template.

**4. Start the application**

```bash
npm start
```

**5. Open NewGram**

Visit:

```text
http://localhost:3000
```

The application is served locally by the Express.js server.

## 🗄️ Database

NewGram uses **SQLite3**, a lightweight relational SQL database.

- Database file: `newgram.db`
- Database integration: `better-sqlite3`
- Database initialization and schema setup: `db.js`
- Journal mode: WAL (Write-Ahead Logging)

The database stores application records such as users, posts, comments, likes, and follower relationships, along with other features implemented in the project.

## 🔐 Authentication & Security

- Login and registration endpoints.
- Password hashing.
- Session-token-based authentication.
- Protected administrative API endpoints.
- Role-based access checks for admin functionality.

**Security note:** Review authentication, authorization, and password-hashing implementations before deploying publicly. Use strong environment-based credentials, never commit real secrets, and restrict sensitive administrative operations.

## 🔑 Demo Access

For local testing, use demo accounts documented in the project setup instructions, if available.

For administrative access, configure the admin credentials securely through environment variables. Do not rely on default credentials for a public deployment.

## 🧪 Testing

Before deployment, verify the following:

- Registration and login.
- Creating and deleting posts.
- Liking posts and adding comments.
- Following and unfollowing users.
- Profile updates and search.
- Admin authorization and restricted API access.
- Database persistence after restarting the server.

## 🎯 Project Objective

NewGram explores the development of a full-stack social networking application using web technologies, a REST API, and a relational database. It demonstrates frontend design, backend development, database integration, and social interaction workflows.

## 🔮 Future Improvements

- Real-time notifications and messaging.
- Improved media upload and storage.
- Feed ranking and personalization.
- Enhanced content moderation.
- Automated tests and deployment workflows.

## 📄 License

This project is intended for educational and portfolio purposes. Add a `LICENSE` file if you want to specify formal reuse and distribution terms.

---

**Built with ❤️ using HTML, CSS, JavaScript, Node.js, Express.js, and SQLite.**
