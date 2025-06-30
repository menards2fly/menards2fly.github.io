import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://jbekjmsruiadbhaydlbt.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZWtqbXNydWlhZGJoYXlkbGJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzOTQ2NTgsImV4cCI6MjA2Mzk3MDY1OH0.5Oku6Ug-UH2voQhLFGNt9a_4wJQlAHRaFwTeQRyjTSY"
);

// --- Navbar Insert ---
const style = document.createElement("style");
style.innerHTML = `
    .extra-links {
      display: none;
      gap: 10px;
    }
  `;
document.head.appendChild(style);

let username = "Sign Up";
let avatarUrl = "/uploads/branding/signup.png";

const {
  data: { user },
} = await supabase.auth.getUser();

if (user) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (!error && profile) {
    username = profile.username || "User";
    avatarUrl = profile.avatar_url;
    localStorage.setItem("loggedInUser", JSON.stringify({username: profile.username, avatar: profile.avatar_url}));
  }
}

let a = ``;

let isAdmin = JSON.parse(localStorage.getItem("isAdmin"));
if (!isAdmin) {
  isAdmin = { isAdmin: false, role: null }; // Default to not admin if not set
}
console.log("isAdmin:", isAdmin);
console.log("isadmin isadmin", isAdmin.isAdmin);
if (isAdmin.isAdmin === true) {
  console.log("User is an admin");
  a = `<a href="/admin.html" class="admin-icon" title="Admin Panel">
      <i class="fa-solid fa-user-tie"></i>
    </a>`;
} else {
  console.log("User is not an admin");
  a = `
  <a onClick="showPopUp()" class="admin-icon"  title="Show Socials">
    <i class="fa-solid fa-hashtag"></i>
  </a>


    `;
}
const isPlayPage = window.location.pathname.includes("play");

const navbarHTML = isPlayPage
  ? `
  <div class="navbar-container">
    <div class="nav-center-bg">
      <div id="streak" class="streak-container">
        <span class="streak-text">🔥 0 Days</span>
      </div>
    </div>
    <nav class="navbar">
      <div class="nav-links">
<a id="homeButton" ><i class="fa fa-home fa-lg"></i></a>

<a id="likeBtn" href="#" title="Like" style="font-size:1.2em;">
  👍 <span id="likeCount">0</span>
</a>

<a id="dislikeBtn"  title="Dislike" style="font-size:1.2em;">
  👎 <span id="dislikeCount">0</span>
</a>


<div id="logo-container" class="logo-container">
        <a href="/index.html" class="logo">
          <img src="/uploads/branding/favicon.png" alt="GameVerse Logo">
        </a>
</div>



<a id="reloadButton">
  <i class="fa fa-refresh fa-lg"></i>
</a>

<a id="fullscreenButton">
  <i class="fa fa-arrows-alt fa-lg"></i>
</a>

<a id="shareButton">
  <i class="fa fa-share-nodes fa-lg"></i>
</a>

        <div class="extra-links">
          <a href="https://github.com/starship-site"><i class="fa-brands fa-square-github fa-lg"></i></a>
          <a href="/reviews"><i class="fa fa-star fa-lg"></i></a>
          <a href="/share"><i class="fa-solid fa-share-nodes fa-lg"></i></a>
        </div>
      </div>
    </nav>

    <div class="nav-right-bg">
      <a href="/auth.html" class="profile-link">
        <img src="${avatarUrl}" alt="${username}" class="profile-img">
        <span class="username">${username}</span>
      </a>
    </div>
  </div>

  <div id="social-popup" class="social-popup hidden">
    <a class="close-btn" onclick="hidePopUp()">&times;</a>
    <p> Follow us on social media!</p>
    <a href="https://discord.gg/MgeVsEKDrt" target="_blank" title="Join us on Discord">
      <i class="fa-brands fa-discord"></i>
    </a>
    <a href="https://instagram.com/starship.site" target="_blank" title="Follow us on Instagram">
      <i class="fa-brands fa-instagram"></i>
    </a>
    <a href="https://youtube.com/@starship_site" target="_blank" title="Subscribe on YouTube">
      <i class="fa-brands fa-youtube"></i>
    </a>
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
    <a href="/tv" title="TV"><i class="fa fa-television"></i><span class="link-text">TV</span></a>
    <a href="/apps" title="Apps"><i class="fa fa-cube"></i><span class="link-text">Apps</span></a>
    <a href="/chat" title="Chat"><i class="fa-solid fa-comments"></i><span class="link-text">Chat</span></a>
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
      <i class="fa-brands fa-youtube"></i><span class="link-text">YouTube</span>
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


document.body.insertAdjacentHTML("afterbegin", navbarHTML);

const sidebar = document.getElementById('starshipSidebar');
if (sidebar) {
  sidebar.classList.add('collapsed');  // start collapsed

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



/*

// Show or hide the unsupported message based on device width
const unsupportedMsg = document.getElementById("unsupported-message");
if (window.innerWidth <= 500) {
  unsupportedMsg.style.display = "flex";
} else if (unsupportedMsg) {
  unsupportedMsg.remove();
}

// Set scrollbar width variable after navbar is in DOM
function getScrollbarWidth() {
  return window.innerWidth - document.documentElement.clientWidth;
}
function updateScrollbarWidth() {
  document.documentElement.style.setProperty(
    "--scrollbar-width",
    getScrollbarWidth() + "px"
  );
}
updateScrollbarWidth();
window.addEventListener("resize", updateScrollbarWidth);

// --- Dynamic Island Logic ---
let typingTimeout;
const dynamicIsland = document.querySelector(".nav-center-bg");
let currentState = "streak";

function updateStreak() {
  const today = new Date().toISOString().split("T")[0];
  let streakData = JSON.parse(localStorage.getItem("streak")) || {
    streak: 0,
    lastDate: null,
  };

  if (streakData.lastDate) {
    const lastDate = new Date(streakData.lastDate);
    const differenceInDays =
      (new Date(today) - lastDate) / (1000 * 60 * 60 * 24);

    if (Math.floor(differenceInDays) === 1) {
      streakData.streak++;
    } else if (differenceInDays > 1) {
      streakData.streak = 1;
    }
  } else {
    streakData.streak = 1;
  }

  streakData.lastDate = today;
  localStorage.setItem("streak", JSON.stringify(streakData));

  return `🔥 ${streakData.streak} days`;
}

function showScreenTime() {
  const dataJSON = localStorage.getItem("screenTimeData");
  let seconds = 0;
  if (dataJSON) {
    try {
      const data = JSON.parse(dataJSON);
      seconds = data.secondsSpent || 0;
    } catch (e) {
      seconds = 0;
    }
  }

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  let formatted;
  if (h > 0) {
    formatted = `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  } else {
    formatted = `${m}:${s.toString().padStart(2, "0")}`;
  }

  dynamicIsland.innerHTML = `
      <div class="screen-time">
        ⏳ <b>${formatted}</b>
      </div>
    `;
  currentState = "screen-time";
}

