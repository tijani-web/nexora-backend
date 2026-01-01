import express from 'express';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Simple memory storage (for testing)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// POST /api/upload - Simple upload endpoint
router.post('/', upload.single('image'), (req, res) => {
  try {
    console.log('📤 Upload request received');
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No image file provided' 
      });
    }

    // console.log('📁 File info:', {
    //   originalname: req.file.originalname,
    //   mimetype: req.file.mimetype,
    //   size: req.file.size
    // });

    // For now, return a placeholder image URL
    // In production, you'd save the file and return a real URL
    const placeholderUrl = 'https://picsum.photos/600/400';
    
    res.json({
      success: true,
      imageUrl: placeholderUrl,
      message: 'Image uploaded successfully (placeholder)'
    });
    
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to upload image' 
    });
  }
});

export default router;