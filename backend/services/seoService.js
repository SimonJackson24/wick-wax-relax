const { query } = require('../config/database');

class SEOService {
  constructor() {
    this.baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    this.siteName = 'Wick Wax Relax';
    this.siteDescription = 'Premium wax melts, candles, and home fragrance products. Hand-poured soy wax with natural essential oils.';
    this.defaultImage = '/images/hero-image.svg';
  }

  // Generate meta tags for pages
  generateMetaTags(pageType, data = {}) {
    const baseMeta = {
      title: this.siteName,
      description: this.siteDescription,
      keywords: 'wax melts, candles, home fragrance, essential oils, soy wax, aromatherapy',
      image: this.baseUrl + this.defaultImage,
      url: this.baseUrl,
      type: 'website',
      siteName: this.siteName,
      locale: 'en_GB'
    };

    switch (pageType) {
      case 'product':
        return this.generateProductMeta(data);
      case 'category':
        return this.generateCategoryMeta(data);
      case 'blog':
        return this.generateBlogMeta(data);
      case 'home':
        return this.generateHomeMeta(data);
      case 'about':
        return this.generateAboutMeta(data);
      case 'contact':
        return this.generateContactMeta(data);
      default:
        return baseMeta;
    }
  }

  // Product page meta tags
  generateProductMeta(product) {
    if (!product) return this.generateMetaTags('home');

    const title = `${product.name} - ${this.siteName}`;
    const description = product.description ?
      product.description.substring(0, 155) :
      `Shop ${product.name} at ${this.siteName}. Premium quality home fragrance products.`;

    const image = product.images && product.images[0] ?
      this.baseUrl + product.images[0] :
      this.baseUrl + this.defaultImage;

    return {
      title,
      description,
      keywords: `${product.name}, ${product.category || 'home fragrance'}, wax melts, candles, essential oils`,
      image,
      url: `${this.baseUrl}/products/${product.id}`,
      type: 'product',
      siteName: this.siteName,
      locale: 'en_GB',
      product: {
        name: product.name,
        description: product.description,
        image: image,
        price: product.price,
        currency: 'GBP',
        availability: product.inventory_quantity > 0 ? 'in_stock' : 'out_of_stock',
        category: product.category,
        brand: this.siteName
      }
    };
  }

  // Category page meta tags
  generateCategoryMeta(category) {
    if (!category) return this.generateMetaTags('home');

    const title = `${category.name} - ${this.siteName}`;
    const description = category.description ||
      `Shop our ${category.name} collection at ${this.siteName}. Premium quality home fragrance products.`;

    return {
      title,
      description,
      keywords: `${category.name}, home fragrance, wax melts, candles, essential oils`,
      image: this.baseUrl + this.defaultImage,
      url: `${this.baseUrl}/categories/${category.slug}`,
      type: 'website',
      siteName: this.siteName,
      locale: 'en_GB'
    };
  }

  // Blog page meta tags
  generateBlogMeta(post) {
    if (!post) return this.generateMetaTags('home');

    const title = `${post.title} - ${this.siteName}`;
    const description = post.excerpt || post.content?.substring(0, 155) || this.siteDescription;

    return {
      title,
      description,
      keywords: post.tags ? post.tags.join(', ') : 'blog, home fragrance, aromatherapy',
      image: post.featuredImage ? this.baseUrl + post.featuredImage : this.baseUrl + this.defaultImage,
      url: `${this.baseUrl}/blog/${post.slug}`,
      type: 'article',
      siteName: this.siteName,
      locale: 'en_GB',
      article: {
        publishedTime: post.publishedAt,
        modifiedTime: post.updatedAt,
        author: post.author,
        section: post.category,
        tags: post.tags
      }
    };
  }

  // Home page meta tags
  generateHomeMeta(data = {}) {
    return {
      title: `${this.siteName} - Premium Home Fragrance Products`,
      description: this.siteDescription,
      keywords: 'wax melts, candles, home fragrance, essential oils, soy wax, aromatherapy, luxury candles',
      image: this.baseUrl + this.defaultImage,
      url: this.baseUrl,
      type: 'website',
      siteName: this.siteName,
      locale: 'en_GB'
    };
  }

  // About page meta tags
  generateAboutMeta(data = {}) {
    return {
      title: `About Us - ${this.siteName}`,
      description: 'Learn about our story, our commitment to quality, and our passion for creating premium home fragrance products.',
      keywords: 'about us, company story, quality products, home fragrance, essential oils',
      image: this.baseUrl + this.defaultImage,
      url: `${this.baseUrl}/about`,
      type: 'website',
      siteName: this.siteName,
      locale: 'en_GB'
    };
  }

  // Contact page meta tags
  generateContactMeta(data = {}) {
    return {
      title: `Contact Us - ${this.siteName}`,
      description: 'Get in touch with us. We\'re here to help with your home fragrance needs.',
      keywords: 'contact, customer service, support, home fragrance',
      image: this.baseUrl + this.defaultImage,
      url: `${this.baseUrl}/contact`,
      type: 'website',
      siteName: this.siteName,
      locale: 'en_GB'
    };
  }

