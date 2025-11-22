// Homepage Layout Debug Script
// Run this in browser console to validate layout issues

console.log('🔍 HOMEPAGE LAYOUT DEBUG ANALYSIS');
console.log('=====================================');

// 1. Viewport Analysis
const viewport = {
  width: window.innerWidth,
  height: window.innerHeight,
  isMobile: window.innerWidth < 768,
  isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
  isDesktop: window.innerWidth >= 1024
};

console.log('📱 Viewport Analysis:');
console.log(`   Width: ${viewport.width}px`);
console.log(`   Height: ${viewport.height}px`);
console.log(`   Device: ${viewport.isMobile ? '📱 Mobile' : viewport.isTablet ? '📟 Tablet' : '🖥️ Desktop'}`);

// 2. Image Loading Analysis
console.log('\n🖼️ Image Loading Analysis:');
const criticalImages = [
  '/images/logo.webp',
  '/images/hero-image.webp',
  '/images/bath-scene.webp',
  '/images/wax-melt.webp'
];

criticalImages.forEach(async (imgSrc) => {
  try {
    const response = await fetch(imgSrc, { method: 'HEAD' });
    if (response.ok) {
      console.log(`   ✅ ${imgSrc} - LOADED`);
    } else {
      console.log(`   ❌ ${imgSrc} - FAILED (${response.status})`);
    }
  } catch (error) {
    console.log(`   ❌ ${imgSrc} - ERROR: ${error.message}`);
  }
});

// 3. Layout Element Analysis
console.log('\n📐 Layout Element Analysis:');
setTimeout(() => {
  const sections = ['home', 'features', 'categories', 'products', 'about', 'contact'];
  sections.forEach(sectionId => {
    const element = document.getElementById(sectionId);
    if (element) {
      const rect = element.getBoundingClientRect();
      console.log(`   #${sectionId}: ${rect.height.toFixed(0)}px height, ${rect.width.toFixed(0)}px width`);
    } else {
      console.log(`   ❌ #${sectionId} - NOT FOUND`);
    }
  });

  // Check for oversized elements
  const allElements = document.querySelectorAll('*');
  let oversizedCount = 0;
  allElements.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.height > window.innerHeight * 0.8 && rect.width > window.innerWidth * 0.8) {
      oversizedCount++;
    }
  });
  console.log(`   🚨 Oversized elements (>80% viewport): ${oversizedCount}`);

}, 2000);

// 4. Performance Analysis
console.log('\n⚡ Performance Analysis:');
if ('performance' in window) {
  const perfData = performance.getEntriesByType('navigation')[0];
  const loadTime = perfData.loadEventEnd - perfData.fetchStart;
  console.log(`   Page load time: ${loadTime.toFixed(0)}ms`);
  console.log(`   Performance rating: ${loadTime < 1000 ? '🟢 Fast' : loadTime < 3000 ? '🟡 Acceptable' : '🔴 Slow'}`);
}

// 5. Animation Count
console.log('\n🎭 Animation Analysis:');
setTimeout(() => {
  const animatedElements = document.querySelectorAll('[style*="animation"], [style*="transition"]');
  console.log(`   Elements with animations: ${animatedElements.length}`);

  // Check for heavy animations
  const motionElements = document.querySelectorAll('[data-projection-id]');
  console.log(`   Framer Motion elements: ${motionElements.length}`);
}, 3000);

// 6. Content Analysis
console.log('\n📄 Content Analysis:');
setTimeout(() => {
  const sections = document.querySelectorAll('section, [role="region"]');
  console.log(`   Total sections: ${sections.length}`);

  let totalTextContent = 0;
  sections.forEach(section => {
    totalTextContent += section.textContent.length;
  });
  console.log(`   Total text content: ${totalTextContent} characters`);
  console.log(`   Content density: ${totalTextContent > 10000 ? '🔴 High (may overwhelm users)' : totalTextContent > 5000 ? '🟡 Medium' : '🟢 Low'}`);
}, 2000);

console.log('\n🎯 DIAGNOSIS SUMMARY:');
console.log('====================');
console.log('Based on analysis, the most likely issues are:');
console.log('1. 📸 Missing critical images causing 404 errors');
console.log('2. 📏 Oversized elements not scaling properly');
console.log('3. 🎭 Too many animations impacting performance');
console.log('4. 📄 Too much content creating cognitive overload');
console.log('5. 📱 Inconsistent responsive breakpoints');

console.log('\n🔧 RECOMMENDED FIXES:');
console.log('====================');
console.log('1. Add missing image assets or implement fallbacks');
console.log('2. Replace fixed pixel values with responsive units');
console.log('3. Reduce animation complexity for better performance');
console.log('4. Simplify content hierarchy and reduce sections');
console.log('5. Implement consistent responsive design patterns');

console.log('\n✅ Debug analysis complete. Check console for detailed results.');