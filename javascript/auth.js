// (Initialization of interactive auth UI is performed after DOMContentLoaded)

// When returning to login view, reset all login UI and show main Turnstile only
function showLogin() {
  console.log('🔄 Switching to Login view');
  if (authOptions) authOptions.style.display = 'none';
  if (loginSection) loginSection.style.display = 'block';
  if (signupSection) signupSection.style.display = 'none';
  // Reset login UI
  if (passwordLoginFields) passwordLoginFields.style.display = 'none';
  if (magicLinkConfirm) magicLinkConfirm.style.display = 'none';
  if (showPasswordLoginBtn) showPasswordLoginBtn.style.display = '';
  if (showMagicLinkBtn) showMagicLinkBtn.style.display = '';
  const loginMethods = document.getElementById('login-methods');
  if (loginMethods) loginMethods.style.display = '';
  // Hide password Turnstile, show main Turnstile
  const allTurnstiles = loginSection ? loginSection.querySelectorAll('.cf-turnstile') : [];
  allTurnstiles.forEach(ts => {
    if (ts.id === 'password-turnstile') {
      ts.style.display = 'none';
    } else {
      ts.style.display = '';
    }
  });
  // Always show login button in login view
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) loginBtn.style.display = '';
  // Always show email/password inputs
  if (loginEmailInput) loginEmailInput.style.display = '';
  const loginPasswordInput = document.getElementById('login-password');
  if (loginPasswordInput) loginPasswordInput.style.display = '';
  setStatus('', 'login');
}

// Bulletproof: Immediately assign to window after declaration, with try/catch for safety
try {
  window.showLogin = showLogin;
} catch (e) {
  // fallback: define property if window is not writable
  Object.defineProperty(window, 'showLogin', { value: showLogin, writable: true });
}

// ...existing code...
// Elements
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const signupEmailInput = document.getElementById('signup-email');
const signupPasswordInput = document.getElementById('signup-password');
const signupUsernameInput = document.getElementById('signup-username');
const signupAvatarInput = document.getElementById('signup-avatar');
const statusLo = document.getElementById('status-lo');
const statusEl = document.getElementById('status');
const profileInfo = document.getElementById('profile-info');
const profileUsername = document.getElementById('profile-username');
const profileAvatar = document.getElementById('profile-avatar');
const newUsernameInput = document.getElementById('new-username');
const updateUsernameBtn = document.getElementById('update-username-btn');
const authOptions = document.getElementById('auth-options');
const loginSection = document.getElementById('login-section');
const signupSection = document.getElementById('signup-section');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const showPasswordLoginBtn = document.getElementById('show-password-login-btn');
const showMagicLinkBtn = document.getElementById('show-magic-link-btn');
const passwordLoginFields = document.getElementById('password-login-fields');
const magicLinkConfirm = document.getElementById('magic-link-confirm');
const magicLinkBackBtn = document.getElementById('magic-link-back-btn');

function setStatus(msg, los) {
  if (los === 'login') {
    console.log(`💬 [Status - Login]: ${msg}`);
    statusLo.innerHTML = msg;
  } else if (los === 'signup') {
    console.log(`💬 [Status - Signup]: ${msg}`);
    statusEl.innerHTML = msg;

  } else {
    console.log(`💬 [Status]: ${msg}`);
  }
}

// ...existing code...
// Global tokens for each widget
// Tokens for each flow/widget
// Tokens for each flow and metadata (timestamp) to prevent reuse/timeouts
window.turnstileSignupToken = null;
window.turnstileSignupMeta = null; // { token, ts }
window.turnstileLoginToken = null;
window.turnstileLoginMeta = null; // { token, ts }
window.turnstilePasswordToken = null;
window.turnstilePasswordMeta = null; // { token, ts }

// In-flight flags and render promises to prevent duplicate actions
window._authInFlight = window._authInFlight || false;
window._turnstileRenderPromises = window._turnstileRenderPromises || {};

function _cap(s){ return s.charAt(0).toUpperCase()+s.slice(1); }
function setTurnstileToken(flow, token){
  const meta = { token: token, ts: Date.now() };
  if (flow === 'signup') { window.turnstileSignupToken = token; window.turnstileSignupMeta = meta; }
  else if (flow === 'login') { window.turnstileLoginToken = token; window.turnstileLoginMeta = meta; }
  else if (flow === 'password') { window.turnstilePasswordToken = token; window.turnstilePasswordMeta = meta; }
}
function clearTurnstileToken(flow){
  if (flow === 'signup') { window.turnstileSignupToken = null; window.turnstileSignupMeta = null; }
  else if (flow === 'login') { window.turnstileLoginToken = null; window.turnstileLoginMeta = null; }
  else if (flow === 'password') { window.turnstilePasswordToken = null; window.turnstilePasswordMeta = null; }
}
function isTurnstileTokenFresh(flow, maxAgeMs = 120000){
  let meta = null;
  if (flow === 'signup') meta = window.turnstileSignupMeta;
  else if (flow === 'login') meta = window.turnstileLoginMeta;
  else if (flow === 'password') meta = window.turnstilePasswordMeta;
  if (!meta || !meta.token) return false;
  return (Date.now() - meta.ts) <= maxAgeMs;
}

// Helper: Reload all visible Turnstile widgets and clear tokens
function reloadAllTurnstiles(force = false) {
  // Prefer resetting by stored widget id to avoid duplicate-render warnings
  try {
    Object.keys(window._turnstileWidgets || {}).forEach(key => {
      const widgetId = window._turnstileWidgets[key];
      if (widgetId !== undefined && widgetId !== null && window.turnstile && typeof window.turnstile.reset === 'function') {
        try { window.turnstile.reset(widgetId); } catch (e) { /* ignore */ }
      } else {
        // Fallback: try resetting by element reference if available
        const possibleEl = document.querySelector('[data-_turnstile-key="' + key + '"]') || document.getElementById(key);
        if (possibleEl && window.turnstile && typeof window.turnstile.reset === 'function') {
          try { window.turnstile.reset(possibleEl); } catch (e) { /* ignore */ }
        }
      }
    });
  } catch (e) { /* ignore */ }

  // Also attempt a generic reset for any remaining containers
  document.querySelectorAll('.cf-turnstile').forEach(el => {
    try {
      const key = el.dataset._turnstileKey;
      if (!key && window.turnstile && typeof window.turnstile.reset === 'function') {
        try { window.turnstile.reset(el); } catch (e) { /* ignore */ }
      }
    } catch (e) { /* ignore */ }
  });

  // Clear stored widget ids so future renders are clean
  window._turnstileWidgets = {};
  // Clear tokens unless they are still fresh and force is false
  if (force) {
    clearTurnstileToken('signup'); clearTurnstileToken('login'); clearTurnstileToken('password');
  } else {
    if (!isTurnstileTokenFresh('signup')) clearTurnstileToken('signup');
    if (!isTurnstileTokenFresh('login')) clearTurnstileToken('login');
    if (!isTurnstileTokenFresh('password')) clearTurnstileToken('password');
  }
  // Disable buttons until solved again
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) loginBtn.disabled = true;
  const signupBtn = document.getElementById('signup-btn');
  if (signupBtn) signupBtn.disabled = true;
}

// Debug: expose a showSignup to match HTML inline handlers
function showSignup() {
  console.debug('showSignup() called');
  if (authOptions) authOptions.style.display = 'none';
  if (loginSection) loginSection.style.display = 'none';
  if (signupSection) signupSection.style.display = 'block';
  // ensure signup-related widgets visible
  const allTurnstiles = signupSection ? signupSection.querySelectorAll('.cf-turnstile') : document.querySelectorAll('.cf-turnstile');
  allTurnstiles.forEach(ts => { ts.style.display = ''; });
  setStatus('', 'signup');
}
try { window.showSignup = showSignup; } catch(e) { Object.defineProperty(window, 'showSignup', { value: showSignup, writable: true }); }


