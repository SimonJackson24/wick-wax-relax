// Frontend SEO utility functions

/**
 * Generate SEO-friendly URL slug
 * @param {string} text - Text to convert to slug
 * @returns {string} SEO-friendly slug
 */
export function generateSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Calculate optimal title length
 * @param {string} title - Title to check
 * @returns {object} Title analysis
 */
export function analyzeTitle(title) {
  const length = title.length;
  const pixelWidth = estimatePixelWidth(title);

  return {
    length,
    pixelWidth,
    isOptimal: length >= 30 && length <= 60,
    isTooShort: length < 30,
    isTooLong: length > 60,
    recommendations: getTitleRecommendations(length, pixelWidth)
  };
}

/**
 * Estimate pixel width of text (rough approximation)
 * @param {string} text - Text to measure
 * @returns {number} Estimated pixel width
 */
function estimatePixelWidth(text) {
  // Rough estimation: average character width is about 8-10 pixels
  // This is a simplified calculation
  const avgCharWidth = 9;
  return text.length * avgCharWidth;
}

/**
 * Get title recommendations
 * @param {number} length - Title length
 * @param {number} pixelWidth - Title pixel width
 * @returns {Array} Recommendations
 */
function getTitleRecommendations(length, pixelWidth) {
  const recommendations = [];

  if (length < 30) {
    recommendations.push('Title is too short. Aim for 30-60 characters.');
  } else if (length > 60) {
    recommendations.push('Title is too long. Keep it under 60 characters for better display.');
  }

  if (pixelWidth > 600) {
    recommendations.push('Title may be truncated in search results. Consider shortening it.');
  }

  return recommendations;
}

/**
 * Analyze meta description
 * @param {string} description - Meta description to analyze
 * @returns {object} Description analysis
 */
export function analyzeDescription(description) {
  const length = description.length;

  return {
    length,
    isOptimal: length >= 120 && length <= 160,
    isTooShort: length < 120,
    isTooLong: length > 160,
    recommendations: getDescriptionRecommendations(length)
  };
}

/**
 * Get description recommendations
 * @param {number} length - Description length
 * @returns {Array} Recommendations
 */
function getDescriptionRecommendations(length) {
  const recommendations = [];

  if (length < 120) {
    recommendations.push('Meta description is too short. Aim for 120-160 characters.');
  } else if (length > 160) {
    recommendations.push('Meta description is too long. Keep it under 160 characters.');
  }

  return recommendations;
}

/**
 * Analyze keyword usage in content
 * @param {string} content - Content to analyze
 * @param {Array} keywords - Keywords to check
 * @returns {object} Keyword analysis
 */
export function analyzeKeywords(content, keywords) {
  const contentLower = content.toLowerCase();
  const analysis = {};

  keywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase();
    const count = (contentLower.match(new RegExp(keywordLower, 'g')) || []).length;
    const density = (count * keyword.length) / content.length * 100;

    analysis[keyword] = {
      count,
      density: Math.round(density * 100) / 100,
      isOptimal: density >= 0.5 && density <= 2.5,
      recommendations: getKeywordRecommendations(count, density)
    };
  });

  return analysis;
}

/**
 * Get keyword recommendations
 * @param {number} count - Keyword count
 * @param {number} density - Keyword density
 * @returns {Array} Recommendations
 */
function getKeywordRecommendations(count, density) {
  const recommendations = [];

  if (count === 0) {
    recommendations.push('Keyword not found in content. Consider adding it naturally.');
  } else if (density < 0.5) {
    recommendations.push('Keyword density is low. Consider using the keyword more naturally.');
  } else if (density > 2.5) {
    recommendations.push('Keyword density is high. Avoid keyword stuffing.');
  }

  return recommendations;
}

/**
 * Analyze heading structure
 * @param {Array} headings - Array of heading objects with level and text
 * @returns {object} Heading analysis
 */
export function analyzeHeadings(headings) {
  const h1Count = headings.filter(h => h.level === 1).length;
  const h2Count = headings.filter(h => h.level === 2).length;
  const h3Count = headings.filter(h => h.level === 3).length;

  const issues = [];
  const recommendations = [];

  // Check H1
  if (h1Count === 0) {
    issues.push('No H1 heading found');
    recommendations.push('Add one H1 heading for the main topic');
  } else if (h1Count > 1) {
    issues.push('Multiple H1 headings found');
    recommendations.push('Use only one H1 heading per page');
  }

  // Check heading hierarchy
  const hasSkippedLevels = headings.some((heading, index) => {
    if (index === 0) return false;
    const prevLevel = headings[index - 1].level;
    const currentLevel = heading.level;
    return currentLevel > prevLevel + 1;
  });

  if (hasSkippedLevels) {
    issues.push('Heading hierarchy is broken');
    recommendations.push('Maintain proper heading hierarchy (H1 > H2 > H3, etc.)');
  }

  return {
    h1Count,
    h2Count,
    h3Count,
    totalHeadings: headings.length,
    issues,
    recommendations,
    isValid: issues.length === 0
  };
}

