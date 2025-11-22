const express = require('express');
const { query, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const seoService = require('../services/seoService');

const router = express.Router();

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

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

// ===== PUBLIC SEO ENDPOINTS =====

// Get meta tags for a page
router.get('/meta/:pageType/:id?', [
  query('pageType').isIn(['product', 'category', 'blog', 'home', 'about', 'contact']),
  query('id').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { pageType, id } = req.params;
    let data = null;

    // Fetch data based on page type and ID
    if (id) {
      switch (pageType) {
        case 'product':
          const productResult = await query(`
            SELECT
              p.id,
              p.name,
              p.description,
              p.scent_profile,
              pv.price,
              pv.inventory_quantity,
              GROUP_CONCAT(pi.image_url) as images,
              c.name as category
            FROM products p
            LEFT JOIN product_variants pv ON p.id = pv.product_id
            LEFT JOIN product_images pi ON p.id = pi.product_id
            LEFT JOIN product_categories pc ON p.id = pc.product_id
            LEFT JOIN categories c ON pc.category_id = c.id
            WHERE p.id = ? AND p.is_active = true
            GROUP BY p.id
          `, [id]);

          if (productResult.rows.length > 0) {
            data = productResult.rows[0];
            data.images = data.images ? data.images.split(',') : [];
          }
          break;

        case 'category':
          const categoryResult = await query(`
            SELECT id, name, slug, description
            FROM categories
            WHERE slug = ? AND is_active = true
          `, [id]);

          if (categoryResult.rows.length > 0) {
            data = categoryResult.rows[0];
          }
          break;

        case 'blog':
          // Assuming we have a blog_posts table
          const blogResult = await query(`
            SELECT id, title, slug, excerpt, content, featured_image, author, published_at, updated_at, category
            FROM blog_posts
            WHERE slug = ? AND status = 'published'
          `, [id]);

          if (blogResult.rows.length > 0) {
            data = blogResult.rows[0];
          }
          break;
      }
    }

    const metaTags = seoService.generateMetaTags(pageType, data);
    const structuredData = seoService.generateStructuredData(pageType, data);
    const socialMetaTags = seoService.generateSocialMetaTags(metaTags);

    res.json({
      metaTags,
      structuredData,
      socialMetaTags
    });
  } catch (error) {
    console.error('Error generating meta tags:', error);
    res.status(500).json({ error: 'Failed to generate meta tags' });
  }
});

// Generate sitemap
router.get('/sitemap.xml', async (req, res) => {
  try {
    const sitemap = await seoService.generateSitemap();

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    // Convert sitemap object to XML string
    const xmlString = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${sitemap.urlset.url.map(url => `
  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${new Date(url.lastmod).toISOString()}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('')}
</urlset>`;

    res.send(xmlString);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).json({ error: 'Failed to generate sitemap' });
  }
});

// Generate robots.txt
router.get('/robots.txt', (req, res) => {
  try {
    const robotsTxt = seoService.generateRobotsTxt();

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours

    res.send(robotsTxt);
  } catch (error) {
    console.error('Error generating robots.txt:', error);
    res.status(500).json({ error: 'Failed to generate robots.txt' });
  }
});

// ===== ADMIN SEO ENDPOINTS =====

// SEO analysis for a page
router.post('/analyze', authenticateToken, requireAdmin, [
  query('url').isURL(),
  query('content').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { url, content = {} } = req.body;
    const analysis = await seoService.analyzeSEO(url, content);

    res.json({ analysis });
  } catch (error) {
    console.error('Error analyzing SEO:', error);
    res.status(500).json({ error: 'Failed to analyze SEO' });
  }
});

// Generate SEO report
router.get('/report', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const report = await seoService.generateSEOReport();
    res.json({ report });
  } catch (error) {
    console.error('Error generating SEO report:', error);
    res.status(500).json({ error: 'Failed to generate SEO report' });
  }
});

// Check for duplicate content
router.post('/duplicate-check', authenticateToken, requireAdmin, [
  query('content').isString(),
  query('threshold').optional().isFloat({ min: 0, max: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, threshold = 0.8 } = req.body;
    const result = await seoService.checkDuplicateContent(content, threshold);

    res.json({ result });
  } catch (error) {
    console.error('Error checking duplicate content:', error);
    res.status(500).json({ error: 'Failed to check duplicate content' });
  }
});

