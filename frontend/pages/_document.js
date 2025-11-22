import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Roboto:wght@300;400;500;700&family=Dancing+Script:wght@400;700&display=swap"
          rel="stylesheet"
        />
        
        {/* Meta tags for accessibility */}
        <meta name="theme-color" content="#1976d2" />
        <meta name="description" content="Wick Wax & Relax - Premium scented candles, wax melts, and bath products for relaxation" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}