import express, { Request, Response, NextFunction } from 'express';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = process.env.DB_FILE || './food.db';
const db = new Database(DB_FILE);
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// Ensure uploads directory
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
app.use('/uploads', express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, UPLOAD_DIR); },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

type JwtPayload = { id: number; role: 'seller'|'consumer' };

function createToken(user: { id: number; role: string }) { return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' }); }

function authMiddleware(req: Request & { user?: JwtPayload }, res: Response, next: NextFunction) {
  const auth = req.headers.authorization as string | undefined;
  if (!auth) return res.status(401).json({ error: 'missing token' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid token' });
  }
}

function roleCheck(requiredRoles: ('seller'|'consumer')[]) {
  return (req: Request & { user?: JwtPayload }, res: Response, next: NextFunction) => {
    if (!req.user || !requiredRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'forbidden' });
    }
    next();
  };
}

app.post('/api/register', async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body as any;
  if (!name || !email || !password || !['seller','consumer'].includes(role))
    return res.status(400).json({ error: 'invalid input' });
  const hash = await bcrypt.hash(password, 10);
  try {
    const stmt = db.prepare('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)');
    const info = stmt.run(name, email, hash, role);
    const user = { id: Number(info.lastInsertRowid), name, email, role };
    const token = createToken(user);
    res.json({ token, user });
  } catch (e: any) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'email exists' });
    res.status(500).json({ error: 'db error' });
  }
});

app.post('/api/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as any;
  const row = db.prepare('SELECT id,name,email,password_hash,role FROM users WHERE email = ?').get(email);
  if (!row) return res.status(400).json({ error: 'invalid credentials' });
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return res.status(400).json({ error: 'invalid credentials' });
  const user = { id: row.id as number, name: row.name as string, email: row.email as string, role: row.role as string };
  res.json({ token: createToken(user), user });
});

app.post('/api/entries', authMiddleware, roleCheck(['seller']), (req: Request & { user?: JwtPayload }, res: Response) => {
  const { consumer_id, date, meal_type, food_name, amount } = req.body as any;
  if (!consumer_id || !date || !meal_type || !food_name || typeof amount !== 'number')
    return res.status(400).json({ error: 'invalid input' });
  const stmt = db.prepare(`INSERT INTO food_entries
    (seller_id, consumer_id, date, meal_type, food_name, amount)
    VALUES (?, ?, ?, ?, ?, ?)`);
  const info = stmt.run(req.user!.id, consumer_id, date, meal_type, food_name, amount);
  res.json({ id: info.lastInsertRowid });
});

app.put('/api/entries/:id', authMiddleware, roleCheck(['seller']), (req: Request & { user?: JwtPayload }, res: Response) => {
  const id = req.params.id;
  const { date, meal_type, food_name, amount, consumer_id } = req.body as any;
  const stmt = db.prepare(`UPDATE food_entries SET date=?, meal_type=?, food_name=?, amount=?, consumer_id=?
                           WHERE id=? AND seller_id=?`);
  const info = stmt.run(date, meal_type, food_name, amount, consumer_id, id, req.user!.id);
  if (info.changes === 0) return res.status(404).json({ error: 'not found or forbidden' });
  res.json({ success: true });
});

app.get('/api/consumers', authMiddleware, roleCheck(['seller']), (req: Request & { user?: JwtPayload }, res: Response) => {
  let rows = db.prepare('SELECT * FROM users WHERE role=? ORDER BY id').all('consumer');
  res.json(rows);
});

app.get('/api/entries', authMiddleware, roleCheck(['seller']), (req: Request & { user?: JwtPayload }, res: Response) => {
  let rows = db.prepare('SELECT * FROM food_entries ORDER BY date DESC').all();
  res.json(rows);
});

app.delete('/api/entries/:id', authMiddleware, roleCheck(['seller']), (req: Request & { user?: JwtPayload }, res: Response) => {
  const id = req.params.id;
  const stmt = db.prepare('DELETE FROM food_entries WHERE id=? AND seller_id=?');
  const info = stmt.run(id, req.user!.id);
  if (info.changes === 0) return res.status(404).json({ error: 'not found or forbidden' });
  res.json({ success: true });
});

