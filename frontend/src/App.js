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
  const [displayExpenses, setDisplayExpenses] = useState([]);
  const [form, setForm] = useState({ title: '', amount: '', category: 'food', date: new Date().toISOString().split('T')[0] });
  const [editingExpense, setEditingExpense] = useState(null);
  const [filters, setFilters] = useState({ category: '', startDate: '', endDate: '' });
  // Pending filters allow users to adjust inputs and apply them using the Search button
  const [pendingFilters, setPendingFilters] = useState({ category: '', startDate: '', endDate: '' });
  const [loading, setLoading] = useState(false);

  // Load expenses from localStorage on component mount
  useEffect(() => {
    const savedExpenses = localStorage.getItem('expenses');
    if (savedExpenses) {
      const parsedExpenses = JSON.parse(savedExpenses);
      setExpenses(parsedExpenses);
      setDisplayExpenses(parsedExpenses);
    }
  }, []);

  // Save expenses to localStorage whenever expenses change
  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
    // Update display when expenses change (if no filters applied)
    if (!filters.category && !filters.startDate && !filters.endDate) {
      setDisplayExpenses(expenses);
    }
  }, [expenses, filters]);

  // Client-side filtering function
  const filterExpenses = (expenseList, appliedFilters) => {
    return expenseList.filter(expense => {
      const matchesCategory = !appliedFilters.category || expense.category === appliedFilters.category;
      
      let matchesStartDate = true;
      let matchesEndDate = true;
      
      if (appliedFilters.startDate) {
        const expenseDate = toLocalMidnight(expense.date);
        const startDate = parseDateInputToStart(appliedFilters.startDate);
        matchesStartDate = expenseDate >= startDate;
      }
      
      if (appliedFilters.endDate) {
        const expenseDate = toLocalMidnight(expense.date);
        const endDate = parseDateInputToEnd(appliedFilters.endDate);
        matchesEndDate = expenseDate <= endDate;
      }
      
      return matchesCategory && matchesStartDate && matchesEndDate;
    });
  };

  const addExpense = (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (editingExpense) {
        // Update existing expense locally
        const updatedExpenses = expenses.map(exp => 
          exp.id === editingExpense.id 
            ? { ...exp, ...form, id: editingExpense.id }
            : exp
        );
        setExpenses(updatedExpenses);
        setEditingExpense(null);
      } else {
        // Add new expense locally
        const newExpense = {
          id: Date.now(), // Simple ID generation
          ...form,
          amount: parseFloat(form.amount)
        };
        setExpenses(prevExpenses => [newExpense, ...prevExpenses]);
      }
      
      setForm({ title: '', amount: '', category: 'food', date: new Date().toISOString().split('T')[0] });
    } catch (error) {
      console.error('Error saving expense:', error);
    } finally {
      setLoading(false);
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

  const deleteExpense = (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== id));
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  const cancelEdit = () => {
    setEditingExpense(null);
    setForm({ title: '', amount: '', category: 'food', date: new Date().toISOString().split('T')[0] });
  };

  // Remove the fetchExpenses call since we're using localStorage

  // The list to render comes from the server based on applied filters
  const filteredExpenses = displayExpenses;

  // Debug: Log expenses whenever they change
  useEffect(() => {
    console.log('Expenses updated:', expenses.length, 'items');
    console.log('Expenses:', expenses);
    console.log('Filtered expenses (server):', filteredExpenses.length, 'items');
    console.log('Filters:', filters);
  }, [expenses, filteredExpenses, filters]);

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

  // Helpers to normalize dates for reliable local-day comparisons
  const toLocalMidnight = (dateLike) => {
    const d = new Date(dateLike);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  };
  const parseDateInputToStart = (value) => {
    if (!value) return null;
    const parts = String(value).split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 0, 0, 0, 0);
    }
    return toLocalMidnight(value);
  };
  const parseDateInputToEnd = (value) => {
    if (!value) return null;
    const parts = String(value).split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 23, 59, 59, 999);
    }
    const d = toLocalMidnight(value);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  };

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <h1>Expense Tracker</h1>
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
                    value={pendingFilters.category}
                    onChange={e => setPendingFilters({ ...pendingFilters, category: e.target.value })}
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
                    value={pendingFilters.startDate}
                    onChange={e => setPendingFilters({ ...pendingFilters, startDate: e.target.value })}
                  />
                </div>
                <div className="filter-group">
                  <label>To</label>
                  <input
                    type="date"
                    value={pendingFilters.endDate}
                    onChange={e => setPendingFilters({ ...pendingFilters, endDate: e.target.value })}
                  />
                </div>
                <div className="filter-group">
                  <label style={{ visibility: 'hidden' }}>Search</label>
                  <div>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => { 
                        setFilters({ ...pendingFilters }); 
                        const filtered = filterExpenses(expenses, pendingFilters);
                        setDisplayExpenses(filtered);
                      }}
                    >
                      Search
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ marginLeft: '8px' }}
                      onClick={() => { 
                        setPendingFilters({ category: '', startDate: '', endDate: '' }); 
                        setFilters({ category: '', startDate: '', endDate: '' }); 
                        setDisplayExpenses(expenses);
                      }}
                    >
                      Reset
                    </button>
                  </div>
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
