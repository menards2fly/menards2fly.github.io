import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://jbekjmsruiadbhaydlbt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZWtqbXNydWlhZGJoYXlkbGJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzOTQ2NTgsImV4cCI6MjA2Mzk3MDY1OH0.5Oku6Ug-UH2voQhLFGNt9a_4wJQlAHRaFwTeQRyjTSY'
);
window.supabase = supabase;
window.supabaseClient = supabase;
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

<!-- Inside .starship-sidebar -->
<div id="dynamicIsland" class="dynamic-island">
  <img id="dynamicIslandIcon" src="/uploads/branding/favicon.png" alt="User Avatar" />
  <div class="dynamic-island-text">
    <div id="dynamicIslandTitle"></div>
    <div id="dynamicIslandContent"></div>
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
    background: rgba(0, 0, 0, 0.25);
    backdrop-filter: blur(50px);
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    cursor: default;
    z-index: 1000000000000000 !important;
    opacity: 1;
    transition: opacity 1s ease;
    color: white;
    font-family: 'Inter', sans-serif;
    user-select: none;
  ">
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
        animation: pulseSpaceship 5500ms ease forwards;
      "/>
    </div>

    <!-- Text element -->
    <div class="init-text" style="
      position: absolute;
      bottom: 38px;
      left: 10%;
      width: 80%;
      text-align: center;
      font-size: 1.1rem;
      color: #8a2be2;
      font-weight: 600;
      user-select: none;
      z-index: 25;
      pointer-events: none;
    ">
      starship is initializing...
    </div>

    <div class="progress-bar-container" style="
      position: absolute;
      bottom: 20px;
      left: 10%;
      width: 80%;
      height: 8px;
      background: rgba(138, 43, 226, 0.25);
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 0 12px rgba(138, 43, 226, 0.7);
      z-index: 20;
      backdrop-filter: blur(20px);
      border: 1.5px solid rgba(138, 43, 226, 0.6);
    ">
      <div class="progress-bar" style="
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #8a2be2, #b266ff);
        border-radius: 4px;
        box-shadow:
          0 0 12px #8a2be2,
          0 0 24px #b266ff,
          0 0 36px #b266ff;
        transition: width 0.1s linear;
      "></div>
    </div>
  </div>

  <style>
    @keyframes pulseSpaceship {
      0%, 60% {
        transform: scale(1);
        opacity: 1;
        filter: none;
      }
      80% {
        transform: scale(1.1) translateY(-10px);
        opacity: 1;
        filter: none;
      }
      100% {
        transform: scale(1.5) translateY(-150vh);
        opacity: 0;
      }
    }
  </style>