// === Turnstile helpers (ensure script, render, reset) ===
// These are lightweight, defensive helpers to make widget rendering reliable.
window._turnstileWidgets = window._turnstileWidgets || {};
window._turnstileLoadPromise = window._turnstileLoadPromise || null;

function ensureTurnstileScript(timeoutMs = 10000) {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (window._turnstileLoadPromise) return window._turnstileLoadPromise;

  window._turnstileLoadPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    s.async = true;
    s.defer = true;
    let finished = false;
    s.addEventListener('load', () => {
      finished = true;
      console.debug('Turnstile script loaded');
      resolve(window.turnstile);
    });
    s.addEventListener('error', (e) => {
      if (finished) return;
      finished = true;
      console.warn('Turnstile script failed to load, will retry once');
      // retry once after 700ms
      setTimeout(() => {
        const t = document.createElement('script');
        t.src = s.src;
        t.async = true; t.defer = true;
        t.addEventListener('load', () => { console.debug('Turnstile script loaded on retry'); resolve(window.turnstile); });
        t.addEventListener('error', () => { reject(new Error('Failed to load Turnstile script after retry')); });
        document.head.appendChild(t);
      }, 700);
    });
    document.head.appendChild(s);
    setTimeout(() => {
      if (finished) return;
      finished = true;
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error('Turnstile script load timeout'));
    }, timeoutMs);
  });
  return window._turnstileLoadPromise;
}

async function renderTurnstile(container, opts = {}) {
  const el = (typeof container === 'string') ? document.querySelector(container) : container;
  if (!el) throw new Error('Turnstile container not found: ' + container);
  console.debug('renderTurnstile: preparing to render into', container);
  await ensureTurnstileScript();
  // dedupe renders for same element
  const renderKey = el.id || el.dataset._turnstileKey || ('ts_' + Math.random().toString(36).slice(2));
  if (window._turnstileRenderPromises[renderKey]) {
    console.debug('renderTurnstile: waiting for in-flight render for', renderKey);
    try { await window._turnstileRenderPromises[renderKey]; } catch(e) { /* ignore */ }
  }
  // Avoid double-render: if we've already rendered into this element, return stored id
  const key = el.dataset._turnstileKey || (el.id || ('ts_' + Math.random().toString(36).slice(2)));
  if (el.dataset._turnstileKey && (window._turnstileWidgets && window._turnstileWidgets[key] !== undefined)) {
    console.debug('renderTurnstile: already rendered for key', key, 'widgetId=', window._turnstileWidgets[key]);
    return window._turnstileWidgets[key];
  }

  // If element already appears to contain a rendered Turnstile (iframe), skip rendering to avoid warning
  try {
    const hasIframe = el.querySelector && el.querySelector('iframe[src*="challenges.cloudflare.com"]');
    if (hasIframe) {
      // mark as rendered so we don't attempt again
      el.dataset._turnstileKey = key;
      window._turnstileWidgets[key] = null; // externally rendered
      return null;
    }
  } catch (e) { /* ignore DOM checks */ }
  const cb = opts.onSuccess ? function(token){ try { opts.onSuccess(token); } catch(e){console.error(e);} } : undefined;
  const exp = opts.onExpired ? function(){ try { opts.onExpired(); } catch(e){console.error(e);} } : undefined;
  const renderOpts = Object.assign({}, opts.render || {});
  if (cb) renderOpts.callback = cb;
  if (exp) renderOpts['expired-callback'] = exp;
  let widgetId = null;
  try {
    console.debug('renderTurnstile: calling window.turnstile.render for key', key);
    // store promise so concurrent callers wait for the same render
    window._turnstileRenderPromises[renderKey] = (async () => {
      try { return window.turnstile.render(el, renderOpts); }
      catch (e1) {
        try { return window.turnstile.render('#' + el.id, renderOpts); } catch (e2) { console.warn('turnstile render failed', e1, e2); throw e2; }
      }
    })();
    widgetId = await window._turnstileRenderPromises[renderKey];
    delete window._turnstileRenderPromises[renderKey];
  } catch (e1) {
    console.warn('renderTurnstile: final render failure', e1);
  }
  // store key even if widgetId is null (external render or failure)
  el.dataset._turnstileKey = key;
  window._turnstileWidgets[key] = widgetId;
  console.debug('renderTurnstile: stored widget', key, '=>', widgetId);
  return widgetId;
}

function resetTurnstile(container) {
  const el = (typeof container === 'string') ? document.querySelector(container) : container;
  if (!el) return;
  const key = el.dataset._turnstileKey;
  const widgetId = key ? window._turnstileWidgets && window._turnstileWidgets[key] : undefined;
  console.debug('resetTurnstile: key=', key, 'widgetId=', widgetId);
  if (widgetId !== undefined && widgetId !== null && window.turnstile && typeof window.turnstile.reset === 'function') {
    try { window.turnstile.reset(widgetId); } catch (e) { console.error('turnstile reset failed', e); }
  } else if (window.turnstile && typeof window.turnstile.reset === 'function') {
    try { window.turnstile.reset(el); } catch (e) { /* ignore */ }
  }
  console.debug('resetTurnstile: cleared tokens for element id=', el.id);
  // Clear associated tokens
  if (el.id && el.id.includes('password')) {
    window.turnstilePasswordToken = null;
  } else if (el.id && el.id.includes('signup')) {
    window.turnstileSignupToken = null;
  } else if (el.id && el.id.includes('login')) {
    window.turnstileLoginToken = null;
  } else {
    // fallback: clear all to be safe
    window.turnstileSignupToken = null;
    window.turnstileLoginToken = null;
    window.turnstilePasswordToken = null;
  }
}

window.ensureTurnstileScript = ensureTurnstileScript;
window.renderTurnstile = renderTurnstile;
window.resetTurnstile = resetTurnstile;

// Callbacks for the Turnstile widgets (set these in your HTML widget data-callback)
window.onTurnstileSignupSuccess = function (token) {
  setTurnstileToken('signup', token);
  const btn = document.getElementById('signup-btn'); if (btn) btn.disabled = false;
  console.log('✅ Turnstile signup token received (fresh)');
};

window.onTurnstileLoginSuccess = function (token) {
  setTurnstileToken('login', token);
  const btn = document.getElementById('login-btn'); if (btn) btn.disabled = false;
  console.log('✅ Turnstile login token received (fresh)');
};

// Password-specific callback (password login flow)
window.onTurnstilePasswordSuccess = function (token) {
  setTurnstileToken('password', token);
  const loginBtn = document.getElementById('login-btn'); if (loginBtn) loginBtn.disabled = false;
  console.log('✅ Turnstile password token received (fresh)');
};

