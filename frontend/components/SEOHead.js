import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

const SEOHead = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  article,
  product,
  noindex = false,
  canonical
}) => {
  const router = useRouter();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const siteName = 'Wick Wax Relax';

  const pageTitle = title || `${siteName} - Premium Home Fragrance Products`;
  const pageDescription = description || 'Premium wax melts, candles, and home fragrance products. Hand-poured soy wax with natural essential oils.';
  const pageKeywords = keywords || 'wax melts, candles, home fragrance, essential oils, soy wax, aromatherapy';
  const pageImage = image || `${siteUrl}/images/hero-image.svg`;
  const pageUrl = url || `${siteUrl}${router.asPath}`;

  const generateStructuredData = () => {
    const baseData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: siteName,
      url: siteUrl,
      logo: `${siteUrl}/images/logo.svg`,
      description: pageDescription,
      sameAs: []
    };

    if (type === 'article' && article) {
      return {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: title,
        description: description,
        image: pageImage,
        author: {
          '@type': 'Person',
          name: article.author
        },
        publisher: {
          '@type': 'Organization',
          name: siteName,
          logo: {
            '@type': 'ImageObject',
            url: `${siteUrl}/images/logo.svg`
          }
        },
        datePublished: article.publishedTime,
        dateModified: article.modifiedTime,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': pageUrl
        }
      };
    }

    if (type === 'product' && product) {
      return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description,
        image: product.image,
        brand: {
          '@type': 'Brand',
          name: siteName
        },
        category: product.category,
        offers: {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: 'GBP',
          availability: product.availability === 'in_stock' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          seller: {
            '@type': 'Organization',
            name: siteName
          }
        },
        aggregateRating: product.rating ? {
          '@type': 'AggregateRating',
          ratingValue: product.rating.average,
          reviewCount: product.rating.count
        } : undefined
      };
    }

    return baseData;
  };

  return (
    <Head>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={pageKeywords} />
      <meta name="author" content={siteName} />
      <meta name="robots" content={noindex ? 'noindex,nofollow' : 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1'} />

      <link rel="canonical" href={canonical || pageUrl} />

      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_GB" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageImage} />
      <meta name="twitter:site" content="@wickwaxrelax" />

      {article && (
        <>
          <meta property="article:author" content={article.author} />
          <meta property="article:published_time" content={article.publishedTime} />
          <meta property="article:modified_time" content={article.modifiedTime} />
          <meta property="article:section" content={article.section} />
          {article.tags && article.tags.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {product && (
        <>
          <meta property="product:price:amount" content={product.price} />
          <meta property="product:price:currency" content="GBP" />
          <meta property="product:availability" content={product.availability} />
          <meta property="product:category" content={product.category} />
        </>
      )}

      <meta name="theme-color" content="#C8B6DB" />
      <meta name="msapplication-TileColor" content="#C8B6DB" />
      <meta name="application-name" content={siteName} />

      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateStructuredData())
        }}
      />

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

      <link rel="dns-prefetch" href="//www.google-analytics.com" />
      <link rel="dns-prefetch" href="//www.googletagmanager.com" />

      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />

      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={siteName} />
    </Head>
  );
};

export default SEOHead;