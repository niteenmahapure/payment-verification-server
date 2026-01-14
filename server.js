const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const upload = multer({ dest: 'uploads/' });

let db;
const DB_FILE = 'payments.sqlite';

/* ---------- INIT SQLITE (WASM) ---------- */
initSqlJs().then(SQL => {
  if (fs.existsSync(DB_FILE)) {
    const filebuffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(filebuffer);
  } else {
    db = new SQL.Database();
    db.run(`
      CREATE TABLE payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client TEXT,
        phone TEXT,
        amount TEXT,
        rm TEXT,
        screenshot TEXT,
        status TEXT DEFAULT 'Pending',
        created_at TEXT
      )
    `);
    saveDB();
  }
  console.log('✅ sql.js database ready');
});

function saveDB() {
  const data = db.export();
  fs.writeFileSync(DB_FILE, Buffer.from(data));
}

/* ---------- ROUTES ---------- */

app.get('/', (req, res) => {
  res.send('Payment Verification Server is running');
});

app.get('/payments', (req, res) => {
  const stmt = db.prepare(`SELECT * FROM payments ORDER BY id DESC`);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  res.json(rows);
});

app.post('/submit', upload.single('screenshot'), (req, res) => {
  const { client, phone, amount, rm } = req.body;
  const screenshot = req.file ? req.file.filename : null;

  db.run(
    `INSERT INTO payments (client, phone, amount, rm, screenshot, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'Pending', datetime('now'))`,
    [client, phone, amount, rm, screenshot]
  );

  saveDB();
  res.json({ success: true });
});

app.post('/update', (req, res) => {
  const { id, client, phone, amount, rm, status } = req.body;

  db.run(
    `UPDATE payments SET client=?, phone=?, amount=?, rm=?, status=? WHERE id=?`,
    [client, phone, amount, rm, status, id]
  );

  saveDB();
  res.json({ success: true });
});

/* ---------- START SERVER ---------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