async function signUp() {
  const email = signupEmailInput.value.trim();
  const password = signupPasswordInput.value;
  const confirmPassword = document.getElementById('signup-confirm-password').value;
  const usernameInput = document.getElementById('signup-username');
  const username = usernameInput.value.trim();
  const birthdayInput = document.getElementById('signup-birthday');
  const birthdayWarning = document.getElementById('birthday-warning');
  const birthdayValue = birthdayInput.value;

  console.log(`👤 SignUp attempt for email: ${email}, username: ${username}, birthday: ${birthdayValue}`);

  // Reset any previous username input styles/messages
  usernameInput.style.border = '';
  const usernameWarning = document.getElementById('username-warning');
  if (usernameWarning) usernameWarning.style.display = 'none';

  const signupBtn = document.getElementById('signup-btn');
  if (signupBtn) signupBtn.disabled = true;
  if (!email || !password || !confirmPassword || !username || !birthdayValue) {
    console.warn('⚠️ SignUp failed: Missing fields');
    setStatus('Please fill in all fields.', 'signup');
    reloadAllTurnstiles();
    if (signupBtn) signupBtn.disabled = false;
    return;
  }
  // New: Block bad usernames
  if (containsBadWord(username)) {
    usernameInput.style.border = '2px solid red';
    if (usernameWarning) {
      usernameWarning.textContent = "This username isn't appropriate for starship.";
      usernameWarning.style.color = 'red';
      usernameWarning.style.display = 'block';
    } else {
      const warningEl = document.createElement('div');
      warningEl.id = 'username-warning';
      warningEl.style.color = 'red';
      warningEl.style.marginTop = '4px';
      warningEl.textContent = "This username isn't appropriate for starship.";
      usernameInput.insertAdjacentElement('afterend', warningEl);
    }
    console.warn('⚠️ SignUp failed: Username contains banned word');
    setStatus("This username isn't appropriate for starship.", 'signup');
    reloadAllTurnstiles();
    if (signupBtn) signupBtn.disabled = false;
    return;
  }
  // --- Passwords match check ---
  if (password !== confirmPassword) {
    console.warn('⚠️ SignUp failed: Passwords do not match');
    setStatus('Passwords do not match.', 'signup');
    reloadAllTurnstiles();
    if (signupBtn) signupBtn.disabled = false;
    return;
  }
  // --- Age check ---
  const birthday = new Date(birthdayValue);
  const today = new Date();
  const ageDifMs = today - birthday;
  const ageDate = new Date(ageDifMs);
  const age = Math.abs(ageDate.getUTCFullYear() - 1970);
  if (age < 13) {
    birthdayInput.style.border = "2px solid red";
    birthdayWarning.style.display = "block";
    console.warn('⚠️ SignUp failed: User under 13');
    setStatus("You must be at least 13 years old to sign up.", "signup");
    reloadAllTurnstiles();
    if (signupBtn) signupBtn.disabled = false;
    return;
  } else {
    birthdayInput.style.border = "";
    birthdayWarning.style.display = "none";
  }
  // --- Turnstile token check ---
  const token = window.turnstileSignupToken;
  if (!token) {
    console.warn('⚠️ No Turnstile token found.');
    setStatus('Please complete the bot check.', 'signup');
    reloadAllTurnstiles();
    if (signupBtn) signupBtn.disabled = false;
    return;
  }
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        captchaToken: token,
        data: {
          username: username,
          birthday: birthdayValue
        }
      }
    });
    if (error) {
      console.error('❌ SignUp error:', error);
      setStatus('Sign up error: ' + error.message, 'signup');
      reloadAllTurnstiles(true);
      if (signupBtn) signupBtn.disabled = false;
      return;
    }
  console.log('✅ SignUp successful:', data);
    localStorage.setItem('pendingUsername', username);
    setStatus('Signed up! Confirm your email, then sign in.', 'signup');
  reloadAllTurnstiles(true);
    if (signupBtn) signupBtn.disabled = false;
  } catch (e) {
  console.error('❌ Unexpected error during signUp:', e);
  setStatus('Unexpected error. Please try again later.', 'signup');
  reloadAllTurnstiles(true);
  if (signupBtn) signupBtn.disabled = false;
  }
}



async function signIn() {
  // Prefer password token when fresh; fall back to login token if fresh
  let token = null;
  if (isTurnstileTokenFresh('password')) token = window.turnstilePasswordToken;
  else if (isTurnstileTokenFresh('login')) token = window.turnstileLoginToken;
  const email = loginEmailInput.value.trim();
  const password = loginPasswordInput.value;
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) loginBtn.disabled = true;
  if (!token) {
    console.warn('⚠️ No Turnstile token found.');
    setStatus('Please complete the bot check to send a magic link.', 'login');
    reloadAllTurnstiles();
    if (loginBtn) loginBtn.disabled = false;
    return;
  }
  console.log(`🔐 SignIn attempt for email: ${email}`);
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
      options: {
        captchaToken: token
      }
    });
    if (error) {
      console.error('❌ Login error:', error);
      setStatus('Login error: ' + error.message, 'login');
      reloadAllTurnstiles(true);
      if (loginBtn) loginBtn.disabled = false;
      return;
    }
    console.log('✅ Logged in successfully:', data);
    setStatus('Logged in!', 'login');
    await ensureProfile();
    await checkForAdmin();
    await loadProfile();
  location.reload();
  reloadAllTurnstiles(true);
    if (loginBtn) loginBtn.disabled = false;
  } catch (e) {
  console.error('❌ Unexpected error during signIn:', e);
  setStatus('Unexpected error. Please try again later.', 'login');
  reloadAllTurnstiles(true);
  if (loginBtn) loginBtn.disabled = false;
  }
}


async function sendResetLink() {
  const email = emailInput.value.trim();
  const token = window.turnstileLoginToken; // grab the same Turnstile token
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) loginBtn.disabled = true;
  if (!email) {
    setStatus('Please enter your email address.', 'reset');
    reloadAllTurnstiles();
    if (loginBtn) loginBtn.disabled = false;
    return;
  }
  if (!token) {
    setStatus('Please complete the bot check.', 'reset');
  reloadAllTurnstiles();
    if (loginBtn) loginBtn.disabled = false;
    return;
  }
  console.log(`🔑 Password reset requested for email: ${email}`);
  try {
    // ensure token fresh
    if (!isTurnstileTokenFresh('login')) {
      setStatus('Captcha token expired — please solve the bot check again.', 'reset');
      try { await renderTurnstile(document.querySelector('#login-turnstile') || document.querySelector('#signup-turnstile') || document.querySelector('.cf-turnstile'), { onSuccess: (t) => setTurnstileToken('login', t), onExpired: () => clearTurnstileToken('login') }); } catch(e){}
      if (loginBtn) loginBtn.disabled = false;
      return;
    }

    const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password.html',
      captchaToken: window.turnstileLoginToken // 👈 required if CAPTCHA enforcement is on
    });
    if (error) {
      console.error('❌ Error sending reset link:', error);
      setStatus('Error: ' + error.message, 'reset');
      reloadAllTurnstiles(true);
      if (loginBtn) loginBtn.disabled = false;
      return;
    }
    console.log('✅ Reset link sent:', data);
    setStatus('Password reset link sent! Check your inbox.', 'login');
    reloadAllTurnstiles();
    if (loginBtn) loginBtn.disabled = false;
  } catch (e) {
    console.error('❌ Unexpected error during reset link send:', e);
    setStatus('Unexpected error. Please try again later.', 'login');
    reloadAllTurnstiles();
    if (loginBtn) loginBtn.disabled = false;
  }
}

// 👇 expose globally so inline HTML onclick works
window.sendResetLink = sendResetLink;





async function signOut() {
  console.log('🚪 Signing out user');
  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    console.error('❌ Logout error:', error);
    return setStatus('Logout error: ' + error.message, 'login');
  }
  console.log('✅ Logged out successfully');
  profileInfo.style.display = 'none';
  authOptions.style.display = 'block';
  loginSection.style.display = 'none';
  signupSection.style.display = 'none';
  setStatus('Logged out!', 'login');
  localStorage.removeItem('loggedInUser');
  localStorage.setItem(
    'isAdmin',
    JSON.stringify({ isAdmin: false, role: null })
  );
  location.reload();
}

async function checkForAdmin() {
  console.log('🔍 Checking admin access...');
  const { data, error } = await supabaseClient
    .from('adminpanel_access')
    .select('username, role');
  if (error) {
    console.error('❌ Error fetching admin data:', error);
    return;
  }
  const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
  if (!loggedInUser) {
    console.warn('⚠️ No loggedInUser in localStorage');
    return;
  }
  data.forEach((admin) => {
    if (admin.username === loggedInUser.username) {
      console.log(
        `👑 Admin access granted for user: ${admin.username} with role: ${admin.role}`
      );
      localStorage.setItem(
        'isAdmin',
        JSON.stringify({ isAdmin: true, role: admin.role })
      );
    }
  });
  window.location.reload();
}