// Generate SEO-friendly URL slug
router.post('/generate-slug', [
  query('text').isString().isLength({ min: 1, max: 200 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { text } = req.body;
    const slug = seoService.generateSlug(text);

    res.json({ slug });
  } catch (error) {
    console.error('Error generating slug:', error);
    res.status(500).json({ error: 'Failed to generate slug' });
  }
});

// Get SEO recommendations for content
router.post('/recommendations', authenticateToken, requireAdmin, [
  query('content').isObject(),
  query('pageType').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, pageType = 'general' } = req.body;

    const recommendations = [];

    // Title recommendations
    if (!content.title || content.title.length < 30) {
      recommendations.push({
        type: 'title',
        priority: 'high',
        message: 'Title is too short. Aim for 30-60 characters.',
        suggestion: 'Create a compelling title that includes your main keyword.'
      });
    } else if (content.title.length > 60) {
      recommendations.push({
        type: 'title',
        priority: 'high',
        message: 'Title is too long. Keep it under 60 characters.',
        suggestion: 'Shorten the title while keeping the main keyword.'
      });
    }

    // Description recommendations
    if (!content.description || content.description.length < 120) {
      recommendations.push({
        type: 'description',
        priority: 'high',
        message: 'Meta description is too short. Aim for 120-160 characters.',
        suggestion: 'Write a compelling description that includes your main keyword and a call-to-action.'
      });
    }

    // Content recommendations
    if (content.content && content.content.length < 300) {
      recommendations.push({
        type: 'content',
        priority: 'medium',
        message: 'Content is too short for good SEO.',
        suggestion: 'Add more valuable content (aim for at least 300 words).'
      });
    }

    // Keyword recommendations
    if (!content.keywords || content.keywords.length === 0) {
      recommendations.push({
        type: 'keywords',
        priority: 'medium',
        message: 'No keywords specified.',
        suggestion: 'Research and add relevant keywords for your content.'
      });
    }

    // Image recommendations
    if (!content.image) {
      recommendations.push({
        type: 'image',
        priority: 'medium',
        message: 'No Open Graph image specified.',
        suggestion: 'Add an attractive image for better social sharing.'
      });
    }

    // Heading structure recommendations
    if (content.headings) {
      const h1Count = content.headings.filter(h => h.level === 1).length;
      if (h1Count === 0) {
        recommendations.push({
          type: 'headings',
          priority: 'high',
          message: 'No H1 heading found.',
          suggestion: 'Add one H1 heading for the main topic of the page.'
        });
      } else if (h1Count > 1) {
        recommendations.push({
          type: 'headings',
          priority: 'high',
          message: 'Multiple H1 headings found.',
          suggestion: 'Use only one H1 heading per page.'
        });
      }
    }

    res.json({ recommendations });
  } catch (error) {
    console.error('Error generating SEO recommendations:', error);
    res.status(500).json({ error: 'Failed to generate SEO recommendations' });
  }
});

// Bulk SEO analysis for multiple pages
router.post('/bulk-analysis', authenticateToken, requireAdmin, [
  query('urls').isArray({ min: 1, max: 50 }),
  query('urls.*').isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { urls } = req.body;
    const results = [];

    for (const url of urls) {
      try {
        // In a real implementation, you might fetch the page content
        // For now, we'll just analyze the URL structure
        const analysis = await seoService.analyzeSEO(url, {});
        results.push({
          url,
          analysis,
          status: 'success'
        });
      } catch (error) {
        results.push({
          url,
          error: error.message,
          status: 'error'
        });
      }
    }

    res.json({ results });
  } catch (error) {
    console.error('Error performing bulk SEO analysis:', error);
    res.status(500).json({ error: 'Failed to perform bulk SEO analysis' });
  }
});

// SEO performance tracking
router.get('/performance', authenticateToken, requireAdmin, [
  query('period').optional().isIn(['7d', '30d', '90d'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { period = '30d' } = req.query;

    // In a real implementation, you would track SEO metrics over time
    // For now, we'll return mock performance data
    const performance = {
      period,
      organicTraffic: {
        current: 12500,
        previous: 11200,
        change: 11.6,
        trend: 'up'
      },
      keywordRankings: {
        improved: 45,
        declined: 12,
        stable: 89
      },
      backlinks: {
        new: 23,
        lost: 5,
        total: 156
      },
      pageSpeed: {
        score: 85,
        change: 5,
        status: 'good'
      },
      mobileFriendly: {
        score: 92,
        issues: 2
      },
      coreWebVitals: {
        lcp: 'good',
        fid: 'good',
        cls: 'needs_improvement'
      }
    };

    res.json({ performance });
  } catch (error) {
    console.error('Error fetching SEO performance:', error);
    res.status(500).json({ error: 'Failed to fetch SEO performance' });
  }
});

// Get SEO settings and configuration
router.get('/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const settings = {
      siteName: seoService.siteName,
      siteDescription: seoService.siteDescription,
      baseUrl: seoService.baseUrl,
      defaultImage: seoService.defaultImage,
      socialMedia: {
        twitter: '@wickwaxrelax',
        facebook: 'https://facebook.com/wickwaxrelax',
        instagram: 'https://instagram.com/wickwaxrelax'
      },
      analytics: {
        googleAnalyticsId: process.env.GA_TRACKING_ID,
        googleSearchConsole: process.env.GSC_SITE_URL
      },
      webmasterTools: {
        googleSiteVerification: process.env.GOOGLE_SITE_VERIFICATION,
        bingSiteVerification: process.env.BING_SITE_VERIFICATION
      }
    };

    res.json({ settings });
  } catch (error) {
    console.error('Error fetching SEO settings:', error);
    res.status(500).json({ error: 'Failed to fetch SEO settings' });
  }
});

// Update SEO settings
router.put('/settings', authenticateToken, requireAdmin, [
  query('siteName').optional().isString().isLength({ min: 1, max: 100 }),
  query('siteDescription').optional().isString().isLength({ min: 1, max: 300 }),
  query('baseUrl').optional().isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { siteName, siteDescription, baseUrl } = req.body;

    if (siteName) seoService.siteName = siteName;
    if (siteDescription) seoService.siteDescription = siteDescription;
    if (baseUrl) seoService.baseUrl = baseUrl;

    res.json({
      message: 'SEO settings updated successfully',
      settings: {
        siteName: seoService.siteName,
        siteDescription: seoService.siteDescription,
        baseUrl: seoService.baseUrl
      }
    });
  } catch (error) {
    console.error('Error updating SEO settings:', error);
    res.status(500).json({ error: 'Failed to update SEO settings' });
  }
});

// Health check for SEO service
router.get('/health', (req, res) => {
  res.json({
    status: 'SEO service healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;