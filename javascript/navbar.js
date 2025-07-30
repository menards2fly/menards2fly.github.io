import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://jbekjmsruiadbhaydlbt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZWtqbXNydWlhZGJoYXlkbGJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzOTQ2NTgsImV4cCI6MjA2Mzk3MDY1OH0.5Oku6Ug-UH2voQhLFGNt9a_4wJQlAHRaFwTeQRyjTSY'
);

// --- Navbar Insert ---
const style = document.createElement('style');
style.innerHTML = `
    .extra-links {
      display: none;
      gap: 10px;
    }
  `;
document.head.appendChild(style);

let username = 'Sign Up';
let avatarUrl = '/uploads/branding/signup.png';

const {
  data: { user },
} = await supabase.auth.getUser();

if (user) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  if (!error && profile) {
    username = profile.username || 'User';
    avatarUrl = profile.avatar_url;
    localStorage.setItem(
      'loggedInUser',
      JSON.stringify({ username: profile.username, avatar: profile.avatar_url })
    );
  }
}

let isAdmin = JSON.parse(localStorage.getItem('isAdmin'));

if (!isAdmin) {
  isAdmin = { isAdmin: false, role: null }; // fallback if missing
  console.warn(
    '⚠️ No admin info found in localStorage, defaulting to non-admin.'
  );
}

console.log('🔐 Admin status:', isAdmin);
console.log('👔 Admin:', isAdmin.isAdmin, 'Role:', isAdmin.role);

let a;

if (isAdmin.isAdmin === true) {
  console.log('✅ User is an admin. Showing admin panel button.');
  a = `
    <a href="/admin.html" class="admin-icon" title="Admin Panel">
      <i class="fa-solid fa-user-tie"></i>
    </a>
  `;
} else {
  console.log('🙅‍♂️ User is NOT an admin. Showing social button.');
  a = `
    <a onClick="showPopUp()" class="admin-icon" title="Show Socials">
      <i class="fa-solid fa-hashtag"></i>
    </a>
  `;
}

const isPlayPage = window.location.pathname.includes('play');

const navbarHTML = isPlayPage
  ? `
  <!-- Left Sidebar Navigation -->
<div class="starship-sidebar" id="starshipSidebar">
  <div class="sidebar-logo">
  <img  src="/uploads/branding/favicon.png" style="transform: translateX(2px); alt="Starship Logo" />
</div>
  <div class="sidebar-links">

<a id="homeButton" href="/games" title="Home">
        <i class="fa fa-home"></i>
        <span class="link-text">Home</span>
      </a>

      <a id="likeBtn" href="#" title="Like">
        <i class="fa fa-thumbs-up fa-lg"></i>
        <span class="link-text" id="likeCount">0</span>
      </a>

      <a id="dislikeBtn" href="#" title="Dislike">
        <i class="fa fa-thumbs-down fa-lg"></i>
        <span class="link-text" id="dislikeCount">0</span>
      </a>

      <a id="reloadButton" href="#" title="Reload">
        <i class="fa fa-refresh"></i>
        <span class="link-text">Reload</span>
      </a>

      <a id="fullscreenButton" href="#" title="Fullscreen">
        <i class="fa fa-arrows-alt"></i>
        <span class="link-text">Fullscreen</span>
      </a>

      <a id="shareButton" href="#" title="Share">
        <i class="fa fa-share-nodes"></i>
        <span class="link-text">Share</span>
      </a>

  </div>

    <div class="sidebar-socials">
    <a href="https://discord.gg/MgeVsEKDrt" target="_blank" title="Discord">
      <i class="fa-brands fa-discord"></i><span class="link-text">Discord</span>
    </a>
    <a href="https://instagram.com/starship.site" style="transform: translateX(2px);" target="_blank" title="Instagram">
      <i class="fa-brands fa-instagram fa-lg"></i><span class="link-text">Instagram</span>
    </a>
    <a href="https://youtube.com/@starship_site" style="transform: translateX(2px);" target="_blank" title="YouTube">
      <i class="fa-brands fa-youtube fa-lg"></i><span class="link-text">YouTube</span>
    </a>
  </div>


  <div class="sidebar-profile">
    <a href="/auth.html">
      <img src="${avatarUrl}" alt="${username}" class="sidebar-avatar">  <span class="sidebar-username">${username}</span>
    
    </a>
  </div>
</div>

  <meta name="viewport" content="width=device-width, initial-scale=1">
  `
  : `
  <!-- 🌐 Normal Navbar -->
  <!-- Left Sidebar Navigation -->
<div class="starship-sidebar" id="starshipSidebar">
  <div class="sidebar-logo">
  <img  src="/uploads/branding/favicon.png" style="transform: translateX(2px); alt="Starship Logo" />
</div>
  <div class="sidebar-links">

 <a href="/" title="Home"><i class="fa fa-home"></i><span class="link-text">Home</span></a>
    <a href="/games" title="Games"><i class="fa fa-gamepad"></i><span class="link-text">Games</span></a>
    <a href="/route" title="Proxy"><i class="fa fa-globe" style="transform: translateX(2px);"></i><span class="link-text">Proxy</span></a>
    <a href="/ai" title="AI"><i class="fa fa-robot"></i><span class="link-text">AI</span></a>
    <a href="/tv" title="TV"><i class="fa fa-television"></i><span class="link-text">TV</span></a>
    <a href="/chat" title="Chat"><i class="fa-solid fa-comments"></i><span class="link-text">Chat</span></a>
    <a href="/contact" title="Contact"><i class="fa fa-phone"></i><span class="link-text">Contact</span></a>
    <a href="/blog" title="Blog"><i class="fa fa-newspaper"></i><span class="link-text">Blog</span></a>
    <a href="/reviews" title="Reviews"><i class="fa fa-star"></i><span class="link-text">Reviews</span></a>
    <a href="/settings" title="Settings"><i class="fa fa-gear"></i><span class="link-text">Settings</span></a>
  </div>

    <div class="sidebar-socials">
    <a href="https://discord.gg/MgeVsEKDrt" target="_blank" title="Discord">
      <i class="fa-brands fa-discord"></i><span class="link-text">Discord</span>
    </a>
    <a href="https://instagram.com/starship.site" style="transform: translateX(2px);" target="_blank" title="Instagram">
      <i class="fa-brands fa-instagram fa-lg"></i><span class="link-text">Instagram</span>
    </a>
    <a href="https://youtube.com/@starship_site" style="transform: translateX(2px);" target="_blank" title="YouTube">
      <i class="fa-brands fa-youtube fa-lg"></i><span class="link-text">YouTube</span>
    </a>
  </div>


  <div class="sidebar-profile">
    <a href="/auth.html">
      <img src="${avatarUrl}" alt="${username}" class="sidebar-avatar">  <span class="sidebar-username">${username}</span>
    
    </a>
  </div>
</div>


  <meta name="viewport" content="width=device-width, initial-scale=1">
  `;

