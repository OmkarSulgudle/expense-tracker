const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Create table if it doesn't exist
pool.query(`
  CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    category TEXT,
    date DATE NOT NULL
  )
`)
.then(() => console.log('✅ Table "expenses" is ready'))
.catch((err) => console.error('❌ Error creating table:', err));

// Root route
app.get('/', (req, res) => {
  res.send('✅ Expense Tracker Backend is running!');
});

// Get all expenses
app.get('/expenses', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM expenses ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching expenses:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Add a new expense
app.post('/expenses', async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;
    await pool.query(
      'INSERT INTO expenses (title, amount, category, date) VALUES ($1, $2, $3, $4)',
      [title, amount, category, date]
    );
    res.json({ message: 'Expense added' });
  } catch (err) {
    console.error('❌ Error adding expense:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update an expense
app.put('/expenses/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, amount, category, date } = req.body;
    const result = await pool.query(
      'UPDATE expenses SET title = $1, amount = $2, category = $3, date = $4 WHERE id = $5 RETURNING *',
      [title, amount, category, date, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json({ message: 'Expense updated', expense: result.rows[0] });
  } catch (err) {
    console.error('❌ Error updating expense:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete an expense
app.delete('/expenses/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await pool.query('DELETE FROM expenses WHERE id = $1', [id]);
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    console.error('❌ Error deleting expense:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
