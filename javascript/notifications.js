import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
(function () {


  // --- NOTIFICATION UI ---
  function showNotification(message, options = {}) {
    console.log('🟢 showNotification called with message:', message, options);

    const allowClose = options.allowClose !== false; // default true
    const notifKey = options.persistClose ? `notif_closed_${btoa(message)}` : null;

    if (notifKey && localStorage.getItem(notifKey) === '1') {
      console.log('ℹ️ Notification already closed (persisted):', message);
      return;
    }

    const container =
      document.getElementById('notifications-container') ||
      (() => {
        const c = document.createElement('div');
        c.id = 'notifications-container';
        document.body.appendChild(c);
        console.log('📦 Created notifications container');
        return c;
      })();

    if (options.isStatus) {
      const existing = container.querySelector('.notification.status-notification');
      if (existing) {
        existing.remove();
        console.log('🟡 Removed existing status notification');
      }
    }

    const notif = document.createElement('div');
    notif.className = 'notification';
    if (options.isStatus) notif.classList.add('status-notification');
    notif.dataset.message = message;

    let innerHTML =
      `<div class="notification-title">${message}</div>` +
      (options.body
        ? `<div class="notification-body" style="text-align:center; margin-top:8px;">${options.body}</div>`
        : '');

    if (allowClose) {
      innerHTML += `<a href="#" class="notification-close" aria-label="Close notification" tabindex="0" role="button">&times;</a>`;
    }

    if (options.duration && options.duration > 0 && !options.sticky) {
      innerHTML += `<div class="notification-timer"></div>`;
    }

    notif.innerHTML = innerHTML;

    if (options.bgColor) {
      notif.style.background = options.bgColor;
      notif.style.backdropFilter = 'blur(12px)';
      notif.style.color = '#fff';
      notif.style.boxShadow = `0 4px 24px ${hexToRgba(options.bgColor, 0.3)}`;
    }

    if (options.isStatus) {
      container.prepend(notif);
    } else {
      container.appendChild(notif);
    }

    requestAnimationFrame(() => notif.classList.add('notif-in'));

    if (options.sound !== false && !options.isStatus) {
      const audio = new Audio(options.soundUrl || '/uploads/branding/notifsound.mp3');
      audio.volume = 0.25;
      audio.play().catch(() => console.warn('⚠️ Notification sound failed to play'));
    }

    if (options.vibrate && navigator.vibrate) {
      navigator.vibrate(100);
    }

    if (allowClose) {
      const closeBtn = notif.querySelector('.notification-close');
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeNotification(notif);
      });
      closeBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          closeNotification(notif);
        }
      });
    }

    let timerInterval,
      timerBar,
      remaining = options.duration || 4000,
      start,
      paused = false;

    if (options.duration && options.duration > 0 && !options.sticky) {
      timerBar = notif.querySelector('.notification-timer');
      Object.assign(timerBar.style, {
        width: '100%',
        height: '3px',
        background: 'rgba(255,255,255,0.5)',
        borderRadius: '2px',
        marginTop: '8px',
        transition: `width ${remaining}ms linear`,
      });

      setTimeout(() => {
        timerBar.style.width = '0%';
      }, 10);

      start = Date.now();
      timerInterval = setTimeout(() => closeNotification(notif), remaining);

      notif.addEventListener('mouseenter', () => {
        if (paused) return;
        paused = true;
        clearTimeout(timerInterval);
        const elapsed = Date.now() - start;
        remaining -= elapsed;
        timerBar.style.transition = '';
        timerBar.style.width = `${(remaining / (options.duration || 4000)) * 100}%`;
      });

      notif.addEventListener('mouseleave', () => {
        if (!paused) return;
        paused = false;
        start = Date.now();
        timerBar.style.transition = `width ${remaining}ms linear`;
        setTimeout(() => {
          timerBar.style.width = '0%';
        }, 10);
        timerInterval = setTimeout(() => closeNotification(notif), remaining);
      });
    }

    if (!options.duration || options.sticky) {
      notif.classList.add('sticky');
    }

    function closeNotification(n) {
      console.log('🔴 Closing notification:', n.dataset.message);
      n.classList.remove('notif-in');
      n.classList.add('notif-out');
      clearTimeout(timerInterval);
      if (notifKey) {
        localStorage.setItem(notifKey, '1');
      }
      n.addEventListener('animationend', () => n.remove(), { once: true });
    }
  }

  function hexToRgba(hex, alpha = 1) {
    let r = 0, g = 0, b = 0;
    if (hex[0] === '#') hex = hex.slice(1);
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    }
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // --- STATUSPAGE API ---
  const statusColors = {
    none: 'rgba(40, 167, 69, 0.1)',
    minor: 'rgba(255, 193, 7, 0.1)',
    major: 'rgba(253, 126, 20, 0.1)',
    critical: 'rgba(220, 53, 69, 0.1)',
  };

  async function fetchAndShowStatus() {
    console.log('🛰️ Fetching status page...');
    try {
      const res = await fetch('https://77qdzlh2x429.statuspage.io/api/v2/summary.json');
      if (!res.ok) throw new Error('Failed to fetch status summary');
      const summary = await res.json();

      const indicator = summary.status.indicator || 'none';
      const description = summary.status.description || 'All Systems Operational';

      const container = document.getElementById('notifications-container');
      if (indicator === 'none') {
        if (container) {
          const existing = container.querySelector('.notification.status-notification');
          if (existing) existing.remove();
        }
        console.log('✅ Status: All systems operational');
        return;
      }

      let incidentNames = '';
      if (summary.incidents && summary.incidents.length > 0) {
        incidentNames = summary.incidents.slice(0, 2).map(inc => inc.name).join(', ');
        if (summary.incidents.length > 2) incidentNames += ', ...';
      }

      const statusPageUrl = 'https://77qdzlh2x429.statuspage.io/';
      const body = incidentNames
        ? `<div>${incidentNames}</div><a href="${statusPageUrl}" target="_blank" rel="noopener noreferrer" style="color:#fff; text-decoration:underline; margin-top:8px; display:block; text-align:center;">View status page</a>`
        : `<a href="${statusPageUrl}" target="_blank" rel="noopener noreferrer" style="color:#fff; text-decoration:underline; margin-top:8px; display:block; text-align:center;">View status page</a>`;

      showNotification(description, {
        isStatus: true,
        duration: 15000,
        sticky: false,
        sound: false,
        vibrate: false,
        bgColor: statusColors[indicator] || 'rgba(108, 117, 125, 0.1)',
        body: body,
      });
    } catch (e) {
      console.error('❌ Statuspage fetch error:', e);
    }
  }

  // --- SUPABASE REALTIME NOTIFICATIONS ---
  async function fetchSupabaseNotifications() {
    const supabase = createClient(
      'https://jbekjmsruiadbhaydlbt.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZWtqbXNydWlhZGJoYXlkbGJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzOTQ2NTgsImV4cCI6MjA2Mzk3MDY1OH0.5Oku6Ug-UH2voQhLFGNt9a_4wJQlAHRaFwTeQRyjTSY'
    );
    if (!window.supabase) {
      console.warn('❌ Supabase client not initialized');
      return;
    }

    try {
      const { data: userData, error: authErr } = await supabase.auth.getUser();
      const currentUser = userData?.user;

      if (authErr) {
        console.error('Auth error:', authErr);
      } else {
        console.log('User:', currentUser);
      }


      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('❌ Error fetching notifications:', error);
        return;
      }

      if (!notifications || notifications.length === 0) return;

      notifications.forEach((notif) => {
        showNotification(notif.title, {
          body: notif.body,
          allowClose: notif.allow_close ?? true,
          persistClose: notif.persist_close ?? false,
          sticky: notif.sticky ?? false,
          duration: notif.duration ?? 4000,
          bgColor: notif.bg_color ?? '',
          sound: notif.sound ?? true,
          soundUrl: notif.sound_url,
          vibrate: notif.vibrate ?? true,
          onClose: async () => {
            try {
              await supabase.from('notifications').delete().eq('id', notif.id);
              console.log('✅ Notification deleted:', notif.id);
            } catch (err) {
              console.error('❌ Failed to delete notification:', err);
            }
          },
        });
      });
    } catch (err) {
      console.error('❌ Failed to fetch notifications:', err);
    }
  }

  // Poll every 10 seconds
  fetchSupabaseNotifications();




  // --- INIT ---
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📅 DOM loaded, initializing notifications...');

    // Example static notifications
    showNotification('Privacy Policy and TOS Changes', {
      body: "We've updated our Privacy Policy and TOS. Please <a href='/legal' style='text-decoration:underline;'>review them</a>.",
      persistClose: true,
      sound: true,
    });

    showNotification('Leave us a review!', {
      body: "Enjoy using our site? Leave a review <a href='/reviews' style='text-decoration:underline;'>here</a>.",
      duration: 10000,
      persistClose: true,
      sound: true,
    });

    // Status page
    fetchAndShowStatus();
    setInterval(fetchAndShowStatus, 5 * 60 * 1000);
  });

  window.showNotification = showNotification;
})();
