import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://jbekjmsruiadbhaydlbt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZWtqbXNydWlhZGJoYXlkbGJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzOTQ2NTgsImV4cCI6MjA2Mzk3MDY1OH0.5Oku6Ug-UH2voQhLFGNt9a_4wJQlAHRaFwTeQRyjTSY'
);

const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');
console.log('🔍 Loaded profile page for username:', username);

let profileIsPrivate = false;
let currentUserId = null;
let profileUserId = null;
let isFollowing = false;
let viewerFollowsProfile = false;
let profileFollowsViewer = false;
let canShowStatus = false;
const followBtn = document.getElementById('follow-btn');
const CUSTOM_STATUS_CARDS = {
  aichat: {
    name: "Chatting with Orbit",
    desc: "Chatting via starai",
    img: "/uploads/images/starbot.png" // replace with your real path
  },
  proxy: {
    name: "Surfing the web",
    desc: "Unblocking via stargate",
    img: "/uploads/images/routeicon.png" // replace with your real path
  }
};

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) {
    console.warn('⚠️ Error fetching current user:', error);
    return null;
  }
  console.log('👤 Current logged in user ID:', user?.id);
  return user?.id || null;
}

async function checkIfFollowing(followerId, followingId) {
  if (!followerId || !followingId) {
    console.log('⚠️ Missing IDs for follow check:', {
      followerId,
      followingId,
    });
    return false;
  }
  const { data, error } = await supabase
    .from('follows')
    .select('*')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();

  if (error) {
    console.error('❌ Error checking follow status:', error);
    return false;
  }
  const following = !!data;
  console.log(
    `🔄 Follow check: follower ${followerId} following ${followingId}?`,
    following
  );
  return following;
}

async function updateFollowButton() {
  if (isFollowing) {
    followBtn.innerHTML = '<i class="fas fa-user-check"></i> Following';
    followBtn.style.background = 'rgba(0, 255, 128, 0.25)';
    followBtn.style.borderColor = 'rgba(0, 255, 128, 0.5)';
    console.log('✅ Follow button updated: Following');
  } else {
    followBtn.innerHTML = '<i class="fas fa-user-plus"></i> Follow';
    followBtn.style.background = 'rgba(138, 43, 226, 0.3)';
    followBtn.style.borderColor = 'rgba(138, 43, 226, 0.6)';
    console.log('✅ Follow button updated: Not following');
  }
}


async function updateProfileStats(profileUserId) {
  if (!profileUserId || typeof profileUserId !== 'string') {
    console.warn('⚠️ Invalid profileUserId:', profileUserId);
    return;
  }

  try {
    const id = profileUserId;

    // --- Get profile data first (for show_stats + favorites) ---
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('favorites, show_stats')
      .eq('id', id)
      .maybeSingle();

    if (profileError) throw profileError;

    const showStats = profileData?.show_stats ?? true;

    // Elements
    const followersEl = document.querySelector('.profile-stats-row .stat-item:nth-child(1) span');
    const followingEl = document.querySelector('.profile-stats-row .stat-item:nth-child(2) span');
    const favoritesEl = document.querySelector('.profile-stats-row .stat-item:nth-child(3) span');

    if (!showStats) {
      // Hide counts, show icons
      if (followersEl) followersEl.innerHTML = `<i class="fa-solid fa-eye-low-vision"></i>`;
      if (followingEl) followingEl.innerHTML = `<i class="fa-solid fa-eye-low-vision"></i>`;
      if (favoritesEl) favoritesEl.innerHTML = `<i class="fa-solid fa-eye-low-vision"></i>`;
      return; // Skip fetching counts
    }

    // --- Followers count ---
    const { data: followersData, error: followersError } = await supabase
      .from('follows')
      .select('id', { count: 'exact' })
      .eq('following_id', id);

    if (followersError) throw followersError;
    const followersCount = followersData?.length || 0;

    // --- Following count ---
    const { data: followingData, error: followingError } = await supabase
      .from('follows')
      .select('id', { count: 'exact' })
      .eq('follower_id', id);

    if (followingError) throw followingError;
    const followingCount = followingData?.length || 0;

    // --- Favorites count ---
    let favoritesCount = 0;
    if (Array.isArray(profileData?.favorites)) {
      favoritesCount = profileData.favorites.length;
    }

    // --- Update DOM ---
    if (followersEl) followersEl.textContent = followersCount;
    if (followingEl) followingEl.textContent = followingCount;
    if (favoritesEl) favoritesEl.textContent = favoritesCount;

  } catch (err) {
    console.error('Failed to load profile stats:', err);
  }
}









