import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://jbekjmsruiadbhaydlbt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZWtqbXNydWlhZGJoYXlkbGJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzOTQ2NTgsImV4cCI6MjA2Mzk3MDY1OH0.5Oku6Ug-UH2voQhLFGNt9a_4wJQlAHRaFwTeQRyjTSY'
);

(function () {
  /***********************
   * UTILITY FUNCTIONS
   ***********************/
  function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [hrs, mins, secs].map((num) => String(num).padStart(2, '0')).join(':');
  }

  function getTodayString() {
    return new Date().toISOString().split('T')[0];
  }

  /***********************
   * GLOBAL VARIABLES & DEFAULTS
   ***********************/
  let trackingInterval = null;
  let midnightTimeout = null;

  const DEFAULT_SETTINGS = {
    usageLimitSeconds: 3600,
    limitActive: false,
    limitAction: 'reminder',
    disabledUntil: null,
    reminderPage: '/reminder.html',
    lockoutPage: '/lockout.html',
    lastReminderRedirect: 0,
  };

  let currentUserId = null;

  /***********************
   * SETTINGS LOAD & SAVE
   ***********************/

  // Load settings either from Supabase or localStorage
  async function loadSettings() {
    if (currentUserId) {
      const { data, error } = await supabase
        .from('profiles')
        .select('settings')
        .eq('id', currentUserId)
        .single();

      if (error) {
        console.warn('Supabase fetch settings error:', error);
        return loadLocalSettings();
      }
      return data?.settings || DEFAULT_SETTINGS;
    } else {
      return loadLocalSettings();
    }
  }

  // Save settings either to Supabase or localStorage
  async function saveSettings(settings) {
    if (currentUserId) {
      const { error } = await supabase
        .from('profiles')
        .update({ settings })
        .eq('id', currentUserId);

      if (error) {
        console.warn('Supabase save settings error:', error);
        saveLocalSettings(settings); // fallback save locally
      }
    } else {
      saveLocalSettings(settings);
    }
  }

  // LocalStorage helpers
  function loadLocalSettings() {
    const settingsJSON = localStorage.getItem('screenTimeSettings');
    if (settingsJSON) {
      try {
        return JSON.parse(settingsJSON);
      } catch {
        return DEFAULT_SETTINGS;
      }
    } else {
      return DEFAULT_SETTINGS;
    }
  }

  function saveLocalSettings(settings) {
    localStorage.setItem('screenTimeSettings', JSON.stringify(settings));
  }

  /***********************
   * TRACKING DATA (always localStorage)
   ***********************/
  function loadTrackingData() {
    const dataJSON = localStorage.getItem('screenTimeData');
    const todayStr = getTodayString();
    if (dataJSON) {
      try {
        const data = JSON.parse(dataJSON);
        if (data.date !== todayStr) {
          return { date: todayStr, secondsSpent: 0 };
        }
        return data;
      } catch {
        return { date: todayStr, secondsSpent: 0 };
      }
    }
    return { date: todayStr, secondsSpent: 0 };
  }

  function saveTrackingData(data) {
    localStorage.setItem('screenTimeData', JSON.stringify(data));
  }

  /***********************
   * MIDNIGHT RESET
   ***********************/
  function scheduleMidnightReset() {
    if (midnightTimeout) clearTimeout(midnightTimeout);
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const msUntilMidnight = nextMidnight - now;
    midnightTimeout = setTimeout(() => {
      saveTrackingData({ date: getTodayString(), secondsSpent: 0 });
      updateDisplay();
      scheduleMidnightReset();
    }, msUntilMidnight);
  }

  /***********************
   * TRACKING & DISPLAY
   ***********************/
  function startTracking() {
    if (trackingInterval) clearInterval(trackingInterval);
    trackingInterval = setInterval(async () => {
      const settings = await loadSettings();

      if (settings.disabledUntil) {
        const disabledDate = new Date(settings.disabledUntil);
        const today = new Date(getTodayString());
        if (today <= disabledDate) return; // skip tracking while disabled
        else {
          settings.disabledUntil = null;
          await saveSettings(settings);
        }
      }

      let data = loadTrackingData();
      data.secondsSpent++;
      saveTrackingData(data);
      updateDisplay();
      checkLimitReached();
    }, 1000);
  }

  async function updateDisplay() {
    const data = loadTrackingData();
    const timeSpentElem = document.getElementById('timeSpent');
    const timeRemainingElem = document.getElementById('timeRemaining');

    if (timeSpentElem) {
      timeSpentElem.textContent = formatTime(data.secondsSpent);
    }

    const settings = await loadSettings();

    if (settings.limitActive && timeRemainingElem) {
      const remaining = settings.usageLimitSeconds - data.secondsSpent;
      timeRemainingElem.textContent = remaining > 0 ? formatTime(remaining) : '00:00:00';
    } else if (timeRemainingElem) {
      timeRemainingElem.textContent = 'No Limit';
    }

    if (data.secondsSpent >= settings.usageLimitSeconds) {
      if (timeSpentElem) timeSpentElem.style.color = 'red';
      if (timeRemainingElem) timeRemainingElem.style.color = 'red';
    } else {
      if (timeSpentElem) timeSpentElem.style.color = 'white';
      if (timeRemainingElem) timeRemainingElem.style.color = 'white';
    }
  }

  /***********************
   * LIMIT HANDLING
   ***********************/
  async function checkLimitReached() {
    const data = loadTrackingData();
    const settings = await loadSettings();

    if (!settings.limitActive) return;

    if (document.getElementById('settingsForm')) return;

    if (data.secondsSpent >= settings.usageLimitSeconds) {
      if (settings.limitAction === 'lockout') {
        window.location.href = settings.lockoutPage;
      } else if (settings.limitAction === 'reminder') {
        const now = Date.now();
        if (!settings.lastReminderRedirect || now - settings.lastReminderRedirect >= 5 * 60 * 1000) {
          settings.lastReminderRedirect = now;
          await saveSettings(settings);
          window.location.href = settings.reminderPage;
        }
      }
    }
  }

  /***********************
   * SETTINGS FORM HANDLERS
   ***********************/
  async function initSettingsForm() {
    const settings = await loadSettings();

    const limitActiveCheckbox = document.getElementById('limitActiveCheckbox');
    const presetTimeDropdown = document.getElementById('presetTimeDropdown');
    const customTimeInput = document.getElementById('customTimeInput');
    const limitActionDropdown = document.getElementById('limitActionDropdown');

    if (limitActiveCheckbox) limitActiveCheckbox.checked = settings.limitActive;

    if (presetTimeDropdown && customTimeInput) {
      const presets = [900, 1800, 3600, 7200, 10800];
      if (presets.includes(settings.usageLimitSeconds)) {
        presetTimeDropdown.value = String(settings.usageLimitSeconds);
        document.getElementById('customTimeContainer').style.display = 'none';
      } else {
        presetTimeDropdown.value = 'custom';
        document.getElementById('customTimeContainer').style.display = 'inline';
        let hrs = Math.floor(settings.usageLimitSeconds / 3600);
        let rem = settings.usageLimitSeconds % 3600;
        let mins = Math.floor(rem / 60);
        let secs = rem % 60;
        customTimeInput.value = [hrs, mins, secs].map((n) => String(n).padStart(2, '0')).join(':');
      }
    }

    if (limitActionDropdown) limitActionDropdown.value = settings.limitAction;
  }

  async function handleSaveSettings() {
    const limitActiveCheckbox = document.getElementById('limitActiveCheckbox');
    const presetTimeDropdown = document.getElementById('presetTimeDropdown');
    const customTimeInput = document.getElementById('customTimeInput');
    const limitActionDropdown = document.getElementById('limitActionDropdown');

    const limitActive = limitActiveCheckbox ? limitActiveCheckbox.checked : true;
    let usageLimitSeconds;

    if (presetTimeDropdown.value === 'custom') {
      const customTime = customTimeInput.value;
      const parts = customTime.split(':');
      if (parts.length === 3) {
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const seconds = parseInt(parts[2], 10);
        usageLimitSeconds = hours * 3600 + minutes * 60 + seconds;
        if (isNaN(usageLimitSeconds)) {
          alert('Invalid custom time. Please enter time as HH:MM:SS.');
          return;
        }
      } else {
        alert('Invalid custom time format. Please use HH:MM:SS.');
        return;
      }
    } else {
      usageLimitSeconds = parseInt(presetTimeDropdown.value, 10);
    }

    const limitAction = limitActionDropdown ? limitActionDropdown.value : 'reminder';

    let settings = await loadSettings();
    settings.limitActive = limitActive;
    settings.usageLimitSeconds = usageLimitSeconds;
    settings.limitAction = limitAction;

    await saveSettings(settings);
    alert('Settings saved!');
    updateDisplay();
  }

  async function handleDisableTracking() {
    const disableDaysDropdown = document.getElementById('disableDaysDropdown');
    const days = disableDaysDropdown ? parseInt(disableDaysDropdown.value, 10) : 0;
    const today = new Date(getTodayString());
    today.setDate(today.getDate() + days);
    const disabledUntilStr = today.toISOString().split('T')[0];

    let settings = await loadSettings();
    settings.disabledUntil = disabledUntilStr;
    await saveSettings(settings);
    alert('Tracking disabled until ' + disabledUntilStr);
  }

  /***********************
   * INITIALIZATION
   ***********************/
  document.addEventListener('DOMContentLoaded', async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    currentUserId = user?.id || null;

    if (document.getElementById('settingsForm')) {
      await initSettingsForm();

      const saveSettingsButton = document.getElementById('saveSettingsButton');
      if (saveSettingsButton) saveSettingsButton.addEventListener('click', handleSaveSettings);

      const disableButton = document.getElementById('disableButton');
      if (disableButton) disableButton.addEventListener('click', handleDisableTracking);
    }

    scheduleMidnightReset();
    startTracking();
    await updateDisplay();
  });
})();
