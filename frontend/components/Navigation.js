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
  useTheme,
  useMediaQuery,
  Container,
  Badge,
  useScrollTrigger,
  Slide
} from '@mui/material';
import { motion } from 'framer-motion';
import MenuIcon from '@mui/icons-material/Menu';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import SkipLink from './SkipLink';

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
  const drawerRef = useRef(null);
  const firstFocusableRef = useRef(null);
  const lastFocusableRef = useRef(null);

  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 50,
  });

  const navLinks = [
    { name: 'Home', href: '/', icon: null },
    { name: 'Products', href: '/products', icon: null },
    { name: 'Categories', href: '/category/wax-melts', icon: null },
    { name: 'About', href: '/#about', icon: null },
    { name: 'Contact', href: '/#contact', icon: null },
  ];

  const userLinks = [
    { name: 'Account', href: '/account', icon: PersonIcon },
    { name: 'Orders', href: '/account/orders', icon: null },
  ];

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (mobileOpen && drawerRef.current) {
      const focusableElements = drawerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length > 0) {
        firstFocusableRef.current = focusableElements[0];
        lastFocusableRef.current = focusableElements[focusableElements.length - 1];
        firstFocusableRef.current.focus();
      }
    }
  }, [mobileOpen]);

  const handleDrawerKeyDown = useCallback((e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusableRef.current) {
          e.preventDefault();
          lastFocusableRef.current?.focus();
        }
      } else {
        if (document.activeElement === lastFocusableRef.current) {
          e.preventDefault();
          firstFocusableRef.current?.focus();
        }
      }
    } else if (e.key === 'Escape') {
      setMobileOpen(false);
    }
  }, []);

  const handleScroll = useCallback(
    throttle(() => {
      if (!isClient) return;

      try {
        const sections = navLinks
          .filter(link => link.href.startsWith('#'))
          .map(link => link.href.substring(1));

        if (router.pathname === '/account/orders') {
          setActiveSection('orders');
          return;
        }
        if (router.pathname === '/account' || router.pathname === '/account/profile') {
          setActiveSection('account');
          return;
        }

        let currentSection = 'home';
        for (const section of sections) {
          const element = document.getElementById(section);
          if (element) {
            const rect = element.getBoundingClientRect();
            const navHeight = 80;
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

  useEffect(() => {
    if (!isClient) return;

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll, isClient]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

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

    if (mobileOpen) {
      setMobileOpen(false);
    }
  }, [isClient, isMobile, mobileOpen]);

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

  const logoVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <>
      <SkipLink href="#main-content">Skip to main content</SkipLink>

      <Slide appear={false} direction="down" in={!trigger}>
        <AppBar
          ref={navRef}
          component="nav"
          position="fixed"
          elevation={trigger ? 4 : 0}
          sx={{
            backgroundColor: trigger
              ? 'rgba(250, 248, 243, 0.97)'
              : 'rgba(62, 35, 81, 0.97)',
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
                          ? 'linear-gradient(135deg, #3E2351 0%, #4A235A 100%)'
                          : 'linear-gradient(135deg, #9B59B6 0%, #6C3483 100%)',
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
                <nav role="navigation" aria-label="Main navigation">
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }} as="ul">
                    {navLinks.map((link, index) => (
                      <Box key={link.name} as="li">
                        <Button
                          component={link.href.startsWith('#') ? 'button' : Link}
                          href={link.href.startsWith('#') ? undefined : link.href}
                          onClick={link.href.startsWith('#') ? () => scrollToSection(link.href) : undefined}
                          aria-current={isLinkActive(link) ? 'page' : undefined}
                          sx={{
                            color: isLinkActive(link)
                              ? (trigger ? '#E6C88A' : '#E6C88A')
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
                                ? 'rgba(200, 182, 219, 0.15)'
                                : 'rgba(230, 200, 138, 0.12)',
                              transform: 'translateY(-1px)',
                              color: isLinkActive(link)
                                ? (trigger ? '#E6C88A' : '#E6C88A')
                                : (trigger ? theme.palette.text.primary : '#E6C88A'),
                            },
                            '&::after': isLinkActive(link) ? {
                              content: '""',
                              position: 'absolute',
                              bottom: 8,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: '40%',
                              height: '3px',
                              backgroundColor: trigger ? '#C8B6DB' : '#E6C88A',
                              borderRadius: '2px',
                            } : {},
                          }}
                        >
                          {link.name}
                        </Button>
                      </Box>
                    ))}
                  </Box>
                </nav>
              </Box>

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
                <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
                  {userLinks.map((link) => (
                    <Button
                      key={link.name}
                      component={Link}
                      href={link.href}
                      startIcon={link.icon ? React.createElement(link.icon, { fontSize: 'small' }) : null}
                      aria-current={link.href === '/account' && (router.pathname === '/account' || router.pathname === '/account/profile') ? 'page' : undefined}
                      sx={{
                        color: trigger ? theme.palette.text.primary : theme.palette.common.white,
                        fontSize: '0.9rem',
                        px: 2,
                        py: 1,
                        textTransform: 'none',
                        borderRadius: '12px',
                        '&:hover': {
                          backgroundColor: trigger
                            ? 'rgba(200, 182, 219, 0.12)'
                            : 'rgba(230, 200, 138, 0.12)',
                        }
                      }}
                    >
                      {link.name}
                    </Button>
                  ))}
                </Box>

                <IconButton
                  component={Link}
                  href="/checkout"
                  aria-label={`Shopping cart with ${cartCount} items`}
                  sx={{
                    color: trigger ? theme.palette.text.primary : theme.palette.common.white,
                    backgroundColor: trigger
                      ? 'rgba(200, 182, 219, 0.18)'
                      : 'rgba(230, 200, 138, 0.2)',
                    p: { xs: 1.5, md: 2 },
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: trigger
                        ? 'rgba(200, 182, 219, 0.28)'
                        : 'rgba(230, 200, 138, 0.3)',
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

                <IconButton
                  color="inherit"
                  aria-label="open navigation menu"
                  aria-expanded={mobileOpen}
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
                        ? 'rgba(200, 182, 219, 0.12)'
                        : 'rgba(230, 200, 138, 0.12)',
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

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        ref={drawerRef}
        onKeyDown={handleDrawerKeyDown}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: '280px',
            background: 'linear-gradient(135deg, #3E2351 0%, #4A235A 100%)',
            backdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(230, 200, 138, 0.15)',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
          role="navigation"
          aria-label="Mobile navigation menu"
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 3,
              borderBottom: '1px solid rgba(230, 200, 138, 0.15)',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontFamily: '"Playfair Display", serif',
                fontWeight: 700,
                color: '#E6C88A',
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
                  backgroundColor: 'rgba(230, 200, 138, 0.1)',
                }
              }}
              aria-label="close navigation menu"
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ flexGrow: 1, p: 2 }}>
            <List sx={{ pt: 2 }} component="ul">
              {navLinks.map((link, index) => (
                <ListItem key={link.name} disablePadding sx={{ mb: 1 }} component="li">
                  <Button
                    component={link.href.startsWith('#') ? 'button' : Link}
                    href={link.href.startsWith('#') ? undefined : link.href}
                    onClick={link.href.startsWith('#') ? () => scrollToSection(link.href) : undefined}
                    fullWidth
                    aria-current={isLinkActive(link) ? 'page' : undefined}
                    sx={{
                      justifyContent: 'flex-start',
                      color: isLinkActive(link) ? '#E6C88A' : theme.palette.common.white,
                      fontWeight: isLinkActive(link) ? 600 : 400,
                      fontSize: '1.1rem',
                      py: 2,
                      px: 3,
                      textAlign: 'left',
                      textTransform: 'none',
                      borderRadius: '12px',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(230, 200, 138, 0.1)',
                        color: '#E6C88A',
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
                        backgroundColor: '#E6C88A',
                        borderRadius: '2px',
                      } : {},
                    }}
                  >
                    {link.name}
                  </Button>
                </ListItem>
              ))}

              <Box sx={{ my: 3, borderTop: '1px solid rgba(230, 200, 138, 0.15)' }} />

              {userLinks.map((link) => (
                <ListItem key={link.name} disablePadding sx={{ mb: 1 }} component="li">
                  <Button
                    component={Link}
                    href={link.href}
                    startIcon={link.icon ? React.createElement(link.icon, { fontSize: 'small' }) : null}
                    fullWidth
                    aria-current={link.href === '/account' && (router.pathname === '/account' || router.pathname === '/account/profile') ? 'page' : undefined}
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
                        backgroundColor: 'rgba(230, 200, 138, 0.1)',
                        color: '#E6C88A',
                      },
                    }}
                  >
                    {link.name}
                  </Button>
                </ListItem>
              ))}
            </List>
          </Box>

          <Box
            sx={{
              p: 3,
              borderTop: '1px solid rgba(230, 200, 138, 0.15)',
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

      <Box sx={{
        height: { xs: 64, md: 80 }
      }} />
    </>
  );
};

export default Navigation;