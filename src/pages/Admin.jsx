import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function money(n) {
  return '$' + Number(n || 0).toFixed(2);
}

export default function Admin() {
  const { user, session, loading } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState('users');

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + session?.access_token,
  }), [session]);

  // Resolve role once authenticated; redirect non-privileged users home.
  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/login?next=%2Fadmin', { replace: true });
      return;
    }
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/portal/me', { headers: authHeaders() });
        const data = await res.json();
        if (!active) return;
        if (data.role === 'admin' || data.role === 'distributor') {
          setRole(data.role);
        } else {
          navigate('/', { replace: true });
        }
      } catch {
        if (active) navigate('/', { replace: true });
      } finally {
        if (active) setChecking(false);
      }
    })();
    return () => { active = false; };
  }, [user, loading, navigate, authHeaders]);

  if (loading || checking) {
    return (
      <div className="auth-gate">
        <div className="text-center" style={{ color: 'var(--tx-gold)' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2.5rem' }}></i>
          <p className="mt-3">Loading portal...</p>
        </div>
      </div>
    );
  }

  if (!role) return null;

  return (
    <>
      <Navbar showDeposit={false} />
      <section className="deposit-section" style={{ minHeight: '80vh' }}>
        <div className="container">
          <h2 className="section-title">
            <i className="fas fa-gauge-high me-2" style={{ fontSize: '0.7em' }}></i>
            {role === 'admin' ? 'Admin Portal' : 'Distributor Portal'}
          </h2>
          <p className="section-subtitle">
            {role === 'admin'
              ? 'Manage users, distributors, and balances'
              : 'Manage your players and their balances'}
          </p>

          {role === 'admin' && (
            <div className="admin-tabs">
              <button
                className={tab === 'users' ? 'admin-tab active' : 'admin-tab'}
                onClick={() => setTab('users')}
              >
                <i className="fas fa-users me-1"></i> Users
              </button>
              <button
                className={tab === 'distributors' ? 'admin-tab active' : 'admin-tab'}
                onClick={() => setTab('distributors')}
              >
                <i className="fas fa-store me-1"></i> Distributors
              </button>
            </div>
          )}

          {tab === 'users' && (
            <UsersTab role={role} authHeaders={authHeaders} />
          )}
          {tab === 'distributors' && role === 'admin' && (
            <DistributorsTab authHeaders={authHeaders} />
          )}
        </div>
      </section>
      <Footer minimal />
    </>
  );
}

function UsersTab({ role, authHeaders }) {
  const [users, setUsers] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterDist, setFilterDist] = useState('');
  const [busyId, setBusyId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', dob: '', distributorId: '' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/portal/users', { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load users.');
      setUsers(data.users || []);
      if (role === 'admin') {
        const dRes = await fetch('/api/portal/distributors', { headers: authHeaders() });
        const dData = await dRes.json();
        if (dRes.ok) setDistributors(dData.distributors || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, role]);

  useEffect(() => { load(); }, [load]);

  async function adjustBalance(u, action) {
    let amount;
    if (action === 'set') {
      const input = window.prompt(`Set balance for ${u.email} to:`, u.balance.toFixed(2));
      if (input === null) return;
      amount = Number(input);
      if (!Number.isFinite(amount) || amount < 0) return alert('Enter a valid non-negative amount.');
    } else if (action === 'zero') {
      if (!window.confirm(`Zero out ${u.email}'s balance (currently ${money(u.balance)})?`)) return;
    }
    setBusyId(u.id);
    try {
      const res = await fetch('/api/portal/balance', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ userId: u.id, action, amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update balance.');
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, balance: data.balance } : x)));
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId('');
    }
  }

  async function reassign(u, distributorId) {
    setBusyId(u.id);
    try {
      const res = await fetch('/api/portal/reassign', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ userId: u.id, distributorId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reassign.');
      const name = distributors.find((d) => d.id === distributorId)?.name || null;
      setUsers((prev) => prev.map((x) => (
        x.id === u.id ? { ...x, distributorId: data.distributorId, distributorName: name } : x
      )));
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId('');
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    setCreating(true);
    try {
      const payload = {
        email: newUser.email.trim(),
        password: newUser.password,
        dob: newUser.dob,
      };
      if (role === 'admin' && newUser.distributorId) payload.distributorId = newUser.distributorId;
      const res = await fetch('/api/portal/users', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user.');
      setUsers((prev) => [data.user, ...prev]);
      setCreateSuccess(`User "${data.user.email}" created.`);
      setNewUser({ email: '', password: '', dob: '', distributorId: '' });
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  }

  const filtered = users.filter((u) => {
    const matchesSearch = !search || (u.email || '').toLowerCase().includes(search.toLowerCase());
    const matchesDist = !filterDist || u.distributorId === filterDist;
    return matchesSearch && matchesDist;
  });

  return (
    <div className="admin-panel">
      <div className="admin-toolbar">
        <input
          className="form-control"
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {role === 'admin' && (
          <select className="form-select" value={filterDist} onChange={(e) => setFilterDist(e.target.value)}>
            <option value="">All distributors</option>
            {distributors.map((d) => (
              <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
            ))}
          </select>
        )}
        <button className="btn-texas-outline" onClick={load} disabled={loading}>
          <i className="fas fa-rotate me-1"></i> Refresh
        </button>
        <button className="btn-texas-outline" onClick={() => setShowCreate((v) => !v)}>
          <i className="fas fa-user-plus me-1"></i> {showCreate ? 'Close' : 'Create User'}
        </button>
      </div>

      {showCreate && (
        <div className="deposit-form-card" style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ color: 'var(--tx-gold)', fontFamily: "'Playfair Display', serif" }}>
            <i className="fas fa-user-plus me-2"></i>Create Player Account
          </h4>
          <form onSubmit={handleCreateUser}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Password</label>
                <input type="text" className="form-control" value={newUser.password} placeholder="At least 8 characters"
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Date of Birth (must be 18+)</label>
                <input type="date" className="form-control" value={newUser.dob}
                  onChange={(e) => setNewUser({ ...newUser, dob: e.target.value })} required />
              </div>
              {role === 'admin' && (
                <div className="col-md-6">
                  <label className="form-label">Distributor <span style={{ opacity: 0.5 }}>(optional)</span></label>
                  <select className="form-select" value={newUser.distributorId}
                    onChange={(e) => setNewUser({ ...newUser, distributorId: e.target.value })}>
                    <option value="">Unassigned</option>
                    {distributors.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="col-12">
                <button type="submit" className="btn-texas" disabled={creating}>
                  {creating ? (<><i className="fas fa-spinner fa-spin me-2"></i>Creating...</>) : (<><i className="fas fa-user-plus me-2"></i>Create User</>)}
                </button>
              </div>
            </div>
          </form>
          {role === 'distributor' && (
            <small style={{ color: 'rgba(255,255,255,0.5)' }}>New players are automatically assigned to you.</small>
          )}
          {createError && <div className="error-box">{createError}</div>}
          {createSuccess && <div className="success-box">{createSuccess}</div>}
        </div>
      )}

      {error && <div className="error-box">{error}</div>}
      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.6)' }}><i className="fas fa-spinner fa-spin me-2"></i>Loading...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>No users found.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Distributor</th>
                <th>Balance</th>
                <th>Total Deposits</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>{u.email || <span style={{ opacity: 0.5 }}>—</span>}</td>
                  <td>
                    {role === 'admin' ? (
                      <select
                        className="form-select form-select-sm"
                        value={u.distributorId || ''}
                        disabled={busyId === u.id}
                        onChange={(e) => reassign(u, e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {distributors.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    ) : (
                      u.distributorName || '—'
                    )}
                  </td>
                  <td className="admin-balance">{money(u.balance)}</td>
                  <td>{money(u.totalDeposits)}</td>
                  <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                  <td className="admin-actions">
                    <button
                      className="btn-mini"
                      disabled={busyId === u.id}
                      onClick={() => adjustBalance(u, 'set')}
                    >
                      Set
                    </button>
                    <button
                      className="btn-mini danger"
                      disabled={busyId === u.id}
                      onClick={() => adjustBalance(u, 'zero')}
                    >
                      Zero out
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DistributorsTab({ authHeaders }) {
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', code: '', email: '', password: '' });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/portal/distributors', { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load distributors.');
      setDistributors(data.distributors || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setCreating(true);
    try {
      const res = await fetch('/api/portal/distributors', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create distributor.');
      setDistributors((prev) => [data.distributor, ...prev]);
      setFormSuccess(`Distributor "${data.distributor.name}" created. They can log in with the email/password you set.`);
      setForm({ name: '', code: '', email: '', password: '' });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(d) {
    setBusyId(d.id);
    try {
      const res = await fetch('/api/portal/distributors', {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ id: d.id, active: !d.active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update.');
      setDistributors((prev) => prev.map((x) => (x.id === d.id ? { ...x, active: data.distributor.active } : x)));
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId('');
    }
  }

  return (
    <div className="admin-panel">
      <div className="deposit-form-card" style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ color: 'var(--tx-gold)', fontFamily: "'Playfair Display', serif" }}>
          <i className="fas fa-plus me-2"></i>Add Distributor
        </h4>
        <form onSubmit={handleCreate}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Name</label>
              <input className="form-control" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Referral Code</label>
              <input className="form-control" value={form.code} placeholder="e.g. SAMMY"
                onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Login Email</label>
              <input type="email" className="form-control" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Login Password</label>
              <input type="text" className="form-control" value={form.password} placeholder="At least 8 characters"
                onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div className="col-12">
              <button type="submit" className="btn-texas" disabled={creating}>
                {creating ? (<><i className="fas fa-spinner fa-spin me-2"></i>Creating...</>) : (<><i className="fas fa-store me-2"></i>Create Distributor</>)}
              </button>
            </div>
          </div>
        </form>
        {formError && <div className="error-box">{formError}</div>}
        {formSuccess && <div className="success-box">{formSuccess}</div>}
      </div>

      {error && <div className="error-box">{error}</div>}
      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.6)' }}><i className="fas fa-spinner fa-spin me-2"></i>Loading...</p>
      ) : distributors.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>No distributors yet.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Players</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {distributors.map((d) => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td><code style={{ color: 'var(--tx-gold)' }}>{d.code}</code></td>
                  <td>{d.playerCount}</td>
                  <td>
                    <span className={d.active ? 'status-badge active' : 'status-badge inactive'}>
                      {d.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="admin-actions">
                    <button className="btn-mini" disabled={busyId === d.id} onClick={() => toggleActive(d)}>
                      {d.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
