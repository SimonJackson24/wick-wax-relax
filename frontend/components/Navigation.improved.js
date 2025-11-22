import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useTheme,
  useMediaQuery,
  Container,
  Badge,
  Fab,
  useScrollTrigger,
  Slide,
  Fade
} from '@mui/material';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import MenuIcon from '@mui/icons-material/Menu';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';

// Throttle function for performance
const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

const Navigation = () => {
  const theme = useTheme();
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [isClient, setIsClient] = useState(false);
  const [cartCount, setCartCount] = useState(3); // This would come from context/state
  const navRef = useRef(null);

  // Use MUI's scroll trigger for better performance
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 50,
  });

  // Navigation links with better organization
  const navLinks = [
    { name: 'Home', href: '#home', icon: null },
    { name: 'Products', href: '#products', icon: null },
    { name: 'Categories', href: '#categories', icon: null },
    { name: 'About', href: '#about', icon: null },
    { name: 'Contact', href: '#contact', icon: null },
  ];

  const userLinks = [
    { name: 'Account', href: '/account', icon: PersonIcon },
    { name: 'Orders', href: '/account/orders', icon: null },
  ];

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Optimized scroll handler with throttling
  const handleScroll = useCallback(
    throttle(() => {
      if (!isClient) return;

      try {
        // Update active section based on scroll position
        const sections = navLinks
          .filter(link => link.href.startsWith('#'))
          .map(link => link.href.substring(1));

        // Check current page first
        if (router.pathname === '/account/orders') {
          setActiveSection('orders');
          return;
        }
        if (router.pathname === '/account' || router.pathname === '/account/profile') {
          setActiveSection('account');
          return;
        }

        // Find active section based on scroll position
        let currentSection = 'home';
        for (const section of sections) {
          const element = document.getElementById(section);
          if (element) {
            const rect = element.getBoundingClientRect();
            const navHeight = 80; // Approximate nav height
            if (rect.top <= navHeight + 50 && rect.bottom >= navHeight) {
              currentSection = section;
              break;
            }
          }
        }
        setActiveSection(currentSection);
      } catch (error) {
        console.warn('Error in scroll handler:', error);
      }
    }, 100),
    [isClient, router.pathname, navLinks]
  );

  // Set up scroll listener
  useEffect(() => {
    if (!isClient) return;

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll, isClient]);

  // Handle mobile menu toggle
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Handle smooth scrolling to sections
  const scrollToSection = useCallback((href) => {
    if (!isClient) return;

    if (href.startsWith('#')) {
      try {
        const sectionId = href.substring(1);
        const element = document.getElementById(sectionId);
        if (element) {
          const navHeight = isMobile ? 64 : 80;
          const offsetTop = element.offsetTop - navHeight;

          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      } catch (error) {
        console.warn('Error scrolling to section:', error);
      }
    }

    // Close mobile menu
    if (mobileOpen) {
      setMobileOpen(false);
    }
  }, [isClient, isMobile, mobileOpen]);

  // Check if link is active
  const isLinkActive = useCallback((link) => {
    if (!isClient) return false;

    if (link.href.startsWith('#')) {
      return activeSection === link.href.substring(1);
    }

    if (link.href === '/account') {
      return router.pathname === '/account' || router.pathname === '/account/profile';
    }

    if (link.href === '/account/orders') {
      return router.pathname === '/account/orders';
    }

    return false;
  }, [activeSection, router.pathname, isClient]);

  // Animation variants
  const logoVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.5 }
  };

  const navItemVariants = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  };

  return (
    <>
      {/* Hide/show animation for the entire nav bar */}
      <Slide appear={false} direction="down" in={!trigger}>
        <AppBar
          ref={navRef}
          component="nav"
          position="fixed"
          elevation={trigger ? 4 : 0}
          sx={{
            backgroundColor: trigger
              ? 'rgba(255, 255, 255, 0.95)'
              : 'rgba(26, 26, 46, 0.9)',
            backdropFilter: 'blur(20px)',
            borderBottom: trigger ? '1px solid rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: theme.zIndex.appBar,
          }}
        >
          <Container maxWidth="xl">
            <Toolbar
              disableGutters
              sx={{
                minHeight: { xs: 64, md: 80 },
                px: { xs: 2, md: 3 },
                py: 1,
              }}
            >
              {/* Logo Section */}
              <Box
                component={motion.div}
                {...logoVariants}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mr: { xs: 2, md: 4 }
                }}
              >
                <Link href="/" style={{ textDecoration: 'none' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease',
                      '&:hover': {
                        transform: 'scale(1.02)'
                      }
                    }}
                  >
                    <Image
                      src="/images/logo.webp"
                      alt="Wick Wax Relax Logo"
                      width={isMobile ? 40 : 48}
                      height={isMobile ? 40 : 48}
                      style={{
                        borderRadius: '12px',
                        objectFit: 'cover'
                      }}
                      priority
                    />
                    <Typography
                      variant="h6"
                      noWrap
                      component="span"
                      sx={{
                        ml: 2,
                        fontFamily: '"Playfair Display", serif',
                        fontWeight: 700,
                        fontSize: { xs: '1.1rem', md: '1.4rem' },
                        background: trigger
                          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
                          : 'linear-gradient(135deg, #ffd700 0%, #ffb347 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        display: { xs: 'none', sm: 'block' },
                      }}
                    >
                      Wick Wax & Relax
                    </Typography>
                  </Box>
                </Link>
              </Box>

              {/* Desktop Navigation */}
              <Box
                component={motion.div}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                sx={{
                  flexGrow: 1,
                  display: { xs: 'none', md: 'flex' },
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  {navLinks.map((link, index) => (
                    <Button
                      key={link.name}
                      component={link.href.startsWith('#') ? 'button' : Link}
                      href={link.href.startsWith('#') ? undefined : link.href}
                      onClick={link.href.startsWith('#') ? () => scrollToSection(link.href) : undefined}
                      sx={{
                        color: isLinkActive(link)
                          ? (trigger ? theme.palette.primary.main : '#ffd700')
                          : (trigger ? theme.palette.text.primary : theme.palette.common.white),
                        fontWeight: isLinkActive(link) ? 600 : 500,
                        fontSize: '0.95rem',
                        px: 3,
                        py: 1.5,
                        position: 'relative',
                        textTransform: 'none',
                        borderRadius: '12px',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: trigger
                            ? 'rgba(25, 118, 210, 0.08)'
                            : 'rgba(255, 215, 0, 0.1)',
                          transform: 'translateY(-1px)',
                          color: isLinkActive(link)
                            ? (trigger ? theme.palette.primary.main : '#ffd700')
                            : (trigger ? theme.palette.primary.main : '#ffd700'),
                        },
                        '&::after': isLinkActive(link) ? {
                          content: '""',
                          position: 'absolute',
                          bottom: 8,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '40%',
                          height: '3px',
                          backgroundColor: trigger ? theme.palette.primary.main : '#ffd700',
                          borderRadius: '2px',
                        } : {},
                      }}
                    >
                      {link.name}
                    </Button>
                  ))}
                </Box>
              </Box>

              {/* User Actions */}
              <Box
                component={motion.div}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                {/* Account Links - Desktop */}
                <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
                  {userLinks.map((link) => (
                    <Button
                      key={link.name}
                      component={Link}
                      href={link.href}
                      startIcon={link.icon ? React.createElement(link.icon, { fontSize: 'small' }) : null}
                      sx={{
                        color: trigger ? theme.palette.text.primary : theme.palette.common.white,
                        fontSize: '0.9rem',
                        px: 2,
                        py: 1,
                        textTransform: 'none',
                        borderRadius: '12px',
                        '&:hover': {
                          backgroundColor: trigger
                            ? 'rgba(25, 118, 210, 0.08)'
                            : 'rgba(255, 215, 0, 0.1)',
                        }
                      }}
                    >
                      {link.name}
                    </Button>
                  ))}
                </Box>

                {/* Cart Button */}
                <IconButton
                  component={Link}
                  href="/checkout"
                  aria-label={`Shopping cart with ${cartCount} items`}
                  sx={{
                    color: trigger ? theme.palette.text.primary : theme.palette.common.white,
                    backgroundColor: trigger
                      ? 'rgba(25, 118, 210, 0.1)'
                      : 'rgba(255, 215, 0, 0.2)',
                    p: { xs: 1.5, md: 2 },
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: trigger
                        ? 'rgba(25, 118, 210, 0.2)'
                        : 'rgba(255, 215, 0, 0.3)',
                      transform: 'scale(1.05)',
                    }
                  }}
                >
                  <Badge
                    badgeContent={cartCount}
                    color="error"
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.7rem',
                        minWidth: '18px',
                        height: '18px',
                      }
                    }}
                  >
                    <ShoppingCartIcon />
                  </Badge>
                </IconButton>

                {/* Mobile Menu Button */}
                <IconButton
                  color="inherit"
                  aria-label="open navigation menu"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{
                    display: { md: 'none' },
                    color: trigger ? theme.palette.text.primary : theme.palette.common.white,
                    ml: 1,
                    p: 1.5,
                    borderRadius: '12px',
                    '&:hover': {
                      backgroundColor: trigger
                        ? 'rgba(25, 118, 210, 0.08)'
                        : 'rgba(255, 215, 0, 0.1)',
                    }
                  }}
                >
                  <MenuIcon />
                </IconButton>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
      </Slide>

      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: '280px',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            backdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 3,
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontFamily: '"Playfair Display", serif',
                fontWeight: 700,
                color: '#ffd700',
                fontSize: '1.3rem',
              }}
            >
              Menu
            </Typography>
            <IconButton
              onClick={handleDrawerToggle}
              sx={{
                color: theme.palette.common.white,
                '&:hover': {
                  backgroundColor: 'rgba(255, 215, 0, 0.1)',
                }
              }}
              aria-label="close navigation menu"
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Navigation Links */}
          <Box sx={{ flexGrow: 1, p: 2 }}>
            <List sx={{ pt: 2 }}>
              {/* Main Navigation */}
              {navLinks.map((link, index) => (
                <ListItem key={link.name} disablePadding sx={{ mb: 1 }}>
                  <Button
                    component={link.href.startsWith('#') ? 'button' : Link}
                    href={link.href.startsWith('#') ? undefined : link.href}
                    onClick={link.href.startsWith('#') ? () => scrollToSection(link.href) : undefined}
                    fullWidth
                    sx={{
                      justifyContent: 'flex-start',
                      color: isLinkActive(link) ? '#ffd700' : theme.palette.common.white,
                      fontWeight: isLinkActive(link) ? 600 : 400,
                      fontSize: '1.1rem',
                      py: 2,
                      px: 3,
                      textAlign: 'left',
                      textTransform: 'none',
                      borderRadius: '12px',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 215, 0, 0.1)',
                        color: '#ffd700',
                        transform: 'translateX(4px)',
                      },
                      '&::before': isLinkActive(link) ? {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '4px',
                        height: '60%',
                        backgroundColor: '#ffd700',
                        borderRadius: '2px',
                      } : {},
                    }}
                  >
                    {link.name}
                  </Button>
                </ListItem>
              ))}

              {/* Divider */}
              <Box sx={{ my: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }} />

              {/* User Links */}
              {userLinks.map((link) => (
                <ListItem key={link.name} disablePadding sx={{ mb: 1 }}>
                  <Button
                    component={Link}
                    href={link.href}
                    startIcon={link.icon ? React.createElement(link.icon, { fontSize: 'small' }) : null}
                    fullWidth
                    sx={{
                      justifyContent: 'flex-start',
                      color: theme.palette.common.white,
                      fontSize: '1rem',
                      py: 1.5,
                      px: 3,
                      textAlign: 'left',
                      textTransform: 'none',
                      borderRadius: '12px',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 215, 0, 0.1)',
                        color: '#ffd700',
                      },
                    }}
                  >
                    {link.name}
                  </Button>
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Footer */}
          <Box
            sx={{
              p: 3,
              borderTop: '1px solid rgba(255,255,255,0.1)',
              textAlign: 'center',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.9rem',
              }}
            >
              © 2024 Wick Wax & Relax
            </Typography>
          </Box>
        </Box>
      </Drawer>

      {/* Spacer to prevent content from being hidden under fixed header */}
      <Box sx={{
        height: { xs: 64, md: 80 }
      }} />
    </>
  );
};

export default Navigation;