async function toggleFollow() {
  if (!currentUserId || !profileUserId) {
    console.warn('⚠️ Cannot toggle follow — missing user IDs');
    return;
  }

  if (currentUserId === profileUserId) {
    console.log('ℹ️ User cannot follow themselves.');
    return;
  }

  // Check current follow status
  try {
    isFollowing = await checkIfFollowing(currentUserId, profileUserId);
  } catch (err) {
    console.error('❌ Error checking follow status:', err);
    return;
  }

  if (isFollowing) {
    console.log('🚫 Unfollowing user:', profileUserId);
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', currentUserId)
      .eq('following_id', profileUserId);

    if (error) {
      console.error('❌ Error unfollowing:', error);
      return;
    }

    isFollowing = false;
  } else {
    console.log('➕ Following user:', profileUserId);
    const { error: followError } = await supabase
      .from('follows')
      .insert({ follower_id: currentUserId, following_id: profileUserId });

    if (followError) {
      console.error('❌ Error following:', followError);
      return;
    }

    isFollowing = true;

    
  }

  // Update UI
  updateFollowButton();
  updateFollowerCount();
}






async function loadProfile() {
  if (!username) {
    console.warn('⚠️ No username found in query params');
    return;
  }

  console.log('⏳ Fetching profile data for', username);

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !data) {
    console.error('❌ Error loading profile:', error);
    document.getElementById('profile-username').textContent = 'User not found';
    document.getElementById('profile-bio').textContent = '';
    return;
  }


  console.log('✅ Profile data loaded:', data);
  profileUserId = data.id;
profileUserId = data.id;

[viewerFollowsProfile, profileFollowsViewer] = await Promise.all([
  checkIfFollowing(currentUserId, profileUserId),
  checkIfFollowing(profileUserId, currentUserId),
]);

const visibility = data.online_status_visibility || 'everyone';

canShowStatus = (() => {
  if (profileIsPrivate) {
    console.log('🚫 Profile is private — no status shown');
    return false;
  }
  if (visibility === 'everyone') {
    console.log('✅ Visibility set to everyone — showing status');
    return true;
  }
  if (visibility === 'friends') {
    const mutualFriends = viewerFollowsProfile && profileFollowsViewer;
    console.log(`🔄 Visibility is friends. Mutual friends? ${mutualFriends}`);
    return mutualFriends;
  }
  if (visibility === 'mutual') {
    // Assuming "mutual" means mutual follows — same as friends in your context
    const mutual = viewerFollowsProfile && profileFollowsViewer;
    console.log(`🔄 Visibility is mutual. Mutual friends? ${mutual}`);
    return mutual;
  }
  console.log('❓ Visibility setting not recognized — hiding status');
  return false;
})();





  // 🖼️ Set profile pic
  const profilePic = document.getElementById('profile-pic');
  if (profilePic && data.avatar_url) {
    profilePic.src = data.avatar_url;
  }

  // 📝 Set username + bio
  const usernameEl = document.getElementById('profile-username');
  usernameEl.textContent = '@' + data.username;

  const bioEl = document.getElementById('profile-bio');
  bioEl.textContent = data.bio || '';

  // 🏅 Badges
  if (Array.isArray(data.badges)) {
    data.badges.forEach((badge) => {
      const badgeImg = document.createElement('img');
      badgeImg.className = 'badge-icon';
      badgeImg.alt = badge;
      badgeImg.src = `/uploads/badges/${badge}.png`;
      usernameEl.appendChild(badgeImg);
    });
  }

// 🔒 Handle private profile
if (data.private && currentUserId !== data.id) {
  profileIsPrivate = true;
  console.log('🔒 Profile is private — hiding info');

  profilePic.style.filter = 'blur(8px)';
  bioEl.textContent = 'This profile is private.';

  followBtn.disabled = true;
  followBtn.style.opacity = '0.5';
  followBtn.style.cursor = 'not-allowed';
  followBtn.innerHTML = '<i class="fas fa-lock"></i> Private Profile';

  // Hide stats row completely
  const statsRow = document.querySelector('.profile-stats-row');
  if (statsRow) statsRow.style.display = 'none';

  document.getElementById('online-indicator').style.display = 'none';
  document.getElementById('current-game-card').style.display = 'none';

  return;
}


  // ✅ Update follower count


 // 🟢 Online + Activity visibility logic
