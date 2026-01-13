const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ================= DATABASE ================= */
const db = new sqlite3.Database('./payments.db', (err) => {
  if (err) {
    console.error('DB error:', err.message);
  } else {
    console.log('✅ SQLite connected');
  }
});

db.run(`
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client TEXT,
    phone TEXT,
    amount TEXT,
    rm TEXT,
    screenshot TEXT,
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

/* ================= FILE UPLOAD ================= */
const upload = multer({
  dest: 'uploads/',
});

/* ================= ROUTES ================= */

/* Health check (VERY IMPORTANT) */
app.get('/', (req, res) => {
  res.send('✅ Payment Verification Server is running');
});

/* GET ALL PAYMENTS */
app.get('/payments', (req, res) => {
  db.all(
    'SELECT * FROM payments ORDER BY id DESC',
    [],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

/* USER SUBMIT PAYMENT */
app.post('/submit', upload.single('screenshot'), (req, res) => {
  const { client, phone, amount, rm } = req.body;
  const screenshot = req.file ? req.file.filename : null;

  db.run(
    `INSERT INTO payments (client, phone, amount, rm, screenshot)
     VALUES (?, ?, ?, ?, ?)`,
    [client, phone, amount, rm, screenshot],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

/* UPDATE PAYMENT (ADMIN EDIT) */
app.post('/update', (req, res) => {
  const { id, client, phone, amount, rm, status } = req.body;

  db.run(
    `UPDATE payments
     SET client=?, phone=?, amount=?, rm=?, status=?
     WHERE id=?`,
    [client, phone, amount, rm, status, id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false });
      }
      res.json({ success: true });
    }
  );
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
