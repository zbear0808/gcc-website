import React, { useState, useEffect } from 'react';
import { fullCatalog, shells, buttons, cables, rumbles, sliderPots, zButtons, rubberMembranes, mods, triggers, products } from '@shared/catalog';
import '@/assets/styles/admin.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Reconstruct all items flat list
const allItems = [
  ...shells,
  ...buttons,
  ...cables,
  ...rumbles,
  ...sliderPots,
  ...zButtons,
  ...rubberMembranes,
  ...mods,
  ...triggers,
  ...products,
  ...fullCatalog.flatMap(category => category.items)
].filter((item, index, self) => self.findIndex(i => i.id === item.id) === index); // Unique items

export default function AdminPage() {
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/inventory`)
      .then(res => res.json())
      .then(data => {
        setInventory(data);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setMessage('Failed to load inventory');
        setLoading(false);
      });
  }, []);

  const handleChange = (id: string, value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0) {
      setInventory(prev => ({ ...prev, [id]: num }));
    } else if (value === '') {
      // allow empty temporarily
      const newInv = { ...inventory };
      delete newInv[id];
      setInventory(newInv);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE}/api/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inventory),
      });
      if (response.ok) {
        setMessage('Inventory saved successfully!');
      } else {
        setMessage('Failed to save inventory.');
      }
    } catch (e) {
      console.error(e);
      setMessage('Error saving inventory.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="admin-page">
      <h1>Inventory Admin</h1>
      {message && <div className="admin-message">{message}</div>}
      
      <div className="admin-grid">
        {allItems.map(item => (
          <div key={item.id} className="admin-item">
            <label>{item.label}</label>
            <input 
              type="number" 
              min="0"
              value={inventory[item.id] !== undefined ? inventory[item.id] : 0}
              onChange={(e) => handleChange(item.id, e.target.value)}
            />
          </div>
        ))}
      </div>

      <button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Inventory'}
      </button>
    </div>
  );
}
