import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://jbekjmsruiadbhaydlbt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZWtqbXNydWlhZGJoYXlkbGJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzOTQ2NTgsImV4cCI6MjA2Mzk3MDY1OH0.5Oku6Ug-UH2voQhLFGNt9a_4wJQlAHRaFwTeQRyjTSY'
);



  let currentUserId = null;
  let settingsCache = {};

  async function checkUser() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error('Supabase auth error:', error);
      return;
    }

    if (session) {
      currentUserId = session.user.id;
      await loadSettingsFromSupabase();
    } else {
      loadSettingsFromLocalStorage();
    }
  }

  async function loadSettingsFromSupabase() {
    const { data, error } = await supabase
      .from('profiles')
      .select('settings')
      .eq('id', currentUserId)
      .single();

    if (error) {
      console.warn('Failed to load settings from Supabase:', error);
      loadSettingsFromLocalStorage();
      return;
    }

    settingsCache = data?.settings || {};
    // Apply loaded settings to local variables
    panickey = settingsCache.panicKey || 'Escape';
    panicURL = settingsCache.cloakLink || 'https://www.google.com/';
  }

  function loadSettingsFromLocalStorage() {
    panickey = localStorage.getItem('panicKey') || 'Escape';
    panicURL = localStorage.getItem('cloakLink') || 'https://www.google.com/';
  }

  async function saveSettings() {
    settingsCache.panicKey = panickey;
    settingsCache.cloakLink = panicURL;

    if (currentUserId) {
      const { error } = await supabase
        .from('profiles')
        .update({ settings: settingsCache })
        .eq('id', currentUserId);
      if (error) {
        console.error('Failed to save settings to Supabase:', error);
      }
    } else {
      // Not logged in — fallback to localStorage
      localStorage.setItem('panicKey', panickey);
      localStorage.setItem('cloakLink', panicURL);
    }
  }

  // Initial panic key & URL values (fallbacks)
  let panickey = 'Escape';
  let panicURL = 'https://www.google.com/';

  // Listen for the panic key press
  document.addEventListener('keydown', (event) => {
    if (event.key === panickey) {
      window.location.href = panicURL;
    }
  });

  // Expose function for user to set new panic key
  window.listenForKey = function () {
    alert('Press the key you want to use as your Panic Key.');

    function setKey(e) {
      panickey = e.key;
      alert('Panic key set to: ' + panickey);
      saveSettings();
      document.removeEventListener('keydown', setKey, true);
    }

    document.addEventListener('keydown', setKey, true);
  };

  // Function to set a new cloak URL (optional helper)
  window.setPanicURL = function (url) {
    panicURL = url;
    saveSettings();
  };

  // Run on page load
  document.addEventListener('DOMContentLoaded', () => {
    checkUser();
  });