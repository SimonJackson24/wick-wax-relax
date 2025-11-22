const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
const imagesDir = path.join(uploadsDir, 'images');
const productsDir = path.join(imagesDir, 'products');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}
if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Middleware to authenticate JWT token from cookies
function authenticateToken(req, res, next) {
  const token = req.cookies.accessToken;
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Admin middleware
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Upload single product image
router.post('/product-image', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { productId, altText = '', isPrimary = false } = req.body;

    // Process image with Sharp for optimization
    const originalPath = req.file.path;
    const filename = path.parse(req.file.filename).name;
    const optimizedPath = path.join(productsDir, `${filename}-optimized.jpg`);

    await sharp(originalPath)
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 })
      .toFile(optimizedPath);

    // Create thumbnail
    const thumbnailPath = path.join(productsDir, `${filename}-thumb.jpg`);
    await sharp(originalPath)
      .resize(300, 300, {
        fit: 'cover'
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    // Save to database
    const imageUrl = `/uploads/images/products/${filename}-optimized.jpg`;
    const thumbnailUrl = `/uploads/images/products/${filename}-thumb.jpg`;

    if (productId) {
      // Save as product image
      const result = await query(`
        INSERT INTO product_images (product_id, image_url, alt_text, is_primary)
        VALUES (?, ?, ?, ?)
        RETURNING id
      `, [productId, imageUrl, altText, isPrimary]);

      // If this is the primary image, update the product's main image
      if (isPrimary) {
        await query(`
          UPDATE products
          SET image_url = ?, image_alt_text = ?
          WHERE id = ?
        `, [imageUrl, altText, productId]);
      }

      res.json({
        id: result.rows[0].id,
        imageUrl,
        thumbnailUrl,
        altText,
        isPrimary
      });
    } else {
      // Just return the URLs for temporary storage
      res.json({
        imageUrl,
        thumbnailUrl,
        altText
      });
    }

    // Clean up original file
    fs.unlinkSync(originalPath);

  } catch (error) {
    console.error('Error uploading image:', error);

    // Clean up files on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Upload multiple product images
router.post('/product-images', authenticateToken, requireAdmin, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    const { productId, altTexts = [] } = req.body;
    const results = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const altText = altTexts[i] || '';

      // Process image
      const originalPath = file.path;
      const filename = path.parse(file.filename).name;
      const optimizedPath = path.join(productsDir, `${filename}-optimized.jpg`);

      await sharp(originalPath)
        .resize(800, 800, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85 })
        .toFile(optimizedPath);

      // Create thumbnail
      const thumbnailPath = path.join(productsDir, `${filename}-thumb.jpg`);
      await sharp(originalPath)
        .resize(300, 300, {
          fit: 'cover'
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      const imageUrl = `/uploads/images/products/${filename}-optimized.jpg`;
      const thumbnailUrl = `/uploads/images/products/${filename}-thumb.jpg`;

      if (productId) {
        const result = await query(`
          INSERT INTO product_images (product_id, image_url, alt_text, display_order)
          VALUES (?, ?, ?, ?)
          RETURNING id
        `, [productId, imageUrl, altText, i]);

        results.push({
          id: result.rows[0].id,
          imageUrl,
          thumbnailUrl,
          altText,
          displayOrder: i
        });
      } else {
        results.push({
          imageUrl,
          thumbnailUrl,
          altText
        });
      }

      // Clean up original file
      fs.unlinkSync(originalPath);
    }

    res.json({ images: results });

  } catch (error) {
    console.error('Error uploading images:', error);

    // Clean up files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    res.status(500).json({ error: 'Failed to upload images' });
  }
});

// Delete product image
router.delete('/product-image/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Get image info
    const imageResult = await query(`
      SELECT image_url FROM product_images WHERE id = ?
    `, [id]);

    if (imageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const imageUrl = imageResult.rows[0].image_url;

    // Delete from database
    await query('DELETE FROM product_images WHERE id = ?', [id]);

    // Delete files
    const filename = path.basename(imageUrl, path.extname(imageUrl));
    const basePath = path.join(productsDir, filename);

    const filesToDelete = [
      `${basePath}.jpg`,
      `${basePath}-optimized.jpg`,
      `${basePath}-thumb.jpg`
    ];

    filesToDelete.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    res.json({ success: true });

  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// Update image metadata
router.put('/product-image/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { altText, isPrimary, displayOrder } = req.body;

    let updateFields = [];
    let updateValues = [];

    if (altText !== undefined) {
      updateFields.push('alt_text = ?');
      updateValues.push(altText);
    }

    if (isPrimary !== undefined) {
      updateFields.push('is_primary = ?');
      updateValues.push(isPrimary);
    }

    if (displayOrder !== undefined) {
      updateFields.push('display_order = ?');
      updateValues.push(displayOrder);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(id);

    await query(`
      UPDATE product_images
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);

    // If setting as primary, update product main image
    if (isPrimary) {
      const imageResult = await query(`
        SELECT image_url, alt_text, product_id FROM product_images WHERE id = ?
      `, [id]);

      if (imageResult.rows.length > 0) {
        const { image_url, alt_text, product_id } = imageResult.rows[0];
        await query(`
          UPDATE products
          SET image_url = ?, image_alt_text = ?
          WHERE id = ?
        `, [image_url, alt_text, product_id]);
      }
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Error updating image:', error);
    res.status(500).json({ error: 'Failed to update image' });
  }
});

module.exports = router;