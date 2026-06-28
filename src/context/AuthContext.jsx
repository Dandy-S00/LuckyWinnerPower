import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const AuthContext = createContext(null);

const MIN_AGE = 18;

function ageFromDob(dob) {
  const birth = new Date(dob + 'T00:00:00');
  if (isNaN(birth.getTime())) return NaN;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);
  const clientRef = useRef(null);

  const getConfig = useCallback(async () => {
    if (config) return config;
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error('Could not load site configuration.');
    const cfg = await res.json();
    setConfig(cfg);
    return cfg;
  }, [config]);

  const getClient = useCallback(async () => {
    if (clientRef.current) return clientRef.current;
    const cfg = await getConfig();
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
      throw new Error('Accounts are not configured yet.');
    }
    const client = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    clientRef.current = client;
    return client;
  }, [getConfig]);

  useEffect(() => {
    let mounted = true;
    let subscription = null;
    (async () => {
      try {
        const client = await getClient();
        const { data } = await client.auth.getSession();
        if (mounted) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
        }
        const { data: { subscription: sub } } = client.auth.onAuthStateChange((_event, newSession) => {
          if (mounted) {
            setSession(newSession);
            setUser(newSession?.user ?? null);
          }
        });
        subscription = sub;
      } catch {
        if (mounted) {
          setUser(null);
          setSession(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; subscription?.unsubscribe(); };
  }, [getClient]);

  const signUp = useCallback(async ({ email, password, dob }) => {
    const age = ageFromDob(dob);
    if (isNaN(age)) throw new Error('Please enter a valid date of birth.');
    if (age < MIN_AGE) throw new Error('You must be at least 18 years old to create an account.');

    const client = await getClient();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + '/login',
        data: { date_of_birth: dob, age_attested: true },
      },
    });
    if (error) throw error;
    return data;
  }, [getClient]);

  const signIn = useCallback(async ({ email, password }) => {
    const client = await getClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, [getClient]);

  const signOut = useCallback(async () => {
    const client = await getClient();
    await client.auth.signOut();
    setUser(null);
    setSession(null);
  }, [getClient]);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      config,
      signUp,
      signIn,
      signOut,
      getConfig,
      MIN_AGE,
      ageFromDob,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
