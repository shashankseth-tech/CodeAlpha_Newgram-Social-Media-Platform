/* ==========================================================================
   NEWGRAM — APPLICATION LOGIC
   Instagram-style Visual Social Media Platform with Black & White Aesthetics
   ========================================================================== */

// Application State
const state = {
  currentUserId: parseInt(localStorage.getItem('newgram_current_user_id'), 10) || 1,
  currentUser: null,
  authToken: localStorage.getItem('newgram_auth_token') || null,
  isAuthenticated: !!localStorage.getItem('newgram_auth_token'),
  isAdmin: false,
  adminToken: localStorage.getItem('newgram_admin_token') || null,
  allUsers: [],
  activeView: 'feed', // 'feed' | 'explore' | 'messages' | 'saved' | 'notifications' | 'profile'
  feedFilter: 'all',  // 'all' | 'following'
  profileViewUserId: null,
  profileDisplayMode: 'grid', // 'grid' | 'feed'
  activeTagFilter: null,
  theme: localStorage.getItem('newgram_theme') || 'dark',
  stories: [],
  selectedPostMediaUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  selectedStoryMediaUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
  storyTimer: null,
  activeChatPartnerId: null,
  selectedNewChatUserId: null,
  userNotes: {
    1: "What's new...",
    2: "40% speed boost ⚡",
    3: "Oslo morning light ☕",
    4: "Analog mixdown 🎚️",
    5: "Galerie Noir 🕊️"
  }
};

// DOM References
const dom = {
  // Navigation
  navFeed: document.getElementById('nav-feed'),
  navExplore: document.getElementById('nav-explore'),
  navReels: document.getElementById('nav-reels'),
  navMessages: document.getElementById('nav-messages'),
  chatUnreadBadge: document.getElementById('chat-unread-badge'),
  btnOpenCreateModal: document.getElementById('btn-open-create-modal'),
  navNotifications: document.getElementById('nav-notifications'),
  navSaved: document.getElementById('more-item-saved') || document.getElementById('nav-saved'),
  navProfile: document.getElementById('nav-profile'),
  brandHomeLink: document.getElementById('brand-home-link'),
  unreadCountBadge: document.getElementById('unread-count'),
  sidebarUserAvatar: document.getElementById('sidebar-user-avatar'),
  btnMenuMore: document.getElementById('btn-menu-more'),
  moreMenuPopover: document.getElementById('more-menu-popover'),
  moreItemSettings: document.getElementById('more-item-settings'),
  moreItemSaved: document.getElementById('more-item-saved'),
  moreItemTheme: document.getElementById('more-item-theme'),
  moreItemAdmin: document.getElementById('more-item-admin'),
  moreItemAuth: document.getElementById('more-item-auth'),

  // Floating Messages Dock (Image 1)
  floatingMessagesDock: document.getElementById('floating-messages-dock'),
  floatingDockBadge: document.getElementById('floating-dock-badge'),

  // Theme & Account Pill
  btnThemeToggle: document.getElementById('more-item-theme') || document.getElementById('btn-theme-toggle'),
  themeLabel: document.getElementById('more-theme-label') || document.getElementById('theme-label'),
  btnSwitchAccountPill: document.getElementById('btn-switch-account-pill'),
  activeUserAvatar: document.getElementById('active-user-avatar'),
  activeUserName: document.getElementById('active-user-name'),
  activeUserHandle: document.getElementById('active-user-handle'),

  // Mobile Header
  mobileCreateBtn: document.getElementById('mobile-create-btn'),
  mobileChatBtn: document.getElementById('mobile-chat-btn'),
  mobileNotifBtn: document.getElementById('mobile-notif-btn'),

  // Views
  viewFeed: document.getElementById('view-feed'),
  viewExplore: document.getElementById('view-explore'),
  viewReels: document.getElementById('view-reels'),
  reelsFeedContainer: document.getElementById('reels-feed-container'),
  btnReelPrev: document.getElementById('btn-reel-prev'),
  btnReelNext: document.getElementById('btn-reel-next'),
  viewMessages: document.getElementById('view-messages'),
  viewSaved: document.getElementById('view-saved'),
  viewNotifications: document.getElementById('view-notifications'),
  viewProfile: document.getElementById('view-profile'),
  viewSettings: document.getElementById('view-settings'),

  // Chat Elements (Image 2)
  chatAccountSelector: document.getElementById('chat-account-selector'),
  chatCurrentUserHandle: document.getElementById('chat-current-user-handle'),
  btnOpenNewChat: document.getElementById('btn-open-new-chat'),
  chatSearchInput: document.getElementById('chat-search-input'),
  chatNotesShelf: document.getElementById('chat-notes-shelf'),
  tabDirectMessages: document.getElementById('tab-direct-messages'),
  tabDirectRequests: document.getElementById('tab-direct-requests'),
  chatThreadsList: document.getElementById('chat-threads-list'),
  chatPlaceholder: document.getElementById('chat-placeholder'),
  btnChatStartDirect: document.getElementById('btn-chat-start-direct'),
  chatConversationArea: document.getElementById('chat-conversation-area'),
  chatPartnerInfo: document.getElementById('chat-partner-info'),
  chatHeaderAvatar: document.getElementById('chat-header-avatar'),
  chatHeaderName: document.getElementById('chat-header-name'),
  btnViewChatPartnerProfile: document.getElementById('btn-view-chat-partner-profile'),
  chatMessagesStream: document.getElementById('chat-messages-stream'),
  chatTextInput: document.getElementById('chat-text-input'),
  btnSendMessage: document.getElementById('btn-send-message'),
  chatTypingRow: document.getElementById('chat-typing-row'),
  chatTypingText: document.getElementById('chat-typing-text'),

  // New Chat Modal
  modalNewChat: document.getElementById('modal-new-chat'),
  btnCancelNewChat: document.getElementById('btn-cancel-new-chat'),
  btnStartSelectedChat: document.getElementById('btn-start-selected-chat'),
  newChatSearchInput: document.getElementById('new-chat-search-input'),
  newChatUserList: document.getElementById('new-chat-user-list'),

  // Feed & Composer Elements
  infeedComposerAvatar: document.getElementById('infeed-composer-avatar'),
  infeedQuickText: document.getElementById('infeed-quick-text'),
  btnInfeedAddPhoto: document.getElementById('btn-infeed-add-photo'),
  btnInfeedAddMusic: document.getElementById('btn-infeed-add-music'),
  btnInfeedAddTag: document.getElementById('btn-infeed-add-tag'),
  btnInfeedPost: document.getElementById('btn-infeed-post'),
  composerExpandableRow: document.getElementById('composer-expandable-row'),
  infeedPhotoUrl: document.getElementById('infeed-photo-url'),
  infeedMusicTag: document.getElementById('infeed-music-tag'),
  storiesStripContainer: document.querySelector('.stories-strip-container'),
  storiesStrip: document.getElementById('stories-strip'),
  btnStoriesPrev: document.getElementById('btn-stories-prev'),
  btnStoriesNext: document.getElementById('btn-stories-next'),
  myStoryAvatar: document.getElementById('my-story-avatar'),
  btnAddStory: document.getElementById('btn-add-story'),
  subtabAll: document.getElementById('subtab-all'),
  subtabFollowing: document.getElementById('subtab-following'),
  tagFilterIndicator: document.getElementById('tag-filter-indicator'),
  activeTagText: document.getElementById('active-tag-text'),
  btnRemoveTagFilter: document.getElementById('btn-remove-tag-filter'),
  postsContainer: document.getElementById('posts-container'),

  // Aside Elements
  asideUserAvatar: document.getElementById('aside-user-avatar'),
  asideUserHandle: document.getElementById('aside-user-handle'),
  asideUserName: document.getElementById('aside-user-name'),
  btnAsideSwitch: document.getElementById('btn-aside-switch'),
  btnSeeAllSuggestions: document.getElementById('btn-see-all-suggestions'),
  btnCreatePersonaLink: document.getElementById('btn-create-persona-link'),
  personaList: document.getElementById('persona-list'),
  whoToFollowList: document.getElementById('who-to-follow-list'),
  btnResetDb: document.getElementById('btn-reset-db'),

  // Explore Elements
  exploreSearchInput: document.getElementById('explore-search-input'),
  btnClearSearch: document.getElementById('btn-clear-search'),
  exploreTagsCloud: document.getElementById('explore-tags-cloud'),
  explorePostsContainer: document.getElementById('explore-posts-container'),
  savedPostsContainer: document.getElementById('saved-posts-container'),

  // Notifications
  notificationsList: document.getElementById('notifications-list'),
  btnMarkAllRead: document.getElementById('btn-mark-all-read'),

  // Profile Elements
  profileViewAvatar: document.getElementById('profile-view-avatar'),
  profileViewHandle: document.getElementById('profile-view-handle'),
  profileActionButtons: document.getElementById('profile-action-buttons'),
  statPostsCount: document.getElementById('stat-posts-count'),
  statFollowersCount: document.getElementById('stat-followers-count'),
  statFollowingCount: document.getElementById('stat-following-count'),
  btnViewFollowers: document.getElementById('btn-view-followers'),
  btnViewFollowing: document.getElementById('btn-view-following'),
  profileViewName: document.getElementById('profile-view-name'),
  profileViewBadge: document.getElementById('profile-view-badge'),
  profileViewBio: document.getElementById('profile-view-bio'),
  profileViewLocation: document.getElementById('profile-view-location'),
  profileViewWebsite: document.getElementById('profile-view-website'),
  btnProfileGridTab: document.getElementById('btn-profile-grid-tab'),
  btnProfileFeedTab: document.getElementById('btn-profile-feed-tab'),
  profileGridContainer: document.getElementById('profile-grid-container'),
  profileFeedContainer: document.getElementById('profile-feed-container'),

  // Modals
  modalCreatePost: document.getElementById('modal-create-post'),
  btnCancelCreatePost: document.getElementById('btn-cancel-create-post'),
  btnPublishPost: document.getElementById('btn-publish-post'),
  createPreviewImg: document.getElementById('create-preview-img'),
  customImageInput: document.getElementById('custom-image-input'),
  btnApplyCustomImage: document.getElementById('btn-apply-custom-image'),
  createModalAuthorAvatar: document.getElementById('create-modal-author-avatar'),
  createModalAuthorHandle: document.getElementById('create-modal-author-handle'),
  createCaptionInput: document.getElementById('create-caption-input'),
  createLocationInput: document.getElementById('create-location-input'),
  createTagsInput: document.getElementById('create-tags-input'),

  modalStoryViewer: document.getElementById('modal-story-viewer'),
  storyViewerAvatar: document.getElementById('story-viewer-avatar'),
  storyViewerName: document.getElementById('story-viewer-name'),
  storyViewerTime: document.getElementById('story-viewer-time'),
  storyViewerImg: document.getElementById('story-viewer-img'),
  storyViewerCaption: document.getElementById('story-viewer-caption'),
  storyProgressFill: document.getElementById('story-progress-fill'),
  btnCloseStory: document.getElementById('btn-close-story'),

  modalAddStory: document.getElementById('modal-add-story'),
  btnCancelAddStory: document.getElementById('btn-cancel-add-story'),
  btnSubmitStory: document.getElementById('btn-submit-story'),
  storyMediaUrl: document.getElementById('story-media-url'),
  storyCaption: document.getElementById('story-caption'),

  modalEditProfile: document.getElementById('modal-edit-profile'),
  btnCancelEdit: document.getElementById('btn-cancel-edit'),
  btnSaveEditProfile: document.getElementById('btn-save-edit-profile'),
  editName: document.getElementById('edit-name'),
  editBio: document.getElementById('edit-bio'),
  editAvatar: document.getElementById('edit-avatar'),
  editLocation: document.getElementById('edit-location'),
  editWebsite: document.getElementById('edit-website'),

  modalCreateUser: document.getElementById('modal-create-user'),
  btnCancelCreateUser: document.getElementById('btn-cancel-create-user'),
  btnSubmitCreateUser: document.getElementById('btn-submit-create-user'),
  newUsername: document.getElementById('new-username'),
  newName: document.getElementById('new-name'),
  newBio: document.getElementById('new-bio'),
  newAvatar: document.getElementById('new-avatar'),

  modalNetwork: document.getElementById('modal-network'),
  networkModalTitle: document.getElementById('network-modal-title'),
  networkModalList: document.getElementById('network-modal-list'),
  btnCloseNetworkModal: document.getElementById('btn-close-network-modal'),

  // Authentication Elements
  btnSidebarAuth: document.getElementById('more-item-auth') || document.getElementById('btn-sidebar-auth'),
  sidebarAuthLabel: document.getElementById('more-auth-label') || document.getElementById('sidebar-auth-label'),
  sidebarAuthIconLogin: document.getElementById('more-auth-icon-login') || document.getElementById('sidebar-auth-icon-login'),
  sidebarAuthIconLogout: document.getElementById('more-auth-icon-logout') || document.getElementById('sidebar-auth-icon-logout'),
  modalAuth: document.getElementById('modal-auth'),
  btnCloseAuthModal: document.getElementById('btn-close-auth-modal'),
  authTabLogin: document.getElementById('auth-tab-login'),
  authTabRegister: document.getElementById('auth-tab-register'),
  authNoticeBanner: document.getElementById('auth-notice-banner'),
  formAuthLogin: document.getElementById('form-auth-login'),
  formAuthRegister: document.getElementById('form-auth-register'),
  loginUsername: document.getElementById('login-username'),
  loginPassword: document.getElementById('login-password'),
  btnToggleLoginPass: document.getElementById('btn-toggle-login-pass'),
  btnSubmitLogin: document.getElementById('btn-submit-login'),
  demoCreatorsShelf: document.getElementById('demo-creators-shelf'),
  registerName: document.getElementById('register-name'),
  registerUsername: document.getElementById('register-username'),
  registerPassword: document.getElementById('register-password'),
  btnToggleRegPass: document.getElementById('btn-toggle-reg-pass'),
  registerBio: document.getElementById('register-bio'),
  registerAvatar: document.getElementById('register-avatar'),
  btnSubmitRegister: document.getElementById('btn-submit-register'),

  // Settings Hub Elements
  settingsCurrentUserPill: document.getElementById('settings-current-user-pill'),
  settingsAvatarPreview: document.getElementById('settings-avatar-preview'),
  settingsAvatarHandle: document.getElementById('settings-avatar-handle'),
  settingsInputName: document.getElementById('settings-input-name'),
  settingsInputUsername: document.getElementById('settings-input-username'),
  settingsInputBadge: document.getElementById('settings-input-badge'),
  settingsInputBio: document.getElementById('settings-input-bio'),
  settingsBioCounter: document.getElementById('settings-bio-counter'),
  settingsInputLocation: document.getElementById('settings-input-location'),
  settingsInputWebsite: document.getElementById('settings-input-website'),
  settingsInputAvatar: document.getElementById('settings-input-avatar'),
  settingsInputCover: document.getElementById('settings-input-cover'),
  btnSaveSettingsProfile: document.getElementById('btn-save-settings-profile'),
  settingsPassCurrent: document.getElementById('settings-pass-current'),
  settingsPassNew: document.getElementById('settings-pass-new'),
  settingsPassConfirm: document.getElementById('settings-pass-confirm'),
  btnUpdateSettingsPassword: document.getElementById('btn-update-settings-password'),
  settingsToggle2FA: document.getElementById('settings-toggle-2fa'),
  btnDangerDeleteAccount: document.getElementById('btn-danger-delete-account'),
  settingsTogglePrivate: document.getElementById('settings-toggle-private'),
  settingsSelectMessages: document.getElementById('settings-select-messages'),
  settingsToggleFilterComments: document.getElementById('settings-toggle-filter-comments'),
  settingsToggleActivityStatus: document.getElementById('settings-toggle-activity-status'),
  btnSaveSettingsPrivacy: document.getElementById('btn-save-settings-privacy'),
  settingsToggleNotifPause: document.getElementById('settings-toggle-notif-pause'),
  settingsToggleNotifLikes: document.getElementById('settings-toggle-notif-likes'),
  settingsToggleNotifComments: document.getElementById('settings-toggle-notif-comments'),
  settingsToggleNotifMessages: document.getElementById('settings-toggle-notif-messages'),
  settingsToggleNotifFollowers: document.getElementById('settings-toggle-notif-followers'),
  btnSaveSettingsNotifications: document.getElementById('btn-save-settings-notifications'),
  themeOptDark: document.getElementById('theme-opt-dark'),
  themeOptLight: document.getElementById('theme-opt-light'),
  settingsToggleHqMedia: document.getElementById('settings-toggle-hq-media'),
  settingsToggleAutoplay: document.getElementById('settings-toggle-autoplay'),
  settingsToggleCompactFeed: document.getElementById('settings-toggle-compact-feed'),
  btnSaveSettingsAppearance: document.getElementById('btn-save-settings-appearance'),
  btnDownloadMyData: document.getElementById('btn-download-my-data'),
  storageCacheSize: document.getElementById('storage-cache-size'),
  btnClearLocalCache: document.getElementById('btn-clear-local-cache'),
  btnHelpGuidelines: document.getElementById('btn-help-guidelines'),
  btnHelpTerms: document.getElementById('btn-help-terms'),
  btnHelpPrivacy: document.getElementById('btn-help-privacy'),
  settingsAdminRow: document.getElementById('settings-admin-row'),

  toastContainer: document.getElementById('toast-container')
};