/**
 * Analyze internal linking
 * @param {Array} links - Array of link objects
 * @param {string} currentUrl - Current page URL
 * @returns {object} Link analysis
 */
export function analyzeInternalLinks(links, currentUrl) {
  const internalLinks = links.filter(link => {
    try {
      const linkUrl = new URL(link.href, currentUrl);
      const currentUrlObj = new URL(currentUrl);
      return linkUrl.hostname === currentUrlObj.hostname;
    } catch {
      return false;
    }
  });

  const externalLinks = links.filter(link => !internalLinks.includes(link));

  return {
    totalLinks: links.length,
    internalLinks: internalLinks.length,
    externalLinks: externalLinks.length,
    internalLinkRatio: links.length > 0 ? (internalLinks.length / links.length) * 100 : 0,
    recommendations: getLinkRecommendations(internalLinks.length, externalLinks.length)
  };
}

/**
 * Get link recommendations
 * @param {number} internalCount - Internal link count
 * @param {number} externalCount - External link count
 * @returns {Array} Recommendations
 */
function getLinkRecommendations(internalCount, externalCount) {
  const recommendations = [];

  if (internalCount === 0) {
    recommendations.push('Add internal links to improve site structure');
  }

  if (externalCount > internalCount * 2) {
    recommendations.push('Too many external links. Focus more on internal linking');
  }

  return recommendations;
}

/**
 * Analyze image optimization
 * @param {Array} images - Array of image objects
 * @returns {object} Image analysis
 */
export function analyzeImages(images) {
  const totalImages = images.length;
  const imagesWithAlt = images.filter(img => img.alt && img.alt.trim()).length;
  const imagesWithTitle = images.filter(img => img.title && img.title.trim()).length;
  const largeImages = images.filter(img => img.size > 100000).length; // > 100KB

  const issues = [];
  const recommendations = [];

  if (imagesWithAlt < totalImages) {
    issues.push(`${totalImages - imagesWithAlt} images missing alt text`);
    recommendations.push('Add descriptive alt text to all images for accessibility and SEO');
  }

  if (largeImages > 0) {
    issues.push(`${largeImages} large images found`);
    recommendations.push('Optimize images for web (compress, resize, use modern formats)');
  }

  return {
    totalImages,
    imagesWithAlt,
    imagesWithTitle,
    largeImages,
    altTextRatio: totalImages > 0 ? (imagesWithAlt / totalImages) * 100 : 0,
    issues,
    recommendations,
    isOptimized: issues.length === 0
  };
}

/**
 * Generate SEO score
 * @param {object} analysis - Complete SEO analysis object
 * @returns {number} SEO score (0-100)
 */
