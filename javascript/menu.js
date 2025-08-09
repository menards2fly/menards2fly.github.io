import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://jbekjmsruiadbhaydlbt.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZWtqbXNydWlhZGJoYXlkbGJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzOTQ2NTgsImV4cCI6MjA2Mzk3MDY1OH0.5Oku6Ug-UH2voQhLFGNt9a_4wJQlAHRaFwTeQRyjTSY';

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;


let games = [];
let showClickCounts = false;
let currentSortOption = 'favorites';
let typingTimeout;
let userBlurCovers = true; // default to true if no user or no profile

async function loadUserBlurSetting() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    userBlurCovers = true; // no user signed in or error -> default true
    return;
  }

  const { data, error: profileError } = await supabase
    .from('profiles')
    .select('blur_covers')
    .eq('id', user.id)
    .single();

  if (profileError || !data) {
    console.warn('Could not fetch user profile, defaulting blur_covers to true', profileError);
    userBlurCovers = true;
  } else {
    userBlurCovers = data.blur_covers === true;
  }
}



function getCardHTML(game) {
  return `
<div class="card game-card">
  <div class="card-body">
    <div class="favorite-icon">
      ${game.isFavorited
        ? '<i class="fa-solid fa-heart-circle-check"></i>'
        : '<i class="fa-solid fa-heart-circle-plus"></i>'}
    </div>
    <div class="card-content">
      <div class="card-image">
        <img src="${game.image}" alt="${game.name}" style="filter: ${game.blur ? 'blur(9px)' : 'none'}" />
      </div>
      <div class="card-text-content">
        <h5 class="card-title">${game.name}</h5>
        <p style="display:${game.blur ? 'block' : 'none'}; color:red;" class="card-text"><i class="fa fa-warning"></i> Cover hidden due to your content settings.</p>
        <div class="card-stats">
          <div class="stat"><i class="fa fa-clock"></i> ${game.clickCount} plays</div>
          <div class="stat"><i class="fa fa-thumbs-up"></i> ${game.globalLikes || 0} likes</div>
        </div>
      </div>
    </div>
  </div>
</div>
  `;
}


async function loadGamesFromSupabase() {
  console.log('🎮 Loading games from Supabase...');
  showSkeletonLoader();

  // First, load the user blur setting
  await loadUserBlurSetting();

  const { data, error } = await supabase
    .from('games_menu')
    .select('id, name, url, img_url, description, tags, play_count, likes, blur');

  if (error) {
    console.error('❌ Error loading games:', error.message);
    alert('Error loading games from Supabase');
    return;
  }
  console.log(`✅ Loaded ${data.length} games.`);

  games = data.map((row) => ({
    id: row.id,
    name: row.name,
    image: row.img_url,
    link: row.url,
    description: row.description,
    tags: row.tags || [],
    clickCount: row.play_count || 0,
    isFavorited: false,
    path: '/play',
    globalLikes: row.likes || 0,
    globalClicks: row.play_count || 0,
    // Only blur if the game’s own blur flag is true AND userBlurCovers is true
    blur: row.blur === true && userBlurCovers,
  }));

  await loadFavoritesFromSupabase();
  displayGamesWithSkeleton();
}


async function saveFavoritesToSupabase() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const favs = games.filter((g) => g.isFavorited).map((g) => g.id);
  console.log(`💾 Saving ${favs.length} favorites for user ${user.id}`);
  const { error } = await supabase.from('profiles').update({ favorites: favs }).eq('id', user.id);
  if (error) console.error('❌ Error saving favorites:', error.message);
}

async function loadFavoritesFromSupabase() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('favorites')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('❌ Error loading favorites:', error.message);
    return;
  }

  const favIds = (profile?.favorites || []).map((id) => String(id));
  console.log(`⭐ Loaded ${favIds.length} favorite IDs for user ${user.id}`);
  games.forEach((g) => (g.isFavorited = favIds.includes(String(g.id))));
}

