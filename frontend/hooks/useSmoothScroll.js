import { useEffect } from 'react';

const useSmoothScroll = () => {
  useEffect(() => {
    // Add smooth scrolling behavior to the entire document
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Handle anchor links for smooth scrolling
    const handleAnchorClick = (e) => {
      const target = e.target.closest('a[href^="#"]');
      if (!target) return;
      
      const href = target.getAttribute('href');
      if (href === '#') return;
      
      const elementId = href.substring(1);
      const element = document.getElementById(elementId);
      
      if (element) {
        e.preventDefault();
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // Update URL without triggering navigation
        window.history.pushState(null, null, href);
      }
    };
    
    // Add event listener to the document
    document.addEventListener('click', handleAnchorClick);
    
    // Clean up the event listener on component unmount
    return () => {
      document.removeEventListener('click', handleAnchorClick);
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);
};

export default useSmoothScroll;