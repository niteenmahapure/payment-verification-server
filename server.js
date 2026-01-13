const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json());
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const db = new sqlite3.Database('./payments.db');

db.run(`
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_name TEXT,
  phone TEXT,
  amount REAL,
  screenshot TEXT,
  relationship_manager TEXT,
  status TEXT DEFAULT 'Pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);

const upload = multer({ dest: 'uploads/' });

app.post('/submit', upload.single('screenshot'), (req, res) => {
  const { client_name, phone, amount, relationship_manager } = req.body;
  const screenshot = req.file ? req.file.filename : '';

  db.run(
    `INSERT INTO payments 
     (client_name, phone, amount, screenshot, relationship_manager)
     VALUES (?, ?, ?, ?, ?)`,
    [client_name, phone, amount, screenshot, relationship_manager],
    () => res.json({ success: true })
  );
});

app.get('/payments', (req, res) => {
  db.all(`SELECT * FROM payments ORDER BY id DESC`, [], (err, rows) => {
    res.json(rows || []);
  });
});

app.post('/update', (req, res) => {
  const { id, status } = req.body;
  db.run(`UPDATE payments SET status=? WHERE id=?`, [status, id]);
  res.json({ success: true });
});

app.post('/edit', (req, res) => {
  const { id, client_name, phone, amount, relationship_manager } = req.body;
  db.run(
    `UPDATE payments 
     SET client_name=?, phone=?, amount=?, relationship_manager=? 
     WHERE id=?`,
    [client_name, phone, amount, relationship_manager, id],
    () => res.json({ success: true })
  );
});

app.listen(3000, () => {
  console.log('✅ Server running on http://localhost:3000');
});