async function ensureProfile() {
  console.log('⏳ Ensuring profile exists for logged in user...');
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    console.warn('⚠️ No logged in user found during ensureProfile');
    return;
  }

  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    console.log('🆕 No profile found, creating new profile');

    // Get username from localStorage first
    let username = localStorage.getItem('pendingUsername');

    // If no stored username, fallback to input field or email prefix
    if (!username) {
      const signupUsernameInput = document.getElementById('signup-username');
      username = signupUsernameInput?.value.trim() || user.email?.split('@')[0] || 'New User';
    }

    await supabaseClient
      .from('profiles')
      .insert([{ id: user.id, username, avatar_url: null }]);

    console.log(`✅ Profile created with username: ${username}`);

    // Clear localStorage after use
    localStorage.removeItem('pendingUsername');
  } else {
    console.log('✅ Profile exists:', profile);
    localStorage.setItem('loggedInUser', JSON.stringify(profile));
  }
}



async function uploadAvatar(userId, file) {
  if (!file) {
    console.warn('⚠️ No file provided for avatar upload');
    return null;
  }
  console.log('📤 Uploading avatar...');
  const base64Url = await fileToDataUrl(file);
  await updateAvatarUrl(userId, base64Url);
  console.log('✅ Avatar uploaded and URL updated');
  return base64Url;
}

async function updateAvatarUrl(userId, url) {
  console.log('🔄 Updating avatar URL in profile...');
  const { error } = await supabaseClient
    .from('profiles')
    .update({ avatar_url: url })
    .eq('id', userId);
  if (error) {
    console.error('❌ Avatar update error:', error);
    setStatus('Avatar update error: ' + error.message, 'login');
  } else {
    console.log('✅ Avatar URL updated successfully');
  }
}
// Safe fallback for bannedWords list (avoid breaking if module import fails)
const bannedWords = window.bannedWords || [];
async function updateUsername() {
  const newUsername = newUsernameInput.value.trim();
  console.log(`✏️ Attempting username update to: ${newUsername}`);
  if (containsBadWord(newUsername)) {
    showNotification('Username Blocked', {
      body: `Hey explorer, that username is a bit rough. Let's keep it friendly!`,
      duration: 5000,
      sound: true,
    });
    return; // STOP here — don't update username
  }
  if (!newUsername) {
    console.warn('⚠️ Username update failed: no input');
    return setStatus('Please enter a new username.');
  }
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();
  if (!user) {
    console.warn('⚠️ Username update failed: not logged in');
    return setStatus('You must be logged in.', 'login');
  }

  showAvatarPopup();
  const { error } = await supabaseClient
    .from('profiles')
    .update({ username: newUsername })
    .eq('id', user.id);
  hideAvatarPopup();

  if (error) {
    console.error('❌ Username update failed:', error);
    return setStatus('Username update failed: ' + error.message, 'login');
  }
  console.log('✅ Username updated successfully');
  setStatus('Username updated!', 'login');
  await loadProfile();

  const navbarUsername = document.querySelector('.username');
  if (navbarUsername) navbarUsername.textContent = newUsername;
}
function containsBadWord(text) {
  const lowered = text.toLowerCase();
  return bannedWords.some(word => {
    const pattern = new RegExp(`\\b${word}\\b`, 'i');
    return pattern.test(lowered);
  });
}

async function loadProfile() {
  console.log('⏳ Loading profile data for current user...');
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  if (!user) {
    console.warn('⚠️ No logged in user found during profile load');
    return setStatus('Not logged in', 'login');
  }

  let { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  // Create or select warning section
  let warningSection = document.getElementById('profile-warning');
  if (!warningSection) {
    warningSection = document.createElement('div');
    warningSection.id = 'profile-warning';
    warningSection.style =
      'background:rgba(255,0,0,0.15);color:#b00;padding:18px 24px;margin:16px auto;border-radius:12px;max-width:500px;font-weight:bold;display:none;';
    warningSection.innerHTML =
      "<h3>Your account isn't connected to a profile.</h3>" +
      "<p>This can cause issues with your account, and may cause failures with sync, and other features. Please log out, then log back in to fix it. If this keeps happening after, please contact support.</p>" +
      "<button id='logout-btn'>Log Out</button>";
    document.body.insertBefore(warningSection, document.body.firstChild);

    // Attach logout event
    document.getElementById('logout-btn').addEventListener('click', () => {
      console.log('🚪 Logout button clicked (from warning section)');
      signOut();
    });
  }

  if (error) {
    console.error('❌ Error loading profile:', error);
    setStatus('Error loading profile: ' + error.message, 'login');
    warningSection.style.display = 'block';
    return;
  }

  async function createProfileWithUsername(user, desiredUsername) {
    const MAX_RETRIES = 5;

    let username = desiredUsername;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      if (!username) {
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        username = `user${randomNum}`;
      }

      console.log(`Attempt ${attempt}: Trying username "${username}"`);

      const firstLetter = username.charAt(0).toUpperCase();
      const avatarUrl = `https://placehold.co/100x100/8a2be2/white?text=${firstLetter}`;

      const { error: createError } = await supabaseClient
        .from('profiles')
        .insert([{ id: user.id, username, avatar_url: avatarUrl }]);

      if (!createError) {
        console.log(`✅ Profile created with username: ${username}`);
        return username; // success!
      } else {
        console.warn(`❌ Username "${username}" rejected: ${createError.message}`);

        if (!createError.message.toLowerCase().includes('username')) {
          throw new Error(`Unexpected error creating profile: ${createError.message}`);
        }

        username = null; // clear to generate new next attempt
      }
    }

    throw new Error('Failed to create a unique username after max retries');
  }

  if (!profile) {
    console.warn('⚠️ No profile found for user, creating one...');

    // Use pending username from localStorage if any, else null
    const storedUsername = localStorage.getItem('pendingUsername')?.trim() || null;

    try {
      const finalUsername = await createProfileWithUsername(user, storedUsername);

      // Clear stored username after use
      localStorage.removeItem('pendingUsername');

      // Reload profile after creation
      const { data: newProfile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError || !newProfile) {
        setStatus('Failed to load profile after creation.', 'login');
        warningSection.style.display = 'block';
        return;
      }

      profile = newProfile;
      setStatus('Profile created! Please finish setting up your account.', 'login');
      showNotification('Account recovered', {
        body: 'Your account was successfully recovered and a profile was created. Customize your profile now.',
        duration: 5000,
        persistClose: true,
      });
      warningSection.style.display = 'none';

    } catch (e) {
      console.error('❌ Failed to create profile:', e);
      setStatus('Failed to create profile: ' + e.message, 'login');
      warningSection.style.display = 'block';
      return;
    }
  }

  // Update UI with profile info
  console.log('✅ Profile loaded:', profile);

  profileUsername.textContent = profile.username;

  if (profile?.avatar_url && profile.avatar_url.startsWith('data:image/')) {
    profileAvatar.src = profile.avatar_url;
    profileAvatar.style.display = 'block';
    console.log('🖼️ Avatar set from data URL');
  } else {
    let username = profile?.username || 'New User';
    const firstLetter = username?.charAt(0)?.toUpperCase() || 'U';
    profileAvatar.src = `https://placehold.co/100x100/8a2be2/white?text=${firstLetter}`;
    profileAvatar.style.display = 'block';
    console.log('🖼️ Using default avatar');
  }

  authOptions.style.display = 'none';
  loginSection.style.display = 'none';
  signupSection.style.display = 'none';
  profileInfo.style.display = 'block';

  const navbarUsername = document.querySelector('.username');
  if (navbarUsername) navbarUsername.textContent = profile.username;
}


profileAvatar?.addEventListener('click', async () => {
  console.log('👆 Avatar clicked, triggering file input...');
  let fileInput = document.getElementById('profile-avatar-input');
  if (!fileInput) {
    console.log('➕ Creating hidden file input for avatar upload');
    fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.id = 'profile-avatar-input';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!file || !user) {
        console.warn('⚠️ Upload aborted: no file or user not logged in');
        return setStatus('You must be logged in to upload an avatar.', 'login');
      }
      showAvatarPopup();
      setStatus('Uploading avatar...', 'login');
      const publicUrl = await uploadAvatar(user.id, file);
      hideAvatarPopup();
      if (publicUrl) {
        await updateAvatarUrl(user.id, publicUrl);
        await loadProfile();
        setStatus('Avatar updated!', 'login');
      }
      fileInput.value = '';
    });
  }
  fileInput.click();
});

