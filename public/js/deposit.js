document.addEventListener('DOMContentLoaded', async function () {
  const form = document.getElementById('depositForm');
  const amountInput = document.getElementById('amount');
  const quickBtns = document.querySelectorAll('.quick-amount-btn');
  const submitBtn = document.getElementById('submitBtn');
  const errorMsg = document.getElementById('errorMsg');
  const emailInput = document.getElementById('email');

  // Require login before depositing; prefill the account email.
  const session = await window.txAuth.requireAuth();
  if (!session) return;
  if (emailInput && session.user.email) {
    emailInput.value = session.user.email;
    emailInput.readOnly = true;
  }
  const gate = document.getElementById('authGate');
  if (gate) gate.style.display = 'none';

  // Quick amount buttons
  quickBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      quickBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      amountInput.value = this.dataset.amount;
    });
  });

  // Update active state when typing custom amount
  amountInput.addEventListener('input', function () {
    quickBtns.forEach(b => b.classList.remove('active'));
    const val = parseInt(this.value);
    quickBtns.forEach(b => {
      if (parseInt(b.dataset.amount) === val) {
        b.classList.add('active');
      }
    });
  });

  // Check for canceled payment
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('canceled') === 'true') {
    showError('Payment was canceled. You can try again when ready.');
  }

  // Form submission
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideError();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const amount = parseFloat(amountInput.value);

    if (!username) {
      showError('Please enter your game username.');
      return;
    }

    if (!email) {
      showError('Please enter your email address.');
      return;
    }

    if (!amount || amount < 1) {
      showError('Minimum deposit is $1.00.');
      return;
    }

    if (amount > 1000) {
      showError('Maximum deposit is $1,000.00.');
      return;
    }

    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';

    try {
      const current = await window.txAuth.getSession();
      if (!current) {
        window.location.replace('login.html');
        return;
      }
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + current.access_token,
        },
        body: JSON.stringify({ amount, username }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      showError(err.message || 'Failed to create payment session. Please try again.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-lock me-2"></i>Proceed to Secure Payment';
    }
  });

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.style.display = 'block';
  }

  function hideError() {
    errorMsg.style.display = 'none';
  }
});