// ==========================================================================
// API CLIENT
// ==========================================================================

async function api(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'x-user-id': state.currentUserId.toString(),
    ...(options.headers || {})
  };

  if (state.authToken) {
    headers['Authorization'] = `Bearer ${state.authToken}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  dom.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 250);
  }, 2800);
}

function selectBentoPoll(btn) {
  const parent = btn.parentElement;
  if (!parent) return;
  parent.querySelectorAll('.bento-poll-btn').forEach(b => {
    b.classList.remove('selected');
    const pct = b.querySelector('.poll-percent');
    if (pct) pct.style.opacity = '0.7';
  });
  btn.classList.add('selected');
  const activePct = btn.querySelector('.poll-percent');
  if (activePct) activePct.style.opacity = '1';
  showToast('✨ Vote recorded for Daily Dialogue!');
}
window.selectBentoPoll = selectBentoPoll;


// ==========================================================================
// THEME & INITIALIZATION
// ==========================================================================

function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('newgram_theme', theme);
  if (dom.themeLabel) {
    dom.themeLabel.textContent = theme === 'dark' ? 'White Mode' : 'Black Mode';
  }
}

function toggleTheme() {
  const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  showToast(nextTheme === 'light' ? 'Pristine White Mode on ☀️' : 'Obsidian Black Mode on 🌑');
}

// ==========================================
// AUTHENTICATION & SESSION MANAGEMENT
// ==========================================

function isGenuineLoggedIn() {
  return !!state.authToken && state.isAuthenticated && state.currentUserId > 5;
}

function updateAuthUI() {
  const isGenuine = isGenuineLoggedIn();
  const isAdmin = !!(state.isAdmin || (state.currentUser && (state.currentUser.badge === 'ADMIN' || state.currentUser.is_admin || state.currentUser.username === 'admin')));

  if (dom.moreItemAdmin) {
    dom.moreItemAdmin.classList.toggle('hidden', !isAdmin);
  }
  if (dom.settingsAdminRow) {
    dom.settingsAdminRow.classList.toggle('hidden', !isAdmin);
  }
  if (dom.sidebarAuthLabel) {
    dom.sidebarAuthLabel.textContent = isGenuine ? 'Log Out' : 'Log In';
  }
  if (dom.sidebarAuthIconLogin && dom.sidebarAuthIconLogout) {
    dom.sidebarAuthIconLogin.classList.toggle('hidden', isGenuine);
    dom.sidebarAuthIconLogout.classList.toggle('hidden', !isGenuine);
  }
  if (dom.btnAsideSwitch) {
    dom.btnAsideSwitch.textContent = isGenuine ? 'Log Out' : 'Switch';
  }
}

async function checkAuthSession() {
  if (state.adminToken) {
    try {
      const vRes = await fetch('/api/admin/verify', {
        headers: { 'Authorization': `Bearer ${state.adminToken}` }
      });
      if (vRes.ok) {
        const vData = await vRes.json();
        if (vData.authenticated) {
          state.isAdmin = true;
        } else {
          state.isAdmin = false;
          state.adminToken = null;
          localStorage.removeItem('newgram_admin_token');
        }
      } else {
        state.isAdmin = false;
        state.adminToken = null;
        localStorage.removeItem('newgram_admin_token');
      }
    } catch (err) {
      state.isAdmin = false;
    }
  }

  if (state.authToken) {
    try {
      const meRes = await api('/api/auth/me');
      if (meRes && meRes.user) {
        state.currentUser = meRes.user;
        state.currentUserId = meRes.user.id;
        state.isAuthenticated = true;
        if (meRes.user.badge === 'ADMIN' || meRes.user.is_admin || meRes.user.username === 'admin') {
          state.isAdmin = true;
        }
        localStorage.setItem('newgram_current_user_id', meRes.user.id.toString());
      }
    } catch (err) {
      console.warn('Session verification failed:', err.message);
      state.authToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('newgram_auth_token');
    }
  } else {
    // If not authenticated, default to demo account 1 (Elena) if invalid or genuine user
    if (!state.currentUserId || state.currentUserId > 5) {
      state.currentUserId = 1;
      localStorage.setItem('newgram_current_user_id', '1');
    }
  }
  updateAuthUI();
}

function openAuthModal(defaultTab = 'login') {
  setAuthTab(defaultTab);
  showAuthNotice('');
  document.body.classList.add('auth-modal-open');
  if (dom.modalAuth && !dom.modalAuth.open) {
    dom.modalAuth.showModal();
  }
}

function closeAuthModal() {
  document.body.classList.remove('auth-modal-open');
  if (dom.modalAuth && dom.modalAuth.open) {
    dom.modalAuth.close();
  }
}

function setAuthTab(tab) {
  if (tab === 'login') {
    if (dom.authTabLogin) dom.authTabLogin.classList.add('active');
    if (dom.authTabRegister) dom.authTabRegister.classList.remove('active');
    if (dom.formAuthLogin) {
      dom.formAuthLogin.classList.remove('hidden');
      dom.formAuthLogin.style.display = 'flex';
    }
    if (dom.formAuthRegister) {
      dom.formAuthRegister.classList.add('hidden');
      dom.formAuthRegister.style.display = 'none';
    }
    showAuthNotice('');
    if (dom.loginUsername) {
      setTimeout(() => dom.loginUsername.focus(), 60);
    }
  } else {
    if (dom.authTabRegister) dom.authTabRegister.classList.add('active');
    if (dom.authTabLogin) dom.authTabLogin.classList.remove('active');
    if (dom.formAuthRegister) {
      dom.formAuthRegister.classList.remove('hidden');
      dom.formAuthRegister.style.display = 'flex';
    }
    if (dom.formAuthLogin) {
      dom.formAuthLogin.classList.add('hidden');
      dom.formAuthLogin.style.display = 'none';
    }
    showAuthNotice('');
    if (dom.registerName) {
      setTimeout(() => dom.registerName.focus(), 60);
    }
  }
}

function showAuthNotice(message, isError = true) {
  if (!dom.authNoticeBanner) return;
  if (!message) {
    dom.authNoticeBanner.textContent = '';
    dom.authNoticeBanner.className = 'auth-notice-banner hidden';
    return;
  }
  dom.authNoticeBanner.textContent = message;
  dom.authNoticeBanner.className = `auth-notice-banner ${isError ? 'error' : 'success'}`;
}

function renderDemoCreatorsShelf() {
  if (!dom.demoCreatorsShelf) return;
  const demoUsers = state.allUsers.slice(0, 4);
  if (demoUsers.length === 0) {
    dom.demoCreatorsShelf.innerHTML = '';
    return;
  }

  dom.demoCreatorsShelf.innerHTML = demoUsers.map(user => `
    <div class="demo-creator-chip" data-username="${escapeHtml(user.username)}" title="Log in as @${escapeHtml(user.username)}">
      <img src="${escapeHtml(user.avatar)}" class="demo-chip-avatar" alt="${escapeHtml(user.name)}">
      <div class="demo-chip-info">
        <span class="demo-chip-name">${escapeHtml(user.name)}</span>
        <span class="demo-chip-handle">${escapeHtml(user.handle)}</span>
      </div>
    </div>
  `).join('');

  dom.demoCreatorsShelf.querySelectorAll('.demo-creator-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const uname = chip.dataset.username;
      quickDemoLogin(uname);
    });
  });
}

async function quickDemoLogin(username) {
  try {
    showAuthNotice('');
    if (dom.btnSubmitLogin) {
      dom.btnSubmitLogin.disabled = true;
      dom.btnSubmitLogin.textContent = `Logging in as @${username}...`;
    }
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password: 'password123' })
    });
    applyLoginSuccess(res);
  } catch (err) {
    showAuthNotice(err.message || 'Demo login failed');
  } finally {
    if (dom.btnSubmitLogin) {
      dom.btnSubmitLogin.disabled = false;
      dom.btnSubmitLogin.textContent = 'Log In to NewGram';
    }
  }
}

async function handleLogin(e) {
  if (e) e.preventDefault();
  const username = dom.loginUsername.value.trim();
  const password = dom.loginPassword.value;

  if (!username) {
    showAuthNotice('Please enter your username or handle');
    return;
  }
  if (!password) {
    showAuthNotice('Please enter your password');
    return;
  }

  try {
    dom.btnSubmitLogin.disabled = true;
    dom.btnSubmitLogin.textContent = 'Verifying credentials...';
    showAuthNotice('');

    const res = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    applyLoginSuccess(res);
  } catch (err) {
    showAuthNotice(err.message || 'Invalid username or password');
  } finally {
    dom.btnSubmitLogin.disabled = false;
    dom.btnSubmitLogin.textContent = 'Log In to NewGram';
  }
}

async function handleRegister(e) {
  if (e) e.preventDefault();
  const name = dom.registerName.value.trim();
  const username = dom.registerUsername.value.trim();
  const password = dom.registerPassword.value;
  const bio = dom.registerBio.value.trim();
  const avatar = dom.registerAvatar.value.trim();

  if (!name) {
    showAuthNotice('Please enter your full name');
    return;
  }
  if (!username) {
    showAuthNotice('Please choose a handle / username');
    return;
  }
  if (!password || password.length < 4) {
    showAuthNotice('Password must be at least 4 characters');
    return;
  }

  try {
    dom.btnSubmitRegister.disabled = true;
    dom.btnSubmitRegister.textContent = 'Creating account...';
    showAuthNotice('');

    const res = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, username, password, bio, avatar })
    });

    if (!state.allUsers.find(u => u.id === res.user.id)) {
      state.allUsers.push(res.user);
    }

    applyLoginSuccess(res);
    showToast(`Welcome to NewGram, @${res.user.username}! 🎉`);
  } catch (err) {
    showAuthNotice(err.message || 'Registration failed');
  } finally {
    dom.btnSubmitRegister.disabled = false;
    dom.btnSubmitRegister.textContent = 'Create Free Account';
  }
}

function applyLoginSuccess(res) {
  state.authToken = res.token;
  state.currentUserId = res.user.id;
  state.currentUser = res.user;
  state.isAuthenticated = true;
  localStorage.setItem('newgram_auth_token', res.token);
  localStorage.setItem('newgram_current_user_id', res.user.id.toString());

  if (res.isAdmin || (res.user && (res.user.badge === 'ADMIN' || res.user.is_admin || res.user.username === 'admin'))) {
    state.isAdmin = true;
    if (res.adminToken) {
      state.adminToken = res.adminToken;
      localStorage.setItem('newgram_admin_token', res.adminToken);
    }
  } else {
    state.isAdmin = false;
    state.adminToken = null;
    localStorage.removeItem('newgram_admin_token');
  }

  closeAuthModal();
  updateAuthUI();
  setupActiveUser();

  if (state.activeView === 'feed') {
    loadFeed();
  } else if (state.activeView === 'messages') {
    loadConversations();
  } else if (state.activeView === 'profile') {
    loadProfile(state.currentUserId);
  }
  loadStories();
  loadSidebarWidgets();
  checkNotifications();
  checkChatUnread();
  showToast(`Welcome back, ${res.user.name}! 🖤`);
}

async function handleLogout() {
  try {
    await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
  } catch (e) {}

  state.authToken = null;
  state.isAuthenticated = false;
  state.currentUser = null;
  state.isAdmin = false;
  state.adminToken = null;
  localStorage.removeItem('newgram_auth_token');
  localStorage.removeItem('newgram_admin_token');
  // Return to demo mode default (Elena)
  state.currentUserId = 1;
  localStorage.setItem('newgram_current_user_id', '1');

  updateAuthUI();
  setupActiveUser();
  loadFeed();
  loadStories();
  loadSidebarWidgets();
  showToast('Switched to Demo Showcase mode. Jump between accounts or log in anytime!');
}

function togglePasswordVisibility(inputEl, btnEl) {
  if (inputEl.type === 'password') {
    inputEl.type = 'text';
    btnEl.textContent = '🙈';
  } else {
    inputEl.type = 'password';
    btnEl.textContent = '👁️';
  }
}

async function initApp() {
  applyTheme(state.theme);
  try {
    await loadUsers();
    await checkAuthSession();
    setupActiveUser();
    setupEventListeners();
    await Promise.all([
      loadStories(),
      loadFeed(),
      loadSidebarWidgets(),
      checkNotifications(),
      checkChatUnread()
    ]);
  } catch (err) {
    console.error('App init error:', err);
    showToast('Connecting to NewGram...');
  }
}

async function loadUsers() {
  state.allUsers = await api('/api/users');
}

function setupActiveUser() {
  let user = state.allUsers.find(u => u.id === state.currentUserId);
  if (!user && state.allUsers.length > 0) {
    user = state.allUsers[0];
    state.currentUserId = user.id;
    localStorage.setItem('newgram_current_user_id', user.id);
  }
  state.currentUser = user;

  const isGenuine = isGenuineLoggedIn();
  document.body.classList.toggle('genuine-auth-active', isGenuine);

  if (user) {
    if (dom.activeUserAvatar) dom.activeUserAvatar.src = user.avatar;
    if (dom.activeUserName) dom.activeUserName.textContent = user.name;
    if (dom.activeUserHandle) dom.activeUserHandle.textContent = user.handle;
    if (dom.sidebarUserAvatar) dom.sidebarUserAvatar.src = user.avatar;
    if (dom.myStoryAvatar) dom.myStoryAvatar.src = user.avatar;

    if (dom.asideUserAvatar) dom.asideUserAvatar.src = user.avatar;
    if (dom.asideUserName) dom.asideUserName.textContent = user.name;
    if (dom.asideUserHandle) dom.asideUserHandle.textContent = user.handle;

    if (dom.createModalAuthorAvatar) dom.createModalAuthorAvatar.src = user.avatar;
    if (dom.createModalAuthorHandle) dom.createModalAuthorHandle.textContent = user.handle;
    if (dom.infeedComposerAvatar) {
      dom.infeedComposerAvatar.src = user.avatar;
    }
    if (dom.chatCurrentUserHandle) {
      dom.chatCurrentUserHandle.textContent = user.handle;
    }
  }

  if (dom.btnAsideSwitch) {
    dom.btnAsideSwitch.textContent = isGenuine ? 'Log Out' : 'Switch';
  }

  updateAuthUI();
  renderPersonaSwitcher();
}

function switchUser(userId) {
  state.currentUserId = userId;
  const user = state.allUsers.find(u => u.id === userId);
  state.currentUser = user;
  localStorage.setItem('newgram_current_user_id', userId.toString());
  setupActiveUser();
  if (user) {
    showToast(`⚡ Jumped to @${user.username} (${user.name})`);
  }

  if (state.activeView === 'feed') {
    loadFeed();
  } else if (state.activeView === 'messages') {
    loadConversations();
  } else if (state.activeView === 'profile') {
    loadProfile(userId);
  } else if (state.activeView === 'saved') {
    loadSavedPosts();
  } else if (state.activeView === 'notifications') {
    loadNotifications();
  } else if (state.activeView === 'explore') {
    loadExplore();
  }
  loadStories();
  loadSidebarWidgets();
  checkNotifications();
  checkChatUnread();
}

// ==========================================================================
// VIEW SWITCHING
// ==========================================================================

function switchView(viewName, meta = {}) {
  state.activeView = viewName;

  [dom.navFeed, dom.navExplore, dom.navReels, dom.navMessages, dom.navNotifications, dom.navSaved, dom.navProfile].forEach(b => {
    if (b) b.classList.remove('active');
  });
  [dom.viewFeed, dom.viewExplore, dom.viewReels, dom.viewMessages, dom.viewSaved, dom.viewNotifications, dom.viewProfile, dom.viewSettings].forEach(v => {
    if (v) v.classList.add('hidden');
  });

  if (viewName === 'feed') {
    document.body.classList.remove('in-messages-view');
    if (dom.floatingMessagesDock && !state.floatingDockDismissed) {
      dom.floatingMessagesDock.classList.remove('hidden');
    }
    dom.navFeed.classList.add('active');
    dom.viewFeed.classList.remove('hidden');
    loadFeed();
  } else if (viewName === 'explore') {
    document.body.classList.remove('in-messages-view');
    if (dom.floatingMessagesDock && !state.floatingDockDismissed) {
      dom.floatingMessagesDock.classList.remove('hidden');
    }
    dom.navExplore.classList.add('active');
    dom.viewExplore.classList.remove('hidden');
    loadExplore();
  } else if (viewName === 'reels') {
    document.body.classList.remove('in-messages-view');
    if (dom.floatingMessagesDock && !state.floatingDockDismissed) {
      dom.floatingMessagesDock.classList.remove('hidden');
    }
    if (dom.navReels) dom.navReels.classList.add('active');
    if (dom.viewReels) dom.viewReels.classList.remove('hidden');
    loadReels();
  } else if (viewName === 'messages') {

    document.body.classList.add('in-messages-view');
    if (dom.floatingMessagesDock) {
      dom.floatingMessagesDock.classList.add('hidden');
    }
    if (dom.floatingDockBadge) dom.floatingDockBadge.style.display = 'none';
    if (dom.chatUnreadBadge) dom.chatUnreadBadge.classList.add('hidden');
    dom.navMessages.classList.add('active');
    dom.viewMessages.classList.remove('hidden');
    loadConversations(meta.partnerId);
  } else if (viewName === 'saved') {
    document.body.classList.remove('in-messages-view');
    if (dom.floatingMessagesDock && !state.floatingDockDismissed) {
      dom.floatingMessagesDock.classList.remove('hidden');
    }
    dom.navSaved.classList.add('active');
    dom.viewSaved.classList.remove('hidden');
    loadSavedPosts();
  } else if (viewName === 'notifications') {
    document.body.classList.remove('in-messages-view');
    if (dom.floatingMessagesDock && !state.floatingDockDismissed) {
      dom.floatingMessagesDock.classList.remove('hidden');
    }
    dom.navNotifications.classList.add('active');
    dom.viewNotifications.classList.remove('hidden');
    loadNotifications();
  } else if (viewName === 'profile') {
    document.body.classList.remove('in-messages-view');
    if (dom.floatingMessagesDock && !state.floatingDockDismissed) {
      dom.floatingMessagesDock.classList.remove('hidden');
    }
    dom.navProfile.classList.add('active');
    dom.viewProfile.classList.remove('hidden');
    const targetUserId = meta.userId || state.currentUserId;
    loadProfile(targetUserId);
  } else if (viewName === 'settings') {
    document.body.classList.remove('in-messages-view');
    if (dom.floatingMessagesDock && !state.floatingDockDismissed) {
      dom.floatingMessagesDock.classList.remove('hidden');
    }
    if (dom.viewSettings) dom.viewSettings.classList.remove('hidden');
    loadSettingsView();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================================================
// STORIES CAROUSEL & VIEWER
// ==========================================================================

async function loadStories() {
  try {
    state.stories = await api('/api/stories');
    renderStoriesStrip();
  } catch (err) {
    console.error('Error loading stories:', err);
  }
}

function renderStoriesStrip() {
  // Clear any existing stories after the add-story bubble
  const bubbles = dom.storiesStrip.querySelectorAll('.story-bubble:not(.add-story)');
  bubbles.forEach(b => b.remove());

  state.stories.forEach(story => {
    const bubble = document.createElement('div');
    bubble.className = 'story-bubble';
    bubble.innerHTML = `
      <div class="story-avatar-wrap">
        <img src="${escapeHtml(story.user_avatar)}" alt="${escapeHtml(story.user_name)}" class="story-avatar-img">
      </div>
      <span class="story-username">${escapeHtml(story.user_name.split(' ')[0])}</span>
    `;
    bubble.addEventListener('click', () => openStoryViewer(story, bubble));
    dom.storiesStrip.appendChild(bubble);
  });
}

function openStoryViewer(story, bubbleEl) {
  if (bubbleEl) bubbleEl.classList.add('seen');

  dom.storyViewerAvatar.src = story.user_avatar;
  dom.storyViewerName.textContent = story.user_name;
  dom.storyViewerTime.textContent = formatTimeAgo(story.created_at);
  dom.storyViewerImg.src = story.media_url;
  dom.storyViewerCaption.textContent = story.caption || '';
  dom.storyProgressFill.style.width = '0%';

  dom.modalStoryViewer.showModal();

  // Animate progress bar & auto dismiss after 5s
  setTimeout(() => {
    dom.storyProgressFill.style.width = '100%';
  }, 50);

  clearTimeout(state.storyTimer);
  state.storyTimer = setTimeout(() => {
    dom.modalStoryViewer.close();
  }, 5200);
}

// ==========================================================================
// FEED & POST RENDERING
// ==========================================================================

async function loadFeed() {
  dom.postsContainer.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading moments...</p>
    </div>
  `;

  try {
    let url = `/api/posts?feed=${state.feedFilter}`;
    if (state.activeTagFilter) {
      url += `&tag=${encodeURIComponent(state.activeTagFilter)}`;
    }

    const posts = await api(url);
    renderFeedPosts(posts, dom.postsContainer);
  } catch (err) {
    dom.postsContainer.innerHTML = `
      <div class="empty-state">
        <p>Failed to load feed</p>
      </div>
    `;
  }
}