function sortGames() {
  const sel = document.getElementById('sortOptions');
  currentSortOption = sel ? sel.value : 'favorites';
  console.log(`🔀 Sorting games by: ${currentSortOption}`);
  displayGames();
}

function isGameLiked(game) {
  return !!localStorage.getItem(`liked_${game.link}`);
}

function displayGames(filter = '') {
  console.log(`📜 Displaying games (filter: "${filter}")`);
  const menu = document.getElementById('gameMenu');
  const countEl = document.getElementById('gameCount');
  const searchBar = document.getElementById('search');
  menu.innerHTML = '';

  const filtered = games
    .filter((g) => {
      const term = filter.toLowerCase();
      const nameMatch = g.name.toLowerCase().includes(term);
      const tagMatch = g.tags?.some((tag) => tag.toLowerCase().includes(term));
      return nameMatch || tagMatch;
    })
    .sort((a, b) => {
      switch (currentSortOption) {
        case 'favorites': return b.isFavorited - a.isFavorited;
        case 'clickCount': return b.clickCount - a.clickCount;
        case 'alphabetical': return a.name.localeCompare(b.name);
        case 'liked': return isGameLiked(b) - isGameLiked(a);
        case 'globalLikes': return (b.globalLikes || 0) - (a.globalLikes || 0);
        case 'trending': return (b.globalClicks || 0) - (a.globalClicks || 0);
        default: return 0;
      }
    });

  filtered.forEach((game) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'game-container';
    wrapper.innerHTML = getCardHTML(game);

    const favEl = wrapper.querySelector('.favorite-icon');
    favEl.addEventListener('click', async (e) => {
      e.stopPropagation();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showNotification('Favorites Error', {
          body: "You need to be signed in to use favorites. Log in <a href='/auth'>here</a>.",
          sound: true,
          duration: 10000,
        });
        return;
      }
      game.isFavorited = !game.isFavorited;
      await saveFavoritesToSupabase();
      displayGames(filter);
    });

    wrapper.addEventListener('click', () => {
      game.clickCount++;
      console.log(`▶️ Launching game: ${game.name}`);
      localStorage.setItem('gameImage', game.image);
      localStorage.setItem('gameName', game.name);
      localStorage.setItem('gameLink', game.link);
      localStorage.setItem('gameDesc', game.description);
      localStorage.setItem('blur', game.blur ? 'true' : 'false');

      displayGames(filter);
      window.location.href = game.path;
    });

    menu.appendChild(wrapper);
  });

  if (countEl) countEl.textContent = `${filtered.length} of ${games.length} games loaded.`;
  if (searchBar) searchBar.placeholder = `Search ${games.length} games...`;
}

function showSkeletonLoader() {
  console.log('⏳ Showing skeleton loader...');
  const menu = document.getElementById('gameMenu');
  menu.innerHTML = '';
  for (let i = 0; i < 90; i++) {
    const s = document.createElement('div');
    s.className = 'skeleton skeleton-game';
    menu.appendChild(s);
  }
}

async function displayGamesWithSkeleton() {
  console.log('🖼️ Rendering skeleton before games...');
  const ids = ['search', 'sortOptions', 'gameCount', 'card'];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  showSkeletonLoader();
  setTimeout(async () => {
    await loadFavoritesFromSupabase();
    displayGames();
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.style.display = id === 'card' ? 'block' : 'inline-block';
    });
  }, 500);
}


