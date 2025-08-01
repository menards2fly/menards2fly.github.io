import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://jbekjmsruiadbhaydlbt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZWtqbXNydWlhZGJoYXlkbGJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzOTQ2NTgsImV4cCI6MjA2Mzk3MDY1OH0.5Oku6Ug-UH2voQhLFGNt9a_4wJQlAHRaFwTeQRyjTSY'
);

// Cloak options
const cloaks = [
  { name: 'gdoc', title: 'Untitled document - Google Docs', icon: '/uploads/cloaks/gdocs.png', link: 'https://docs.google.com/document/u/0/' },
  { name: 'gslides', title: 'Untitled presentation - Google Slides', icon: '/uploads/cloaks/gslides.png', link: 'https://docs.google.com/presentation/u/0/' },
  { name: 'gsheets', title: 'Untitled spreadsheet - Google Sheets', icon: '/uploads/cloaks/gsheets.png', link: 'https://docs.google.com/spreadsheets/u/0/' },
  { name: 'calculator', title: 'Calculator - Google Search', icon: '/uploads/cloaks/google.png', link: 'https://www.google.com/search?q=calculator' },
  { name: 'desmoscalc', title: 'Desmos | Scientific Calculator', icon: '/uploads/cloaks/desmos.png', link: 'https://www.desmos.com/scientific' },
  { name: 'gdrive', title: 'Google Drive', icon: '/uploads/cloaks/gdrive.png', link: 'https://drive.google.com/' },
  { name: 'google', title: 'Google', icon: '/uploads/cloaks/google.png', link: 'https://www.google.com/' },
  { name: 'gassign', title: 'Google Assignments', icon: '/uploads/cloaks/gassign.png', link: 'https://assignments.google.com/' },
  { name: 'blank', title: '        ', icon: '/uploads/cloaks/transparent.png', link: '' },
];

window.cloaks = cloaks;

const logo = '[Parcoil Cloak]';

// Cloak helper functions
const cloak = {
  getFavicon() {
    const icons = document.querySelectorAll('link[rel="icon"]');
    return icons.length > 0 ? icons[0].href : null;
  },
  setFavicon(url) {
    const icons = document.querySelectorAll('link[rel="icon"]');
    if (icons.length === 0) {
      // Create favicon link if not present
      const link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
      link.href = url;
    } else {
      icons.forEach(icon => icon.href = url);
    }
    localStorage.setItem('cloakFavicon', url);
  },
  getTitle() {
    return document.title;
  },
  setTitle(newTitle) {
    document.title = newTitle;
    localStorage.setItem('cloakTitle', newTitle);
  },
  setLink(newLink) {
    localStorage.setItem('cloakLink', newLink);
  },
  setCloak(newTitle, url, link) {
    this.setTitle(newTitle);
    this.setFavicon(url);
    this.setLink(link);
  },
  reset(reload = true) {
    localStorage.removeItem('cloakTitle');
    localStorage.removeItem('cloakFavicon');
    localStorage.removeItem('cloakLink');
    console.log(logo, 'Cloak reset.');
    if (reload) window.location.reload();
  }
};

window.cloak = cloak;
// Get user ID from supabase auth session
async function getUserId() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Auth error:', error);
    return null;
  }
  return user ? user.id : null;
}




// Fetch user settings from Supabase (returns settings object or {})
async function fetchSettings(userId) {
  if (!userId) return {};
  const { data, error } = await supabase.from('profiles').select('settings').eq('id', userId).single();
  if (error) {
    console.error('Error fetching settings:', error);
    return {};
  }
  return data?.settings || {};
}

// Save settings object to Supabase
async function saveSettings(userId, settings) {
  if (!userId) return; // no user, skip
  const { error } = await supabase.from('profiles').update({ settings }).eq('id', userId);
  if (error) console.error('Failed to save settings:', error);
  else console.log('Settings saved to Supabase');
}

// Sync cloak state to settings & localStorage
async function updateCloakSetting(userId, settings, cloakName) {
  const selectedCloak = cloaks.find(c => c.name === cloakName);
  if (!selectedCloak) {
    console.error(`Cloak '${cloakName}' not found`);
    return;
  }
  // Update cloak in settings object
  settings.cloak = {
    name: selectedCloak.name,
    title: selectedCloak.title,
    icon: selectedCloak.icon,
    link: selectedCloak.link,
  };

  // Apply cloak immediately
  cloak.setCloak(selectedCloak.title, selectedCloak.icon, selectedCloak.link);

  // Save locally
  localStorage.setItem('cloak', JSON.stringify(settings.cloak));

  // Save to Supabase if logged in
  await saveSettings(userId, settings);
}

// Load cloak from settings or localStorage on init
async function loadCloak(userId) {
  let cloakData = null;

  if (userId) {
    const settings = await fetchSettings(userId);
    cloakData = settings.cloak || null;
    if (cloakData) {
      cloak.setCloak(cloakData.title, cloakData.icon, cloakData.link);
      // Also sync localStorage to keep things consistent
      localStorage.setItem('cloak', JSON.stringify(cloakData));
      return settings; // return full settings for further use
    }
  }

  // No user or no cloak in settings, fallback to localStorage
  const localCloakStr = localStorage.getItem('cloak');
  if (localCloakStr) {
    try {
      cloakData = JSON.parse(localCloakStr);
      cloak.setCloak(cloakData.title, cloakData.icon, cloakData.link);
    } catch {
      // ignore parse error
    }
  } else {
    // If no cloak set at all, reset favicon/title or set default
    const savedTitle = localStorage.getItem('cloakTitle');
    const savedFavicon = localStorage.getItem('cloakFavicon');
    if (savedTitle && savedFavicon) {
      cloak.setTitle(savedTitle);
      cloak.setFavicon(savedFavicon);
    }
  }

  return {};
}

document.addEventListener('DOMContentLoaded', async () => {
  const userId = await getUserId(); // Implement your auth

  // Load cloak and settings
  const settings = await loadCloak(userId);

  // Setup cloak select dropdown listener
  const cloakSelect = document.querySelector('[data-cloak-select]');
  if (cloakSelect) {
    cloakSelect.value = settings.cloak?.name || localStorage.getItem('cloakName') || 'blank';

    cloakSelect.addEventListener('change', async () => {
      const newCloakName = cloakSelect.value;
      await updateCloakSetting(userId, settings, newCloakName);
    });
  }
});

