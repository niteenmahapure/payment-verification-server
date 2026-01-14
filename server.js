const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------- Middleware ---------- */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------- Uploads Folder ---------- */
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

app.use('/uploads', express.static(uploadDir));

/* ---------- Multer Setup ---------- */
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

/* ---------- In-Memory Storage (TEMP) ---------- */
let payments = [];

/* ---------- Routes ---------- */

// Health check (VERY IMPORTANT for Render)
app.get('/', (req, res) => {
  res.send('Payment Verification Server is running ✅');
});

// Get all payments
app.get('/payments', (req, res) => {
  res.json(payments);
});

// Submit payment
app.post('/payments', upload.single('screenshot'), (req, res) => {
  const { name, phone, amount, rm } = req.body;

  const payment = {
    id: Date.now(),
    name,
    phone,
    amount,
    rm,
    status: 'Pending',
    screenshot: req.file ? `/uploads/${req.file.filename}` : null,
    createdAt: new Date()
  };

  payments.unshift(payment);
  res.json({ success: true, payment });
});

// Update status
app.put('/payments/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const payment = payments.find(p => p.id == id);
  if (!payment) return res.status(404).json({ error: 'Not found' });

  payment.status = status;
  res.json({ success: true });
});

/* ---------- Start Server ---------- */
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
