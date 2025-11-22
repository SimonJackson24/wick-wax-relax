const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

class ImageOptimizationService {
  constructor() {
    this.supportedFormats = ['webp', 'avif', 'jpg', 'png'];
  }

  /**
   * Optimize image with multiple formats and return the best one
   * @param {string} inputPath - Path to input image
   * @param {string} outputDir - Directory to save optimized images
   * @param {string} filename - Base filename without extension
   * @param {Object} options - Optimization options
   * @returns {Object} Optimization results
   */
  async optimizeImage(inputPath, outputDir, filename, options = {}) {
    const {
      maxWidth = 800,
      maxHeight = 800,
      quality = 85,
      generateThumbnail = true,
      thumbnailSize = 300
    } = options;

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Get image metadata
    const metadata = await sharp(inputPath).metadata();
    const originalSize = fs.statSync(inputPath).size;

    console.log(`Optimizing image: ${filename}, original size: ${originalSize} bytes`);

    const results = [];

    // Generate optimized versions in different formats
    for (const format of this.supportedFormats) {
      try {
        const outputPath = path.join(outputDir, `${filename}-optimized.${format}`);
        let sharpInstance = sharp(inputPath)
          .resize(maxWidth, maxHeight, {
            fit: 'inside',
            withoutEnlargement: true
          });

        // Apply format-specific options
        switch (format) {
          case 'webp':
            sharpInstance = sharpInstance.webp({
              quality,
              effort: 6, // Higher effort for better compression
              smartSubsample: true
            });
            break;
          case 'avif':
            sharpInstance = sharpInstance.avif({
              quality: Math.max(quality - 5, 70), // Slightly lower quality for AVIF
              effort: 6,
              chromaSubsampling: '4:2:0'
            });
            break;
          case 'jpg':
            sharpInstance = sharpInstance.jpeg({
              quality,
              mozjpeg: true,
              progressive: true
            });
            break;
          case 'png':
            sharpInstance = sharpInstance.png({
              quality,
              compressionLevel: 9,
              progressive: true
            });
            break;
        }

        await sharpInstance.toFile(outputPath);
        const optimizedSize = fs.statSync(outputPath).size;
        const compressionRatio = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);

        results.push({
          format,
          path: outputPath,
          size: optimizedSize,
          compressionRatio: `${compressionRatio}%`,
          url: `/uploads/images/products/${filename}-optimized.${format}`
        });

        console.log(`Generated ${format}: ${optimizedSize} bytes (${compressionRatio}% reduction)`);
      } catch (error) {
        console.error(`Error generating ${format} version:`, error);
      }
    }

    // Sort by size (smallest first)
    results.sort((a, b) => a.size - b.size);
    const bestFormat = results[0];

    // Generate thumbnail
    let thumbnailResult = null;
    if (generateThumbnail) {
      try {
        const thumbnailPath = path.join(outputDir, `${filename}-thumb.webp`);
        await sharp(inputPath)
          .resize(thumbnailSize, thumbnailSize, {
            fit: 'cover',
            position: 'center'
          })
          .webp({ quality: 80, effort: 4 })
          .toFile(thumbnailPath);

        const thumbnailSizeBytes = fs.statSync(thumbnailPath).size;
        thumbnailResult = {
          path: thumbnailPath,
          size: thumbnailSizeBytes,
          url: `/uploads/images/products/${filename}-thumb.webp`
        };

        console.log(`Generated thumbnail: ${thumbnailSizeBytes} bytes`);
      } catch (error) {
        console.error('Error generating thumbnail:', error);
      }
    }

    return {
      originalSize,
      optimizedSize: bestFormat.size,
      compressionRatio: bestFormat.compressionRatio,
      bestFormat: bestFormat.format,
      optimizedUrl: bestFormat.url,
      thumbnailUrl: thumbnailResult?.url,
      allFormats: results,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format
      }
    };
  }

  /**
   * Clean up temporary files
   * @param {string[]} filePaths - Array of file paths to delete
   */
  cleanupFiles(filePaths) {
    filePaths.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up: ${filePath}`);
        }
      } catch (error) {
        console.error(`Error cleaning up ${filePath}:`, error);
      }
    });
  }

  /**
   * Get image dimensions without processing
   * @param {string} imagePath - Path to image file
   * @returns {Object} Image dimensions
   */
  async getImageDimensions(imagePath) {
    try {
      const metadata = await sharp(imagePath).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        aspectRatio: metadata.width / metadata.height
      };
    } catch (error) {
      console.error('Error getting image dimensions:', error);
      return null;
    }
  }

  /**
   * Validate image file
   * @param {string} imagePath - Path to image file
   * @returns {boolean} Whether image is valid
   */
  async validateImage(imagePath) {
    try {
      await sharp(imagePath).metadata();
      return true;
    } catch (error) {
      console.error('Invalid image file:', error);
      return false;
    }
  }
}

module.exports = new ImageOptimizationService();