const onlineDot = document.getElementById('online-indicator');
const profileStatusEl = document.getElementById('profile-status-text');
const gameCard = document.getElementById('current-game-card');


  // ✅ Call stats loader *after* profileUserId is set and DOM is ready
  updateProfileStats(profileUserId);

// Hide everything if not allowed
if (!canShowStatus) {
  onlineDot.style.display = 'none';
  gameCard.style.display = 'none';
  profileStatusEl.style.display = 'none';
} else {
  // Format "last seen" tooltip nicely
  if (data.last_active) {
    const isoString = data.last_active.replace(' ', 'T') + 'Z';
    const lastActiveDate = new Date(isoString);
    const now = Date.now();
    const minutesAgo = (now - lastActiveDate.getTime()) / 60000;

    const formatLastSeen = (minutes) => {
      if (minutes < 1) return 'just now';
      if (minutes < 60) return `${Math.floor(minutes)}m ago`;
      const hours = minutes / 60;
      if (hours < 24) return `${Math.floor(hours)}h ago`;
      const days = hours / 24;
      return `${Math.floor(days)}d ago`;
    };

    if (minutesAgo < 0) {
      onlineDot.title = `⚪ Offline (invalid activity time)`;
      onlineDot.classList.add('offline');
      onlineDot.style.display = 'inline-block';
    } else if (!isNaN(minutesAgo) && minutesAgo < 5) {
      onlineDot.title = '🟢 Online';
      onlineDot.classList.remove('offline');
      onlineDot.style.display = 'inline-block';
    } else {
      onlineDot.title = `⚪ Last seen ${formatLastSeen(minutesAgo)}`;
      onlineDot.classList.add('offline');
      onlineDot.style.display = 'inline-block';
    }
  } else {
    onlineDot.title = `⚪ Offline (no activity recorded)`;
    onlineDot.classList.add('offline');
    onlineDot.style.display = 'inline-block';
  }

  // Status (Surfing the web, Chatting with AI, etc.)
  const statusDisplayText = {
    proxy: 'Surfing the web',
    aichat: 'Chatting with AI',
    tv: 'Watching TV',
    sitechat: 'Hanging out in Chat',
  };

  if (data.status && !data.current_game_id) {
    const statusText = statusDisplayText[data.status] || 'Active';
    profileStatusEl.textContent = statusText;
    profileStatusEl.style.display = 'block';

    const statusRoutes = {
      proxy: '/route',
      aichat: '/ai',
      tv: '/tv',
      sitechat: '/chat',
    };

    if (statusRoutes[data.status]) {
      profileStatusEl.style.cursor = 'pointer';
      profileStatusEl.title = `Go to ${statusText}`;
      profileStatusEl.onclick = () => {
        window.location.href = statusRoutes[data.status];
      };
    } else {
      profileStatusEl.style.cursor = 'default';
      profileStatusEl.onclick = null;
    }
  } else {
    profileStatusEl.style.display = 'none';
  }
}


  
  // Map statuses to friendly display text and optionally route URLs
const statusDisplayText = {
  proxy: 'Surfing the web',
  aichat: 'Chatting with AI',
  tv: 'Watching TV',
  sitechat: 'Hanging out in Chat',
};

// Show the user's status text below the bio, if available and allowed


if (canShowStatus && data.status && !data.current_game_id) {
  const statusText = statusDisplayText[data.status] || 'Active';

  profileStatusEl.textContent = statusText;
  profileStatusEl.style.display = 'block';

  // Make status clickable if you want to link to route pages
  const statusRoutes = {
    proxy: '/route',
    aichat: '/ai',
    tv: '/tv',
    sitechat: '/chat',
  };

  if (statusRoutes[data.status]) {
    profileStatusEl.style.cursor = 'pointer';
    profileStatusEl.title = `Go to ${statusText}`;
    profileStatusEl.onclick = () => {
      window.location.href = statusRoutes[data.status];
    };
  } else {
    profileStatusEl.style.cursor = 'default';
    profileStatusEl.onclick = null;
  }

  console.log(`ℹ️ Showing status on profile: ${statusText}`);
} else {
  profileStatusEl.style.display = 'none';
}

console.log('🔒 Profile private:', profileIsPrivate);
console.log('🛠️ online_status_visibility:', visibility);
console.log('👤 currentUserId:', currentUserId);
console.log('👥 viewerFollowsProfile:', viewerFollowsProfile);
console.log('👥 profileFollowsViewer:', profileFollowsViewer);


}