`;

const hasSeenIntro = sessionStorage.getItem('seenIntro');

if (hasSeenIntro) {
  // Already seen this session — don't show intro
  // Just skip and no overlay
} else {
  // First time — show animation & store flag
  sessionStorage.setItem('seenIntro', 'true');
  document.body.insertAdjacentHTML('afterbegin', introOverlayHTML);

  const overlay = document.getElementById('introOverlay');
  const progressBar = overlay.querySelector('.progress-bar');

  let start = null;
  const duration = 5500; // ms

  function animateProgressBar(timestamp) {
    if (!start) start = timestamp;
    const elapsed = timestamp - start;
    const progress = Math.min(elapsed / duration, 1);
    progressBar.style.width = `${progress * 100}%`;

    if (progress < 1) {
      requestAnimationFrame(animateProgressBar);
    } else {
      // Fade out overlay synced with spaceship animation end
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.remove();
      }, 1000); // matches CSS fade duration
    }
  }
  requestAnimationFrame(animateProgressBar);
}



// == Dynamic Island HTML Injection ==

// Check localStorage settings first
const reduceTransparency = localStorage.getItem('reduceTransparency') === 'true';
const dynamicIslandShow = localStorage.getItem('dynamicIslandShow') !== 'false';


// If reduceTransparency is on or dynamicIslandShow is off, don't show dynamic island at all
if (!reduceTransparency && dynamicIslandShow) {

  const dynamicIslandHTML = `
    <div id="dynamicIsland" style="
      position: fixed;
      top: 16px;
      left: 260px; /* will be updated dynamically */
      background: rgba(138, 43, 226, 0.85);
      color: white;
      padding: 10px 16px;
      border-radius: 20px;
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 0 20px #8a2be2aa;
      z-index: 11000;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease, transform 0.3s ease, left 0.3s ease;
      transform: translateX(-20px);
    ">
      <img id="dynamicIslandIcon" src="" alt="User Avatar" style="
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid white;
        object-fit: cover;
        flex-shrink: 0;
        display: none;
      "/>
      <div>
        <div id="dynamicIslandTitle" style="margin-bottom: 2px;"></div>
        <div id="dynamicIslandContent">Loading...</div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', dynamicIslandHTML);

  const dynamicIsland = document.getElementById('dynamicIsland');
  const dynamicIslandTitle = document.getElementById('dynamicIslandTitle');
  const dynamicIslandContent = document.getElementById('dynamicIslandContent');
  const dynamicIslandIcon = document.getElementById('dynamicIslandIcon');

  const SIDEBAR_WIDTH = 250;       // expanded width in px
  const SIDEBAR_COLLAPSED = 64;    // collapsed width in px
  const GAP = 10;                  // gap between sidebar and island in px

  // Make sure sidebar is defined
  const sidebar = document.querySelector('.starship-sidebar'); // or your sidebar selector

  // Info blocks for cycling content
  const infoBlocks = [
    {
      title: '',
      content: () => {
        const now = new Date();
        return `🕘 ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      },
      showAvatar: false,
    },
    {
      title: '',
      content: () => {
        const dataJSON = localStorage.getItem('screenTimeData');
        let secondsSpent = 0;
        if (dataJSON) {
          try {
            const data = JSON.parse(dataJSON);
            const todayStr = new Date().toISOString().split('T')[0];
            if (data.date === todayStr) {
              secondsSpent = data.secondsSpent;
            }
          } catch (e) {
            secondsSpent = 0;
          }
        }
        const mins = Math.floor(secondsSpent / 60);
        const secs = secondsSpent % 60;
        return `⌛ ${mins}m ${secs}s`;
      },
    },
    {
      title: `Hey, ${username || 'User'}`,
      content: () => '',
      showAvatar: true,
    },
    // Add more blocks if you want!
  ];

  // Show the island with fade-in
  function showDynamicIsland() {
    dynamicIsland.style.opacity = '1';
    dynamicIsland.style.pointerEvents = 'auto';
    dynamicIsland.style.transform = 'translateX(0)';
  }

  // Hide the island with fade-out
  function hideDynamicIsland() {
    dynamicIsland.style.opacity = '0';
    dynamicIsland.style.pointerEvents = 'none';
    dynamicIsland.style.transform = 'translateX(-20px)';
  }

  // Update island left position based on sidebar state
  function updateDynamicIslandPosition() {
    if (!sidebar || !dynamicIsland) return;
    const isCollapsed = sidebar.classList.contains('collapsed');
    const leftPos = isCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH;
    dynamicIsland.style.left = `${leftPos + GAP}px`;
  }

  // Cycle through info blocks every 3 seconds
  let infoIndex = 0;
  function updateDynamicIslandContent() {
    if (!dynamicIsland) return;

    const block = infoBlocks[infoIndex];

    // Update title and content
    dynamicIslandTitle.textContent = block.title;
    dynamicIslandContent.textContent = block.content();

    // Show or hide avatar based on block config
    if (block.showAvatar) {
      dynamicIslandIcon.style.display = 'block';
      dynamicIslandIcon.src = avatarUrl || '/uploads/branding/favicon.png';
    } else {
      dynamicIslandIcon.style.display = 'none';
    }

    showDynamicIsland();

    infoIndex = (infoIndex + 1) % infoBlocks.length;
  }

  // Initial positioning & content
  updateDynamicIslandPosition();
  updateDynamicIslandContent();

  // Watch sidebar for class changes (collapsed toggle)
  const observer = new MutationObserver(updateDynamicIslandPosition);
  if (sidebar) {
    observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
  }

  // Cycle content every 3 seconds
  setInterval(updateDynamicIslandContent, 3000);

} else {
  // Hide or remove if conditions don't allow showing
  const existingIsland = document.getElementById('dynamicIsland');
  if (existingIsland) existingIsland.remove();
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

const clearProfileFieldsBasedOnPage = async () => {
  const path = window.location.pathname.toLowerCase();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.warn('⚠️ Could not get current user to clear profile fields', authError);
    return;
  }

  const updates = {};

  if (!path.includes('/play')) {
    updates.current_game_id = null;
  }

  if (!path.includes('/tv')) {
    updates.last_video_url = null;
  }

  if (!path.includes('/ai') && !path.includes('/route') && !path.includes('/tv') && !path.includes('/chat')) {
    updates.status = null;
  }

  // Only update if there's something to clear
  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Failed to clear profile fields:', updateError.message);
    } else {
      console.log('✅ Cleared profile fields based on current page:', updates);
    }
  } else {
    console.log('ℹ️ No profile fields needed clearing for this page.');
  }
};

// Run it immediately
clearProfileFieldsBasedOnPage();



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
async function applyPerformanceModeIfEnabled() {
  const perfStyleId = 'perf-style-tag';

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  let isPerfMode = false;

  if (user) {
    // Fetch user profile settings from Supabase
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('settings')
      .eq('id', user.id)
      .single();

    if (!error && profile?.settings?.performanceMode === true) {
      isPerfMode = true;
    }
  } else {
    // Fallback to localStorage for guests
    isPerfMode = localStorage.getItem('performanceMode') === 'true';
  }

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

// Call the function
applyPerformanceModeIfEnabled();

function forceOpaqueBackgrounds() {
  const allElems = document.querySelectorAll('*');

  allElems.forEach(el => {
    const style = getComputedStyle(el);
    let bg = style.backgroundColor;

    if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
      let opaqueBg = bg;

      // Check if background is rgba or rgb
      if (bg.startsWith('rgba')) {
        const match = bg.match(/rgba\((\d+), (\d+), (\d+), ([0-9.]+)\)/);
        if (match) {
          let r = parseInt(match[1]);
          let g = parseInt(match[2]);
          let b = parseInt(match[3]);
          let a = parseFloat(match[4]);

          // If white or greyish (r,g,b all close to 200+)
          if (r >= 200 && g >= 200 && b >= 200) {
            // Force black fully opaque
            opaqueBg = 'rgba(0, 0, 0, 1)';
          } else {
            // Just remove transparency
            opaqueBg = `rgba(${r}, ${g}, ${b}, 1)`;
          }
        }
      } else if (bg.startsWith('rgb')) {
        // rgb(r,g,b)
        const match = bg.match(/rgb\((\d+), (\d+), (\d+)\)/);
        if (match) {
          let r = parseInt(match[1]);
          let g = parseInt(match[2]);
          let b = parseInt(match[3]);

          if (r >= 200 && g >= 200 && b >= 200) {
            opaqueBg = 'rgb(0, 0, 0)';
          } else {
            opaqueBg = bg; // already opaque
          }
        }
      } else {
        // For named colors or hex, fallback: skip or convert white/grey to black manually
        // You can add more advanced parsing if you want
      }

      el.style.backgroundColor = opaqueBg;
    }

    // Remove transparency-related styles
    el.style.opacity = '1';
    el.style.backdropFilter = 'none';
    el.style.filter = 'none';
  });
}




async function applyForceOpaqueBackgrounds() {
  // Get current user from Supabase
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // User logged in — fetch settings from profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('settings')
      .eq('id', user.id)
      .single();

    if (!error && profile?.settings?.forceOpaqueBackgrounds === true) {
      forceOpaqueBackgrounds();
    } else {
      // No setting in profile or error — fallback or do nothing
      console.log('No forceOpaqueBackgrounds setting found in profile');
    }
  } else {
    // Not logged in — check localStorage fallback
    if (localStorage.getItem('forceOpaqueBackgrounds') === 'true') {
      forceOpaqueBackgrounds();
    }
  }
}

// Run it right away
applyForceOpaqueBackgrounds();


async function checkAccountDeletionStatus(user) {
  try {
    if (!user || !user.id) {
      console.log('⛔ No user signed in — skipping notification.');
      return;
    }

    console.log(`🔐 User signed in: ${user.email} (ID: ${user.id})`);

    const { data, error } = await supabase
      .from('account_deletion')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('❌ Error fetching deletion status:', error);
      return;
    }

    console.log('Deletion status data:', data);

    if (data.length > 0) {
      console.log('Showing account deletion notification...');
      showNotification('Account Deletion Notice', {
        body: 'Your account is scheduled for deletion. It will be deleted within 24 hours.',
         bgColor: 'rgba(255, 0, 0, 0.1)', // fallback gray
        sound: true,
        allowClose: false, // Don't allow closing
      });
    } else {
      console.log('✅ User is not scheduled for deletion.');
    }
  } catch (err) {
    console.error('❌ Failed to check account deletion status:', err);
  }
}

(async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Failed to get user:', error);
    return;
  }
  await checkAccountDeletionStatus(user);
})();