function renderFeedPosts(posts, containerEl) {
  if (!posts || posts.length === 0) {
    containerEl.innerHTML = `
      <div class="empty-state">
        <h3>No Posts Yet</h3>
        <p>${state.feedFilter === 'following' ? 'Accounts you follow have not posted yet. Switch to "For You"!' : 'Share the first photo moment on NewGram!'}</p>
      </div>
    `;
    return;
  }

  containerEl.innerHTML = '';
  posts.forEach(post => {
    const card = createInstagramCard(post);
    containerEl.appendChild(card);
  });
}

function createInstagramCard(post) {
  const card = document.createElement('article');
  card.className = 'ig-card';
  card.id = `post-${post.id}`;

  const isAuthor = post.user_id === state.currentUserId;
  const timeFormatted = formatTimeAgo(post.created_at);

  const formattedContent = escapeHtml(post.content || '').replace(/#[a-zA-Z0-9_]+/g, match => {
    return `<span class="hashtag-link" data-tag="${match}">${match}</span>`;
  });

  card.innerHTML = `
    <div class="ig-card-header">
      <div class="ig-card-author" data-user-id="${post.user_id}">
        <div class="ig-author-avatar-wrap">
          <img src="${escapeHtml(post.author_avatar)}" alt="${escapeHtml(post.author_name)}" class="ig-author-avatar">
        </div>
        <div class="ig-author-info">
          <div class="ig-author-name-row">
            <span class="ig-author-name">${escapeHtml(post.author_handle)}</span>
          </div>
          ${post.location ? `<span class="ig-card-location">${escapeHtml(post.location)}</span>` : ''}
        </div>
      </div>

      ${isAuthor ? `
        <button class="btn-card-more" data-post-id="${post.id}" title="Delete post">•••</button>
      ` : ''}
    </div>

    ${post.media_url ? `
      <div class="ig-card-media" data-post-id="${post.id}">
        <img src="${escapeHtml(post.media_url)}" alt="Visual photo" class="ig-card-img" loading="lazy">
        <div class="media-heart-overlay">
          <svg viewBox="0 0 24 24"><path d="M12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78 5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23z"/></svg>
        </div>
      </div>
    ` : ''}

    ${post.music_tag ? `
      <div class="card-audio-pill">
        <span class="audio-note-icon">🎵</span>
        <span class="audio-tag-text">${escapeHtml(post.music_tag)}</span>
      </div>
    ` : ''}

    <div class="ig-card-actions">
      <div class="ig-actions-left">
        <button class="ig-action-btn like-btn ${post.is_liked ? 'liked' : ''}" data-post-id="${post.id}" title="Like">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>

        <button class="ig-action-btn comment-btn" data-post-id="${post.id}" title="Comment">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
          </svg>
        </button>

        <button class="ig-action-btn repost-btn" data-post-id="${post.id}" title="Repost to Feed">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="17 1 21 5 17 9"></polyline>
            <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
            <polyline points="7 23 3 19 7 15"></polyline>
            <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
          </svg>
          <span class="repost-count-num">${post.reposts_count || 0}</span>
        </button>

        <button class="ig-action-btn share-btn" data-post-id="${post.id}" title="Share">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>

      <button class="ig-action-btn bookmark-btn ${post.is_bookmarked ? 'bookmarked' : ''}" data-post-id="${post.id}" title="Save">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
      </button>
    </div>

    <div class="ig-card-body">
      <div class="likes-indicator">
        <span class="likes-num">${post.likes_count || 0}</span> likes
      </div>

      ${post.content ? `
        <div class="caption-line">
          <span class="caption-username" data-user-id="${post.user_id}">${escapeHtml(post.author_handle)}</span>
          ${formattedContent}
        </div>
      ` : ''}

      ${(post.comments && post.comments.length > 0) ? `
        <button class="comments-expand-btn" data-post-id="${post.id}">
          View all ${post.comments_count || post.comments.length} comments
        </button>
      ` : ''}

      <div class="post-time-meta">${timeFormatted}</div>

      <!-- COMMENTS SECTION -->
      <div class="ig-comments-drawer ${(post.comments && post.comments.length > 0) ? '' : 'hidden'}" id="comments-box-${post.id}">
        <div class="comments-list" id="comments-list-${post.id}">
          ${(post.comments || []).map(c => `
            <div class="ig-comment-row" id="comment-${c.id}">
              <div>
                <span class="comment-author-bold">${escapeHtml(c.author_handle || c.author_name)}</span>
                <span>${escapeHtml(c.content)}</span>
              </div>
              ${c.user_id === state.currentUserId ? `
                <button class="btn-del-comment" data-comment-id="${c.id}">✕</button>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- INLINE ADD COMMENT -->
    <div class="ig-comment-input-row">
      <input type="text" placeholder="Add a comment..." class="input-comment" data-post-id="${post.id}">
      <button class="btn-post-comment" data-post-id="${post.id}">Post</button>
    </div>
  `;

  attachCardEvents(card, post);
  return card;
}