export function calculateSEOscore(analysis) {
  let score = 0;
  let maxScore = 0;

  // Title analysis (20 points)
  maxScore += 20;
  if (analysis.title?.isOptimal) {
    score += 20;
  } else if (analysis.title?.isTooShort) {
    score += 5;
  } else if (analysis.title?.isTooLong) {
    score += 10;
  }

  // Description analysis (20 points)
  maxScore += 20;
  if (analysis.description?.isOptimal) {
    score += 20;
  } else if (analysis.description?.isTooShort) {
    score += 5;
  } else if (analysis.description?.isTooLong) {
    score += 10;
  }

  // Keywords analysis (15 points)
  maxScore += 15;
  if (analysis.keywords) {
    const keywordScore = Object.values(analysis.keywords).reduce((sum, keyword) => {
      return sum + (keyword.isOptimal ? 1 : 0);
    }, 0) / Object.keys(analysis.keywords).length * 15;
    score += keywordScore;
  }

  // Headings analysis (15 points)
  maxScore += 15;
  if (analysis.headings?.isValid) {
    score += 15;
  } else if (analysis.headings?.issues.length === 1) {
    score += 7;
  }

  // Links analysis (10 points)
  maxScore += 10;
  if (analysis.links) {
    const linkRatio = analysis.links.internalLinkRatio;
    if (linkRatio >= 60) {
      score += 10;
    } else if (linkRatio >= 40) {
      score += 6;
    } else if (linkRatio >= 20) {
      score += 3;
    }
  }

  // Images analysis (10 points)
  maxScore += 10;
  if (analysis.images?.isOptimized) {
    score += 10;
  } else if (analysis.images?.issues.length === 1) {
    score += 5;
  }

  // Content analysis (10 points)
  maxScore += 10;
  if (analysis.content) {
    if (analysis.content.wordCount >= 300) {
      score += 10;
    } else if (analysis.content.wordCount >= 150) {
      score += 5;
    }
  }

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

/**
 * Generate SEO recommendations
 * @param {object} analysis - Complete SEO analysis object
 * @returns {Array} Prioritized recommendations
 */
export function generateSEORecommendations(analysis) {
  const recommendations = [];

  // High priority recommendations
  if (analysis.title?.issues) {
    recommendations.push({
      priority: 'high',
      category: 'title',
      message: analysis.title.issues.join(' '),
      suggestions: analysis.title.recommendations
    });
  }

  if (analysis.description?.issues) {
    recommendations.push({
      priority: 'high',
      category: 'description',
      message: analysis.description.issues.join(' '),
      suggestions: analysis.description.recommendations
    });
  }

  if (analysis.headings?.issues) {
    recommendations.push({
      priority: 'high',
      category: 'headings',
      message: analysis.headings.issues.join(' '),
      suggestions: analysis.headings.recommendations
    });
  }

  // Medium priority recommendations
  if (analysis.keywords) {
    Object.entries(analysis.keywords).forEach(([keyword, data]) => {
      if (data.recommendations.length > 0) {
        recommendations.push({
          priority: 'medium',
          category: 'keywords',
          message: `Keyword "${keyword}": ${data.recommendations.join(' ')}`,
          suggestions: data.recommendations
        });
      }
    });
  }

  if (analysis.images?.issues) {
    recommendations.push({
      priority: 'medium',
      category: 'images',
      message: analysis.images.issues.join(' '),
      suggestions: analysis.images.recommendations
    });
  }

  // Low priority recommendations
  if (analysis.links?.recommendations) {
    recommendations.push({
      priority: 'low',
      category: 'links',
      message: analysis.links.recommendations.join(' '),
      suggestions: analysis.links.recommendations
    });
  }

  if (analysis.content?.wordCount < 300) {
    recommendations.push({
      priority: 'low',
      category: 'content',
      message: 'Content is shorter than recommended',
      suggestions: ['Add more valuable content (aim for at least 300 words)']
    });
  }

  // Sort by priority
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  return recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
}

/**
 * Validate URL structure for SEO
 * @param {string} url - URL to validate
 * @returns {object} URL validation results
 */
export function validateURL(url) {
  const issues = [];
  const recommendations = [];

  // Check for underscores
  if (url.includes('_')) {
    issues.push('URL contains underscores');
    recommendations.push('Use hyphens instead of underscores in URLs');
  }

  // Check for uppercase characters
  if (/[A-Z]/.test(url)) {
    issues.push('URL contains uppercase characters');
    recommendations.push('Use lowercase characters in URLs');
  }

  // Check for multiple consecutive hyphens
  if (url.includes('--')) {
    issues.push('URL contains multiple consecutive hyphens');
    recommendations.push('Avoid multiple consecutive hyphens in URLs');
  }

  // Check for query parameters (for SEO URLs)
  if (url.includes('?')) {
    issues.push('URL contains query parameters');
    recommendations.push('Use clean URLs without query parameters when possible');
  }

  // Check length
  const pathLength = url.split('?')[0].length;
  if (pathLength > 100) {
    issues.push('URL is too long');
    recommendations.push('Keep URLs under 100 characters when possible');
  }

  return {
    isValid: issues.length === 0,
    issues,
    recommendations,
    score: Math.max(0, 100 - (issues.length * 20))
  };
}

/**
 * Generate meta tags for social sharing
 * @param {object} metaData - Meta data object
 * @returns {object} Social meta tags
 */
export function generateSocialMetaTags(metaData) {
  return {
    // Open Graph
    'og:title': metaData.title,
    'og:description': metaData.description,
    'og:image': metaData.image,
    'og:url': metaData.url,
    'og:type': metaData.type || 'website',
    'og:site_name': metaData.siteName,

    // Twitter Card
    'twitter:card': 'summary_large_image',
    'twitter:title': metaData.title,
    'twitter:description': metaData.description,
    'twitter:image': metaData.image,
    'twitter:site': metaData.twitterHandle || '@yourhandle',

    // LinkedIn
    'linkedin:title': metaData.title,
    'linkedin:description': metaData.description,
    'linkedin:image': metaData.image,
    'linkedin:url': metaData.url
  };
}

/**
 * Analyze page load performance for SEO
 * @param {object} performanceData - Performance metrics
 * @returns {object} Performance analysis
 */
export function analyzePerformance(performanceData) {
  const analysis = {
    score: 100,
    issues: [],
    recommendations: []
  };

  // Core Web Vitals
  if (performanceData.lcp > 2500) {
    analysis.issues.push('Largest Contentful Paint is too slow');
    analysis.recommendations.push('Optimize LCP by improving server response time and resource loading');
    analysis.score -= 20;
  }

  if (performanceData.fid > 100) {
    analysis.issues.push('First Input Delay is too high');
    analysis.recommendations.push('Reduce FID by minimizing JavaScript execution time');
    analysis.score -= 15;
  }

  if (performanceData.cls > 0.1) {
    analysis.issues.push('Cumulative Layout Shift is too high');
    analysis.recommendations.push('Fix CLS by reserving space for dynamic content');
    analysis.score -= 15;
  }

  // Overall load time
  if (performanceData.loadTime > 3000) {
    analysis.issues.push('Page load time is too slow');
    analysis.recommendations.push('Optimize images, minify code, and use caching');
    analysis.score -= 10;
  }

  analysis.score = Math.max(0, analysis.score);

  return analysis;
}