const updateAvatarBtn = document.getElementById('update-avatar-btn');
const avatarInput = document.getElementById('profile-avatar-input');

updateAvatarBtn?.addEventListener('click', async () => {
  console.log('🔄 Update avatar button clicked');
  const file = avatarInput.files[0];
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();
  if (!file) {
    console.warn('⚠️ No image file selected');
    return setStatus('Please select an image file.', 'login');
  }
  if (!user) {
    console.warn('⚠️ User not logged in for avatar upload');
    return setStatus('You must be logged in to upload an avatar.', 'login');
  }
  showAvatarPopup();
  setStatus('Uploading avatar...', 'login');
  const publicUrl = await uploadAvatar(user.id, file);
  hideAvatarPopup();
  if (publicUrl) {
    await updateAvatarUrl(user.id, publicUrl);
    await loadProfile();
    setStatus('Avatar updated!', 'login');
    avatarInput.value = '';
    const navbarAvatar = document.querySelector('.profile-img');
    if (navbarAvatar) {
      navbarAvatar.src = publicUrl + '?t=' + Date.now();
      console.log('🖼️ Navbar avatar updated with new image');
    }
  }
});

document.getElementById('signup-btn')?.addEventListener('click', async function (e) {
  e.preventDefault && e.preventDefault();
  const btn = this;
  console.log('👤 Signup button clicked (robust handler)');
  console.debug('signup: current tokens: signup=', window.turnstileSignupToken, 'login=', window.turnstileLoginToken);
  if (window._authInFlight) return;
  window._authInFlight = true;
  btn.disabled = true;

  try {
    const container = document.querySelector('#signup-turnstile, .signup-turnstile, .cf-turnstile');
    if (container) {
      try {
        await renderTurnstile(container, {
          onSuccess: (token) => { window.turnstileSignupToken = token; btn.disabled = false; },
          onExpired: () => { window.turnstileSignupToken = null; }
        });
      } catch (e) { console.warn('Turnstile render failed for signup:', e); }
    } else {
      // Ensure script is available so any inline markup can render
      try { await ensureTurnstileScript(); } catch (e) { /* ignore */ }
    }

    // If backend requires captcha, ensure token exists
    const requireCaptcha = true;
    if (requireCaptcha && !window.turnstileSignupToken) {
      setStatus && setStatus('Please complete the captcha to create your account.', 'signup');
      btn.disabled = false;
      window._authInFlight = false;
      return;
    }

  // Call the original signUp function if present
    if (typeof signUp === 'function') {
      const res = signUp();
      if (res && typeof res.then === 'function') await res;
    } else {
      // fallback: submit nearest form
      const form = btn.closest('form') || document.querySelector('#signup-form');
      if (form) form.submit();
      else setStatus && setStatus('Signup handler missing.', 'signup');
    }
  } catch (err) {
    console.error('Signup wrapper error', err);
    setStatus && setStatus('Error creating account. Please try again.', 'signup');
  } finally {
    btn.disabled = false;
    window._authInFlight = false;
  }
});
console.debug('signup handler attached');
document.getElementById('login-btn')?.addEventListener('click', () => {
  console.log('🔑 Login button clicked');
  signIn();
});
document.getElementById('logout-btn')?.addEventListener('click', () => {
  console.log('🚪 Logout button clicked');
  signOut();
});
updateUsernameBtn?.addEventListener('click', () => {
  console.log('✏️ Update username button clicked');
  updateUsername();
});
window.onload = async () => {
  console.log('🌐 Window loaded, loading profile and bio...');
  await loadProfile();
  await loadBio();
  await loadPrivateSetting();
};

function showAvatarPopup() {
  console.log('📤 Showing avatar upload popup');
  document.getElementById('avatar-upload-popup').style.display = 'flex';
}
function hideAvatarPopup() {
  console.log('📥 Hiding avatar upload popup');
  setTimeout(() => {
    document.getElementById('avatar-upload-popup').style.display = 'none';
    showNotification('Changes uploaded.', {
      body: 'Your changes were made successfully.',
      duration: 5000,
    });
  }, 3000);
}

document.getElementById('toggle-signup-password')?.addEventListener('click', function () {
  console.log('👁️ Toggling signup password visibility');
  const pw = document.getElementById('signup-password');
  pw.type = pw.type === 'password' ? 'text' : 'password';
  this.innerHTML =
    pw.type === 'text'
      ? '<i class="fa-solid fa-eye-slash"></i>'
      : '<i class="fa-solid fa-eye"></i>';
});

document.getElementById('toggle-signup-confirm-password')?.addEventListener('click', function () {
    console.log('👁️ Toggling signup confirm password visibility');
    const pw = document.getElementById('signup-confirm-password');
    pw.type = pw.type === 'password' ? 'text' : 'password';
    this.innerHTML =
      pw.type === 'text'
        ? '<i class="fa-solid fa-eye-slash"></i>'
        : '<i class="fa-solid fa-eye"></i>';
  });

  // Proactively ensure Turnstile script is available but do NOT render main widgets on load.
  // We'll render per-flow on user action (magic-link click, signup click, password flow) to avoid
  // showing a Turnstile on the email-only page and to prevent duplicate-render/timeouts.
  try {
    await ensureTurnstileScript();
  } catch (e) {
    console.warn('Turnstile script could not be loaded proactively:', e);
  }

  // Helper: render a Turnstile into a container and wait for its token for the given flow.
  // Resolves with token string, or rejects on error/timeout.
  async function renderAndGetToken(flow, containerSelector, opts = {}) {
    // If token is already fresh, return it immediately
    if (isTurnstileTokenFresh(flow)) {
      if (flow === 'login') return window.turnstileLoginToken;
      if (flow === 'signup') return window.turnstileSignupToken;
      if (flow === 'password') return window.turnstilePasswordToken;
    }

    await ensureTurnstileScript();
    const container = (typeof containerSelector === 'string') ? document.querySelector(containerSelector) : containerSelector;
    if (!container) throw new Error('Turnstile container not found for flow: ' + flow);

    return new Promise(async (resolve, reject) => {
      let settled = false;
      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error('Turnstile solve timed out'));
      }, opts.timeoutMs || 120000);

      const onSuccess = (token) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        try { setTurnstileToken(flow, token); } catch (e) { /* ignore */ }
        resolve(token);
      };
      const onExpired = () => {
        try { clearTurnstileToken(flow); } catch (e) { /* ignore */ }
      };

      try {
        await renderTurnstile(container, { onSuccess, onExpired });
      } catch (e) {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          reject(e);
        }
      }
    });
  }

function fileToDataUrl(file) {
  console.log('🔄 Converting file to DataURL...');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      console.log('✅ File converted to DataURL');
      resolve(reader.result);
    };
    reader.onerror = (err) => {
      console.error('❌ File conversion failed:', err);
      reject(err);
    };
    reader.readAsDataURL(file);
  });
}

const bioTextarea = document.getElementById('bio-textarea');
const saveBioBtn = document.getElementById('save-bio-btn');
const bioStatus = document.getElementById('bio-status');

async function loadBio() {
  console.log('⏳ Loading user bio...');
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();
  if (!user) {
    console.warn('⚠️ No logged in user found during bio load');
    return;
  }

  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('bio')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('❌ Error loading bio:', error);
    bioStatus.textContent = 'Error loading bio.';
    return;
  }

  console.log('✅ Bio loaded:', profile?.bio);
  bioTextarea.value = profile?.bio || '';
  bioStatus.textContent = '';
}

