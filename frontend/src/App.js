import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'https://expense-tracker-backend.onrender.com';

const CATEGORIES = [
  { value: 'food', label: '🍽️ Food & Dining' },
  { value: 'transport', label: '🚗 Transport' },
  { value: 'entertainment', label: '🎬 Entertainment' },
  { value: 'shopping', label: '🛍️ Shopping' },
  { value: 'healthcare', label: '🏥 Healthcare' },
  { value: 'utilities', label: '⚡ Utilities' },
  { value: 'other', label: '📦 Other' }
];

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ title: '', amount: '', category: 'food', date: new Date().toISOString().split('T')[0] });
  const [editingExpense, setEditingExpense] = useState(null);
  const [filters, setFilters] = useState({ category: '', startDate: '', endDate: '' });
  const [loading, setLoading] = useState(false);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/expenses`);
      setExpenses(res.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingExpense) {
        await axios.put(`${API_URL}/expenses/${editingExpense.id}`, form);
        setEditingExpense(null);
      } else {
        await axios.post(`${API_URL}/expenses`, form);
      }
      setForm({ title: '', amount: '', category: 'food', date: new Date().toISOString().split('T')[0] });
      await fetchExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const editExpense = (expense) => {
    setForm({
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: expense.date
    });
    setEditingExpense(expense);
  };

  const deleteExpense = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await axios.delete(`${API_URL}/expenses/${id}`);
        await fetchExpenses();
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  const cancelEdit = () => {
    setEditingExpense(null);
    setForm({ title: '', amount: '', category: 'food', date: new Date().toISOString().split('T')[0] });
  };

  useEffect(() => { 
    fetchExpenses(); 
  }, []);

  // Filter expenses based on filters
  const filteredExpenses = expenses.filter(expense => {
    const matchesCategory = !filters.category || expense.category === filters.category;
    const matchesStartDate = !filters.startDate || new Date(expense.date) >= new Date(filters.startDate);
    const matchesEndDate = !filters.endDate || new Date(expense.date) <= new Date(filters.endDate);
    return matchesCategory && matchesStartDate && matchesEndDate;
  });

  // Calculate statistics
  const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
  const monthlyExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const currentMonth = new Date();
    return expenseDate.getMonth() === currentMonth.getMonth() && 
           expenseDate.getFullYear() === currentMonth.getFullYear();
  }).reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);

  const categoryStats = CATEGORIES.map(cat => ({
    ...cat,
    amount: expenses.filter(exp => exp.category === cat.value)
      .reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0)
  })).sort((a, b) => b.amount - a.amount);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getCategoryLabel = (categoryValue) => {
    return CATEGORIES.find(cat => cat.value === categoryValue)?.label || categoryValue;
  };

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <h1>💰 Expense Tracker</h1>
          <p>Track your spending and manage your finances efficiently</p>
        </div>

        <div className="main-content">
          {/* Statistics Cards */}
          <div className="stats-section">
            <div className="stats-cards">
              <div className="stat-card">
                <h3>Total Expenses</h3>
                <div className="value">{formatAmount(totalExpenses)}</div>
              </div>
              <div className="stat-card">
                <h3>This Month</h3>
                <div className="value">{formatAmount(monthlyExpenses)}</div>
              </div>
              <div className="stat-card">
                <h3>Total Items</h3>
                <div className="value">{expenses.length}</div>
              </div>
            </div>

            {/* Expense Form */}
            <div className="expense-form">
              <h2>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</h2>
              <form onSubmit={addExpense}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="title">Expense Title</label>
                    <input
                      id="title"
                      type="text"
                      placeholder="What did you spend on?"
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="amount">Amount (₹)</label>
                    <input
                      id="amount"
                      type="number"
                      placeholder="0"
                      min="0"
                      step="0.01"
                      value={form.amount}
                      onChange={e => setForm({ ...form, amount: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <select
                      id="category"
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      required
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="date">Date</label>
                    <input
                      id="date"
                      type="date"
                      value={form.date}
                      onChange={e => setForm({ ...form, date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <button type="submit" className="btn" disabled={loading}>
                    {loading ? 'Saving...' : (editingExpense ? 'Update Expense' : 'Add Expense')}
                  </button>
                  {editingExpense && (
                    <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Expenses List */}
          <div className="expenses-section">
            <div className="expenses-header">
              <h2>Expense History</h2>
              <div className="filters">
                <div className="filter-group">
                  <label>Category</label>
                  <select
                    value={filters.category}
                    onChange={e => setFilters({ ...filters, category: e.target.value })}
                  >
                    <option value="">All Categories</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label.replace(/^\w+\s/, '')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label>From</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                  />
                </div>
                <div className="filter-group">
                  <label>To</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="expense-list">
              {loading && expenses.length === 0 ? (
                <div className="no-expenses">
                  <h3>Loading expenses...</h3>
                </div>
              ) : filteredExpenses.length === 0 ? (
                <div className="no-expenses">
                  <h3>No expenses found</h3>
                  <p>{expenses.length === 0 ? 'Add your first expense to get started!' : 'Try adjusting your filters.'}</p>
                </div>
              ) : (
                filteredExpenses.map(expense => (
                  <div key={expense.id} className="expense-item">
                    <div className="expense-info">
                      <div className="expense-title">{expense.title}</div>
                      <div className="expense-meta">
                        <span className={`category-badge category-${expense.category}`}>
                          {getCategoryLabel(expense.category).replace(/^\w+\s/, '')}
                        </span>
                        <span>{formatDate(expense.date)}</span>
                      </div>
                    </div>
                    <div className="expense-amount">
                      {formatAmount(expense.amount)}
                    </div>
                    <div className="expense-actions">
                      <button 
                        className="btn btn-secondary small-btn"
                        onClick={() => editExpense(expense)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-danger small-btn"
                        onClick={() => deleteExpense(expense.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
