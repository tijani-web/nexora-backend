// /apps/api/routes/authRoutes.js
import express from 'express';
import { register, login } from '../controllers/authController.js';

const router = express.Router();

// 🟢 Register new user
router.post('/register', register);

// 🟠 Login existing user
router.post('/login', login);

router.get('/test', (req, res) => {
  res.json({ message: '✅ Auth routes are working!' });
});

export default router;