function attachCardEvents(card, post) {
  // Author profile
  card.querySelectorAll('.ig-card-author, .caption-username').forEach(el => {
    el.addEventListener('click', () => switchView('profile', { userId: post.user_id }));
  });

  // Hashtags
  card.querySelectorAll('.hashtag-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.stopPropagation();
      filterByTag(link.dataset.tag);
    });
  });

  // Like toggle
  const likeBtn = card.querySelector('.like-btn');
  const likesNum = card.querySelector('.likes-num');

  const toggleLike = async () => {
    try {
      const res = await api(`/api/posts/${post.id}/like`, { method: 'POST' });
      likeBtn.classList.toggle('liked', res.is_liked);
      likesNum.textContent = res.likes_count;
    } catch (err) {
      showToast('Error liking post');
    }
  };

  likeBtn.addEventListener('click', toggleLike);

  // Double-tap photo like animation
  const mediaWrap = card.querySelector('.ig-card-media');
  if (mediaWrap) {
    let lastTap = 0;
    mediaWrap.addEventListener('click', () => {
      const now = Date.now();
      if (now - lastTap < 300) {
        // Trigger double-tap heart
        const heartOverlay = mediaWrap.querySelector('.media-heart-overlay');
        heartOverlay.classList.add('animate');
        setTimeout(() => heartOverlay.classList.remove('animate'), 700);

        if (!likeBtn.classList.contains('liked')) {
          toggleLike();
        }
      }
      lastTap = now;
    });
  }

  // Bookmark toggle
  const bookmarkBtn = card.querySelector('.bookmark-btn');
  bookmarkBtn.addEventListener('click', async () => {
    try {
      const res = await api(`/api/posts/${post.id}/bookmark`, { method: 'POST' });
      bookmarkBtn.classList.toggle('bookmarked', res.is_bookmarked);
      showToast(res.is_bookmarked ? 'Saved to collection' : 'Removed from saved');
    } catch (err) {
      showToast('Error saving post');
    }
  });

  // Share
  const shareBtn = card.querySelector('.share-btn');
  shareBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.origin + `/#post-${post.id}`);
    showToast('Photo link copied! 📋');
  });

  // Repost
  const repostBtn = card.querySelector('.repost-btn');
  if (repostBtn) {
    repostBtn.addEventListener('click', async () => {
      try {
        const res = await api(`/api/posts/${post.id}/repost`, { method: 'POST' });
        repostBtn.classList.toggle('reposted');
        const countSpan = repostBtn.querySelector('.repost-count-num');
        if (countSpan) countSpan.textContent = res.reposts_count;
        showToast('Shared to your feed! 🔁');
      } catch (err) {
        showToast('Failed to repost');
      }
    });
  }

  // Delete post
  const btnDelete = card.querySelector('.btn-card-more');
  if (btnDelete) {
    btnDelete.addEventListener('click', async () => {
      if (confirm('Delete this post?')) {
        try {
          await api(`/api/posts/${post.id}`, { method: 'DELETE' });
          card.remove();
          showToast('Post removed');
        } catch (err) {
          showToast('Error deleting post');
        }
      }
    });
  }

  // Comments expand
  const expandBtn = card.querySelector('.comments-expand-btn');
  const commentsDrawer = card.querySelector(`#comments-box-${post.id}`);
  if (expandBtn && commentsDrawer) {
    expandBtn.addEventListener('click', () => {
      commentsDrawer.classList.toggle('hidden');
    });
  }

  // Submit comment
  const commentInput = card.querySelector('.input-comment');
  const btnPostComment = card.querySelector('.btn-post-comment');

  commentInput.addEventListener('input', () => {
    btnPostComment.classList.toggle('active', !!commentInput.value.trim());
  });

  const submitComment = async () => {
    const text = commentInput.value.trim();
    if (!text) return;

    try {
      btnPostComment.disabled = true;
      const res = await api(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: text })
      });

      commentInput.value = '';
      btnPostComment.classList.remove('active');
      commentsDrawer.classList.remove('hidden');

      const list = card.querySelector(`#comments-list-${post.id}`);
      const newCommentRow = document.createElement('div');
      newCommentRow.className = 'ig-comment-row';
      newCommentRow.id = `comment-${res.comment.id}`;
      newCommentRow.innerHTML = `
        <div>
          <span class="comment-author-bold">${escapeHtml(res.comment.author_handle || res.comment.author_name)}</span>
          <span>${escapeHtml(res.comment.content)}</span>
        </div>
        <button class="btn-del-comment" data-comment-id="${res.comment.id}">✕</button>
      `;

      list.appendChild(newCommentRow);
      newCommentRow.querySelector('.btn-del-comment').addEventListener('click', () => {
        deleteComment(res.comment.id, newCommentRow);
      });

      showToast('Comment posted');
    } catch (err) {
      showToast('Failed to post comment');
    } finally {
      btnPostComment.disabled = false;
    }
  };

  btnPostComment.addEventListener('click', submitComment);
  commentInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitComment();
  });

  // Delete existing comments
  card.querySelectorAll('.btn-del-comment').forEach(btn => {
    btn.addEventListener('click', () => {
      const cId = btn.dataset.commentId;
      const row = card.querySelector(`#comment-${cId}`);
      deleteComment(cId, row);
    });
  });
}

async function deleteComment(commentId, rowEl) {
  try {
    await api(`/api/comments/${commentId}`, { method: 'DELETE' });
    if (rowEl) rowEl.remove();
    showToast('Comment deleted');
  } catch (err) {
    showToast('Failed to delete comment');
  }
}

function filterByTag(tag) {
  state.activeTagFilter = tag;
  dom.activeTagText.textContent = tag;
  dom.tagFilterIndicator.classList.remove('hidden');
  switchView('feed');
  loadFeed();
}

// ==========================================
// 3x3 PHOTO GRID RENDERER (INSTAGRAM STYLE)
// ==========================================

function renderPhotoGrid(posts, containerEl) {
  if (!posts || posts.length === 0) {
    containerEl.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <p>No photos yet</p>
      </div>
    `;
    return;
  }

  containerEl.innerHTML = posts.map(post => `
    <div class="grid-photo-card" data-post-id="${post.id}">
      <img src="${escapeHtml(post.media_url || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80')}" alt="Moment" loading="lazy">
      <div class="grid-photo-overlay">
        <div class="overlay-stat">
          <span>❤️</span>
          <span>${post.likes_count || 0}</span>
        </div>
        <div class="overlay-stat">
          <span>💬</span>
          <span>${post.comments_count || 0}</span>
        </div>
      </div>
    </div>
  `).join('');

  containerEl.querySelectorAll('.grid-photo-card').forEach(card => {
    card.addEventListener('click', () => {
      const pId = card.dataset.postId;
      // Scroll to post in feed or switch to feed
      switchView('feed');
      setTimeout(() => {
        const target = document.getElementById(`post-${pId}`);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    });
  });
}

// ==========================================
// EXPLORE & SAVED VIEWS
// ==========================================

async function loadExplore() {
  try {
    const data = await api('/api/explore');

    // Render Trending Tags
    dom.exploreTagsCloud.innerHTML = data.trendingTags.map(t => `
      <button class="tag-bubble" data-tag="${escapeHtml(t.tag)}">
        ${escapeHtml(t.tag)} (${t.count})
      </button>
    `).join('');

    dom.exploreTagsCloud.querySelectorAll('.tag-bubble').forEach(btn => {
      btn.addEventListener('click', () => filterByTag(btn.dataset.tag));
    });

    // Render Grid
    renderPhotoGrid(data.popularPosts, dom.explorePostsContainer);
  } catch (err) {
    console.error('Error loading explore:', err);
  }
}

async function handleSearch(query) {
  if (!query || !query.trim()) {
    loadExplore();
    return;
  }

  dom.explorePostsContainer.innerHTML = `<div class="loading-state" style="grid-column: 1 / -1;"><div class="spinner"></div></div>`;
  try {
    const results = await api(`/api/posts?search=${encodeURIComponent(query.trim())}`);
    renderPhotoGrid(results, dom.explorePostsContainer);
  } catch (err) {
    showToast('Search failed');
  }
}

async function loadSavedPosts() {
  dom.savedPostsContainer.innerHTML = `<div class="loading-state" style="grid-column: 1 / -1;"><div class="spinner"></div></div>`;
  try {
    const posts = await api('/api/posts?saved=true');
    renderPhotoGrid(posts, dom.savedPostsContainer);
  } catch (err) {
    showToast('Failed to load saved posts');
  }
}

// ==========================================
// REELS VIEW (VERTICAL SNAP SCROLL)
// ==========================================

const reelsData = [
  {
    id: 1,
    authorName: 'Elena Rostova',
    authorHandle: '@elena_visuals',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-vertical-aerial-view-of-waves-crashing-on-a-beach-41484-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    caption: 'Golden horizon along the Mediterranean cliffs. The water reflections at twilight create pure calm. 🌊✨ #nature #minimalism',
    audioTitle: 'Tycho • Awake (Horizon Slowed)',
    likes: '14.8k',
    comments: '312',
    isLiked: false,
    isBookmarked: false
  },
  {
    id: 2,
    authorName: 'Alex Rivera',
    authorHandle: '@alex_minimal',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-potter-shaping-a-clay-vase-41551-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80',
    caption: 'Ceramic craftsmanship in Kyoto. Tactile design and physical form over digital noise. 🏺🍵 #craft #zen #ceramics',
    audioTitle: 'Bonobo • Kerala (Acoustic Edit)',
    likes: '22.4k',
    comments: '584',
    isLiked: true,
    isBookmarked: false
  },
  {
    id: 3,
    authorName: 'Sophia Kim',
    authorHandle: '@sophia_lens',
    authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-tokyo-traffic-at-night-vertical-view-41517-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    caption: 'Midnight rain in Shibuya. Cyberpunk neon refractions captured on 35mm f/1.2 lens. 🌌🏙️ #tokyo #neon #cyberpunk',
    audioTitle: 'Kavinsky • Nightcall (Cyber Edit)',
    likes: '38.9k',
    comments: '920',
    isLiked: false,
    isBookmarked: true
  },
  {
    id: 4,
    authorName: 'Marcus Vance',
    authorHandle: '@marcus_vance',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-silhouette-of-a-photographer-taking-pictures-at-sunset-41490-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80',
    caption: 'Catching the last light beam over the alpine peaks. Sound tracking this with raw tape synthesizer layers. 🎚️🏔️ #cinematic',
    audioTitle: 'Odesza • A Moment Apart',
    likes: '11.2k',
    comments: '185',
    isLiked: false,
    isBookmarked: false
  },
  {
    id: 5,
    authorName: 'Nora Studio',
    authorHandle: '@nora_design',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-skater-performing-a-trick-on-a-street-at-dusk-41549-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1520045884218-a66e3ba3c887?auto=format&fit=crop&w=800&q=80',
    caption: 'Street kinetic flow at dusk. Fluid movement and geometry through urban concrete. 🛹🌆 #skate #urban #motion',
    audioTitle: 'Bicep • Glue (Orchestral Edit)',
    likes: '19.7k',
    comments: '440',
    isLiked: true,
    isBookmarked: true
  }
];

let reelsSoundMuted = true;

function loadReels() {
  if (!dom.reelsFeedContainer) return;

  dom.reelsFeedContainer.innerHTML = reelsData.map((reel, idx) => `
    <article class="reel-card" data-reel-id="${reel.id}" id="reel-item-${idx}">
      <!-- Background Video with Poster Fallback -->
      <div class="reel-video-wrapper">
        <video class="reel-video-element" src="${reel.videoUrl}" poster="${reel.posterUrl}" autoplay loop ${reelsSoundMuted ? 'muted' : ''} playsinline></video>
        <div class="reel-play-indicator hidden">▶</div>
        <div class="reel-heart-burst">
          <svg viewBox="0 0 24 24"><path d="M12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78 5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23z"/></svg>
        </div>
      </div>

      <!-- Top Controls -->
      <div class="reel-top-bar">
        <span class="reel-badge">✨ Reels</span>
        <button class="reel-sound-btn" title="Toggle Sound" onclick="toggleReelSound(this)">
          ${reelsSoundMuted ? '🔇' : '🔊'}
        </button>
      </div>

      <!-- Bottom Creator & Caption Info -->
      <div class="reel-overlay-content">
        <div class="reel-author-row">
          <img src="${reel.authorAvatar}" alt="${reel.authorName}" class="reel-author-avatar">
          <span class="reel-author-handle">${reel.authorHandle}</span>
          <button class="reel-follow-btn" onclick="showToast('Followed ${reel.authorHandle}!')">Follow</button>
        </div>
        <p class="reel-caption">${reel.caption}</p>
        <div class="reel-audio-strip">
          <span class="audio-note-icon">🎵</span>
          <div class="reel-audio-marquee"><span>${reel.audioTitle} • Original Audio</span></div>
        </div>
      </div>

      <!-- Right Floating Action Strip -->
      <div class="reel-action-strip">
        <button class="reel-action-btn ${reel.isLiked ? 'liked' : ''}" onclick="toggleReelLike(this, ${reel.id})" title="Like">
          <div class="reel-action-icon-wrap">
            <svg viewBox="0 0 24 24" fill="${reel.isLiked ? '#f43f5e' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78 5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23z"/>
            </svg>
          </div>
          <span class="reel-action-label">${reel.likes}</span>
        </button>

        <button class="reel-action-btn" onclick="showToast('💬 ${reel.comments} comments on this moment')" title="Comments">
          <div class="reel-action-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
          </div>
          <span class="reel-action-label">${reel.comments}</span>
        </button>

        <button class="reel-action-btn ${reel.isBookmarked ? 'bookmarked' : ''}" onclick="toggleReelBookmark(this)" title="Save Reel">
          <div class="reel-action-icon-wrap">
            <svg viewBox="0 0 24 24" fill="${reel.isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <span class="reel-action-label">Save</span>
        </button>

        <button class="reel-action-btn" onclick="navigator.clipboard && navigator.clipboard.writeText(window.location.href); showToast('✨ Reel link copied!')" title="Share Reel">
          <div class="reel-action-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </div>
          <span class="reel-action-label">Share</span>
        </button>

        <div class="reel-disc-wrapper" title="${reel.audioTitle}">
          <img src="${reel.authorAvatar}" alt="Audio disc" class="reel-disc-avatar">
        </div>
      </div>
    </article>
  `).join('');

  setupReelVideoEvents();
}

function setupReelVideoEvents() {
  const cards = dom.reelsFeedContainer.querySelectorAll('.reel-card');
  cards.forEach(card => {
    const video = card.querySelector('.reel-video-element');
    const playIndicator = card.querySelector('.reel-play-indicator');
    const heartBurst = card.querySelector('.reel-heart-burst');

    if (video) {
      video.addEventListener('click', () => {
        if (video.paused) {
          video.play().catch(() => {});
          if (playIndicator) playIndicator.classList.add('hidden');
        } else {
          video.pause();
          if (playIndicator) playIndicator.classList.remove('hidden');
        }
      });

      card.addEventListener('dblclick', () => {
        const likeBtn = card.querySelector('.reel-action-btn[title="Like"]');
        if (likeBtn && !likeBtn.classList.contains('liked')) {
          likeBtn.classList.add('liked');
          const svg = likeBtn.querySelector('svg');
          if (svg) svg.setAttribute('fill', '#f43f5e');
          showToast('❤️ Liked reel!');
        }
        if (heartBurst) {
          heartBurst.classList.add('animate');
          setTimeout(() => heartBurst.classList.remove('animate'), 750);
        }
      });
    }
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const video = entry.target.querySelector('.reel-video-element');
      if (!video) return;
      if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, { threshold: [0.6] });

  cards.forEach(c => observer.observe(c));
}

function scrollReel(direction) {
  if (!dom.reelsFeedContainer) return;
  const card = dom.reelsFeedContainer.querySelector('.reel-card');
  if (!card) return;
  const cardHeight = card.offsetHeight + 24;
  dom.reelsFeedContainer.scrollBy({ top: direction * cardHeight, behavior: 'smooth' });
}

function toggleReelSound(btn) {
  reelsSoundMuted = !reelsSoundMuted;
  const allVideos = document.querySelectorAll('.reel-video-element');
  allVideos.forEach(v => v.muted = reelsSoundMuted);
  const allSoundBtns = document.querySelectorAll('.reel-sound-btn');
  allSoundBtns.forEach(b => b.textContent = reelsSoundMuted ? '🔇' : '🔊');
  showToast(reelsSoundMuted ? '🔇 Reels muted' : '🔊 Reels sound on');
}

function toggleReelLike(btn, id) {
  const isLiked = btn.classList.toggle('liked');
  const svg = btn.querySelector('svg');
  if (svg) svg.setAttribute('fill', isLiked ? '#f43f5e' : 'none');
  showToast(isLiked ? '❤️ Liked reel' : 'Removed like');
}

function toggleReelBookmark(btn) {
  const isBookmarked = btn.classList.toggle('bookmarked');
  const svg = btn.querySelector('svg');
  if (svg) svg.setAttribute('fill', isBookmarked ? 'currentColor' : 'none');
  showToast(isBookmarked ? '🔖 Reel saved to collection' : 'Removed from saved');
}

window.toggleReelSound = toggleReelSound;
window.toggleReelLike = toggleReelLike;
window.toggleReelBookmark = toggleReelBookmark;
window.scrollReel = scrollReel;

// ==========================================
// USER PROFILE VIEW (INSTAGRAM STYLE)
// ==========================================


async function loadProfile(userId) {
  state.profileViewUserId = userId;
  try {
    const user = await api(`/api/users/${userId}`);

    dom.profileViewAvatar.src = user.avatar;
    dom.profileViewHandle.textContent = user.handle;
    dom.profileViewName.textContent = user.name;
    dom.profileViewBadge.textContent = user.badge || 'CREATOR';
    dom.profileViewBio.textContent = user.bio || 'Minimal visual journal.';
    dom.profileViewLocation.textContent = `📍 ${user.location || 'Global'}`;

    if (user.website) {
      dom.profileViewWebsite.textContent = `🔗 ${user.website.replace(/^https?:\/\//, '')}`;
      dom.profileViewWebsite.href = user.website;
      dom.profileViewWebsite.style.display = 'inline';
    } else {
      dom.profileViewWebsite.style.display = 'none';
    }

    dom.statPostsCount.textContent = user.posts_count || 0;
    dom.statFollowersCount.textContent = user.followers_count || 0;
    dom.statFollowingCount.textContent = user.following_count || 0;

    // Action button: Edit Profile or Follow
    dom.profileActionButtons.innerHTML = '';
    if (userId === state.currentUserId) {
      const btnEdit = document.createElement('button');
      btnEdit.className = 'btn-profile-action';
      btnEdit.textContent = 'Edit Profile';
      btnEdit.addEventListener('click', openEditProfileModal);
      dom.profileActionButtons.appendChild(btnEdit);

      const btnLogout = document.createElement('button');
      btnLogout.className = 'btn-profile-action danger';
      btnLogout.textContent = 'Log Out';
      btnLogout.title = 'Sign out of this session';
      btnLogout.addEventListener('click', handleLogout);
      dom.profileActionButtons.appendChild(btnLogout);
    } else {
      const btnFollow = document.createElement('button');
      btnFollow.className = `btn-profile-action ${user.is_following ? '' : 'primary'}`;
      btnFollow.textContent = user.is_following ? 'Following' : 'Follow';
      btnFollow.addEventListener('click', async () => {
        const res = await api(`/api/users/${userId}/follow`, { method: 'POST' });
        btnFollow.classList.toggle('primary', !res.is_following);
        btnFollow.textContent = res.is_following ? 'Following' : 'Follow';
        dom.statFollowersCount.textContent = res.followers_count;
        loadSidebarWidgets();
      });
      dom.profileActionButtons.appendChild(btnFollow);

      const btnMessage = document.createElement('button');
      btnMessage.className = 'btn-profile-action';
      btnMessage.textContent = 'Message';
      btnMessage.addEventListener('click', () => {
        switchView('messages', { partnerId: userId });
      });
      dom.profileActionButtons.appendChild(btnMessage);
    }

    // Render User Posts (Grid & Feed)
    renderPhotoGrid(user.posts || [], dom.profileGridContainer);
    renderFeedPosts(user.posts || [], dom.profileFeedContainer);
  } catch (err) {
    console.error('Error loading profile:', err);
  }
}

// ==========================================
// NOTIFICATIONS
// ==========================================

async function loadNotifications() {
  dom.notificationsList.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;
  try {
    const res = await api('/api/notifications');
    if (!res.notifications || res.notifications.length === 0) {
      dom.notificationsList.innerHTML = `<div class="empty-state"><p>No activity yet.</p></div>`;
      return;
    }

    dom.notificationsList.innerHTML = res.notifications.map(n => `
      <div class="notif-row ${n.is_read ? '' : 'unread'}">
        <img src="${escapeHtml(n.actor_avatar)}" class="notif-actor-avatar" alt="Actor">
        <div class="notif-text-wrap">
          <strong>${escapeHtml(n.actor_name)}</strong> ${escapeHtml(n.message)}
          <div class="notif-time-ago">${formatTimeAgo(n.created_at)}</div>
        </div>
      </div>
    `).join('');

    updateUnreadBadge(0);
    await api('/api/notifications/read', { method: 'POST' });
  } catch (err) {
    showToast('Failed to fetch activity');
  }
}

async function checkNotifications() {
  try {
    const res = await api('/api/notifications');
    updateUnreadBadge(res.unreadCount || 0);
  } catch (err) {}
}

function updateUnreadBadge(count) {
  if (count > 0) {
    dom.unreadCountBadge.textContent = count > 9 ? '9+' : count;
    dom.unreadCountBadge.classList.remove('hidden');
  } else {
    dom.unreadCountBadge.classList.add('hidden');
  }
}

// ==========================================
// ASIDE WIDGETS & PERSONAS
// ==========================================

async function loadSidebarWidgets() {
  renderPersonaSwitcher();
  await renderWhoToFollow();
}

function renderPersonaSwitcher() {
  const isGenuine = isGenuineLoggedIn();
  const block = document.querySelector('.compact-persona-block');
  if (isGenuine) {
    if (block) block.style.display = 'none';
    if (dom.personaList) dom.personaList.innerHTML = '';
    return;
  }

  // Demo showcase mode: display persona switch list so user can jump between dummy accounts!
  if (block) block.style.display = 'block';
  if (!dom.personaList) return;

  const demoUsers = state.allUsers.filter(u => u.id <= 5);
  dom.personaList.innerHTML = demoUsers.map(user => `
    <div class="persona-row ${user.id === state.currentUserId ? 'active' : ''}" data-user-id="${user.id}" title="Jump to @${escapeHtml(user.username)}">
      <div class="persona-row-left">
        <img src="${escapeHtml(user.avatar)}" class="persona-micro-avatar" alt="${escapeHtml(user.name)}">
        <div class="persona-micro-meta">
          <span class="persona-micro-handle">${escapeHtml(user.handle)}</span>
          <span class="persona-micro-name">${escapeHtml(user.name)}</span>
        </div>
      </div>
      <button class="btn-text" style="pointer-events: none;">${user.id === state.currentUserId ? 'Active' : 'Jump'}</button>
    </div>
  `).join('');

  dom.personaList.querySelectorAll('.persona-row').forEach(row => {
    row.addEventListener('click', () => {
      const uId = parseInt(row.dataset.userId, 10);
      if (uId !== state.currentUserId) switchUser(uId);
    });
  });
}

async function renderWhoToFollow() {
  try {
    const data = await api('/api/explore');
    let users = data.suggestedUsers || [];

    // When logged in as genuine user, dummy accounts (IDs 1 to 5) should NOT be suggested
    if (isGenuineLoggedIn()) {
      users = users.filter(u => u.id > 5 && u.id !== state.currentUserId);
    } else {
      users = users.filter(u => u.id !== state.currentUserId);
    }

    if (users.length === 0) {
      dom.whoToFollowList.innerHTML = '<span class="aside-hint">You are all caught up! Explore feed & reels.</span>';
      return;
    }

    dom.whoToFollowList.innerHTML = users.map(u => `
      <div class="suggestion-row">
        <div class="suggestion-left" data-user-id="${u.id}">
          <img src="${escapeHtml(u.avatar)}" class="suggestion-avatar" alt="${escapeHtml(u.name)}">
          <div class="suggestion-meta">
            <span class="suggestion-handle">${escapeHtml(u.handle)}</span>
            <span class="suggestion-sub">${escapeHtml(u.name)}</span>
          </div>
        </div>
        <button class="btn-follow-link" data-user-id="${u.id}">Follow</button>
      </div>
    `).join('');

    dom.whoToFollowList.querySelectorAll('.suggestion-left').forEach(el => {
      el.addEventListener('click', () => {
        const uId = parseInt(el.dataset.userId, 10);
        switchView('profile', { userId: uId });
      });
    });

    dom.whoToFollowList.querySelectorAll('.btn-follow-link').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uId = parseInt(btn.dataset.userId, 10);
        await api(`/api/users/${uId}/follow`, { method: 'POST' });
        showToast('Now following creator');
        loadSidebarWidgets();
      });
    });
  } catch (err) {}
}