(async () => {
  currentUserId = await getCurrentUserId();

  // Load profile first so profileUserId is ready
  await loadProfile();

  // Only do follow stuff if viewing someone else's profile and logged in
  if (currentUserId && profileUserId && currentUserId !== profileUserId) {
    // Check if current user is following the profile user
    isFollowing = await checkIfFollowing(currentUserId, profileUserId);

    // Update the follow button based on isFollowing
    updateFollowButton();

    // Add event listener to toggle follow/unfollow
    followBtn.addEventListener('click', toggleFollow);
  } else {
    // Hide the follow button if no user logged in or viewing own profile
    followBtn.style.display = 'none';
  }

  // Load the profile's current game AFTER follow button logic
  if (profile.current_game_id) {
  await loadCurrentGame(profile.current_game_id);
} else if (profile.last_video_url) {
  await showNowWatchingYouTube(profile.last_video_url);
}
await loadProfileGame();
})();

// 🔗 Share button logic
const shareBtn = document.getElementById('share-profile-btn');
const shareStatus = document.getElementById('share-status');

shareBtn?.addEventListener('click', async () => {
  const url = window.location.href;

  try {
    await navigator.clipboard.writeText(url);
    shareStatus.textContent = '🔗 Link copied!';
    shareStatus.style.color = '#4caf50';
    console.log('✅ Copied current profile URL:', url);
  } catch (err) {
    shareStatus.textContent = '❌ Failed to copy';
    shareStatus.style.color = '#f44336';
    console.error('❌ Failed to copy profile URL:', err);
  }

  setTimeout(() => {
    shareStatus.textContent = '';
  }, 4000);
});
async function loadCurrentGame(gameId) {
  if (!gameId) {
    console.log('🎮 No current game ID — hiding game card.');
    document.getElementById('current-game-card').style.display = 'none';
    return;
  }

  console.log(`🎮 Fetching game with ID: ${gameId}`);

  const { data: game, error } = await supabase
    .from('games_menu')
    .select('name, description, img_url')
    .eq('id', gameId)
    .maybeSingle();

  if (error || !game) {
    console.warn('⚠️ Failed to load game or no game found:', error);
    document.getElementById('current-game-card').style.display = 'none';
    return;
  }

  console.log('✅ Loaded game:', game);

  document.getElementById('current-game-name').textContent = game.name;
  document.getElementById('current-game-desc').textContent = "Playing via starplay";
  document.getElementById('current-game-img').src = game.img_url;
  document.getElementById('current-game-card').style.display = 'block';
}

async function loadProfileGame() {
  if (profileIsPrivate) {
    console.log('🔒 Profile is private — skipping game/video card load.');
    document.getElementById('current-game-card').style.display = 'none';
    return;
  }

  const { data: profileSettings, error: settingsError } = await supabase
    .from('profiles')
    .select('online_status_visibility, status')
    .eq('id', profileUserId)
    .single();

  if (settingsError || !profileSettings) {
    console.warn('⚠️ Could not fetch profile visibility:', settingsError);
    document.getElementById('current-game-card').style.display = 'none';
    return;
  }

  const canShowGame = (() => {
    if (profileIsPrivate) return false;
    if (!canShowStatus) return false;
    return true;
  })();

  if (!canShowGame) {
    console.log('🚫 Not allowed to show now playing (privacy settings).');
    document.getElementById('current-game-card').style.display = 'none';
    return;
  }

  const status = profileSettings.status;

  // Handle custom status cards for AI chat or web surfing
  if (status && CUSTOM_STATUS_CARDS[status]) {
    const card = CUSTOM_STATUS_CARDS[status];
    const gameCard = document.getElementById('current-game-card');

    document.getElementById('current-game-name').textContent = card.name;
    document.getElementById('current-game-desc').textContent = card.desc;
    document.getElementById('current-game-img').src = card.img;
    gameCard.style.display = 'block';

    console.log(`✨ Showing custom status card for: ${status}`);
    return; // Done here, skip the rest
  }

  if (!profileUserId) {
    console.log('🎮 No profile user ID, hiding game/video card.');
    document.getElementById('current-game-card').style.display = 'none';
    return;
  }

  // Fetch current_game_id AND last_video_url
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('current_game_id, last_video_url')
    .eq('id', profileUserId)
    .maybeSingle();

  if (error || !profile) {
    console.warn('⚠️ Could not fetch profile game/video info:', error);
    document.getElementById('current-game-card').style.display = 'none';
    return;
  }

  if (profile.current_game_id) {
    console.log('👾 Current game ID for profile:', profile.current_game_id);
    await loadCurrentGame(profile.current_game_id);
  } else if (profile.last_video_url) {
    console.log('🎥 Showing YouTube video:', profile.last_video_url);
    await showNowWatchingYouTube(profile.last_video_url);
  } else {
    console.log('🚫 No game or video set — hiding card.');
    document.getElementById('current-game-card').style.display = 'none';
  }
}