/* ----------------- MUTUAL FRIENDS ----------------- */
async function loadMutualFriends() {
  console.log('🚀 Loading mutual friends...');
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) console.warn('⚠️ User fetch error:', userError);
  if (!user) {
    document.getElementById('friends-list').innerHTML = `
      <div class="signup-box" style="padding:20px; text-align:center; border: 2px dashed #888; border-radius: 8px; color: white;">
        ✨ Sign up or log in to see what your friends are playing! ✨
      </div>`;
    return;
  }
  console.log(`👤 Logged in as ${user.id}`);

  // Fetch follows (who user follows, who follows user)
  const { data: followingRows } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
  const { data: followerRows } = await supabase.from('follows').select('follower_id').eq('following_id', user.id);
  const followingIds = (followingRows || []).map(r => r.following_id);
  const followerIds = (followerRows || []).map(r => r.follower_id);
  const mutualIds = followingIds.filter(id => followerIds.includes(id));
  console.log(`🔗 Found ${mutualIds.length} mutual friends.`);

  if (!mutualIds.length) {
    document.getElementById('friends-list').innerHTML =
      "<p>No mutual friends yet. When you follow someone who follows you back, they'll show up here!</p>";
    return;
  }

  // Preload all follow relationships (both directions for user & mutual friends)
  const { data: allFollows, error: followError } = await supabase
    .from('follows')
    .select('follower_id, following_id')
    .or(
      [
        `follower_id.eq.${user.id},following_id.in.(${mutualIds.join(',')})`,
        `follower_id.in.(${mutualIds.join(',')}),following_id.eq.${user.id}`
      ].join(',')
    );

  if (followError) console.warn('⚠️ Follow preload error:', followError);
  console.log('🧪 allFollows:', allFollows);

  const isMutualFollow = (fid) =>
    allFollows?.some(f => f.follower_id === user.id && f.following_id === fid) &&
    allFollows?.some(f => f.follower_id === fid && f.following_id === user.id);

  // Load profiles of mutual friends
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, last_active, current_game_id, status, online_status_visibility')
    .in('id', mutualIds);

  // Preload all games (batch)
  const activeGameIds = profiles.filter(p => p.current_game_id).map(p => p.current_game_id);
  const { data: gamesData } = activeGameIds.length
    ? await supabase.from('games_menu').select('id, name, url').in('id', activeGameIds)
    : { data: [] };
  const gameMap = Object.fromEntries(gamesData.map(g => [g.id, g]));

  profiles.sort((a, b) => (!!b.current_game_id) - (!!a.current_game_id));
  const list = document.getElementById('friends-list');
  list.innerHTML = '';

  for (const friend of profiles) {
    const visibility = (friend.online_status_visibility || 'everyone').toLowerCase();
    
    // Assume canView true unless visibility is explicitly 'noone'
    const canView = visibility !== 'noone';

    console.log(`🧪 Checking online status for ${friend.username}...`);
    console.log(`➡️ visibility: ${visibility}, canView: ${canView}, last_active: ${friend.last_active}`);

    let isOnline = false;
    if (canView && friend.last_active) {
      isOnline = isUserOnline(friend.last_active, 5); // still compares in UTC
    }

    console.log(`🔍 ${friend.username} is ${isOnline ? 'online' : 'offline'}.`);

    const game = canView && friend.current_game_id ? gameMap[friend.current_game_id] : null;
    const nowPlaying = game?.name || null;
    const gameUrl = game?.url || null;

    let statusText = 'Inactive';
    if (!isOnline) statusText = 'Offline';
    else if (nowPlaying) statusText = nowPlaying;
    else if (friend.status && !friend.current_game_id) {
      const statuses = {
        proxy: 'Surfing the web',
        aichat: 'Chatting with AI',
        tv: 'Watching TV',
        sitechat: 'Hanging out in Chat',
      };
      statusText = statuses[friend.status] || 'Active';
    }

    const avatarWrapper = document.createElement('div');
    avatarWrapper.className = 'friend-avatar-wrapper';
    let clickUrl = null;

    if (gameUrl) {
      clickUrl = '/play';
      avatarWrapper.style.cursor = 'pointer';
      avatarWrapper.addEventListener('click', () => {
        localStorage.setItem('gameLink', gameUrl);
        localStorage.setItem('gameName', nowPlaying);
        window.location.href = clickUrl;
      });
    } else if (friend.status && !friend.current_game_id) {
      const routes = { proxy: '/route', aichat: '/ai', tv: '/tv', sitechat: '/chat' };
      if (routes[friend.status]) {
        clickUrl = routes[friend.status];
        avatarWrapper.style.cursor = 'pointer';
        avatarWrapper.addEventListener('click', () => (window.location.href = clickUrl));
      }
    }

    const avatarImg = document.createElement('img');
    avatarImg.className = 'friend-avatar';
    avatarImg.src = friend.avatar_url || '/uploads/branding/default-avatar.png';
    avatarImg.alt = friend.username;
    avatarWrapper.appendChild(avatarImg);

    if (isOnline) {
      const dot = document.createElement('span');
      dot.className = 'online-dot';
      dot.title = 'Online';
      avatarWrapper.appendChild(dot);
    }

    const card = document.createElement('div');
    card.className = 'friend-item';
    const usernameDiv = document.createElement('div');
    usernameDiv.className = 'friend-username';
    usernameDiv.textContent = friend.username;
    const nowPlayingDiv = document.createElement('div');
    nowPlayingDiv.className = 'friend-nowplaying';
    nowPlayingDiv.textContent = statusText;

    card.appendChild(avatarWrapper);
    card.appendChild(usernameDiv);
    card.appendChild(nowPlayingDiv);
    list.appendChild(card);
  }

  console.log('🎉 Finished loading mutual friends.');
}



