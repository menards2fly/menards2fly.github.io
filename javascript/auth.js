import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://jbekjmsruiadbhaydlbt.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZWtqbXNydWlhZGJoYXlkbGJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzOTQ2NTgsImV4cCI6MjA2Mzk3MDY1OH0.5Oku6Ug-UH2voQhLFGNt9a_4wJQlAHRaFwTeQRyjTSY';

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseClient = supabase; // alias for supabaseClient usage elsewhere

export default supabase;





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

function showLogin() {
  console.log('🔄 Switching to Login view');
  authOptions.style.display = 'none';
  loginSection.style.display = 'block';
  signupSection.style.display = 'none';
}

function showSignup() {
  console.log('🔄 Switching to Signup view');
  authOptions.style.display = 'none';
  signupSection.style.display = 'block';
  loginSection.style.display = 'none';
}
window.showLogin = showLogin;
window.showSignup = showSignup;
// Global tokens for each widget
window.turnstileSignupToken = null;
window.turnstileLoginToken = null;

// Callbacks for the Turnstile widgets (set these in your HTML widget data-callback)
window.onTurnstileSignupSuccess = function (token) {
  window.turnstileSignupToken = token;
  document.getElementById('signup-btn').disabled = false;
  console.log('✅ Turnstile signup token received');
};

window.onTurnstileLoginSuccess = function (token) {
  window.turnstileLoginToken = token;
  document.getElementById('login-btn').disabled = false;
  console.log('✅ Turnstile login token received');
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

  if (!email || !password || !confirmPassword || !username || !birthdayValue) {
    console.warn('⚠️ SignUp failed: Missing fields');
    return setStatus('Please fill in all fields.', 'signup');
  }

  // New: Block bad usernames
  if (containsBadWord(username)) {
    usernameInput.style.border = '2px solid red';
    
    // Show or create a warning message under username input
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
    return setStatus("This username isn't appropriate for starship.", 'signup');
  }

  // --- Passwords match check ---
  if (password !== confirmPassword) {
    console.warn('⚠️ SignUp failed: Passwords do not match');
    return setStatus('Passwords do not match.', 'signup');
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
    return setStatus("You must be at least 13 years old to sign up.", "signup");
  } else {
    birthdayInput.style.border = "";
    birthdayWarning.style.display = "none";
  }

  // --- Turnstile token check ---
  const token = window.turnstileSignupToken;
  if (!token) {
    console.warn('⚠️ No Turnstile token found.');
    return setStatus('Please complete the bot check.', 'signup');
  }

  // --- Sign up using Supabase ---
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
      return setStatus('Sign up error: ' + error.message, 'signup');
    }

    console.log('✅ SignUp successful:', data);
    // right before location.reload() in signUp
localStorage.setItem('pendingUsername', username);
location.reload();

    location.reload();
    setStatus(
      'Signed up! Now you can, <a onclick="showLogin()" style="text-decoration: underline; cursor: pointer">log in</a>.',
      'signup'
    );

    window.turnstileSignupToken = null;
  } catch (e) {
    console.error('❌ Unexpected error during signUp:', e);
    return setStatus('Unexpected error. Please try again later.', 'signup');
  }
}



async function signIn() {
  const token = window.turnstileLoginToken;
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!token) {
    console.warn('⚠️ No Turnstile token found.');
    return setStatus('Please complete the bot check.', 'login');
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
      console.log('Turnstile token:', token);
      return setStatus('Login error: ' + error.message, 'login');
    }

    console.log('✅ Logged in successfully:', data);
    setStatus('Logged in!', 'login');
    await ensureProfile();
    await checkForAdmin();
    await loadProfile();
    location.reload();

    window.turnstileLoginToken = null;
  } catch (e) {
    console.error('❌ Unexpected error during signIn:', e);
    return setStatus('Unexpected error. Please try again later.', 'login');
  }
}









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
import { bannedWords } from '/javascript/filter.js';
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


profileAvatar.addEventListener('click', async () => {
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

document.getElementById('signup-btn')?.addEventListener('click', function (e) {
  e.preventDefault();
  console.log('👤 Signup button clicked');
  signUp();
});
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

document.getElementById('toggle-signup-password').onclick = function () {
  console.log('👁️ Toggling signup password visibility');
  const pw = document.getElementById('signup-password');
  pw.type = pw.type === 'password' ? 'text' : 'password';
  this.innerHTML =
    pw.type === 'text'
      ? '<i class="fa-solid fa-eye-slash"></i>'
      : '<i class="fa-solid fa-eye"></i>';
};

document.getElementById('toggle-signup-confirm-password').onclick =
  function () {
    console.log('👁️ Toggling signup confirm password visibility');
    const pw = document.getElementById('signup-confirm-password');
    pw.type = pw.type === 'password' ? 'text' : 'password';
    this.innerHTML =
      pw.type === 'text'
        ? '<i class="fa-solid fa-eye-slash"></i>'
        : '<i class="fa-solid fa-eye"></i>';
  };

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

saveBioBtn.addEventListener('click', saveBio);

window.onload = async () => {
  console.log('🌐 Window loaded, loading profile, bio, and privacy setting...');
  await loadProfile();
  await loadBio();
  await loadPrivateSetting();
};

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

window.onTurnstileCheckSuccess = function(token) {
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