// ==========================================
// MODALS LOGIC
// ==========================================

function openCreatePostModal() {
  dom.createCaptionInput.value = '';
  dom.createLocationInput.value = '';
  dom.createTagsInput.value = '';
  dom.createModalAuthorAvatar.src = state.currentUser ? state.currentUser.avatar : '';
  dom.createModalAuthorHandle.textContent = state.currentUser ? state.currentUser.handle : '@user';
  dom.modalCreatePost.showModal();
}

async function handlePublishPost() {
  const content = dom.createCaptionInput.value.trim();
  const location = dom.createLocationInput.value.trim();
  const tags = dom.createTagsInput.value.trim();
  const mediaUrl = state.selectedPostMediaUrl;

  try {
    dom.btnPublishPost.disabled = true;
    const newPost = await api('/api/posts', {
      method: 'POST',
      body: JSON.stringify({
        content,
        location,
        tags,
        media_url: mediaUrl
      })
    });

    dom.modalCreatePost.close();
    showToast('Photo published to NewGram! 📷');
    switchView('feed');
  } catch (err) {
    showToast('Failed to publish');
  } finally {
    dom.btnPublishPost.disabled = false;
  }
}

function openAddStoryModal() {
  dom.modalAddStory.showModal();
}

async function handleSubmitStory() {
  const mediaUrl = dom.storyMediaUrl.value.trim() || state.selectedStoryMediaUrl;
  const caption = dom.storyCaption.value.trim();

  try {
    dom.btnSubmitStory.disabled = true;
    await api('/api/stories', {
      method: 'POST',
      body: JSON.stringify({ media_url: mediaUrl, caption })
    });

    dom.modalAddStory.close();
    showToast('Added to your story! 🌟');
    await loadStories();
  } catch (err) {
    showToast('Failed to add story');
  } finally {
    dom.btnSubmitStory.disabled = false;
  }
}

function openEditProfileModal() {
  if (!state.currentUser) return;
  dom.editName.value = state.currentUser.name || '';
  dom.editBio.value = state.currentUser.bio || '';
  dom.editAvatar.value = state.currentUser.avatar || '';
  dom.editLocation.value = state.currentUser.location || '';
  dom.editWebsite.value = state.currentUser.website || '';
  dom.modalEditProfile.showModal();
}