/* ----------------- EVENT LISTENERS ----------------- */
window.addEventListener('load', loadGamesFromSupabase);

// Add this back to handle search properly
function filterGames() {
  console.log('🔍 Filtering games...');
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    const search = document.getElementById('search').value;
    showSkeletonLoader();
    console.log(`⌛ Searching for: "${search}"`);
    setTimeout(() => {
      displayGames(search);
      console.log('✅ Search complete.');
    }, 500);
  }, 300); // debounce
}

// Fix event listeners so it uses filterGames()
window.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search');
  if (searchInput) searchInput.addEventListener('input', filterGames);

  const sortSelect = document.getElementById('sortOptions');
  if (sortSelect) sortSelect.addEventListener('change', sortGames);

  loadMutualFriends();
});

const greetings = [
  'Hey, {username}!',
  'Howdy there, {username}!',
  'Welcome back, {username}!',
  'Good to see you, {username}!',
  'Ready to play, {username}?',
  'Yo, {username}!',
  "What's up, {username}?",
  'Fancy seeing you here, {username}',
];

async function setWelcome() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let username = 'Guest';
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle();
    if (profile && profile.username) {
      username = profile.username;
      localStorage.setItem('loggedInUser', JSON.stringify(profile));
    }
  }
  const greeting = greetings[
    Math.floor(Math.random() * greetings.length)
  ].replace('{username}', username);
  setTimeout(() => {
    document.querySelector('.welcome').textContent = greeting;
  }, 3000); // 3 second delay
}

setWelcome();

function isUserOnline(lastActiveStr, minutesThreshold = 5) {
  if (!lastActiveStr) return false;

  // Supabase returns UTC timestamps, so handle them right
  const isoString = lastActiveStr.includes('T')
    ? lastActiveStr.endsWith('Z') ? lastActiveStr : lastActiveStr + 'Z'
    : lastActiveStr.replace(' ', 'T') + 'Z';

  const lastActiveDate = new Date(isoString);
  if (isNaN(lastActiveDate)) return false;

  const now = Date.now();
  const diffMinutes = (now - lastActiveDate.getTime()) / 60000;

  console.log("📦 Raw timestamp from DB:", lastActiveStr);
  console.log("🕰️ Interpreted as:", lastActiveDate.toISOString());
  console.log("🧮 Minutes ago:", diffMinutes.toFixed(2));

  return diffMinutes >= 0 && diffMinutes < minutesThreshold;
}