async function saveBio() {
  console.log('💾 Saving bio...');
  bioStatus.style.color = '#aaa';
  bioStatus.textContent = 'Saving...';

  const newBio = bioTextarea.value.trim();
  if (containsBadWord(newBio)) {
    showNotification('Bio Blocked', {
      body: `Hey explorer, that bio is a bit rough. Let's keep it friendly!`,
      duration: 5000,
      sound: true,
    });
    bioStatus.style.color = 'red';
    bioStatus.textContent = 'Bio contains inappropriate content.';
    return; // STOP here — don't update username
  }

  const {
    data: { user },
  } = await supabaseClient.auth.getUser();
  if (!user) {
    console.warn('⚠️ User must be logged in to save bio');
    bioStatus.style.color = 'red';
    bioStatus.textContent = 'You must be logged in to save your bio.';
    return;
  }

  const { error } = await supabaseClient
    .from('profiles')
    .update({ bio: newBio })
    .eq('id', user.id);

  if (error) {
    console.error('❌ Failed to save bio:', error);
    bioStatus.style.color = 'red';
    bioStatus.textContent = 'Failed to save bio: ' + error.message;
  } else {
    console.log('✅ Bio saved successfully');
    bioStatus.style.color = '#0f0';
    bioStatus.textContent = 'Bio saved successfully!';
  }

  setTimeout(() => {
    bioStatus.textContent = '';
  }, 4000);
}

saveBioBtn?.addEventListener('click', saveBio);

// Consolidate critical initialization to DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
  // Wire up auth buttons
  const signupBtn = document.getElementById('signup-btn');
  // signup button uses the robust handler attached earlier; if it's missing, attach a safe fallback
  if (signupBtn && !signupBtn._robustAttached) {
    signupBtn._robustAttached = true;
    // existing robust handler attached near top of file will be used; no-op here
  }

  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) loginBtn.addEventListener('click', () => { console.log('🔑 Login button clicked'); signIn(); });

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => { console.log('🚪 Logout button clicked'); signOut(); });

  if (updateUsernameBtn) updateUsernameBtn.addEventListener('click', () => { console.log('✏️ Update username button clicked'); updateUsername(); });

  // Password login toggle
  const showPasswordBtn = document.getElementById('show-password-login-btn');
  showPasswordBtn?.addEventListener('click', async () => {
    console.debug('showPasswordBtn clicked, tokens before:', window.turnstilePasswordToken, window.turnstileLoginToken);
    if (magicLinkConfirm) magicLinkConfirm.style.display = 'none';
    const loginMethods = document.getElementById('login-methods');
    if (loginMethods) loginMethods.style.display = 'none';
    if (passwordLoginFields) passwordLoginFields.style.display = '';
    const allTurnstiles = loginSection ? loginSection.querySelectorAll('.cf-turnstile') : [];
    // show only password turnstile
    allTurnstiles.forEach(ts => { ts.style.display = ts.id === 'password-turnstile' ? '' : 'none'; });
    // Reset any previous widgets/tokens then render the password widget so it remains active
    try { reloadAllTurnstiles(); } catch(e) { /* ignore */ }
    try {
      const pwd = document.getElementById('password-turnstile') || document.querySelector('.cf-turnstile.password');
      if (pwd) {
        pwd.style.display = '';
        await renderTurnstile(pwd, {
          onSuccess: (token) => { window.turnstilePasswordToken = token; const b = document.getElementById('login-btn'); if (b) b.disabled = false; },
          onExpired: () => { window.turnstilePasswordToken = null; }
        });
      }
    } catch (e) { console.warn('Password turnstile render failed', e); }
    setStatus('Please complete the bot check for password login.', 'login');
    console.debug('password flow: rendered password widget; tokens now:', window.turnstilePasswordToken);
    const loginBtn = document.getElementById('login-btn'); if (loginBtn) loginBtn.style.display = '';
    if (loginEmailInput) loginEmailInput.style.display = '';
    const loginPasswordInput = document.getElementById('login-password'); if (loginPasswordInput) loginPasswordInput.style.display = '';
  });

  // Magic link handler
  const magicBtn = document.getElementById('show-magic-link-btn');
  magicBtn?.addEventListener('click', async () => {
    console.debug('magicBtn clicked, tokens:', window.turnstileLoginToken, window.turnstileSignupToken);
    const allTurnstiles = loginSection ? loginSection.querySelectorAll('.cf-turnstile') : [];
    // Hide the 'use password' button immediately and show only the main turnstile when solving
    if (showPasswordLoginBtn) showPasswordLoginBtn.style.display = 'none';
    // ensure main (non-password) turnstile is hidden until render
    allTurnstiles.forEach(ts => { if (ts.id === 'password-turnstile') ts.style.display = 'none'; else ts.style.display = 'none'; });
    const email = loginEmailInput ? loginEmailInput.value.trim() : '';
    const btn = magicBtn;
    // simple debounce to prevent duplicate requests
    btn._lastClick = btn._lastClick || 0;
    if (Date.now() - btn._lastClick < 3000) { console.warn('Duplicate magic link click ignored'); return; }
    btn._lastClick = Date.now();
    // If no email, prompt user
    if (!email) { setStatus('Please enter your email address.', 'login'); if (showPasswordLoginBtn) showPasswordLoginBtn.style.display = ''; return; }

    // Render the login turnstile on-demand and wait for token
    btn.disabled = true;
    try {
      const mainSelector = '#login-turnstile, #signup-turnstile, .cf-turnstile';
      const mainEl = document.querySelector('#login-turnstile') || document.querySelector('#signup-turnstile') || document.querySelector('.cf-turnstile');
      if (!mainEl) {
        // No container available—try to show user a helpful message and abort
        setStatus('Bot check unavailable on this page.', 'login');
        btn.disabled = false;
        if (showPasswordLoginBtn) showPasswordLoginBtn.style.display = '';
        return;
      }

      // Make sure only main container is visible
      allTurnstiles.forEach(ts => { ts.style.display = ts.id === 'password-turnstile' ? 'none' : 'none'; });
      mainEl.style.display = '';

      // Wait for user to solve the Turnstile and get token (timeout ~2 minutes)
      let token = null;
      try {
        token = await renderAndGetToken('login', mainEl, { timeoutMs: 120000 });
      } catch (e) {
        console.warn('User did not complete Turnstile or render failed:', e);
        setStatus('Please complete the bot check to send a magic link.', 'login');
        btn.disabled = false;
        if (showPasswordLoginBtn) showPasswordLoginBtn.style.display = '';
        return;
      }

      if (!token) {
        setStatus('Bot check failed. Please try again.', 'login');
        btn.disabled = false;
        if (showPasswordLoginBtn) showPasswordLoginBtn.style.display = '';
        return;
      }

      // Ensure token fresh
      if (!isTurnstileTokenFresh('login')) {
        setStatus('Captcha token expired — please solve the bot check again.', 'login');
        btn.disabled = false;
        if (showPasswordLoginBtn) showPasswordLoginBtn.style.display = '';
        return;
      }

      // Send magic link
      const { error } = await supabase.auth.signInWithOtp({ email, options: { captchaToken: token, emailRedirectTo: window.location.origin + '/auth.html' } });
      if (error) {
        setStatus('Error sending magic link: ' + error.message, 'login');
        reloadAllTurnstiles(true);
        btn.disabled = false;
        if (showPasswordLoginBtn) showPasswordLoginBtn.style.display = '';
        return;
      }

      // Success -> show confirmation UI
      if (loginEmailInput) loginEmailInput.style.display = 'none';
      const loginMethods = document.getElementById('login-methods'); if (loginMethods) loginMethods.style.display = 'none';
      if (passwordLoginFields) passwordLoginFields.style.display = 'none';
      const newhere = document.getElementById('signupalt');
      if (newhere) newhere.style.display = 'none';
      if (showPasswordLoginBtn) showPasswordLoginBtn.style.display = 'none';
      if (showMagicLinkBtn) showMagicLinkBtn.style.display = 'none';
      allTurnstiles.forEach(ts => { ts.style.display = ts.id === 'password-turnstile' ? 'none' : 'none'; });
      if (magicLinkConfirm) {
        magicLinkConfirm.style.display = 'block';
        const backBtn = document.getElementById('magic-link-back-btn'); if (backBtn) backBtn.style.display = 'none';
      }
      setStatus('', 'login');
      reloadAllTurnstiles(true);
      btn.disabled = false;
      console.debug('magic link sent successfully');
    } catch (e) {
      console.error('Unexpected error in magic flow', e);
      setStatus('Unexpected error. Please try again.', 'login');
      reloadAllTurnstiles(true);
      btn.disabled = false;
      if (showPasswordLoginBtn) showPasswordLoginBtn.style.display = '';
    }
  });

  // Back from magic link confirmation
  const magicBack = document.getElementById('magic-link-back-btn');
  magicBack?.addEventListener('click', () => {
    if (magicLinkConfirm) magicLinkConfirm.style.display = 'none';
    if (showPasswordLoginBtn) showPasswordLoginBtn.style.display = '';
    if (showMagicLinkBtn) showMagicLinkBtn.style.display = '';
    if (passwordLoginFields) passwordLoginFields.style.display = 'none';
    if (loginEmailInput) loginEmailInput.style.display = '';
    const loginMethods = document.getElementById('login-methods'); if (loginMethods) loginMethods.style.display = '';
    const allTurnstiles = loginSection ? loginSection.querySelectorAll('.cf-turnstile') : [];
    allTurnstiles.forEach(ts => { ts.style.display = ts.id === 'password-turnstile' ? 'none' : ''; });
    const backBtn = document.getElementById('magic-link-back-btn'); if (backBtn) backBtn.style.display = '';
    setStatus('', 'login');
  });

  // Load initial data
  try { await loadProfile(); } catch (e) { console.warn('loadProfile failed:', e); }
  try { await loadBio(); } catch (e) { console.warn('loadBio failed:', e); }
  try { await loadPrivateSetting(); } catch (e) { console.warn('loadPrivateSetting failed:', e); }
  try { await loadStatusVisibility(); } catch (e) { /* ignore */ }
  try { await loadStatsSetting(); } catch (e) { /* ignore */ }
  try { await loadBlurSetting(); } catch (e) { /* ignore */ }
});