document.body.insertAdjacentHTML('afterbegin', navbarHTML);

const mobileNavToggle = `
  <div id="mobileNavBtn" class="mobile-nav-toggle">
    <i class="fa fa-bars"></i>
  </div>

  <div id="mobileOverlay" class="mobile-overlay">
    <div class="mobile-overlay-content">
      <a href="/" title="Home"><i class="fa fa-home"></i> Home</a>
      <a href="/games" title="Games"><i class="fa fa-gamepad"></i> Games</a>
      <a href="/route" title="Proxy"><i class="fa fa-globe"></i> Proxy</a>
      <a href="/ai" title="AI"><i class="fa fa-robot"></i> AI</a>
      <a href="/tv" title="TV"><i class="fa fa-television"></i> TV</a>
      <a href="/chat" title="Chat"><i class="fa-solid fa-comments"></i> Chat</a>
      <a href="/contact" title="Contact"><i class="fa fa-phone"></i><span class="link-text">Contact</span></a>
      <a href="/blog" title="Blog"><i class="fa fa-newspaper"></i> Blog</a>
      <a href="/reviews" title="Reviews"><i class="fa fa-star"></i> Reviews</a>
      <a href="/settings" title="Settings"><i class="fa fa-gear"></i> Settings</a>
    </div>
  </div>
`;

document.body.insertAdjacentHTML('beforeend', mobileNavToggle);


const sidebar = document.getElementById('starshipSidebar');
if (sidebar) {
  sidebar.classList.add('collapsed'); // start collapsed

  const toggleBtn = document.querySelector('.sidebar-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });
  }
}

// == Intro Animation Overlay ==

