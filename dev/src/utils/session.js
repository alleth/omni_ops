// src/utils/session.js
const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes

let timeout;

export const startSessionTimer = (navigate) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        sessionStorage.removeItem('user');
        navigate('/masterfile/login');
        showTimeoutModal();
    }, SESSION_TIMEOUT);
};

export const resetSessionTimer = (navigate) => {
    startSessionTimer(navigate);
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
