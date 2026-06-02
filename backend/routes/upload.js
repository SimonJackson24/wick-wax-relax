const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { query } = require('../config/database');
const { authenticateToken, requireAdminMfa } = require('../middleware/auth');

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
const imagesDir = path.join(uploadsDir, 'images');
const productsDir = path.join(imagesDir, 'products');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
if (!fs.existsSync(productsDir)) fs.mkdirSync(productsDir, { recursive: true });

// Configure multer for file uploads. Filename is sanitised to ASCII so a
// malicious client cannot smuggle path traversal sequences (`../`) into the
// saved filename.
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, productsDir),
  filename: (req, file, cb) => {
    const safeExt = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `product-${uniqueSuffix}${safeExt}`);
  },
});

// Block upload of any file whose claimed extension is dangerous (SVG, HTML,
// executable, script). The list is intentionally small — anything that
// cannot be rasterised by `sharp` is rejected.
const BLOCKED_EXTENSIONS = new Set(['.svg', '.html', '.htm', '.js', '.mjs', '.php', '.exe', '.bat', '.sh', '.ps1']);

// File filter:
//  1. Reject anything claiming to be a known dangerous type (regardless of
//     the client-supplied mimetype — that header is attacker-controlled).
//  2. Allow image/* only; everything else rejected.
//  3. The on-disk content is re-validated with sharp.metadata() after upload
//     to defeat mimetype spoofing.
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (BLOCKED_EXTENSIONS.has(ext)) {
    return cb(new Error(`File type ${ext} is not allowed`), false);
  }
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

// Upload single product image
router.post('/product-image', authenticateToken, requireAdminMfa, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Verify the on-disk file is actually a raster image. sharp.metadata()
    // throws for non-image content. This blocks polyglot files (a JPEG
    // header followed by HTML/JS) from being served as images.
    let metadata;
    try {
      metadata = await sharp(req.file.path).metadata();
    } catch (err) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'File is not a valid image' });
    }
    if (!['jpeg', 'png', 'webp', 'gif', 'avif'].includes(metadata.format)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: `Unsupported image format: ${metadata.format}` });
    }

    const { productId, altText = '', isPrimary = false } = req.body;

    // Process image with Sharp for optimization
    const filename = path.parse(req.file.filename).name;
    const optimizedPath = path.join(productsDir, `${filename}-optimized.jpg`);

    await sharp(req.file.path)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(optimizedPath);

    // Create thumbnail
    const thumbnailPath = path.join(productsDir, `${filename}-thumb.jpg`);
    await sharp(req.file.path)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    // Save to database
    const imageUrl = `/uploads/images/products/${filename}-optimized.jpg`;
    const thumbnailUrl = `/uploads/images/products/${filename}-thumb.jpg`;

    if (productId) {
      const result = await query(`
        INSERT INTO product_images (product_id, image_url, alt_text, is_primary)
        VALUES (?, ?, ?, ?)
        RETURNING id
      `, [productId, imageUrl, altText, isPrimary === 'true' || isPrimary === true]);

      if (isPrimary === 'true' || isPrimary === true) {
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
        isPrimary,
      });
    } else {
      res.json({ imageUrl, thumbnailUrl, altText });
    }

    fs.unlinkSync(req.file.path);
  } catch (error) {
    console.error('Error uploading image:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Upload multiple product images
router.post('/product-images', authenticateToken, requireAdminMfa, upload.array('images', 10), async (req, res) => {
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
router.delete('/product-image/:id', authenticateToken, requireAdminMfa, async (req, res) => {
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
router.put('/product-image/:id', authenticateToken, requireAdminMfa, async (req, res) => {
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