//api/controllers/authController.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createUser, findByEmail } from '../models/userModel.js';

const JWT_SECRET = process.env.JWT_SECRET;

// 🟢 REGISTER
// authController.js - UPDATE THE CATCH BLOCK
// authController.js - UPDATE CATCH BLOCK
export const register = async (req, res) => {
  try {
    console.log('🔐 Register attempt with:', req.body);
    
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const newUser = await createUser({ name, email, password_hash });

    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.status(201).json({
      message: 'User registered successfully',
      user: newUser,
      token,
    });
  } catch (error) {
    console.error('💥 FINAL Register Error:', error);
    console.error('💥 Error code:', error.code);
    console.error('💥 Error detail:', error.detail);
    
    return res.status(500).json({ 
      message: 'Server error during registration',
      error: error.message,
      code: error.code,
      detail: error.detail
    });
  }
};

// 🟠 LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' });

    const user = await findByEmail(email);
    if (!user)
      return res.status(400).json({ message: 'Invalid email or password' });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res.status(400).json({ message: 'Invalid email or password' });

    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
