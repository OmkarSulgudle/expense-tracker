import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'https://expense-tracker-backend.onrender.com';

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ title: '', amount: '', category: '', date: '' });

  const fetchExpenses = async () => {
    const res = await axios.get(`${API_URL}/expenses`);
    setExpenses(res.data);
  };

  const addExpense = async (e) => {
    e.preventDefault();
    await axios.post(`${API_URL}/expenses`, form);
    setForm({ title: '', amount: '', category: '', date: '' });
    fetchExpenses();
  };

  useEffect(() => { fetchExpenses(); }, []);

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h1>💰 Expense Tracker</h1>
      <form onSubmit={addExpense}>
        <input placeholder="Title" value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })} required />
        <input placeholder="Amount" type="number" value={form.amount}
          onChange={e => setForm({ ...form, amount: e.target.value })} required />
        <input placeholder="Category" value={form.category}
          onChange={e => setForm({ ...form, category: e.target.value })} required />
        <input type="date" value={form.date}
          onChange={e => setForm({ ...form, date: e.target.value })} required />
        <button type="submit">Add</button>
      </form>

      <ul>
        {expenses.map(e => (
          <li key={e.id}>
            <strong>{e.title}</strong> — ₹{e.amount} ({e.category}) on {e.date}
          </li>
        ))}
      </ul>
    </div>
  );
}