async function handleSaveEditProfile() {
  try {
    await api(`/api/users/${state.currentUserId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: dom.editName.value.trim(),
        bio: dom.editBio.value.trim(),
        avatar: dom.editAvatar.value.trim(),
        location: dom.editLocation.value.trim(),
        website: dom.editWebsite.value.trim()
      })
    });

    dom.modalEditProfile.close();
    showToast('Profile updated');
    await loadUsers();
    setupActiveUser();
    loadProfile(state.currentUserId);
  } catch (err) {
    showToast('Failed to update profile');
  }
}

function openCreateUserModal() {
  dom.newUsername.value = '';
  dom.newName.value = '';
  dom.newBio.value = '';
  dom.newAvatar.value = '';
  dom.modalCreateUser.showModal();
}

async function handleSubmitCreateUser(e) {
  if (e) e.preventDefault();
  try {
    const newUser = await api('/api/users', {
      method: 'POST',
      body: JSON.stringify({
        username: dom.newUsername.value.trim(),
        name: dom.newName.value.trim(),
        bio: dom.newBio.value.trim(),
        avatar: dom.newAvatar.value.trim()
      })
    });

    dom.modalCreateUser.close();
    showToast(`Welcome ${newUser.name}!`);
    await loadUsers();
    switchUser(newUser.id);
  } catch (err) {
    showToast(err.message || 'Creation error');
  }
}

async function openNetworkModal(type) {
  const userId = state.profileViewUserId || state.currentUserId;
  dom.networkModalTitle.textContent = type === 'followers' ? 'Followers' : 'Following';
  dom.networkModalList.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;
  dom.modalNetwork.showModal();

  try {
    const list = await api(`/api/users/${userId}/${type}`);
    if (list.length === 0) {
      dom.networkModalList.innerHTML = `<div class="empty-state"><p>No ${type} yet</p></div>`;
      return;
    }

    dom.networkModalList.innerHTML = list.map(u => `
      <div class="network-user-row">
        <div class="network-user-left" data-user-id="${u.id}">
          <img src="${escapeHtml(u.avatar)}" class="network-avatar" alt="${escapeHtml(u.name)}">
          <div class="network-meta">
            <span class="network-handle">${escapeHtml(u.handle)}</span>
            <span class="network-name">${escapeHtml(u.name)}</span>
          </div>
        </div>
        ${u.id !== state.currentUserId ? `
          <button class="btn-profile-action ${u.is_following ? '' : 'primary'} btn-modal-follow" data-user-id="${u.id}">
            ${u.is_following ? 'Following' : 'Follow'}
          </button>
        ` : ''}
      </div>
    `).join('');

    dom.networkModalList.querySelectorAll('.network-user-left').forEach(el => {
      el.addEventListener('click', () => {
        const uId = parseInt(el.dataset.userId, 10);
        dom.modalNetwork.close();
        switchView('profile', { userId: uId });
      });
    });

    dom.networkModalList.querySelectorAll('.btn-modal-follow').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uId = parseInt(btn.dataset.userId, 10);
        const res = await api(`/api/users/${uId}/follow`, { method: 'POST' });
        btn.classList.toggle('primary', !res.is_following);
        btn.textContent = res.is_following ? 'Following' : 'Follow';
      });
    });
  } catch (err) {
    showToast('Network error');
  }
}

// ==========================================
// DIRECT MESSAGES (CHAT) LOGIC
// ==========================================

async function loadConversations(autoSelectPartnerId = null) {
  try {
    renderChatNotes();
    const threads = await api('/api/conversations');
    renderChatThreads(threads);
    checkChatUnread();

    if (autoSelectPartnerId) {
      selectConversation(autoSelectPartnerId);
    } else if (state.activeChatPartnerId) {
      selectConversation(state.activeChatPartnerId);
    } else if (threads && threads.length > 0) {
      selectConversation(threads[0].partner.id);
    } else {
      const otherUser = state.allUsers.find(u => u.id !== state.currentUserId);
      if (otherUser) {
        selectConversation(otherUser.id);
      }
    }
  } catch (err) {
    console.error('Error loading conversations:', err);
  }
}

function renderChatNotes() {
  if (!dom.chatNotesShelf) return;
  const currentUser = state.currentUser;
  if (!currentUser) return;

  const myNote = state.userNotes[currentUser.id] || "What's new...";
  const otherUsers = state.allUsers.filter(u => u.id !== currentUser.id);

  let html = `
    <div class="note-item user-note-item" id="btn-edit-my-note" title="Click to share your note">
      <div class="note-avatar-wrapper">
        <div class="note-cloud" id="my-note-cloud">${escapeHtml(myNote)}</div>
        <img src="${escapeHtml(currentUser.avatar)}" class="note-avatar" alt="${escapeHtml(currentUser.name)}">
        <span class="note-plus">+</span>
      </div>
      <span class="note-username">Your note</span>
    </div>
  `;

  otherUsers.forEach(u => {
    const note = state.userNotes[u.id] || "Active ✨";
    html += `
      <div class="note-item friend-note-item" data-user-id="${u.id}" title="Message ${escapeHtml(u.name)}">
        <div class="note-avatar-wrapper">
          <div class="note-cloud">${escapeHtml(note)}</div>
          <img src="${escapeHtml(u.avatar)}" class="note-avatar" alt="${escapeHtml(u.name)}">
        </div>
        <span class="note-username">${escapeHtml(u.name.split(' ')[0])}</span>
      </div>
    `;
  });

  dom.chatNotesShelf.innerHTML = html;

  const myNoteBtn = dom.chatNotesShelf.querySelector('#btn-edit-my-note');
  if (myNoteBtn) {
    myNoteBtn.addEventListener('click', () => {
      const currentNote = state.userNotes[currentUser.id] || '';
      const input = prompt("Share a thought / note (e.g. 'Coffee & Code ☕', 'Vibing to Lofi 🎧'):", currentNote);
      if (input !== null && input.trim()) {
        state.userNotes[currentUser.id] = input.trim();
        renderChatNotes();
        showToast('Your note shared! 💭');
      }
    });
  }

  dom.chatNotesShelf.querySelectorAll('.friend-note-item').forEach(item => {
    item.addEventListener('click', () => {
      const uId = parseInt(item.dataset.userId, 10);
      selectConversation(uId);
    });
  });
}

function renderChatThreads(threads) {
  if (!threads || threads.length === 0) {
    dom.chatThreadsList.innerHTML = `
      <div class="empty-state" style="padding: 30px 14px;">
        <p style="font-size: 0.85rem;">No chats yet. Start a conversation with a creator!</p>
      </div>
    `;
    return;
  }

  dom.chatThreadsList.innerHTML = threads.map(t => {
    const isActive = state.activeChatPartnerId === t.partner.id;
    return `
      <div class="chat-thread-item ${isActive ? 'active' : ''}" data-partner-id="${t.partner.id}">
        <div class="thread-avatar-wrap">
          <img src="${escapeHtml(t.partner.avatar)}" alt="${escapeHtml(t.partner.name)}" class="thread-avatar">
          <span class="thread-online-dot"></span>
        </div>
        <div class="thread-meta">
          <span class="thread-name">${escapeHtml(t.partner.name)}</span>
          <div class="thread-snippet-row">
            <span class="thread-snippet">${escapeHtml(t.last_message || 'Started a conversation')}</span>
            <span>· ${formatTimeAgo(t.last_message_time)}</span>
          </div>
        </div>
        ${t.unread_count > 0 ? '<span class="thread-unread-dot"></span>' : ''}
      </div>
    `;
  }).join('');

  dom.chatThreadsList.querySelectorAll('.chat-thread-item').forEach(item => {
    item.addEventListener('click', () => {
      const pId = parseInt(item.dataset.partnerId, 10);
      selectConversation(pId);
    });
  });
}

async function selectConversation(partnerId) {
  state.activeChatPartnerId = partnerId;

  // Highlight active thread
  dom.chatThreadsList.querySelectorAll('.chat-thread-item').forEach(el => {
    el.classList.toggle('active', parseInt(el.dataset.partnerId, 10) === partnerId);
  });

  if (dom.chatPlaceholder) dom.chatPlaceholder.classList.add('hidden');
  if (dom.chatConversationArea) dom.chatConversationArea.classList.remove('hidden');

  try {
    const data = await api(`/api/messages/${partnerId}`);

    // Set Header
    dom.chatHeaderAvatar.src = data.partner.avatar;
    dom.chatHeaderName.textContent = data.partner.name;
    dom.btnViewChatPartnerProfile.onclick = () => switchView('profile', { userId: data.partner.id });

    // Render message bubbles
    renderMessageBubbles(data.messages);
    checkChatUnread();
  } catch (err) {
    showToast('Failed to load chat');
  }
}

function renderMessageBubbles(messages) {
  if (!messages || messages.length === 0) {
    dom.chatMessagesStream.innerHTML = `
      <div class="empty-state" style="margin: auto;">
        <p>No messages yet. Say hello! 👋</p>
      </div>
    `;
    return;
  }

  dom.chatMessagesStream.innerHTML = messages.map(m => {
    const isOutgoing = m.sender_id === state.currentUserId;
    return `
      <div class="chat-bubble-row ${isOutgoing ? 'outgoing' : 'incoming'}">
        <div class="chat-bubble">${escapeHtml(m.content)}</div>
        <span class="chat-msg-time">${formatTimeAgo(m.created_at)}</span>
      </div>
    `;
  }).join('');

  dom.chatMessagesStream.scrollTop = dom.chatMessagesStream.scrollHeight;
}

async function handleSendMessage() {
  const text = dom.chatTextInput.value.trim();
  let partnerId = state.activeChatPartnerId;
  if (!partnerId) {
    const otherUser = state.allUsers.find(u => u.id !== state.currentUserId);
    if (otherUser) {
      partnerId = otherUser.id;
      state.activeChatPartnerId = otherUser.id;
    }
  }
  if (!text || !partnerId) return;

  dom.chatTextInput.value = '';
  dom.btnSendMessage.classList.remove('active');

  try {
    const newMsg = await api('/api/messages', {
      method: 'POST',
      body: JSON.stringify({
        receiver_id: partnerId,
        content: text
      })
    });

    const emptyState = dom.chatMessagesStream.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    const bubbleRow = document.createElement('div');
    bubbleRow.className = 'chat-bubble-row outgoing';
    bubbleRow.innerHTML = `
      <div class="chat-bubble">${escapeHtml(newMsg.content)}</div>
      <span class="chat-msg-time">just now</span>
    `;
    dom.chatMessagesStream.appendChild(bubbleRow);
    dom.chatMessagesStream.scrollTop = dom.chatMessagesStream.scrollHeight;

    const threads = await api('/api/conversations');
    renderChatThreads(threads);

    // Unlimited continuous chat loop: partner auto-replies naturally every time
    triggerPartnerAutoReply(partnerId, text);
  } catch (err) {
    showToast('Failed to send message');
  }
}

async function triggerPartnerAutoReply(partnerId, userMessageText) {
  if (dom.chatTypingRow) {
    dom.chatTypingRow.classList.remove('hidden');
    if (dom.chatTypingText) {
      dom.chatTypingText.textContent = `${dom.chatHeaderName ? dom.chatHeaderName.textContent : 'Creator'} is typing...`;
    }
    dom.chatMessagesStream.scrollTop = dom.chatMessagesStream.scrollHeight;
  }

  // Realistic conversational delay (900ms - 1500ms)
  const delay = 900 + Math.random() * 600;
  setTimeout(async () => {
    try {
      const replyMsg = await api('/api/messages/reply', {
        method: 'POST',
        body: JSON.stringify({
          partner_id: partnerId,
          message_text: userMessageText
        })
      });

      if (dom.chatTypingRow) {
        dom.chatTypingRow.classList.add('hidden');
      }

      if (state.activeChatPartnerId === partnerId && replyMsg && replyMsg.content) {
        const replyBubble = document.createElement('div');
        replyBubble.className = 'chat-bubble-row incoming';
        replyBubble.innerHTML = `
          <div class="chat-bubble">${escapeHtml(replyMsg.content)}</div>
          <span class="chat-msg-time">just now</span>
        `;
        dom.chatMessagesStream.appendChild(replyBubble);
        dom.chatMessagesStream.scrollTop = dom.chatMessagesStream.scrollHeight;
      }

      const threads = await api('/api/conversations');
      renderChatThreads(threads);
      checkChatUnread();
    } catch (err) {
      console.error('Auto reply error:', err);
      if (dom.chatTypingRow) dom.chatTypingRow.classList.add('hidden');
    }
  }, delay);
}

async function handleInfeedPost() {
  const text = (dom.infeedQuickText ? dom.infeedQuickText.value : '').trim();
  const photoUrl = (dom.infeedPhotoUrl ? dom.infeedPhotoUrl.value : '').trim();
  const musicTag = (dom.infeedMusicTag ? dom.infeedMusicTag.value : '').trim();

  if (!text && !photoUrl) {
    showToast('Please type a thought or enter an image URL');
    return;
  }

  try {
    if (dom.btnInfeedPost) {
      dom.btnInfeedPost.disabled = true;
      dom.btnInfeedPost.textContent = 'Posting...';
    }

    await api('/api/posts', {
      method: 'POST',
      body: JSON.stringify({
        content: text,
        media_url: photoUrl || '',
        music_tag: musicTag || '',
        location: '',
        tags: []
      })
    });

    if (dom.infeedQuickText) dom.infeedQuickText.value = '';
    if (dom.infeedPhotoUrl) dom.infeedPhotoUrl.value = '';
    if (dom.infeedMusicTag) dom.infeedMusicTag.value = '';
    if (dom.composerExpandableRow) dom.composerExpandableRow.classList.add('hidden');

    showToast('Moment shared to feed! 📸');
    await loadFeed();
  } catch (err) {
    showToast('Failed to publish post');
  } finally {
    if (dom.btnInfeedPost) {
      dom.btnInfeedPost.disabled = false;
      dom.btnInfeedPost.textContent = 'Post';
    }
  }
}

async function checkChatUnread() {
  try {
    const threads = await api('/api/conversations');
    const totalUnread = threads.reduce((acc, t) => acc + (t.unread_count || 0), 0);
    if (totalUnread > 0) {
      dom.chatUnreadBadge.textContent = totalUnread > 9 ? '9+' : totalUnread;
      dom.chatUnreadBadge.classList.remove('hidden');
    } else {
      dom.chatUnreadBadge.classList.add('hidden');
    }
  } catch (err) {}
}

function openNewChatModal() {
  state.selectedNewChatUserId = null;
  dom.newChatSearchInput.value = '';
  renderNewChatUserList(state.allUsers.filter(u => u.id !== state.currentUserId));
  dom.modalNewChat.showModal();
}

function renderNewChatUserList(users) {
  if (!users || users.length === 0) {
    dom.newChatUserList.innerHTML = '<div class="empty-state"><p>No creators found</p></div>';
    return;
  }

  dom.newChatUserList.innerHTML = users.map(u => `
    <div class="network-user-row new-chat-user-row" style="cursor: pointer; padding: 10px; border-radius: 8px;" data-user-id="${u.id}">
      <div class="network-user-left">
        <img src="${escapeHtml(u.avatar)}" class="network-avatar" alt="${escapeHtml(u.name)}">
        <div class="network-meta">
          <span class="network-handle">${escapeHtml(u.handle)}</span>
          <span class="network-name">${escapeHtml(u.name)}</span>
        </div>
      </div>
      <input type="radio" name="new-chat-radio" value="${u.id}" style="cursor: pointer;">
    </div>
  `).join('');

  dom.newChatUserList.querySelectorAll('.new-chat-user-row').forEach(row => {
    row.addEventListener('click', () => {
      dom.newChatUserList.querySelectorAll('.new-chat-user-row').forEach(r => r.style.background = 'transparent');
      row.style.background = 'var(--bg-hover)';
      const radio = row.querySelector('input[type="radio"]');
      radio.checked = true;
      state.selectedNewChatUserId = parseInt(radio.value, 10);
    });
  });
}

// ==========================================
// SETTINGS HUB MANAGEMENT
// ==========================================

function loadSettingsView() {
  const user = state.currentUser;
  if (!user) return;

  // Header pill & Avatar preview
  if (dom.settingsCurrentUserPill) dom.settingsCurrentUserPill.textContent = user.handle || `@${user.username}`;
  if (dom.settingsAvatarPreview) dom.settingsAvatarPreview.src = user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80';
  if (dom.settingsAvatarHandle) dom.settingsAvatarHandle.textContent = `${user.name} (${user.handle || '@' + user.username})`;

  // Profile inputs
  if (dom.settingsInputName) dom.settingsInputName.value = user.name || '';
  if (dom.settingsInputUsername) dom.settingsInputUsername.value = user.username || '';
  if (dom.settingsInputBadge) dom.settingsInputBadge.value = user.badge || 'CREATOR';
  if (dom.settingsInputBio) {
    dom.settingsInputBio.value = user.bio || '';
    if (dom.settingsBioCounter) dom.settingsBioCounter.textContent = `${(user.bio || '').length}/150`;
  }
  if (dom.settingsInputLocation) dom.settingsInputLocation.value = user.location || '';
  if (dom.settingsInputWebsite) dom.settingsInputWebsite.value = user.website || '';
  if (dom.settingsInputAvatar) dom.settingsInputAvatar.value = user.avatar || '';
  if (dom.settingsInputCover) dom.settingsInputCover.value = user.cover || '';

  // Security & 2FA
  if (dom.settingsToggle2FA) {
    dom.settingsToggle2FA.checked = localStorage.getItem('newgram_2fa') === 'true';
  }

  // Privacy
  if (dom.settingsTogglePrivate) {
    dom.settingsTogglePrivate.checked = user.is_private === 1 || localStorage.getItem('newgram_is_private') === 'true';
  }
  if (dom.settingsSelectMessages) {
    dom.settingsSelectMessages.value = user.allow_messages || localStorage.getItem('newgram_allow_messages') || 'everyone';
  }
  if (dom.settingsToggleFilterComments) {
    const val = user.filter_comments !== undefined ? user.filter_comments === 1 : localStorage.getItem('newgram_filter_comments') !== 'false';
    dom.settingsToggleFilterComments.checked = val;
  }
  if (dom.settingsToggleActivityStatus) {
    const val = user.activity_status !== undefined ? user.activity_status === 1 : localStorage.getItem('newgram_activity_status') !== 'false';
    dom.settingsToggleActivityStatus.checked = val;
  }

  // Notifications
  if (dom.settingsToggleNotifPause) {
    dom.settingsToggleNotifPause.checked = user.notif_pause_all === 1 || localStorage.getItem('newgram_notif_pause') === 'true';
  }
  if (dom.settingsToggleNotifLikes) {
    const val = user.notif_likes !== undefined ? user.notif_likes === 1 : localStorage.getItem('newgram_notif_likes') !== 'false';
    dom.settingsToggleNotifLikes.checked = val;
  }
  if (dom.settingsToggleNotifComments) {
    const val = user.notif_comments !== undefined ? user.notif_comments === 1 : localStorage.getItem('newgram_notif_comments') !== 'false';
    dom.settingsToggleNotifComments.checked = val;
  }
  if (dom.settingsToggleNotifMessages) {
    const val = user.notif_messages !== undefined ? user.notif_messages === 1 : localStorage.getItem('newgram_notif_messages') !== 'false';
    dom.settingsToggleNotifMessages.checked = val;
  }
  if (dom.settingsToggleNotifFollowers) {
    const val = user.notif_followers !== undefined ? user.notif_followers === 1 : localStorage.getItem('newgram_notif_followers') !== 'false';
    dom.settingsToggleNotifFollowers.checked = val;
  }

  // Appearance & Media
  updateThemePickerVisuals();
  if (dom.settingsToggleHqMedia) {
    const val = user.hq_media !== undefined ? user.hq_media === 1 : localStorage.getItem('newgram_hq_media') !== 'false';
    dom.settingsToggleHqMedia.checked = val;
  }
  if (dom.settingsToggleAutoplay) {
    const val = user.autoplay_media !== undefined ? user.autoplay_media === 1 : localStorage.getItem('newgram_autoplay') !== 'false';
    dom.settingsToggleAutoplay.checked = val;
  }
  if (dom.settingsToggleCompactFeed) {
    const val = user.compact_feed === 1 || localStorage.getItem('newgram_compact_feed') === 'true';
    dom.settingsToggleCompactFeed.checked = val;
    document.body.classList.toggle('compact-feed-mode', val);
  }

  // Storage Stats
  if (dom.storageCacheSize) {
    try {
      const bytes = (JSON.stringify(localStorage) || '').length;
      dom.storageCacheSize.textContent = `${(bytes / 1024).toFixed(1)} KB Used`;
    } catch (e) {
      dom.storageCacheSize.textContent = 'Active (Ready)';
    }
  }
}

function switchSettingsTab(tabName) {
  document.querySelectorAll('.settings-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.settingsTab === tabName);
  });
  document.querySelectorAll('.settings-pane').forEach(pane => {
    const isTarget = pane.id === `pane-settings-${tabName}`;
    pane.classList.toggle('hidden', !isTarget);
    pane.classList.toggle('active', isTarget);
  });
}

function updateThemePickerVisuals() {
  const currentTheme = state.theme || 'dark';
  if (dom.themeOptDark) dom.themeOptDark.classList.toggle('selected', currentTheme === 'dark');
  if (dom.themeOptLight) dom.themeOptLight.classList.toggle('selected', currentTheme === 'light');
}

async function handleSaveSettingsProfile() {
  const name = dom.settingsInputName.value.trim();
  const username = dom.settingsInputUsername.value.trim();
  const badge = dom.settingsInputBadge.value;
  const bio = dom.settingsInputBio.value.trim();
  const location = dom.settingsInputLocation.value.trim();
  const website = dom.settingsInputWebsite.value.trim();
  const avatar = dom.settingsInputAvatar.value.trim();
  const cover = dom.settingsInputCover.value.trim();

  if (!name) {
    showToast('Please enter your full name');
    return;
  }
  if (!username) {
    showToast('Username cannot be empty');
    return;
  }

  try {
    if (dom.btnSaveSettingsProfile) {
      dom.btnSaveSettingsProfile.disabled = true;
      dom.btnSaveSettingsProfile.textContent = 'Saving changes...';
    }

    const res = await api('/api/settings/profile', {
      method: 'POST',
      body: JSON.stringify({ name, username, badge, bio, location, website, avatar, cover })
    });

    if (res.user) {
      state.currentUser = res.user;
      const idx = state.allUsers.findIndex(u => u.id === res.user.id);
      if (idx !== -1) state.allUsers[idx] = res.user;
      setupActiveUser();
      loadSettingsView();
      showToast('Profile updated successfully! ✨');
    }
  } catch (err) {
    showToast(err.message || 'Failed to update profile');
  } finally {
    if (dom.btnSaveSettingsProfile) {
      dom.btnSaveSettingsProfile.disabled = false;
      dom.btnSaveSettingsProfile.textContent = 'Save Profile Changes';
    }
  }
}

async function handleUpdateSettingsPassword() {
  const currentPassword = dom.settingsPassCurrent.value;
  const newPassword = dom.settingsPassNew.value;
  const confirmPassword = dom.settingsPassConfirm.value;

  if (!newPassword || newPassword.length < 4) {
    showToast('New password must be at least 4 characters long');
    return;
  }
  if (newPassword !== confirmPassword) {
    showToast('New passwords do not match');
    return;
  }

  try {
    if (dom.btnUpdateSettingsPassword) {
      dom.btnUpdateSettingsPassword.disabled = true;
      dom.btnUpdateSettingsPassword.textContent = 'Updating...';
    }

    await api('/api/settings/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });

    dom.settingsPassCurrent.value = '';
    dom.settingsPassNew.value = '';
    dom.settingsPassConfirm.value = '';
    showToast('Password updated securely! 🔒');
  } catch (err) {
    showToast(err.message || 'Failed to update password');
  } finally {
    if (dom.btnUpdateSettingsPassword) {
      dom.btnUpdateSettingsPassword.disabled = false;
      dom.btnUpdateSettingsPassword.textContent = 'Update Password';
    }
  }
}

async function handleSaveSettingsPrivacy() {
  const is_private = dom.settingsTogglePrivate ? dom.settingsTogglePrivate.checked : false;
  const allow_messages = dom.settingsSelectMessages ? dom.settingsSelectMessages.value : 'everyone';
  const filter_comments = dom.settingsToggleFilterComments ? dom.settingsToggleFilterComments.checked : true;
  const activity_status = dom.settingsToggleActivityStatus ? dom.settingsToggleActivityStatus.checked : true;

  localStorage.setItem('newgram_is_private', is_private);
  localStorage.setItem('newgram_allow_messages', allow_messages);
  localStorage.setItem('newgram_filter_comments', filter_comments);
  localStorage.setItem('newgram_activity_status', activity_status);

  try {
    await api('/api/settings/preferences', {
      method: 'POST',
      body: JSON.stringify({ is_private, allow_messages, filter_comments, activity_status })
    });
    showToast('Privacy preferences saved! 🛡️');
  } catch (err) {
    showToast('Preferences saved locally 🛡️');
  }
}

async function handleSaveSettingsNotifications() {
  const notif_pause_all = dom.settingsToggleNotifPause ? dom.settingsToggleNotifPause.checked : false;
  const notif_likes = dom.settingsToggleNotifLikes ? dom.settingsToggleNotifLikes.checked : true;
  const notif_comments = dom.settingsToggleNotifComments ? dom.settingsToggleNotifComments.checked : true;
  const notif_messages = dom.settingsToggleNotifMessages ? dom.settingsToggleNotifMessages.checked : true;
  const notif_followers = dom.settingsToggleNotifFollowers ? dom.settingsToggleNotifFollowers.checked : true;

  localStorage.setItem('newgram_notif_pause', notif_pause_all);
  localStorage.setItem('newgram_notif_likes', notif_likes);
  localStorage.setItem('newgram_notif_comments', notif_comments);
  localStorage.setItem('newgram_notif_messages', notif_messages);
  localStorage.setItem('newgram_notif_followers', notif_followers);

  try {
    await api('/api/settings/preferences', {
      method: 'POST',
      body: JSON.stringify({ notif_pause_all, notif_likes, notif_comments, notif_messages, notif_followers })
    });
    showToast('Notification preferences updated! 🔔');
  } catch (err) {
    showToast('Preferences saved locally 🔔');
  }
}

async function handleSaveSettingsAppearance() {
  const hq_media = dom.settingsToggleHqMedia ? dom.settingsToggleHqMedia.checked : true;
  const autoplay_media = dom.settingsToggleAutoplay ? dom.settingsToggleAutoplay.checked : true;
  const compact_feed = dom.settingsToggleCompactFeed ? dom.settingsToggleCompactFeed.checked : false;

  localStorage.setItem('newgram_hq_media', hq_media);
  localStorage.setItem('newgram_autoplay', autoplay_media);
  localStorage.setItem('newgram_compact_feed', compact_feed);
  document.body.classList.toggle('compact-feed-mode', compact_feed);

  try {
    await api('/api/settings/preferences', {
      method: 'POST',
      body: JSON.stringify({ hq_media, autoplay_media, compact_feed })
    });
    showToast('Appearance & Media settings applied! 🎨');
  } catch (err) {
    showToast('Appearance settings applied! 🎨');
  }
}

async function handleDownloadMyData() {
  try {
    showToast('Preparing your account data archive... 📦');
    const headers = {};
    if (state.authToken) headers['Authorization'] = `Bearer ${state.authToken}`;
    if (state.currentUserId) headers['x-user-id'] = state.currentUserId.toString();

    const response = await fetch('/api/settings/export-my-data', { headers });
    if (!response.ok) throw new Error('Export failed');

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `newgram-export-${state.currentUser.username || 'user'}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);

    showToast('Archive downloaded successfully! 🖤');
  } catch (err) {
    showToast('Failed to download archive: ' + err.message);
  }
}

