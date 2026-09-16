import React, { useState, useEffect } from 'react';
import type { RedisOrder } from '@shared/types';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function AdminPage() {
  const [orders, setOrders] = useState<RedisOrder[]>([]);
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/admin/orders`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        
        const invRes = await fetch(`${API_BASE}/api/inventory`);
        if (invRes.ok) {
          setInventory(await invRes.json());
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(`Server error: ${errData.error || res.statusText}`);
      }
    } catch {
      const message = 'Unknown error';
      setError(`Failed to fetch orders: ${message}`);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const fulfillOrder = async (orderId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/fulfill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderId })
      });
      
      if (res.ok) {
        const data = await res.json();
        // Update the order in the list
        setOrders(prev => prev.map(o => o.id === orderId ? data.order : o));
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
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(inventory)
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
    setInventory(prev => ({ ...prev, [id]: isNaN(num) ? 0 : num }));
  };

  if (error) {
    return <div className="admin-container"><p className="error">{error}</p></div>;
  }

  const paidOrders = orders.filter(o => o.status === 'paid');
  const shippedOrders = orders.filter(o => o.status === 'shipped');

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Admin Dashboard</h2>
        <button className="btn btn-outline" onClick={() => window.location.reload()} disabled={loading}>Refresh Data</button>
      </div>

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
                      type="number" 
                      value={qty} 
                      onChange={(e) => handleInventoryChange(id, e.target.value)}
                      style={{ padding: '0.5rem', background: '#222', color: 'white', border: '1px solid #444', borderRadius: '4px' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="submit" disabled={loading} className="btn btn-success" style={{ marginBottom: '2rem' }}>
            Save Inventory
          </button>
        </form>
      </section>

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
                <tr key={order.id}>
                  <td>{order.id}</td>
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
