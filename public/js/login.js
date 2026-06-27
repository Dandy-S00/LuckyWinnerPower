document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('loginForm');
  const btn = document.getElementById('loginBtn');
  const errorBox = document.getElementById('loginError');

  // Only allow same-origin relative paths for post-login redirect.
  function safeNext() {
    const next = new URLSearchParams(window.location.search).get('next');
    if (next && next.startsWith('/') && !next.startsWith('//')) return next;
    return 'link2play.html';
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideError();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email) return showError('Please enter your email address.');
    if (!password) return showError('Please enter your password.');

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Logging in...';

    try {
      await window.txAuth.signIn({ email, password });
      window.location.href = safeNext();
    } catch (err) {
      let msg = err.message || 'Login failed. Please try again.';
      if (/email not confirmed/i.test(msg)) {
        msg = 'Please confirm your email address first. Check your inbox for the confirmation link.';
      } else if (/invalid login credentials/i.test(msg)) {
        msg = 'Incorrect email or password.';
      }
      showError(msg);
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-right-to-bracket me-2"></i>Log In';
    }
  });

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.style.display = 'block';
  }

  function hideError() {
    errorBox.style.display = 'none';
  }
});