async function handleDeleteMyAccount() {
  const username = state.currentUser ? state.currentUser.username : 'your account';
  const confirmText = prompt(`Type "${username}" to confirm permanent deletion of your NewGram account:`);
  if (confirmText !== username) {
    showToast('Deletion cancelled');
    return;
  }

  const pass = prompt('Enter your current password to proceed:');
  if (!pass) {
    showToast('Password required');
    return;
  }

  try {
    await api('/api/settings/delete-account', {
      method: 'POST',
      body: JSON.stringify({ password: pass })
    });
    alert(`Account @${username} has been permanently deleted.`);
    handleLogout();
  } catch (err) {
    alert(err.message || 'Failed to delete account');
  }
}

function handleClearLocalCache() {
  if (confirm('Clear local browser storage cache? You will remain logged in.')) {
    const keepToken = localStorage.getItem('newgram_auth_token');
    const keepUser = localStorage.getItem('newgram_current_user_id');
    const keepTheme = localStorage.getItem('newgram_theme');
    localStorage.clear();
    if (keepToken) localStorage.setItem('newgram_auth_token', keepToken);
    if (keepUser) localStorage.setItem('newgram_current_user_id', keepUser);
    if (keepTheme) localStorage.setItem('newgram_theme', keepTheme);
    showToast('Local cache cleared! 🧹');
    loadSettingsView();
  }
}

// ==========================================
// EVENT LISTENERS SETUP
// ==========================================