const privateToggle = document.getElementById('private-toggle');

async function loadPrivateSetting() {
  console.log('🔒 Loading profile privacy setting...');
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();
  if (!user) {
    console.warn('⚠️ No logged in user found when loading privacy setting');
    return;
  }

  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('private')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('❌ Error loading privacy setting:', error.message);
    return;
  }

  console.log(
    `✅ Privacy setting loaded: private=${profile?.private || false}`
  );
  privateToggle.checked = profile?.private || false;
}

privateToggle.addEventListener('change', async () => {
  console.log('🔄 Privacy toggle changed');
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();
  if (!user) {
    alert('You need to be logged in.');
    console.warn('⚠️ Privacy toggle change aborted - user not logged in');
    return;
  }

  const newPrivacy = privateToggle.checked;
  console.log(`🔐 Updating privacy setting to: ${newPrivacy}`);

  const { error } = await supabaseClient
    .from('profiles')
    .update({ private: newPrivacy })
    .eq('id', user.id);

  if (error) {
    alert('Failed to update privacy: ' + error.message);
    console.error('❌ Failed to update privacy setting:', error);
    // revert toggle
    privateToggle.checked = !newPrivacy;
  } else {
    console.log(`✅ Privacy setting updated successfully to ${newPrivacy}`);
    if (newPrivacy) {
      showNotification("You're anonymous, explorer!", {
        body: "You've vanished from the public eye. Your profile is now private.",
        duration: 5000,
      });
    } else {
      showNotification('Out of hiding?', {
        body: 'Your profile is now public again. Welcome back to the spotlight!',
        duration: 5000,
      });
    }
  }
});
const statusVisibilityRadios = document.querySelectorAll(
  'input[name="status-visibility"]'
);

async function loadStatusVisibility() {
  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    console.warn('⚠️ No logged in user found or error:', userError);
    return;
  }

  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('online_status_visibility')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('❌ Error loading status visibility:', error);
    return;
  }

  const visibility = profile?.online_status_visibility || 'everyone';
  console.log(`👀 Loaded status visibility: ${visibility}`);

  statusVisibilityRadios.forEach((radio) => {
    radio.checked = radio.value === visibility;
  });
}

statusVisibilityRadios.forEach((radio) => {
  radio.addEventListener('change', async () => {
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      alert('🚫 You must be logged in to change this setting.');
      console.warn('🚫 Attempt to change status visibility without login.');
      return;
    }

    const newVisibility = document.querySelector(
      'input[name="status-visibility"]:checked'
    ).value;

    const { error } = await supabaseClient
      .from('profiles')
      .update({ online_status_visibility: newVisibility })
      .eq('id', user.id);

    if (error) {
      alert('❌ Failed to update status visibility: ' + error.message);
      console.error('❌ Error updating status visibility:', error);
    } else {
      console.log(`✅ Status visibility updated to: ${newVisibility}`);
      // Show notification based on selection
      if (newVisibility === 'everyone') {
        showNotification("You're visible to the galaxy!", {
          body: 'Everyone can now see your online status. Shine bright!',
          duration: 5000,
        });
      } else if (newVisibility === 'mutual') {
        showNotification('Only your crew can see you.', {
          body: 'Your online status is now visible only to mutual followers.',
          duration: 5000,
        });
      } else if (newVisibility === 'noone') {
        showNotification("You've gone dark.", {
          body: 'No one can see your online status now. Total stealth mode activated.',
          duration: 5000,
        });
      }
    }
  });
});
// Call on page load
loadStatusVisibility();
async function deleteAccount() {
  const modal = document.getElementById('delete-modal');
  const abortModal = document.getElementById('delete-abort-modal');
  const successModal = document.getElementById('delete-success-modal');

  modal.style.display = 'flex';

  let currentLayer = 1;
  const totalLayers = 4;

  // Show the specified layer and hide others
  function showLayer(n) {
    [...modal.querySelectorAll('.modal-layer')].forEach(section => {
      if (section.dataset.layer == n) {
        section.style.display = 'block';
        section.setAttribute('aria-hidden', 'false');
      } else {
        section.style.display = 'none';
        section.setAttribute('aria-hidden', 'true');
      }
    });
    currentLayer = n;
    setupButtons();
  }

  // Setup buttons for current layer, including 5s delay on continue
  function setupButtons() {
    const layer = modal.querySelector(`.modal-layer[data-layer="${currentLayer}"]`);
    const cancelBtn = layer.querySelector('.delete-modal-cancel-btn');
    const continueBtn = layer.querySelector('.delete-modal-continue-btn');

    // Cancel closes modal & resets
    cancelBtn.onclick = () => {
      modal.style.display = 'none';
      resetModal();
    };

    // Disable continue initially and enable after countdown
    continueBtn.disabled = true;
    let countdown = 5;
    const defaultText = currentLayer === totalLayers ? 'Delete Account' : 'Continue';
    continueBtn.textContent = `${defaultText} (${countdown})`;
    continueBtn.classList.add('delete-modal-red-btn');

    const timer = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        continueBtn.disabled = false;
        continueBtn.textContent = defaultText;
        clearInterval(timer);
      } else {
        continueBtn.textContent = `${defaultText} (${countdown})`;
      }
    }, 1000);

    // On last layer, enable continue only if password entered
    if (currentLayer === totalLayers) {
      const passwordInput = layer.querySelector('.delete-modal-password');
      continueBtn.disabled = true;
      passwordInput.value = '';
      passwordInput.focus();

      passwordInput.oninput = () => {
        continueBtn.disabled = passwordInput.value.trim().length === 0;
      };
    }

    continueBtn.onclick = async () => {
      if (currentLayer < totalLayers) {
        showLayer(currentLayer + 1);
      } else {
        const password = modal.querySelector('.delete-modal-password').value.trim();
        console.log('Password entered:', password);

        // ✅ Make sure Turnstile token is present
        const token = window.turnstileDeleteToken;
        if (!token) {
          alert('Please complete the bot check.');
          return;
        }

        // ✅ Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user || !user.email) {
          alert('No logged-in user found.');
          modal.style.display = 'none';
          resetModal();
          return;
        }

        // ✅ Try signing in with the password and Turnstile token
        const { error } = await supabase.auth.signInWithPassword({
          email: user.email,
          password,
          options: {
            captchaToken: turnstileDeleteToken,
          },
        });

        modal.style.display = 'none';
        resetModal();

        if (error) {
          console.log('Password verification failed:', error.message);
          abortModal.style.display = 'flex';
        } else {
          console.log('Password verified!');
          successModal.style.display = 'flex';

          // Proceed with account deletion
          const { data: userData, error: userFetchError } = await supabase.auth.getUser();
          const userId = userData?.user?.id;

          if (!userId || userFetchError) {
            console.error('❌ Failed to get user ID:', userFetchError?.message);
            return;
          }

          const { error: insertError } = await supabase
            .from('account_deletion')
            .insert({ user_id: userId });

          if (insertError) {
            console.error('❌ Failed to queue deletion:', insertError.message);
          } else {
            console.log('🗑️ Account deletion queued successfully.');
          }
        }
      }
    };

  }

  // Reset modal to first layer, but do not call showLayer to avoid recursion
  function resetModal() {
    currentLayer = 1;
    [...modal.querySelectorAll('.modal-layer')].forEach(section => {
      if (section.dataset.layer == 1) {
        section.style.display = 'block';
        section.setAttribute('aria-hidden', 'false');
      } else {
        section.style.display = 'none';
        section.setAttribute('aria-hidden', 'true');
      }
    });
  }

  showLayer(1);

  // Hook up abort modal OK button
  const abortOkBtn = document.getElementById('abort-ok-btn');
  abortOkBtn.onclick = () => {
    abortModal.style.display = 'none';
  };

  // Hook up success modal OK button
  const successOkBtn = document.getElementById('success-ok-btn');
  successOkBtn.onclick = () => {
    successModal.style.display = 'none';
    // Add any post-success logic here if you want
  };
}
const deleteAccountBtn = document.getElementById('delete-btn');
deleteAccountBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  console.log('🗑️ Delete account button clicked');
  deleteAccount();
});


