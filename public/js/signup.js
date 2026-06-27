document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('signupForm');
  const btn = document.getElementById('signupBtn');
  const errorBox = document.getElementById('signupError');
  const successBox = document.getElementById('signupSuccess');

  const dobInput = document.getElementById('signupDob');
  // Nudge the date picker: latest selectable DOB is exactly 18 years ago.
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 18);
  dobInput.max = cutoff.toISOString().split('T')[0];

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideError();

    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const password2 = document.getElementById('signupPassword2').value;
    const dob = dobInput.value;
    const ageChecked = document.getElementById('ageCheck').checked;
    const termsChecked = document.getElementById('termsCheck').checked;

    if (!email) return showError('Please enter your email address.');
    if (password.length < 8) return showError('Password must be at least 8 characters.');
    if (password !== password2) return showError('Passwords do not match.');
    if (!dob) return showError('Please enter your date of birth.');
    if (!ageChecked) return showError('You must confirm you are at least 18 years old.');
    if (!termsChecked) return showError('You must agree to the platform rules and terms.');

    const age = window.txAuth.ageFromDob(dob);
    if (isNaN(age)) return showError('Please enter a valid date of birth.');
    if (age < window.txAuth.MIN_AGE) {
      return showError('You must be at least 18 years old to create an account.');
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Creating account...';

    try {
      await window.txAuth.signUp({ email, password, dob });
      form.style.display = 'none';
      successBox.style.display = 'block';
    } catch (err) {
      showError(err.message || 'Could not create account. Please try again.');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-star me-2"></i>Create My Account';
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
