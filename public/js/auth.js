// Shared Supabase auth helper for Texas Winners.
// Loads runtime config from /api/config, lazily creates the Supabase client,
// and exposes a small API on window.txAuth for the page scripts.
(function () {
  const MIN_AGE = 18;
  let clientPromise = null;
  let configCache = null;

  async function getConfig() {
    if (configCache) return configCache;
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error('Could not load site configuration.');
    configCache = await res.json();
    return configCache;
  }

  async function getClient() {
    if (clientPromise) return clientPromise;
    clientPromise = (async () => {
      const cfg = await getConfig();
      if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
        throw new Error('Accounts are not configured yet. Please try again later.');
      }
      if (!window.supabase || typeof window.supabase.createClient !== 'function') {
        throw new Error('Auth library failed to load.');
      }
      return window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      });
    })();
    return clientPromise;
  }

  // Whole years between dob and today.
  function ageFromDob(dob) {
    const birth = new Date(dob + 'T00:00:00');
    if (isNaN(birth.getTime())) return NaN;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  }

  async function getSession() {
    const client = await getClient();
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async function getUser() {
    const session = await getSession();
    return session ? session.user : null;
  }

  async function signUp({ email, password, dob }) {
    const age = ageFromDob(dob);
    if (isNaN(age)) throw new Error('Please enter a valid date of birth.');
    if (age < MIN_AGE) throw new Error('You must be at least 18 years old to create an account.');

    const client = await getClient();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + '/login.html',
        data: { date_of_birth: dob, age_attested: true },
      },
    });
    if (error) throw error;
    return data;
  }

  async function signIn({ email, password }) {
    const client = await getClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    const client = await getClient();
    await client.auth.signOut();
  }

  // Redirect to login if there is no active session. Returns the session or null.
  async function requireAuth(redirect) {
    const loginUrl = redirect || 'login.html';
    try {
      const session = await getSession();
      if (!session) {
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.replace(loginUrl + '?next=' + next);
        return null;
      }
      return session;
    } catch (err) {
      window.location.replace(loginUrl);
      return null;
    }
  }

  // Populate a navbar slot (#authNav) with login/account links based on state.
  async function renderNav() {
    const slot = document.getElementById('authNav');
    if (!slot) return;
    let user = null;
    try {
      user = await getUser();
    } catch (err) {
      user = null;
    }
    if (user) {
      slot.innerHTML =
        '<a class="nav-link" href="account.html"><i class="fas fa-user-circle me-1"></i>My Account</a>';
      const logout = document.getElementById('logoutLink');
      if (logout) {
        logout.style.display = '';
        logout.addEventListener('click', async function (e) {
          e.preventDefault();
          await signOut();
          window.location.href = 'index.html';
        });
      }
    } else {
      slot.innerHTML =
        '<a class="nav-link" href="login.html"><i class="fas fa-right-to-bracket me-1"></i>Login</a>';
      const logout = document.getElementById('logoutLink');
      if (logout) logout.style.display = 'none';
    }
  }

  window.txAuth = {
    MIN_AGE,
    ageFromDob,
    getClient,
    getConfig,
    getSession,
    getUser,
    signUp,
    signIn,
    signOut,
    requireAuth,
    renderNav,
  };

  document.addEventListener('DOMContentLoaded', renderNav);
})();