// Helper function to show YouTube now watching card
async function showNowWatchingYouTube(videoUrl) {
  const videoIdMatch = videoUrl.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  const videoId = videoIdMatch?.[1];

  if (!videoId) {
    console.warn('❌ Invalid YouTube URL:', videoUrl);
    document.getElementById('current-game-card').style.display = 'none';
    return;
  }

  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (!res.ok) throw new Error('Failed to fetch video data');

    const videoData = await res.json();

    const videoCard = document.getElementById('current-game-card');
    videoCard.style.display = 'block';

    document.getElementById('current-game-img').src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    document.getElementById('current-game-name').textContent = videoData.title;
    document.getElementById('current-game-desc').textContent = 'Watching on startv via YouTube';

  } catch (err) {
    console.error('🎥 Failed to load YouTube video info:', err);
    document.getElementById('current-game-card').style.display = 'none';
  }
}


const searchInput = document.getElementById('profile-search-input');
const searchResults = document.getElementById('profile-search-results');

let searchTimeout = null;



searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    searchProfiles(searchInput.value);
  }, 300);
});


async function searchProfiles(query) {
  if (!query || query.trim().length < 2) {
    searchResults.innerHTML = ''; // clear results if query is empty or too short
    return;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, bio, badges')
    .eq('private', false) // only public profiles
    .ilike('username', `%${query}%`) // case-insensitive partial match
    .limit(10);

  if (error) {
    console.error('❌ Error searching profiles:', error);
    searchResults.innerHTML = '<p>Failed to load results.</p>';
    return;
  }

  if (!data.length) {
    searchResults.innerHTML = '<p>No profiles found.</p>';
    return;
  }

  searchResults.innerHTML = data
    .map((profile) => {
      const badgesHTML = Array.isArray(profile.badges)
        ? profile.badges
            .map(
              (badge) =>
                `<img class="badge-icon" src="/uploads/badges/${badge}.png" alt="${badge}" title="${badge}" />`
            )
            .join('')
        : '';

      return `
      <div class="search-result" data-username="${profile.username}">
        <img src="${profile.avatar_url || '/default-avatar.png'}" alt="${profile.username}" class="search-avatar" />
        <div class="search-info">
          <div class="username-with-badges">
            <strong class="username">@${profile.username}</strong>
            <div class="badges-container">${badgesHTML}</div>
          </div>
          <small class="bio">${profile.bio ? profile.bio.substring(0, 50) + '...' : ''}</small>
        </div>
      </div>`;
    })
    .join('');

  // Add click handlers to each result to go to their profile page
  document.querySelectorAll('.search-result').forEach((el) => {
    el.addEventListener('click', () => {
      const username = el.getAttribute('data-username');
      if (username) {
        window.location.href = `/profile.html?username=${encodeURIComponent(username)}`;
      }
    });
  });
}


// Elements
const reportBtn = document.getElementById('report-profile-btn');
const reportModal = document.getElementById('report-modal');
const cancelReportBtn = document.getElementById('cancel-report');
const reportForm = document.getElementById('report-form');

reportBtn?.addEventListener('click', () => {
  if (!currentUserId || !profileUserId || currentUserId === profileUserId) {
    alert("You can't report this profile.");
    return;
  }
  // Show
document.getElementById('report-modal').classList.add('active');
});

cancelReportBtn?.addEventListener('click', () => {
// Hide
document.getElementById('report-modal').classList.remove('active');
});

// Submit report to Supabase
reportForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const reason = document.getElementById('report-reason').value;
  const details = document.getElementById('report-details').value;

  const { error } = await supabase.from('profile_reports').insert([
    {
      reporter_id: currentUserId,
      reported_id: profileUserId,
      reason,
      details
    }
  ]);

  if (error) {
    alert("Failed to submit report.");
    console.error('❌ Report error:', error);
  } else {
        showNotification('Report sent! ✅', {
      body: "Thanks for helping us keep the community safe. We'll review your report soon.",
      duration: 10000,
  
      sound: true,
    });
    // Hide
document.getElementById('report-modal').classList.remove('active');
  }
});
