// src/utils/session.js
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity

let timeout;

export const startSessionTimer = (navigate) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        sessionStorage.removeItem('user');
        stopActivityTracking();
        navigate('/masterfile/login');
        showTimeoutModal();
    }, SESSION_TIMEOUT);
};

export const resetSessionTimer = (navigate) => {
    startSessionTimer(navigate);
};

// ── Real inactivity tracking ────────────────────────────────────────────────
// startSessionTimer() alone only ever fired once, on mount, then counted down
// unconditionally from page-load — nothing in the app called resetSessionTimer,
// so a user got logged out on a fixed schedule regardless of how active they
// were. This listens for genuine local interaction and resets the clock on
// each one, throttled so a moving mouse doesn't churn clearTimeout/setTimeout
// on every pixel. Deliberately separate from MasterfileLayout's presence
// heartbeat — that only proves the tab is open, not that anyone's at the
// keyboard, which is what an inactivity logout needs to key off of.
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'wheel', 'touchstart'];
const ACTIVITY_THROTTLE_MS = 5000;

let activityDetach = null;

export const startActivityTracking = (navigate) => {
    if (activityDetach) return activityDetach;

    let lastReset = Date.now();
    const handleActivity = () => {
        const now = Date.now();
        if (now - lastReset < ACTIVITY_THROTTLE_MS) return;
        lastReset = now;
        startSessionTimer(navigate);
    };

    ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, handleActivity, { passive: true }));

    activityDetach = () => {
        ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, handleActivity));
        activityDetach = null;
    };
    return activityDetach;
};

const stopActivityTracking = () => {
    if (activityDetach) activityDetach();
};

const showTimeoutModal = () => {
    const modal = document.createElement('div');
    modal.id = 'session-modal';
    modal.className = 'fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
    <div class="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full text-center">
      <h3 class="text-xl font-bold text-gray-800 mb-3">Session Expired</h3>
      <p class="text-gray-600 mb-6">For security, please log in again.</p>
      <button onclick="window.location.href='/public/masterfile/login'" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors">
        Go to Login
      </button>
    </div>
  `;
    document.body.appendChild(modal);
};
