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

// Create table if not exists
pool.query(`
  CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    title TEXT,
    amount NUMERIC,
    category TEXT,
    date DATE
  )
`);

// Routes
app.get('/expenses', async (req, res) => {
  const result = await pool.query('SELECT * FROM expenses ORDER BY date DESC');
  res.json(result.rows);
});

app.post('/expenses', async (req, res) => {
  const { title, amount, category, date } = req.body;
  await pool.query(
    'INSERT INTO expenses (title, amount, category, date) VALUES ($1, $2, $3, $4)',
    [title, amount, category, date]
  );
  res.json({ message: 'Expense added' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