// Create overlay HTML
const introOverlayHTML = `
  <div id="introOverlay" style="
    position: fixed;
    inset: 0;
    background: #0a0a12;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    cursor: pointer;
    z-index: 100000;
    opacity: 1;
    transition: opacity 1s ease;
    color: white;
    font-family: 'Inter', sans-serif;
    user-select: none;
  ">
    <div class="starfield" style="
      position: absolute;
      inset: 0;
      background:
        radial-gradient(2px 2px at 20% 30%, #ffffff 90%, transparent 100%),
        radial-gradient(1.5px 1.5px at 40% 70%, #ffffff 90%, transparent 100%),
        radial-gradient(2.5px 2.5px at 70% 50%, #ffffff 90%, transparent 100%),
        radial-gradient(1.5px 1.5px at 85% 80%, #ffffff 90%, transparent 100%),
        radial-gradient(1.7px 1.7px at 50% 20%, #ffffff 90%, transparent 100%);
      background-repeat: repeat;
      background-size: 200% 200%;
      animation: starTwinkle 4s ease-in-out infinite alternate;
      filter: none;
      z-index: 1;
    "></div>

    <div class="spaceship" style="
      position: relative;
      z-index: 10;
    ">
      <img src="/uploads/branding/spaceship.png" alt="Spaceship" style="
        width: 100px;
        height: auto;
        display: block;
        margin: 0 auto 24px;
        user-select: none;
        pointer-events: none;
        transition: transform 0.3s ease;
        filter: none;
      "/>
    </div>



    <div class="progress-bar-container" style="
      position: absolute;
      bottom: 20px;
      left: 10%;
      width: 80%;
      height: 4px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 2px;
      overflow: hidden;
      box-shadow: 0 0 8px rgba(255,255,255,0.15);
      z-index: 20;
    ">
      <div class="progress-bar" style="
        height: 100%;
        width: 0%;
        background: white;
        border-radius: 2px;
        transition: width 0.1s linear;
      "></div>
    </div>
  </div>

  <style>
    @keyframes starTwinkle {
      0% {
        background-position: 0% 0%;
        opacity: 0.8;
      }
      100% {
        background-position: 100% 100%;
        opacity: 1;
      }
    }

    @keyframes pulseSpaceship {
      0%, 60% {
        transform: scale(1);
        opacity: 1;
      }
      80% {
        transform: scale(1.1) translateY(-10px);
        opacity: 1;
      }
      100% {
        transform: scale(1.5) translateY(-150vh);
        opacity: 0;
      }
    }

    @keyframes fadeInOut {
      0%, 15% {
        opacity: 0;
      }
      25%, 75% {
        opacity: 1;
      }
      85%, 100% {
        opacity: 0;
      }
    }
  </style>
`;

document.body.insertAdjacentHTML('afterbegin', introOverlayHTML);

const overlay = document.getElementById('introOverlay');
const progressBar = overlay.querySelector('.progress-bar');
const hasSeenIntro = sessionStorage.getItem('seenIntro');

function hideIntroOverlay() {
  if (!overlay) return;
  overlay.style.opacity = '0';
  setTimeout(() => {
    overlay.remove();
  }, 1000);
}

if (hasSeenIntro) {
  // Already seen this session — hide immediately
  hideIntroOverlay();
} else {
  // First time — show animation & store flag
  sessionStorage.setItem('seenIntro', 'true');

  // Animate progress bar over 5.5 seconds
  let start = null;
  const duration = 5500; // in ms

  function animateProgressBar(timestamp) {
    if (!start) start = timestamp;
    const elapsed = timestamp - start;
    const progress = Math.min(elapsed / duration, 1);
    progressBar.style.width = `${progress * 100}%`;
    if (progress < 1) {
      requestAnimationFrame(animateProgressBar);
    }
  }
  requestAnimationFrame(animateProgressBar);

  // Allow user to click to skip the animation
  overlay.addEventListener('click', hideIntroOverlay);

  // Auto-hide after animation duration (5.5 seconds)
  setTimeout(hideIntroOverlay, duration);
}

// == Update Last Seen ==
const updateLastSeen = async () => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return;

  const { error } = await supabase
    .from('profiles')
    .update({ last_active: new Date().toISOString() })
    .eq('id', user.id);

  if (error) console.error('❌ Failed to update last seen:', error.message);
  else console.log('📡 Last seen updated.');
};

// Run once on page load
updateLastSeen();

// Ping every 60 seconds
const lastSeenInterval = setInterval(updateLastSeen, 60 * 1000);
window.addEventListener('beforeunload', () => {
  clearInterval(lastSeenInterval);
});

// == Dynamic Page Status Handling ==
const handlePageStatus = async (statusValue) => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return;

  const { error: statusError } = await supabase
    .from('profiles')
    .update({ status: statusValue })
    .eq('id', user.id);

  if (statusError) {
    console.error(`❌ Failed to update status:`, statusError.message);
  } else {
    console.log(`🛰️ User status updated to: ${statusValue}`);
  }
};

// Detect which page we're on and set status
let pageStatus = null;

if (window.location.pathname.includes('/route')) {
  pageStatus = 'proxy';
} else if (window.location.pathname.includes('/ai')) {
  pageStatus = 'aichat';
} else if (window.location.pathname.includes('/tv')) {
  pageStatus = 'tv';
} else if (window.location.pathname.includes('/chat')) {
  pageStatus = 'sitechat';
}