window.turnstileDeleteToken = null;

window.onTurnstileCheckSuccess = function (token) {
  console.log("✅ Turnstile passed for deletion:", token);
  window.turnstileDeleteToken = token;

  const deleteContinueBtn = document.querySelector('.delete-modal-continue-btn');
  if (deleteContinueBtn) {
    deleteContinueBtn.disabled = false; // Enable button after passing
  }
};



const deleteContinueBtn = document.querySelector('.delete-modal-continue-btn');
const deletePasswordInput = document.getElementById('delete-password');

function checkDeleteReady() {
  deleteContinueBtn.disabled = !(window.turnstileDeleteToken && deletePasswordInput.value.trim());
}

deletePasswordInput.addEventListener('input', checkDeleteReady);

document.addEventListener('DOMContentLoaded', () => {
  // your code here
});

const blurToggle = document.getElementById('blur-sensitive-toggle');
async function loadBlurSetting() {
  console.log('🔍 Loading blur_covers setting...');
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    console.warn('⚠️ No logged in user found when loading blur setting');
    blurToggle.checked = true; // default true (blur enabled) if no user
    return;
  }

  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('blur_covers')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('❌ Error loading blur setting:', error.message);
    blurToggle.checked = true; // fail safe to blur on error
    return;
  }

  console.log(`✅ Blur setting loaded: blur_covers=${profile?.blur_covers || false}`);
  blurToggle.checked = profile?.blur_covers !== false; // default to true if null or undefined
}
blurToggle.addEventListener('change', async () => {
  console.log('🔄 Blur toggle changed');
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    alert('You need to be logged in.');
    console.warn('⚠️ Blur toggle change aborted - user not logged in');
    // revert toggle to previous value or default true
    blurToggle.checked = true;
    return;
  }

  const newBlur = blurToggle.checked;
  console.log(`🎨 Updating blur_covers setting to: ${newBlur}`);

  const { error } = await supabaseClient
    .from('profiles')
    .update({ blur_covers: newBlur })
    .eq('id', user.id);

  if (error) {
    alert('Failed to update blur setting: ' + error.message);
    console.error('❌ Failed to update blur setting:', error);
    // revert toggle
    blurToggle.checked = !newBlur;
  } else {
    console.log(`✅ Blur setting updated successfully to ${newBlur}`);
    showNotification(
      newBlur
        ? 'Sensitive content hidden'
        : 'Sensitive content shown',
      {
        body: newBlur
          ? 'Game covers will now be blurred for your settings.'
          : 'Game covers will now show normally.',
        duration: 4000,
      }
    );
  }
});
loadBlurSetting();
const statsToggle = document.getElementById('stats-toggle');

statsToggle.addEventListener('change', async () => {
  console.log('🔄 Stats toggle changed');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert('You need to be logged in.');
    console.warn('⚠️ Stats toggle change aborted - user not logged in');
    // revert toggle to previous value (default true)
    statsToggle.checked = true;
    return;
  }

  const newShowStats = statsToggle.checked;
  console.log(`🎛️ Updating show_stats setting to: ${newShowStats}`);

  const { error } = await supabase
    .from('profiles')
    .update({ show_stats: newShowStats })
    .eq('id', user.id);

  if (error) {
    alert('Failed to update stats setting: ' + error.message);
    console.error('❌ Failed to update stats setting:', error);
    // revert toggle
    statsToggle.checked = !newShowStats;
  } else {
    console.log(`✅ Stats setting updated successfully to ${newShowStats}`);
    showNotification(
      newShowStats
        ? 'Stats are now visible'
        : 'Stats are now hidden',
      {
        body: newShowStats
          ? 'Your profile stats will now be shown to viewers.'
          : 'Your profile stats will now be hidden.',
        duration: 4000,
      }
    );

  }
});

// Optional: Load the current setting on page load
async function loadStatsSetting() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data, error } = await supabase
    .from('profiles')
    .select('show_stats')
    .eq('id', user.id)
    .single();

  if (!error && data) {
    statsToggle.checked = data.show_stats;
  }
}

loadStatsSetting();

(function () {
  const overlay = document.getElementById('email-confirm-overlay');
  const emailSpan = document.getElementById('ec-email');
  const primary = document.getElementById('ec-primary');
  const closeBtn = document.getElementById('ec-close');

  function showEmailConfirmModal(email) {
    if (email) emailSpan.textContent = email;
    overlay.setAttribute('aria-hidden', 'false');
    setTimeout(() => primary.focus(), 0);
    document.documentElement.style.overflow = 'hidden';
  }

  function hideEmailConfirmModal() {
    overlay.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
  }

  // Close handlers
  document.addEventListener('keydown', (e) => {
    if (overlay.getAttribute('aria-hidden') === 'false' && e.key === 'Escape') hideEmailConfirmModal();
  });
  if (closeBtn) closeBtn.addEventListener('click', hideEmailConfirmModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) hideEmailConfirmModal();
  });

  primary.addEventListener('click', () => {
    showLogin();
    hideEmailConfirmModal();
  });

  // expose globally
  window.showEmailConfirmModal = showEmailConfirmModal;
  window.hideEmailConfirmModal = hideEmailConfirmModal;

  // Auto-show on query string (?verify=1&email=...)
  const params = new URLSearchParams(location.search);
  if (params.get('verify') === '1') {
    showEmailConfirmModal(params.get('email') || undefined);
  }

})();

// Legacy magic-link handler disabled; handled by the DOMContentLoaded-attached handler which renders the Turnstile on demand.
showMagicLinkBtn?.addEventListener('click', () => {
  console.debug('Legacy magic-link handler invoked; no-op because new on-demand handler runs on DOMContentLoaded.');
});
