(function () {
  function showNotification(message, options = {}) {
    const allowClose = options.allowClose !== false; // default true

    const notifKey = options.persistClose
      ? `notif_closed_${btoa(message)}`
      : null;

    if (notifKey && localStorage.getItem(notifKey) === '1') return;

    const container =
      document.getElementById('notifications-container') ||
      (() => {
        const c = document.createElement('div');
        c.id = 'notifications-container';
        document.body.appendChild(c);
        return c;
      })();

    // Remove existing status notification if this is a status notif, avoid duplicates
    if (options.isStatus) {
      const existing = container.querySelector('.notification.status-notification');
      if (existing) existing.remove();
    }

    const notif = document.createElement('div');
    notif.className = 'notification';
    if (options.isStatus) notif.classList.add('status-notification');
    notif.dataset.message = message;

    // Build inner HTML without close button first
    let innerHTML =
      `<div class="notification-title">${message}</div>` +
      (options.body
        ? `<div class="notification-body" style="text-align:center; margin-top:8px;">${options.body}</div>`
        : '');

    // Add close button only if allowClose is true
    if (allowClose) {
      innerHTML += `<a href="#" class="notification-close" aria-label="Close notification" tabindex="0" role="button">&times;</a>`;
    }

    // Add timer bar if duration is set and sticky not true
    if (options.duration && options.duration > 0 && !options.sticky) {
      innerHTML += `<div class="notification-timer"></div>`;
    }

    notif.innerHTML = innerHTML;

    // Apply background color and blur for status notifications or custom bgColor
    if (options.bgColor) {
      notif.style.background = options.bgColor;
      notif.style.backdropFilter = 'blur(12px)';
      notif.style.color = '#fff';
      notif.style.boxShadow = `0 4px 24px ${hexToRgba(options.bgColor, 0.3)}`;
    }

    // For status notifications, insert at the top, else append normally
    if (options.isStatus) {
      container.prepend(notif);
    } else {
      container.appendChild(notif);
    }

    requestAnimationFrame(() => notif.classList.add('notif-in'));

    // Play sound only for normal notifications (not status)
    if (options.sound !== false && !options.isStatus) {
      const audio = new Audio(
        options.soundUrl || '/uploads/branding/notifsound.mp3'
      );
      audio.volume = 0.25;
      audio.play().catch(() => {});
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

  const statusColors = {
    none: 'rgba(40, 167, 69, 0.1)',       // green
    minor: 'rgba(255, 193, 7, 0.1)',      // yellow
    major: 'rgba(253, 126, 20, 0.1)',     // orange
    critical: 'rgba(220, 53, 69, 0.1)',   // red
  };

  async function fetchAndShowStatus() {
    try {
      const res = await fetch(
        'https://77qdzlh2x429.statuspage.io/api/v2/summary.json'
      );
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
        return;
      }

      let incidentNames = '';
      if (summary.incidents && summary.incidents.length > 0) {
        incidentNames = summary.incidents
          .slice(0, 2)
          .map(inc => inc.name)
          .join(', ');
        if (summary.incidents.length > 2) incidentNames += ', ...';
      }

      const statusPageUrl = 'https://77qdzlh2x429.statuspage.io/';

      const message = description;
      const body = incidentNames
        ? `<div>${incidentNames}</div><a href="${statusPageUrl}" target="_blank" rel="noopener noreferrer" style="color:#fff; text-decoration:underline; margin-top:8px; display:block; text-align:center;">View status page</a>`
        : `<a href="${statusPageUrl}" target="_blank" rel="noopener noreferrer" style="color:#fff; text-decoration:underline; margin-top:8px; display:block; text-align:center;">View status page</a>`;

      showNotification(message, {
        isStatus: true,
        duration: 15000,
        sticky: false,
        sound: false,
        vibrate: false,
        bgColor: statusColors[indicator] || 'rgba(108, 117, 125, 0.1)',
        body: body,
      });
    } catch (e) {
      console.error('Statuspage fetch error:', e);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Your base notifications still fire normally
    showNotification('Privacy Policy and TOS Changes', {
      body: "To accommodate recent changes to our website, we've updated our Privacy Policy and TOS. Please <a href='/legal' style='text-decoration:underline;'>review them</a> to understand how we handle your data.",
      persistClose: true,
      sound: true,
    });

    showNotification('Leave us a review!', {
      body: "If you enjoy using our site, please consider leaving a review. It helps us improve and reach more users! <br><br> Leave a review <a href='/reviews' style='text-decoration:underline;'>here.</a>",
      duration: 10000,
      persistClose: true,
      sound: true,
    });

    // Status page integration
    fetchAndShowStatus();
    setInterval(fetchAndShowStatus, 5 * 60 * 1000);
  });

  window.showNotification = showNotification;
})();