if (pageStatus) {
  handlePageStatus(pageStatus);

  // Clear status when they leave (refresh, close, or navigate away)
  window.addEventListener('beforeunload', () => {
    handlePageStatus(null);
  });
}



if (user) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  if (!error && profile) {
    username = profile.username || 'User';
    avatarUrl = profile.avatar_url;
    localStorage.setItem(
      'loggedInUser',
      JSON.stringify({ username: profile.username, avatar: profile.avatar_url })
    );
  } else {
    console.error('⚠️ Signed in user does not have a profile in the database.');
    showNotification("There's a glitch in the matrix.", {
      body: 'Your profile is missing! This breaks some features. Please log out and log back in to fix it.',
      sound: true, // Play sound
    });
  }
}

if (user) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  if (!error && profile) {
    username = profile.username || 'User';
    avatarUrl = profile.avatar_url;
    localStorage.setItem(
      'loggedInUser',
      JSON.stringify({ username: profile.username, avatar: profile.avatar_url })
    );

    if (
      !profile.avatar_url ||
      profile.avatar_url === 'NULL' ||
      profile.avatar_url === null
    ) {
      console.warn("⚠️ User's profile avatar is not set (NULL).");
    }
  } else {
    console.error('⚠️ Signed in user does not have a profile in the database.');
    showNotification('Looking a little...default.', {
      body: "Finish setting up your profile to get the max out of Starship! <br><br> Click <a href='/auth' style='text-decoration:underline;'>here</a> to set it up.",
      sound: true,
      timer: 5000, // Auto-dismiss after 10 seconds
      persistClose: true, // Don't show again if closed
    });
  }
}
window.supabase = supabase;

// --- ToS & Privacy Popup ---
function injectTosPopup() {
  if (localStorage.getItem('acceptedTOS')) return; // already accepted

  const popupHTML = `
<div id="tosPopup" style="
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200000;
  font-family: 'Inter', sans-serif;
">
  <div style="
  background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    padding: 24px;
    border-radius: 16px;
    box-shadow: 0 0 40px rgba(138, 43, 226, 0.4);
    color: white;
    max-width: 420px;
    width: 90%;
    text-align: center;
    animation: fadeIn 0.4s ease-out;
  ">
    <h2 style="margin-bottom: 16px; color: #fff; font-family:Inter;">Welcome to Starship</h2>
    <p style="font-size: 14px; color: #ddd;">
      Please read and accept our 
      <a href="/legal" style="color:#8a2be2; text-decoration: underline;">Terms of Service</a>
      and 
      <a href="/legal" style="color:#8a2be2; text-decoration: underline;">Privacy Policy</a>
      before using the site.
    </p>
    <button id="acceptTOSBtn" style="
      margin-top: 20px;
      background: rgba(138, 43, 226, 0.7);
      backdrop-filter: blur(6px);
      color: white;
      border: 1px solid rgba(255,255,255,0.2);
      padding: 10px 18px;
      font-size: 16px;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 0 15px rgba(138, 43, 226, 0.5);
    ">I Agree</button>
  </div>
</div>

<style>
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  #acceptTOSBtn:hover {
    background: rgba(138, 43, 226, 0.9);
    transform: scale(1.05);
    box-shadow: 0 0 25px rgba(138, 43, 226, 0.7);
  }
</style>

  `;

  document.body.insertAdjacentHTML('beforeend', popupHTML);

  document.getElementById('acceptTOSBtn').addEventListener('click', () => {
    localStorage.setItem('acceptedTOS', 'true');
    document.getElementById('tosPopup').remove();
  });
}

// Call it after navbar injection
injectTosPopup();

document.getElementById('mobileNavBtn').addEventListener('click', () => {
  const overlay = document.getElementById('mobileOverlay');
  overlay.classList.toggle('active');
});

document.getElementById('mobileOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'mobileOverlay') {
    e.target.classList.remove('active');
  }
});
function applyPerformanceModeIfEnabled() {
  const perfStyleId = 'perf-style-tag';
  const isPerfMode = localStorage.getItem('performanceMode') === 'true';

  if (isPerfMode && !document.getElementById(perfStyleId)) {
    const styleTag = document.createElement('style');
    styleTag.id = perfStyleId;
    styleTag.textContent = `
      * {
        animation: none !important;
        transition: none !important;
      }
      *::before,
      *::after {
        animation: none !important;
        transition: none !important;
      }
      @keyframes fade, fadeIn, fadeOut, slide, slideIn, slideOut, bounce, spin, move, wiggle {
        from { opacity: 1; transform: none; }
        to { opacity: 1; transform: none; }
      }
    `;
    document.head.appendChild(styleTag);
  }
}
applyPerformanceModeIfEnabled();