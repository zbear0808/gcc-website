import React, { useState } from 'react';
import './AdminPage.css';
import type { RedisOrder } from '@shared/types';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [orders, setOrders] = useState<RedisOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${password}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        setIsAuthenticated(true);
      } else {
        setError('Invalid password');
      }
    } catch (err) {
      setError('Failed to fetch orders');
    }
    setLoading(false);
  };

  const fulfillOrder = async (orderId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/fulfill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${password}`
        },
        body: JSON.stringify({ orderId })
      });
      
      if (res.ok) {
        const data = await res.json();
        // Update the order in the list
        setOrders(prev => prev.map(o => (o as any).id === orderId ? data.order : o));
      } else {
        const data = await res.json();
        alert(`Fulfillment failed: ${data.error}`);
      }
    } catch (err) {
      alert('Network error during fulfillment');
    }
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login-container">
        <h2>Admin Login</h2>
        <form onSubmit={login}>
          <input 
            type="password" 
            placeholder="Enter Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" disabled={loading}>Login</button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  const paidOrders = orders.filter(o => o.status === 'paid');
  const shippedOrders = orders.filter(o => o.status === 'shipped');

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Admin Dashboard</h2>
        <button className="refresh-btn" onClick={() => window.location.reload()} disabled={loading}>Refresh Orders</button>
      </div>

      <section>
        <h3>Paid Orders (Ready to Ship)</h3>
        {paidOrders.length === 0 ? <p>No paid orders pending.</p> : (
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
              {paidOrders.map(order => (
                <tr key={(order as any).id}>
                  <td>{(order as any).id}</td>
                  <td>{order.paidAt ? new Date(order.paidAt).toLocaleString() : 'N/A'}</td>
                  <td>{order.email || 'N/A'}</td>
                  <td>
                    <button onClick={() => fulfillOrder((order as any).id)} disabled={loading}>
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
        {shippedOrders.length === 0 ? <p>No shipped orders.</p> : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date Paid</th>
                <th>Tracking</th>
              </tr>
            </thead>
            <tbody>
              {shippedOrders.map(order => (
                <tr key={(order as any).id}>
                  <td>{(order as any).id}</td>
                  <td>{order.paidAt ? new Date(order.paidAt).toLocaleString() : 'N/A'}</td>
                  <td>
                    {order.trackingUrl ? (
                      <a href={order.trackingUrl} target="_blank" rel="noreferrer">
                        {order.trackingNumber || 'Track'}
                      </a>
                    ) : 'N/A'}
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