app.get('/api/my/entries', authMiddleware, roleCheck(['consumer']), (req: Request & { user?: JwtPayload }, res: Response) => {
  const rows = db.prepare('SELECT * FROM food_entries WHERE consumer_id=? ORDER BY date DESC').all(req.user!.id);
  res.json(rows);
});

app.get('/api/consumer/:id/entries', authMiddleware, roleCheck(['seller']), (req: Request & { user?: JwtPayload }, res: Response) => {
  const consumerId = req.params.id;
  const { month } = req.query as any;
  let rows;
  if (month) {
    rows = db.prepare('SELECT * FROM food_entries WHERE consumer_id=? AND substr(date,1,7)=? ORDER BY date').all(consumerId, month);
  } else {
    rows = db.prepare('SELECT * FROM food_entries WHERE consumer_id=? ORDER BY date').all(consumerId);
  }
  res.json(rows);
});

// Payments endpoint: accept multipart/form-data with optional receipt file
app.post('/api/payments', authMiddleware, upload.single('receipt'), (req: Request & { user?: JwtPayload }, res: Response) => {
  const { consumer_id, seller_id, date, amount, note, upi_reference } = req.body as any;
  const consumerIdNum = Number(consumer_id);
  const sellerIdNum = Number(seller_id);
  const amt = Number(amount);
  if (!consumerIdNum || !sellerIdNum || !date || isNaN(amt)) return res.status(400).json({ error: 'invalid input' });

  const payerIsConsumer = req.user!.role === 'consumer' && req.user!.id === consumerIdNum;
  const payerIsSeller = req.user!.role === 'seller';
  if (!payerIsConsumer && !payerIsSeller) return res.status(403).json({ error: 'forbidden' });

  let receipt_url: string | null = null;
  if (req.file) {
    receipt_url = `/uploads/${req.file.filename}`;
  }

  const stmt = db.prepare('INSERT INTO payments (consumer_id,seller_id,date,amount,note,upi_reference,receipt_url) VALUES (?,?,?,?,?,?,?)');
  const info = stmt.run(consumerIdNum, sellerIdNum, date, amt, note || null, upi_reference || null, receipt_url);
  res.json({ id: info.lastInsertRowid, receipt_url });
});

app.get('/api/my/payments', authMiddleware, roleCheck(['consumer']), (req: Request & { user?: JwtPayload }, res: Response) => {
  const rows = db.prepare('SELECT * FROM payments WHERE consumer_id=? ORDER BY date DESC').all(req.user!.id);
  res.json(rows);
});

app.get('/api/reports/consumer/:id', authMiddleware, roleCheck(['seller']), (req: Request & { user?: JwtPayload }, res: Response) => {
  const consumerId = req.params.id;
  const { month } = req.query as any;
  const dateFilter = month ? "AND substr(fe.date,1,7)=?" : "";
  const entries = month
    ? db.prepare(`SELECT * FROM food_entries fe WHERE fe.consumer_id=? ${dateFilter}`).all(consumerId, month)
    : db.prepare('SELECT * FROM food_entries WHERE consumer_id=?').all(consumerId);
  const totalDue = (entries as any[]).reduce((s,e)=>s+e.amount,0);
  const payments = month
    ? db.prepare(`SELECT * FROM payments WHERE consumer_id=? AND substr(date,1,7)=?`).all(consumerId, month)
    : db.prepare('SELECT * FROM payments WHERE consumer_id=?').all(consumerId);
  const totalPaid = (payments as any[]).reduce((s,p)=>s+p.amount,0);
  res.json({ totalDue, totalPaid, entries, payments, balance: totalDue - totalPaid });
});

app.get('/api/dashboard', authMiddleware, roleCheck(['seller']), (req: Request & { user?: JwtPayload }, res: Response) => {
  const totalRevenue = db.prepare('SELECT IFNULL(SUM(amount),0) as s FROM food_entries').get().s as number;
  const amountPaid = db.prepare('SELECT IFNULL(SUM(amount),0) as s FROM payments').get().s as number;
  const todayFoodItems = db.prepare(
  "SELECT food_name FROM food_entries WHERE DATE(created_at) = DATE('now', 'localtime')"
).all();
  res.json({  totalRevenue, amountPaid, pendingBalance: totalRevenue - amountPaid, todayFoodItems: todayFoodItems?.map((s) => s.food_name)?.join(', ') });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=> console.log('server up', PORT));