function showCurrentTime() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const formattedTime = `${hours}:${minutes
    .toString()
    .padStart(2, "0")} ${ampm}`;
  dynamicIsland.innerHTML = `
      <div class="current-time">
       🕒 ${formattedTime}
      </div>
    `;
  currentState = "current-time";
}

function showLaunchingGame() {
  dynamicIsland.classList.add("expanded");
  dynamicIsland.innerHTML = `
      <div class="loading">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
  currentState = "launching-game";

  setTimeout(() => {
    dynamicIsland.classList.remove("expanded");
    resetToDefault();
  }, 5000);
}

function resetToDefault() {
  const streak = updateStreak();
  dynamicIsland.innerHTML = `
      <div id="streak" class="streak-container">
        <span class="streak-text">${streak}</span>
      </div>
    `;
  currentState = "streak";
}

async function showWeather() {
  dynamicIsland.innerHTML = `<div class="weather">🌦️ Loading weather...</div>`;
  currentState = "weather";

  // Get user's location
  if (!navigator.geolocation) {
    dynamicIsland.innerHTML = `<div class="weather">🌦️ Location not supported.</div>`;
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      // Fetch weather from Open-Meteo
      try {
        const resp = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=fahrenheit`
        );
        const data = await resp.json();
        if (data.current_weather) {
          const temp = Math.round(data.current_weather.temperature);
          const icon = getWeatherIcon(data.current_weather.weathercode);
          dynamicIsland.innerHTML = `
          <div class="weather">
            ${icon} <b>${temp}°F</b>
          </div>
        `;
        } else {
          dynamicIsland.innerHTML = `<div class="weather">🌦️ Weather unavailable.</div>`;
        }
      } catch {
        dynamicIsland.innerHTML = `<div class="weather">🌦️ Weather error.</div>`;
      }
    },
    () => {
      dynamicIsland.innerHTML = `<div class="weather">🌦️ Location denied.</div>`;
    }
  );
}

// Simple weather icon mapping
function getWeatherIcon(code) {
  if ([0].includes(code)) return "☀️";
  if ([1, 2, 3].includes(code)) return "⛅";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 80, 81, 82].includes(code)) return "🌦️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌡️";
}

let periodicIndex = 0;
const periodicFunctions = [
  showScreenTime,
  showCurrentTime,
  showWeather,
  resetToDefault,
];

function periodicUpdates() {
  periodicFunctions[periodicIndex % periodicFunctions.length]();
  periodicIndex++;
}

// On page load, show streak and start rotation
resetToDefault();
setInterval(periodicUpdates, 10000);

const perfStyleId = 'performance-mode-style';

// On page load, set checkbox and apply saved state
document.addEventListener('DOMContentLoaded', () => {
  const checkbox = document.getElementById('performanceModeToggle');
  if (!checkbox) return;

  const saved = localStorage.getItem('performanceMode');
  if (saved === 'true') {
    checkbox.checked = true;
    togglePerformanceMode(true);
  }

  checkbox.addEventListener('change', () => {
    togglePerformanceMode(checkbox.checked);
  });
});


  window.onload = function () {
    window.showPopUp = function () {
      document.getElementById('social-popup').classList.remove('hidden');
    }

    window.hidePopUp = function () {
      document.getElementById('social-popup').classList.add('hidden');
    }
  }
*/