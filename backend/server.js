import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import sequelize from './db/sequelize.js';
import User from './models/User.js';
import authRoutes from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('DB: подключение и синхронизация моделей выполнены');
    app.listen(PORT, () => {
      console.log(`Сервер: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Не удалось запустить сервер:', err.message);
    process.exit(1);
  }
}

start();