  // Generate structured data (JSON-LD)
  generateStructuredData(pageType, data = {}) {
    const baseData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: this.siteName,
      url: this.baseUrl,
      logo: this.baseUrl + '/images/logo.svg',
      description: this.siteDescription,
      sameAs: [
        // Add social media URLs here
      ]
    };

    switch (pageType) {
      case 'product':
        return this.generateProductStructuredData(data);
      case 'home':
        return this.generateHomeStructuredData(data);
      case 'blog':
        return this.generateBlogStructuredData(data);
      default:
        return baseData;
    }
  }

  // Product structured data
  generateProductStructuredData(product) {
    if (!product) return {};

    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: product.images?.map(img => this.baseUrl + img) || [this.baseUrl + this.defaultImage],
      brand: {
        '@type': 'Brand',
        name: this.siteName
      },
      category: product.category,
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: 'GBP',
        availability: product.inventory_quantity > 0 ?
          'https://schema.org/InStock' :
          'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: this.siteName
        }
      },
      aggregateRating: product.rating ? {
        '@type': 'AggregateRating',
        ratingValue: product.rating.average,
        reviewCount: product.rating.count
      } : undefined
    };
  }

  // Home page structured data
  generateHomeStructuredData(data = {}) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: this.siteName,
      url: this.baseUrl,
      logo: this.baseUrl + '/images/logo.svg',
      description: this.siteDescription,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+44-123-456-7890', // Replace with actual phone
        contactType: 'customer service'
      },
      sameAs: [
        // Add social media URLs
      ]
    };
  }

  // Blog post structured data
  generateBlogStructuredData(post) {
    if (!post) return {};

    return {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt || post.content?.substring(0, 155),
      image: post.featuredImage ? this.baseUrl + post.featuredImage : this.baseUrl + this.defaultImage,
      author: {
        '@type': 'Person',
        name: post.author
      },
      publisher: {
        '@type': 'Organization',
        name: this.siteName,
        logo: {
          '@type': 'ImageObject',
          url: this.baseUrl + '/images/logo.svg'
        }
      },
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${this.baseUrl}/blog/${post.slug}`
      }
    };
  }

  // Generate sitemap
  async generateSitemap() {
    const sitemap = {
      urlset: {
        '@xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9',
        '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        '@xsi:schemaLocation': 'http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd',
        url: []
      }
    };

    // Add static pages
    const staticPages = [
      { loc: this.baseUrl, priority: '1.0', changefreq: 'daily' },
      { loc: `${this.baseUrl}/products`, priority: '0.9', changefreq: 'daily' },
      { loc: `${this.baseUrl}/about`, priority: '0.7', changefreq: 'monthly' },
      { loc: `${this.baseUrl}/contact`, priority: '0.7', changefreq: 'monthly' },
      { loc: `${this.baseUrl}/blog`, priority: '0.8', changefreq: 'weekly' }
    ];

    sitemap.urlset.url.push(...staticPages);

    // Add product pages
    try {
      const products = await query('SELECT id, updated_at FROM products WHERE is_active = true');
      products.rows.forEach(product => {
        sitemap.urlset.url.push({
          loc: `${this.baseUrl}/products/${product.id}`,
          lastmod: product.updated_at,
          priority: '0.8',
          changefreq: 'weekly'
        });
      });
    } catch (error) {
      console.error('Error fetching products for sitemap:', error);
    }

    // Add category pages
    try {
      const categories = await query('SELECT slug, updated_at FROM categories WHERE is_active = true');
      categories.rows.forEach(category => {
        sitemap.urlset.url.push({
          loc: `${this.baseUrl}/categories/${category.slug}`,
          lastmod: category.updated_at,
          priority: '0.7',
          changefreq: 'weekly'
        });
      });
    } catch (error) {
      console.error('Error fetching categories for sitemap:', error);
    }

    return sitemap;
  }

  // Generate robots.txt
  generateRobotsTxt() {
    return `User-agent: *
Allow: /

# Block admin and API routes
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /static/

# Allow crawling of important pages
Allow: /products
Allow: /categories
Allow: /blog

# Sitemap
Sitemap: ${this.baseUrl}/sitemap.xml

# Crawl delay (optional)
Crawl-delay: 1`;
  }

  // SEO analysis and recommendations
  async analyzeSEO(url, content = {}) {
    const analysis = {
      score: 0,
      issues: [],
      recommendations: [],
      metaTags: {},
      structuredData: {},
      performance: {}
    };

    // Title analysis
    if (!content.title || content.title.length < 30) {
      analysis.issues.push('Title is too short (should be 30-60 characters)');
      analysis.recommendations.push('Add a descriptive title between 30-60 characters');
    } else if (content.title.length > 60) {
      analysis.issues.push('Title is too long (should be 30-60 characters)');
      analysis.recommendations.push('Shorten the title to under 60 characters');
    } else {
      analysis.score += 20;
    }

    // Description analysis
    if (!content.description || content.description.length < 120) {
      analysis.issues.push('Meta description is too short (should be 120-160 characters)');
      analysis.recommendations.push('Add a compelling meta description between 120-160 characters');
    } else if (content.description.length > 160) {
      analysis.issues.push('Meta description is too long (should be 120-160 characters)');
      analysis.recommendations.push('Shorten the meta description to under 160 characters');
    } else {
      analysis.score += 20;
    }

    // Keywords analysis
    if (!content.keywords || content.keywords.length === 0) {
      analysis.issues.push('No keywords specified');
      analysis.recommendations.push('Add relevant keywords for better SEO');
    } else {
      analysis.score += 10;
    }

    // Image analysis
    if (!content.image) {
      analysis.issues.push('No Open Graph image specified');
      analysis.recommendations.push('Add an Open Graph image for better social sharing');
    } else {
      analysis.score += 10;
    }

    // URL structure analysis
    if (url.includes('_') || url.includes('?')) {
      analysis.issues.push('URL contains underscores or query parameters');
      analysis.recommendations.push('Use hyphens instead of underscores and avoid query parameters in URLs');
    } else {
      analysis.score += 10;
    }

    // Content analysis
    if (content.content && content.content.length < 300) {
      analysis.issues.push('Content is too short for good SEO');
      analysis.recommendations.push('Add more content (aim for at least 300 words)');
    } else if (content.content && content.content.length > 300) {
      analysis.score += 15;
    }

    // Heading structure analysis
    if (content.headings) {
      const h1Count = content.headings.filter(h => h.level === 1).length;
      if (h1Count === 0) {
        analysis.issues.push('No H1 heading found');
        analysis.recommendations.push('Add one H1 heading for the main topic');
      } else if (h1Count > 1) {
        analysis.issues.push('Multiple H1 headings found');
        analysis.recommendations.push('Use only one H1 heading per page');
      } else {
        analysis.score += 15;
      }
    }

    analysis.score = Math.min(analysis.score, 100);

    return analysis;
  }

  // Generate SEO-friendly URL slug
  generateSlug(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  // Check for duplicate content
  async checkDuplicateContent(content, threshold = 0.8) {
    // Simple duplicate content check - in production, use more sophisticated algorithms
    const words = content.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const duplicateRatio = uniqueWords.size / words.length;

    return {
      isDuplicate: duplicateRatio < threshold,
      ratio: duplicateRatio,
      recommendations: duplicateRatio < threshold ? [
        'Content appears to have high duplication',
        'Consider rewriting content to be more unique',
        'Add more original content and value'
      ] : []
    };
  }

  // Generate canonical URL
  generateCanonicalUrl(path, params = {}) {
    const url = new URL(path, this.baseUrl);

    // Remove tracking parameters and other non-canonical params
    const canonicalParams = ['page', 'sort', 'filter'];
    Object.keys(params).forEach(key => {
      if (canonicalParams.includes(key)) {
        url.searchParams.set(key, params[key]);
      }
    });

    return url.toString();
  }

  // SEO monitoring and reporting
  async generateSEOReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      pages: [],
      overallScore: 0,
      recommendations: []
    };

    try {
      // Get all products
      const products = await query('SELECT id, name, description FROM products WHERE is_active = true LIMIT 10');
      for (const product of products.rows) {
        const metaTags = this.generateProductMeta(product);
        const analysis = await this.analyzeSEO(`${this.baseUrl}/products/${product.id}`, metaTags);

        report.pages.push({
          url: `${this.baseUrl}/products/${product.id}`,
          type: 'product',
          title: product.name,
          seoScore: analysis.score,
          issues: analysis.issues,
          recommendations: analysis.recommendations
        });
      }

      // Calculate overall score
      if (report.pages.length > 0) {
        report.overallScore = Math.round(
          report.pages.reduce((sum, page) => sum + page.seoScore, 0) / report.pages.length
        );
      }

      // Generate recommendations
      const allIssues = report.pages.flatMap(page => page.issues);
      const issueCounts = {};
      allIssues.forEach(issue => {
        issueCounts[issue] = (issueCounts[issue] || 0) + 1;
      });

      report.recommendations = Object.entries(issueCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([issue, count]) => `${issue} (${count} pages affected)`);

    } catch (error) {
      console.error('Error generating SEO report:', error);
      report.error = error.message;
    }

    return report;
  }

  // Social media meta tags
  generateSocialMetaTags(metaTags) {
    return {
      // Open Graph
      'og:title': metaTags.title,
      'og:description': metaTags.description,
      'og:image': metaTags.image,
      'og:url': metaTags.url,
      'og:type': metaTags.type,
      'og:site_name': metaTags.siteName,
      'og:locale': metaTags.locale,

      // Twitter Card
      'twitter:card': 'summary_large_image',
      'twitter:title': metaTags.title,
      'twitter:description': metaTags.description,
      'twitter:image': metaTags.image,
      'twitter:site': '@wickwaxrelax', // Replace with actual Twitter handle

      // Additional meta tags
      'article:author': metaTags.article?.author,
      'article:published_time': metaTags.article?.publishedTime,
      'article:modified_time': metaTags.article?.modifiedTime,
      'article:section': metaTags.article?.section,
      'article:tag': metaTags.article?.tags?.join(', ')
    };
  }
}

module.exports = new SEOService();