function setupEventListeners() {
  // Navigation
  dom.brandHomeLink.addEventListener('click', () => switchView('feed'));
  dom.navFeed.addEventListener('click', () => switchView('feed'));
  dom.navExplore.addEventListener('click', () => switchView('explore'));
  if (dom.navReels) {
    dom.navReels.addEventListener('click', () => switchView('reels'));
  }
  if (dom.btnReelPrev) {
    dom.btnReelPrev.addEventListener('click', () => scrollReel(-1));
  }
  if (dom.btnReelNext) {
    dom.btnReelNext.addEventListener('click', () => scrollReel(1));
  }
  window.addEventListener('keydown', (e) => {
    if (state.activeView !== 'reels') return;
    if (e.key === 'ArrowDown' || e.key === 'j') {
      scrollReel(1);
      e.preventDefault();
    } else if (e.key === 'ArrowUp' || e.key === 'k') {
      scrollReel(-1);
      e.preventDefault();
    }
  });

  if (dom.navMessages) {
    dom.navMessages.addEventListener('click', () => switchView('messages'));
  }
  if (dom.mobileChatBtn) {
    dom.mobileChatBtn.addEventListener('click', () => switchView('messages'));
  }
  if (dom.floatingMessagesDock) {
    dom.floatingMessagesDock.addEventListener('click', () => {
      state.floatingDockDismissed = true;
      dom.floatingMessagesDock.classList.add('hidden', 'dismissed');
      if (dom.floatingDockBadge) dom.floatingDockBadge.style.display = 'none';
      if (dom.chatUnreadBadge) dom.chatUnreadBadge.classList.add('hidden');
      switchView('messages');
    });
  }
  if (dom.navSaved && dom.navSaved !== dom.moreItemSaved) {
    dom.navSaved.addEventListener('click', () => switchView('saved'));
  }
  dom.navNotifications.addEventListener('click', () => switchView('notifications'));
  dom.navProfile.addEventListener('click', () => switchView('profile', { userId: state.currentUserId }));

  // Stories Carousel Buttons
  if (dom.btnStoriesNext && dom.storiesStrip) {
    dom.btnStoriesNext.addEventListener('click', () => {
      dom.storiesStrip.scrollBy({ left: 260, behavior: 'smooth' });
    });
  }
  if (dom.btnStoriesPrev && dom.storiesStrip) {
    dom.btnStoriesPrev.addEventListener('click', () => {
      dom.storiesStrip.scrollBy({ left: -260, behavior: 'smooth' });
    });
  }

  // Chat Actions & Filters
  if (dom.chatAccountSelector) {
    dom.chatAccountSelector.addEventListener('click', openCreateUserModal);
  }
  if (dom.chatSearchInput) {
    dom.chatSearchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const threads = dom.chatThreadsList.querySelectorAll('.chat-thread-item');
      threads.forEach(t => {
        const match = t.textContent.toLowerCase().includes(q);
        t.style.display = match ? 'flex' : 'none';
      });
    });
  }
  if (dom.tabDirectMessages && dom.tabDirectRequests) {
    dom.tabDirectMessages.addEventListener('click', () => {
      dom.tabDirectMessages.classList.add('active');
      dom.tabDirectRequests.classList.remove('active');
    });
    dom.tabDirectRequests.addEventListener('click', () => {
      dom.tabDirectRequests.classList.add('active');
      dom.tabDirectMessages.classList.remove('active');
      showToast('No pending message requests');
    });
  }
  if (dom.btnSeeAllSuggestions) {
    dom.btnSeeAllSuggestions.addEventListener('click', () => switchView('explore'));
  }

  if (dom.btnOpenNewChat) {
    dom.btnOpenNewChat.addEventListener('click', openNewChatModal);
  }
  if (dom.btnChatStartDirect) {
    dom.btnChatStartDirect.addEventListener('click', () => {
      const otherUser = state.allUsers.find(u => u.id !== state.currentUserId);
      if (otherUser) {
        selectConversation(otherUser.id);
      } else {
        openNewChatModal();
      }
    });
  }

  if (dom.chatTextInput) {
    dom.chatTextInput.addEventListener('input', () => {
      dom.btnSendMessage.classList.toggle('active', !!dom.chatTextInput.value.trim());
    });
    dom.chatTextInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSendMessage();
    });
  }

  if (dom.btnSendMessage) {
    dom.btnSendMessage.addEventListener('click', handleSendMessage);
  }

  // Quick Chat Reactions
  document.querySelectorAll('.btn-chat-reaction').forEach(btn => {
    btn.addEventListener('click', () => {
      const emoji = btn.dataset.emoji;
      dom.chatTextInput.value += emoji;
      dom.chatTextInput.focus();
      dom.btnSendMessage.classList.add('active');
    });
  });

  // New Chat Modal Controls
  if (dom.btnCancelNewChat) {
    dom.btnCancelNewChat.addEventListener('click', () => dom.modalNewChat.close());
  }
  if (dom.btnStartSelectedChat) {
    dom.btnStartSelectedChat.addEventListener('click', () => {
      if (state.selectedNewChatUserId) {
        dom.modalNewChat.close();
        switchView('messages', { partnerId: state.selectedNewChatUserId });
      } else {
        showToast('Please select a creator to chat with');
      }
    });
  }

  if (dom.newChatSearchInput) {
    dom.newChatSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const filtered = state.allUsers
        .filter(u => u.id !== state.currentUserId)
        .filter(u => u.name.toLowerCase().includes(query) || u.handle.toLowerCase().includes(query));
      renderNewChatUserList(filtered);
    });
  }

  dom.btnOpenCreateModal.addEventListener('click', openCreatePostModal);
  dom.mobileCreateBtn.addEventListener('click', openCreatePostModal);
  dom.mobileNotifBtn.addEventListener('click', () => switchView('notifications'));

  // More Menu Popover Interaction
  if (dom.btnMenuMore && dom.moreMenuPopover) {
    dom.btnMenuMore.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = dom.moreMenuPopover.classList.toggle('hidden');
      dom.btnMenuMore.classList.toggle('active', !isHidden);
    });

    document.addEventListener('click', (e) => {
      if (dom.moreMenuPopover && !dom.moreMenuPopover.classList.contains('hidden')) {
        if (!dom.moreMenuPopover.contains(e.target) && !dom.btnMenuMore.contains(e.target)) {
          dom.moreMenuPopover.classList.add('hidden');
          dom.btnMenuMore.classList.remove('active');
        }
      }
    });

    // When sidebar leaves hover state and returns to normal (72px collapsed), automatically hide popover
    const appSidebar = document.querySelector('.app-sidebar');
    if (appSidebar) {
      appSidebar.addEventListener('mouseleave', () => {
        if (dom.moreMenuPopover && !dom.moreMenuPopover.classList.contains('hidden')) {
          dom.moreMenuPopover.classList.add('hidden');
          if (dom.btnMenuMore) dom.btnMenuMore.classList.remove('active');
        }
      });
    }
  }

  // Settings Tab Switching
  document.querySelectorAll('.settings-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.settingsTab;
      if (tab) switchSettingsTab(tab);
    });
  });

  // More Menu Popover Items
  if (dom.moreItemSettings) {
    dom.moreItemSettings.addEventListener('click', () => {
      if (dom.moreMenuPopover) dom.moreMenuPopover.classList.add('hidden');
      if (dom.btnMenuMore) dom.btnMenuMore.classList.remove('active');
      switchView('settings');
    });
  }

  if (dom.settingsInputBio && dom.settingsBioCounter) {
    dom.settingsInputBio.addEventListener('input', (e) => {
      dom.settingsBioCounter.textContent = `${e.target.value.length}/150`;
    });
  }

  if (dom.settingsInputAvatar && dom.settingsAvatarPreview) {
    dom.settingsInputAvatar.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (val) dom.settingsAvatarPreview.src = val;
    });
  }

  if (dom.btnSaveSettingsProfile) dom.btnSaveSettingsProfile.addEventListener('click', handleSaveSettingsProfile);
  if (dom.btnUpdateSettingsPassword) dom.btnUpdateSettingsPassword.addEventListener('click', handleUpdateSettingsPassword);
  if (dom.btnSaveSettingsPrivacy) dom.btnSaveSettingsPrivacy.addEventListener('click', handleSaveSettingsPrivacy);
  if (dom.btnSaveSettingsNotifications) dom.btnSaveSettingsNotifications.addEventListener('click', handleSaveSettingsNotifications);
  if (dom.btnSaveSettingsAppearance) dom.btnSaveSettingsAppearance.addEventListener('click', handleSaveSettingsAppearance);
  if (dom.btnDownloadMyData) dom.btnDownloadMyData.addEventListener('click', handleDownloadMyData);
  if (dom.btnDangerDeleteAccount) dom.btnDangerDeleteAccount.addEventListener('click', handleDeleteMyAccount);
  if (dom.btnClearLocalCache) dom.btnClearLocalCache.addEventListener('click', handleClearLocalCache);

  if (dom.themeOptDark) {
    dom.themeOptDark.addEventListener('click', () => {
      applyTheme('dark');
      updateThemePickerVisuals();
      showToast('Obsidian Dark Mode selected 🌑');
    });
  }
  if (dom.themeOptLight) {
    dom.themeOptLight.addEventListener('click', () => {
      applyTheme('light');
      updateThemePickerVisuals();
      showToast('Pristine White Mode selected ☀️');
    });
  }

  if (dom.settingsToggle2FA) {
    dom.settingsToggle2FA.addEventListener('change', (e) => {
      localStorage.setItem('newgram_2fa', e.target.checked);
      showToast(e.target.checked ? '2FA Protection Enabled 🛡️' : '2FA Protection Disabled');
    });
  }

  if (dom.btnHelpGuidelines) {
    dom.btnHelpGuidelines.addEventListener('click', () => showToast('Community Guidelines: Be inspiring, respect creators, share original art. 🖤'));
  }
  if (dom.btnHelpTerms) {
    dom.btnHelpTerms.addEventListener('click', () => showToast('Terms: Full copyright & ownership remains with original creators.'));
  }
  if (dom.btnHelpPrivacy) {
    dom.btnHelpPrivacy.addEventListener('click', () => showToast('Privacy: All data stored locally in newgram.db on your PC.'));
  }

  if (dom.moreItemSaved) {
    dom.moreItemSaved.addEventListener('click', () => {
      if (dom.moreMenuPopover) dom.moreMenuPopover.classList.add('hidden');
      if (dom.btnMenuMore) dom.btnMenuMore.classList.remove('active');
      switchView('saved');
    });
  }

  if (dom.moreItemAdmin) {
    dom.moreItemAdmin.addEventListener('click', () => {
      if (dom.moreMenuPopover) dom.moreMenuPopover.classList.add('hidden');
      if (dom.btnMenuMore) dom.btnMenuMore.classList.remove('active');
    });
  }

  if (dom.moreItemAuth) {
    dom.moreItemAuth.addEventListener('click', () => {
      if (dom.moreMenuPopover) dom.moreMenuPopover.classList.add('hidden');
      if (dom.btnMenuMore) dom.btnMenuMore.classList.remove('active');
      if (state.authToken) {
        handleLogout();
      } else {
        openAuthModal('login');
      }
    });
  }

  if (dom.btnAsideSwitch) {
    dom.btnAsideSwitch.addEventListener('click', () => {
      if (isGenuineLoggedIn()) {
        handleLogout();
      } else {
        const demoUsers = state.allUsers.filter(u => u.id <= 5);
        if (demoUsers.length > 0) {
          const currentIndex = demoUsers.findIndex(u => u.id === state.currentUserId);
          const nextIndex = (currentIndex + 1) % demoUsers.length;
          switchUser(demoUsers[nextIndex].id);
        } else {
          openAuthModal('login');
        }
      }
    });
  }

  if (dom.modalAuth) {
    dom.modalAuth.addEventListener('close', () => {
      document.body.classList.remove('auth-modal-open');
    });
  }

  if (dom.btnCloseAuthModal) {
    dom.btnCloseAuthModal.addEventListener('click', closeAuthModal);
  }

  if (dom.authTabLogin) {
    dom.authTabLogin.addEventListener('click', () => setAuthTab('login'));
  }

  if (dom.authTabRegister) {
    dom.authTabRegister.addEventListener('click', () => setAuthTab('register'));
  }

  if (dom.formAuthLogin) {
    dom.formAuthLogin.addEventListener('submit', handleLogin);
  }

  if (dom.formAuthRegister) {
    dom.formAuthRegister.addEventListener('submit', handleRegister);
  }

  if (dom.btnToggleLoginPass && dom.loginPassword) {
    dom.btnToggleLoginPass.addEventListener('click', () => {
      togglePasswordVisibility(dom.loginPassword, dom.btnToggleLoginPass);
    });
  }

  if (dom.btnToggleRegPass && dom.registerPassword) {
    dom.btnToggleRegPass.addEventListener('click', () => {
      togglePasswordVisibility(dom.registerPassword, dom.btnToggleRegPass);
    });
  }
  // In-Feed Quick Composer Controls
  if (dom.btnInfeedAddPhoto) {
    dom.btnInfeedAddPhoto.addEventListener('click', () => {
      dom.composerExpandableRow.classList.toggle('hidden');
      if (!dom.composerExpandableRow.classList.contains('hidden')) {
        dom.infeedPhotoUrl.focus();
      }
    });
  }
  if (dom.btnInfeedAddMusic) {
    dom.btnInfeedAddMusic.addEventListener('click', () => {
      dom.composerExpandableRow.classList.remove('hidden');
      if (!dom.infeedMusicTag.value) {
        dom.infeedMusicTag.value = '🎵 Tycho • Awake (Ambient Mix)';
      }
      dom.infeedMusicTag.focus();
    });
  }
  if (dom.btnInfeedAddTag) {
    dom.btnInfeedAddTag.addEventListener('click', () => {
      dom.infeedQuickText.value = (dom.infeedQuickText.value ? dom.infeedQuickText.value + ' ' : '') + '#aesthetic #moments';
      dom.infeedQuickText.focus();
    });
  }
  if (dom.btnInfeedPost) {
    dom.btnInfeedPost.addEventListener('click', handleInfeedPost);
  }
  if (dom.infeedQuickText) {
    dom.infeedQuickText.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleInfeedPost();
      }
    });
  }

  // Feed Subtabs
  dom.subtabAll.addEventListener('click', () => {
    dom.subtabAll.classList.add('active');
    dom.subtabFollowing.classList.remove('active');
    state.feedFilter = 'all';
    state.activeTagFilter = null;
    dom.tagFilterIndicator.classList.add('hidden');
    loadFeed();
  });

  dom.subtabFollowing.addEventListener('click', () => {
    dom.subtabFollowing.classList.add('active');
    dom.subtabAll.classList.remove('active');
    state.feedFilter = 'following';
    state.activeTagFilter = null;
    dom.tagFilterIndicator.classList.add('hidden');
    loadFeed();
  });

  dom.btnRemoveTagFilter.addEventListener('click', () => {
    state.activeTagFilter = null;
    dom.tagFilterIndicator.classList.add('hidden');
    loadFeed();
  });

  // Stories
  dom.btnAddStory.addEventListener('click', openAddStoryModal);
  dom.btnCloseStory.addEventListener('click', () => {
    clearTimeout(state.storyTimer);
    dom.modalStoryViewer.close();
  });

  // Create Post Modal Controls
  dom.btnCancelCreatePost.addEventListener('click', () => dom.modalCreatePost.close());
  dom.btnPublishPost.addEventListener('click', handlePublishPost);

  document.querySelectorAll('.media-upload-pane .thumb-opt').forEach(thumb => {
    thumb.addEventListener('click', () => {
      document.querySelectorAll('.media-upload-pane .thumb-opt').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      const url = thumb.dataset.url;
      state.selectedPostMediaUrl = url;
      dom.createPreviewImg.src = url;
    });
  });

  dom.btnApplyCustomImage.addEventListener('click', () => {
    const url = dom.customImageInput.value.trim();
    if (url) {
      state.selectedPostMediaUrl = url;
      dom.createPreviewImg.src = url;
      showToast('Image attached');
    }
  });

  // Add Story Modal Controls
  dom.btnCancelAddStory.addEventListener('click', () => dom.modalAddStory.close());
  dom.btnSubmitStory.addEventListener('click', handleSubmitStory);
  document.querySelectorAll('#modal-add-story .thumb-opt').forEach(thumb => {
    thumb.addEventListener('click', () => {
      document.querySelectorAll('#modal-add-story .thumb-opt').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      state.selectedStoryMediaUrl = thumb.dataset.url;
    });
  });

  // Profile View Tabs (Grid vs Feed)
  dom.btnProfileGridTab.addEventListener('click', () => {
    dom.btnProfileGridTab.classList.add('active');
    dom.btnProfileFeedTab.classList.remove('active');
    dom.profileGridContainer.classList.remove('hidden');
    dom.profileFeedContainer.classList.add('hidden');
  });

  dom.btnProfileFeedTab.addEventListener('click', () => {
    dom.btnProfileFeedTab.classList.add('active');
    dom.btnProfileGridTab.classList.remove('active');
    dom.profileFeedContainer.classList.remove('hidden');
    dom.profileGridContainer.classList.add('hidden');
  });

  // Profile Network modals
  dom.btnViewFollowers.addEventListener('click', () => openNetworkModal('followers'));
  dom.btnViewFollowing.addEventListener('click', () => openNetworkModal('following'));

  // Edit Profile
  dom.btnCancelEdit.addEventListener('click', () => dom.modalEditProfile.close());
  dom.btnSaveEditProfile.addEventListener('click', handleSaveEditProfile);

  // Create User
  dom.btnCancelCreateUser.addEventListener('click', () => dom.modalCreateUser.close());
  dom.btnSubmitCreateUser.addEventListener('click', handleSubmitCreateUser);
  dom.btnCloseNetworkModal.addEventListener('click', () => dom.modalNetwork.close());

  // Search
  let searchTimer;
  dom.exploreSearchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    dom.btnClearSearch.classList.toggle('hidden', !val);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => handleSearch(val), 300);
  });

  dom.btnClearSearch.addEventListener('click', () => {
    dom.exploreSearchInput.value = '';
    dom.btnClearSearch.classList.add('hidden');
    loadExplore();
  });

  // Reset DB
  dom.btnResetDb.addEventListener('click', async () => {
    if (confirm('Reset and re-seed NewGram visual database?')) {
      try {
        await api('/api/reset-seed', { method: 'POST' });
        showToast('NewGram database re-seeded! 🖤');
        await loadUsers();
        setupActiveUser();
        loadStories();
        loadFeed();
        loadSidebarWidgets();
      } catch (err) {
        showToast('Error resetting database');
      }
    }
  });
}

// ==========================================
// UTILITIES
// ==========================================

function formatTimeAgo(dateString) {
  if (!dateString) return 'now';
  const now = new Date();
  const past = new Date(dateString.replace(' ', 'T') + 'Z');
  const seconds = Math.floor((now - past) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return past.toLocaleDateString();
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', initApp);
