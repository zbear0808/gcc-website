import React, { useState, useEffect, useCallback } from 'react';
import type { RedisOrder } from '@shared/types';

const API_BASE = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'zu-admin-token';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) ?? '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [orders, setOrders] = useState<RedisOrder[]>([]);
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const authHeaders = (t: string) => ({ Authorization: `Bearer ${t}` });

  const loadData = useCallback(async (t: string) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/admin/orders`, { headers: authHeaders(t) });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);

        const invRes = await fetch(`${API_BASE}/api/inventory`);
        if (invRes.ok) {
          setInventory(await invRes.json());
        }

        sessionStorage.setItem(TOKEN_KEY, t);
        setToken(t);
        setIsAuthenticated(true);
      } else if (res.status === 401) {
        sessionStorage.removeItem(TOKEN_KEY);
        setIsAuthenticated(false);
        setError('Invalid password');
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(`Server error: ${errData.error || res.statusText}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to fetch orders: ${message}`);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem(TOKEN_KEY);
    if (saved) loadData(saved);
  }, [loadData]);

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(password);
  };

  const logout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken('');
    setPassword('');
    setIsAuthenticated(false);
  };

  const fulfillOrder = async (orderId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/fulfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
        body: JSON.stringify({ orderId }),
      });

      if (res.ok) {
        const data = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
      } else {
        const data = await res.json();
        alert(`Fulfillment failed: ${data.error}`);
      }
    } catch {
      alert('Network error during fulfillment');
    }
    setLoading(false);
  };

  const saveInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
        body: JSON.stringify(inventory),
      });
      if (res.ok) {
        alert('Inventory saved successfully!');
      } else {
        const data = await res.json();
        alert(`Failed to save inventory: ${data.error}`);
      }
    } catch {
      alert('Error saving inventory');
    }
    setLoading(false);
  };

  const handleInventoryChange = (id: string, value: string) => {
    const num = parseInt(value, 10);
    setInventory((prev) => ({ ...prev, [id]: isNaN(num) ? 0 : num }));
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login-container">
        <h2>Admin Login</h2>
        <form onSubmit={login}>
          <input
            type="password"
            placeholder="Admin password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !password}>
            {loading ? 'Checking…' : 'Log in'}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  const paidOrders = orders.filter((o) => o.status === 'paid');
  const shippedOrders = orders.filter((o) => o.status === 'shipped');

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Admin Dashboard</h2>
        <div className="admin-header-actions">
          <button className="btn btn-outline" onClick={() => loadData(token)} disabled={loading}>
            Refresh
          </button>
          <button className="btn btn-outline" onClick={logout}>
            Log out
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <section>
        <h3>Inventory Management</h3>
        <form onSubmit={saveInventory}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Item ID</th>
                <th>Quantity in Stock</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(inventory).map(([id, qty]) => (
                <tr key={id}>
                  <td>{id}</td>
                  <td>
                    <input
                      className="admin-input"
                      type="number"
                      value={qty}
                      onChange={(e) => handleInventoryChange(id, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="submit" disabled={loading} className="btn btn-success admin-save-btn">
            Save Inventory
          </button>
        </form>
      </section>

      <section>
        <h3>Paid Orders (Ready to Ship)</h3>
        {paidOrders.length === 0 ? (
          <p>No paid orders pending.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date Paid</th>
                <th>Email</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paidOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.paidAt ? new Date(order.paidAt).toLocaleString() : 'N/A'}</td>
                  <td>{order.email || 'N/A'}</td>
                  <td>
                    <button className="btn btn-primary" onClick={() => fulfillOrder(order.id)} disabled={loading}>
                      Buy Label & Fulfill
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h3>Shipped Orders</h3>
        {shippedOrders.length === 0 ? (
          <p>No shipped orders.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date Paid</th>
                <th>Tracking</th>
              </tr>
            </thead>
            <tbody>
              {shippedOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.paidAt ? new Date(order.paidAt).toLocaleString() : 'N/A'}</td>
                  <td>
                    {order.trackingUrl ? (
                      <a href={order.trackingUrl} target="_blank" rel="noreferrer">
                        {order.trackingNumber || 'Track'}
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
