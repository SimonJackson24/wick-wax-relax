import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, AppBar, Toolbar, Typography, Button, IconButton, Drawer, List, ListItem,
  useTheme, useMediaQuery, Container, Badge, useScrollTrigger, Slide, CircularProgress,
  Avatar, Menu, MenuItem
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import MenuIcon from '@mui/icons-material/Menu';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LogoutIcon from '@mui/icons-material/Logout';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import SkipLink from './SkipLink';
import axios from 'axios';
import { useAuth } from './AuthContext';

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

const NavigationWithCategories = () => {
  const theme = useTheme();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [isClient, setIsClient] = useState(false);
  const [cartCount, setCartCount] = useState(3);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const navRef = useRef(null);
  const drawerRef = useRef(null);
  const firstFocusableRef = useRef(null);
  const lastFocusableRef = useRef(null);
  const categoriesTriggerRef = useRef(null);
  const categoriesDropdownRef = useRef(null);

  const trigger = useScrollTrigger({ disableHysteresis: true, threshold: 50 });

  const navLinks = [
    { name: 'Home', href: '/', icon: null },
    { name: 'Products', href: '/products', icon: null },
    { name: 'About', href: '/#about', icon: null },
    { name: 'Contact', href: '/#contact', icon: null },
  ];

  const handleUserMenuOpen = (event) => setUserMenuAnchor(event.currentTarget);
  const handleUserMenuClose = () => setUserMenuAnchor(null);

  const handleLogout = async () => {
    handleUserMenuClose();
    await logout();
    router.push('/');
  };

  useEffect(() => setIsClient(true), []);

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

  useEffect(() => {
    if (categoriesOpen && categories.length === 0) fetchCategories();
  }, [categoriesOpen]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await axios.get('/api/categories');
      setCategories(response.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([
        { id: 1, name: 'Wax Melts', slug: 'wax-melts' },
        { id: 2, name: 'Candles', slug: 'candles' },
        { id: 3, name: 'Diffusers', slug: 'diffusers' },
        { id: 4, name: 'Accessories', slug: 'accessories' },
      ]);
    } finally {
      setLoadingCategories(false);
    }
  };

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
        const sections = navLinks.filter(link => link.href.startsWith('#')).map(link => link.href.substring(1));
        if (router.pathname === '/account/orders') { setActiveSection('orders'); return; }
        if (router.pathname === '/account' || router.pathname === '/account/profile') { setActiveSection('account'); return; }
        let currentSection = 'home';
        for (const section of sections) {
          const element = document.getElementById(section);
          if (element) {
            const rect = element.getBoundingClientRect();
            const navHeight = 80;
            if (rect.top <= navHeight + 50 && rect.bottom >= navHeight) { currentSection = section; break; }
          }
        }
        setActiveSection(currentSection);
      } catch (error) { console.warn('Error in scroll handler:', error); }
    }, 100),
    [isClient, router.pathname, navLinks]
  );

  useEffect(() => {
    if (!isClient) return;
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll, isClient]);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const scrollToSection = useCallback((href) => {
    if (!isClient) return;
    if (href.startsWith('#')) {
      try {
        const sectionId = href.substring(1);
        const element = document.getElementById(sectionId);
        if (element) {
          const navHeight = isMobile ? 64 : 80;
          window.scrollTo({ top: element.offsetTop - navHeight, behavior: 'smooth' });
        }
      } catch (error) { console.warn('Error scrolling to section:', error); }
    }
    if (mobileOpen) setMobileOpen(false);
  }, [isClient, isMobile, mobileOpen]);

  const isLinkActive = useCallback((link) => {
    if (!isClient) return false;
    if (link.href.startsWith('#')) return activeSection === link.href.substring(1);
    if (link.href === '/account') return router.pathname === '/account' || router.pathname === '/account/profile';
    if (link.href === '/account/orders') return router.pathname === '/account/orders';
    return false;
  }, [activeSection, router.pathname, isClient]);

  const handleCategoriesEnter = () => setCategoriesOpen(true);
  const handleCategoriesLeave = () => setTimeout(() => setCategoriesOpen(false), 150);
  const handleCategoryClick = (slug) => { setCategoriesOpen(false); router.push(`/category/${slug}`); };

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
            backgroundColor: trigger ? 'rgba(250, 248, 243, 0.97)' : 'rgba(62, 35, 75, 0.97)',
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
                sx={{ display: 'flex', alignItems: 'center', mr: { xs: 2, md: 4 } }}
              >
                <Link href="/" style={{ textDecoration: 'none' }}>
                  <Box
                    sx={{
                      display: 'flex', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.2s ease',
                      '&:hover': { transform: 'scale(1.02)' }
                    }}
                  >
                    <Image
                      src="/images/logo.webp"
                      alt="Wick Wax Relax Logo"
                      width={isMobile ? 40 : 48}
                      height={isMobile ? 40 : 48}
                      style={{ borderRadius: '12px', objectFit: 'cover' }}
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
                          ? 'linear-gradient(135deg, rgba(250,248,243,0.97) 0%, rgba(250,248,243,0.95) 100%)'
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
                  flexGrow: 1, display: { xs: 'none', md: 'flex' },
                  justifyContent: 'center', alignItems: 'center'
                }}
              >
                <nav role="navigation" aria-label="Main navigation">
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }} as="ul">
                    {navLinks.map((link, index) => (
                      <Box key={link.name} as="li">
                        <Button
                          component={link.href.startsWith('#') ? 'button' : Link}
                          href={link.href.startsWith('#') ? undefined : link.href}
                          onClick={link.href.startsWith('#') ? () => scrollToSection(link.href) : undefined}
                          aria-current={isLinkActive(link) ? 'page' : undefined}
                          sx={{
                            color: isLinkActive(link)
                              ? (trigger ? '#C8B6DB' : '#C8B6DB')
                              : (trigger ? theme.palette.text.primary : theme.palette.common.white),
                            fontWeight: isLinkActive(link) ? 600 : 500,
                            fontSize: '0.95rem', px: 2, py: 1.5,
                            position: 'relative', textTransform: 'none', borderRadius: '12px',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              backgroundColor: trigger
                                ? 'rgba(200, 182, 219, 0.15)'
                                : 'rgba(155, 89, 182, 0.15)',
                              transform: 'translateY(-1px)',
                              color: isLinkActive(link)
                                ? (trigger ? '#C8B6DB' : '#9B59B6')
                                : (trigger ? theme.palette.text.primary : '#C8B6DB'),
                            },
                            '&::after': isLinkActive(link) ? {
                              content: '""',
                              position: 'absolute',
                              bottom: 8,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: '40%',
                              height: '3px',
                              backgroundColor: trigger ? '#C8B6DB' : '#9B59B6',
                              borderRadius: '2px',
                            } : {},
                          }}
                        >
                          {link.name}
                        </Button>
                      </Box>
                    ))}

                    <Box as="li" ref={categoriesTriggerRef} sx={{ position: 'relative' }}>
                      <Button
                        onClick={() => setCategoriesOpen(!categoriesOpen)}
                        onMouseEnter={handleCategoriesEnter}
                        aria-expanded={categoriesOpen}
                        aria-haspopup="true"
                        sx={{
                          color: router.pathname.startsWith('/category')
                            ? '#C8B6DB'
                            : (trigger ? theme.palette.text.primary : theme.palette.common.white),
                          fontWeight: router.pathname.startsWith('/category') ? 600 : 500,
                          fontSize: '0.95rem', px: 2, py: 1.5,
                          textTransform: 'none', borderRadius: '12px',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            backgroundColor: trigger
                              ? 'rgba(200, 182, 219, 0.15)'
                              : 'rgba(155, 89, 182, 0.15)',
                            color: '#C8B6DB',
                          },
                        }}
                        endIcon={<KeyboardArrowDownIcon sx={{ transform: categoriesOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />}
                      >
                        Categories
                      </Button>

                      <AnimatePresence>
                        {categoriesOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1300 }}
                            ref={categoriesDropdownRef}
                            onMouseLeave={handleCategoriesLeave}
                          >
                            <Box
                              sx={{
                                mt: 1, minWidth: 280, maxWidth: 320,
                                backgroundColor: 'rgba(250, 248, 243, 0.98)',
                                borderRadius: 2,
                                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                border: '1px solid rgba(0,0,0,0.08)',
                                overflow: 'hidden'
                              }}
                            >
                              {loadingCategories ? (
                                <Box sx={{ p: 3, textAlign: 'center' }}>
                                  <CircularProgress size={24} />
                                  <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">Loading categories...</Typography>
                                </Box>
                              ) : (
                                <List sx={{ py: 1 }}>
                                  {categories.map((category) => (
                                    <ListItem key={category.id} disablePadding>
                                      <Button
                                        onClick={() => handleCategoryClick(category.slug)}
                                        sx={{
                                          width: '100%', justifyContent: 'flex-start', textAlign: 'left',
                                          py: 1.5, px: 3, color: theme.palette.text.primary,
                                          textTransform: 'none', borderRadius: 0,
                                          '&:hover': {
                                            backgroundColor: 'rgba(200, 182, 219, 0.15)',
                                            color: theme.palette.primary.main,
                                          },
                                        }}
                                      >
                                        {category.name}
                                      </Button>
                                    </ListItem>
                                  ))}
                                </List>
                              )}
                              <Box sx={{ borderTop: '1px solid rgba(0,0,0,0.08)', p: 2 }}>
                                <Link href="/products" style={{ textDecoration: 'none' }}>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: theme.palette.primary.main, textAlign: 'center', cursor: 'pointer',
                                      '&:hover': { textDecoration: 'underline' },
                                    }}
                                  >
                                    View All Products →
                                  </Typography>
                                </Link>
                              </Box>
                            </Box>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Box>
                  </Box>
                </nav>
              </Box>

              <Box
                component={motion.div}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
                  {isAuthenticated ? (
                    <>
                      <Button
                        onClick={handleUserMenuOpen}
                        aria-controls="user-menu"
                        aria-haspopup="true"
                        startIcon={<Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main' }}>{user?.firstName?.[0] || user?.email?.[0] || 'U'}</Avatar>}
                        sx={{
                          color: trigger ? theme.palette.text.primary : theme.palette.common.white,
                          fontSize: '0.9rem', px: 2, py: 1, textTransform: 'none', borderRadius: '12px',
                          '&:hover': {
                            backgroundColor: trigger ? 'rgba(200, 182, 219, 0.12)' : 'rgba(155, 89, 182, 0.15)',
                          },
                        }}
                      >
                        {user?.firstName || 'Account'}
                      </Button>
                      <Menu
                        id="user-menu"
                        anchorEl={userMenuAnchor}
                        open={Boolean(userMenuAnchor)}
                        onClose={handleUserMenuClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                      >
                        <MenuItem onClick={() => { handleUserMenuClose(); router.push('/account'); }}><PersonIcon sx={{ mr: 1, fontSize: 20 }} /> Account</MenuItem>
                        <MenuItem onClick={() => { handleUserMenuClose(); router.push('/account/orders'); }}>Orders</MenuItem>
                        <MenuItem onClick={handleLogout}><LogoutIcon sx={{ mr: 1, fontSize: 20 }} /> Logout</MenuItem>
                      </Menu>
                    </>
                  ) : (
                    <>
                      <Button
                        component={Link}
                        href="/auth/login"
                        sx={{
                          color: trigger ? theme.palette.text.primary : theme.palette.common.white,
                          fontSize: '0.9rem', px: 2, py: 1, textTransform: 'none', borderRadius: '12px',
                          '&:hover': {
                            backgroundColor: trigger ? 'rgba(200, 182, 219, 0.12)' : 'rgba(155, 89, 182, 0.15)',
                          },
                        }}
                      >
                        Login
                      </Button>
                      <Button
                        component={Link}
                        href="/auth/signup"
                        variant="outlined"
                        sx={{
                          color: theme.palette.common.white,
                          fontSize: '0.9rem', px: 2, py: 1, textTransform: 'none', borderRadius: '12px',
                          borderColor: 'rgba(255,255,255,0.3)',
                          '&:hover': {
                            borderColor: 'rgba(255,255,255,0.6)',
                            backgroundColor: 'rgba(155, 89, 182, 0.15)',
                          },
                        }}
                      >
                        Sign Up
                      </Button>
                    </>
                  )}
                </Box>

                <IconButton
                  component={Link}
                  href="/checkout"
                  aria-label={`Shopping cart with ${cartCount} items`}
                  sx={{
                    color: trigger ? theme.palette.text.primary : theme.palette.common.white,
                    backgroundColor: trigger ? 'rgba(200, 182, 219, 0.18)' : 'rgba(155, 89, 182, 0.25)',
                    p: { xs: 1.5, md: 2 },
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: trigger ? 'rgba(200, 182, 219, 0.28)' : 'rgba(155, 89, 182, 0.35)',
                      transform: 'scale(1.05)',
                    }
                  }}
                >
                  <Badge
                    badgeContent={cartCount}
                    color="error"
                    sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem', minWidth: '18px', height: '18px' } }}
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
                    ml: 1, p: 1.5, borderRadius: '12px',
                    '&:hover': {
                      backgroundColor: trigger ? 'rgba(200, 182, 219, 0.12)' : 'rgba(155, 89, 182, 0.15)',
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
        ModalProps={{ keepMounted: true }}
        ref={drawerRef}
        onKeyDown={handleDrawerKeyDown}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: '280px',
            background: 'linear-gradient(135deg, #3E2351 0%, #4A235A 100%)',
            backdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(200, 182, 219, 0.15)',
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }} role="navigation" aria-label="Mobile navigation menu">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, borderBottom: '1px solid rgba(200, 182, 219, 0.15)' }}>
            <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: '#C8B6DB' }}>Menu</Typography>
            <IconButton
              onClick={handleDrawerToggle}
              sx={{ color: theme.palette.common.white, '&:hover': { backgroundColor: 'rgba(200, 182, 219, 0.1)' } }}
              aria-label="close navigation menu"
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <List sx={{ flex: 1, py: 2 }}>
            {navLinks.map((link) => (
              <ListItem key={link.name} disablePadding>
                <Button
                  component={link.href.startsWith('#') ? 'button' : Link}
                  href={link.href.startsWith('#') ? undefined : link.href}
                  onClick={link.href.startsWith('#')
                    ? (e) => { e.preventDefault(); scrollToSection(link.href); }
                    : handleDrawerToggle
                  }
                  sx={{
                    width: '100%', justifyContent: 'flex-start', color: theme.palette.common.white,
                    py: 2, px: 3, textTransform: 'none', borderRadius: 0,
                    '&:hover': { backgroundColor: 'rgba(155, 89, 182, 0.1)' },
                  }}
                >
                  {link.name}
                </Button>
              </ListItem>
            ))}

            <ListItem disablePadding>
              <Button
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                sx={{
                  width: '100%', justifyContent: 'flex-start', color: theme.palette.common.white,
                  py: 2, px: 3, textTransform: 'none', borderRadius: 0,
                  '&:hover': { backgroundColor: 'rgba(155, 89, 182, 0.1)' },
                }}
                endIcon={<KeyboardArrowDownIcon sx={{ transform: categoriesOpen ? 'rotate(180deg)' : 'rotate(0)' }} />}
              >
                Categories
              </Button>
            </ListItem>

            {categoriesOpen && (
              <Box sx={{ pl: 2 }}>
                {categories.map((category) => (
                  <ListItem key={category.id} disablePadding>
                    <Button
                      onClick={() => { handleCategoryClick(category.slug); handleDrawerToggle(); }}
                      sx={{
                        width: '100%', justifyContent: 'flex-start', color: 'rgba(255,255,255,0.8)',
                        py: 1.5, px: 3, textTransform: 'none', fontSize: '0.9rem', borderRadius: 0,
                        '&:hover': { backgroundColor: 'rgba(155, 89, 182, 0.15)', color: '#C8B6DB' },
                      }}
                    >
                      {category.name}
                    </Button>
                  </ListItem>
                ))}
              </Box>
            )}

            <Box sx={{ borderBottom: '1px solid rgba(200, 182, 219, 0.15)', my: 2 }} />

            {isAuthenticated ? (
              <>
                <ListItem disablePadding>
                  <Button
                    component={Link}
                    href="/account"
                    onClick={handleDrawerToggle}
                    startIcon={<PersonIcon sx={{ fontSize: 'small', color: 'inherit' }} />}
                    sx={{
                      width: '100%', justifyContent: 'flex-start', color: theme.palette.common.white,
                      py: 2, px: 3, textTransform: 'none', borderRadius: 0,
                      '&:hover': { backgroundColor: 'rgba(155, 89, 182, 0.1)' },
                    }}
                  >
                    Account
                  </Button>
                </ListItem>
                <ListItem disablePadding>
                  <Button
                    component={Link}
                    href="/account/orders"
                    onClick={handleDrawerToggle}
                    sx={{
                      width: '100%', justifyContent: 'flex-start', color: theme.palette.common.white,
                      py: 2, px: 3, textTransform: 'none', borderRadius: 0,
                      '&:hover': { backgroundColor: 'rgba(155, 89, 182, 0.1)' },
                    }}
                  >
                    Orders
                  </Button>
                </ListItem>
                <ListItem disablePadding>
                  <Button
                    onClick={() => { handleDrawerToggle(); handleLogout(); }}
                    startIcon={<LogoutIcon sx={{ fontSize: 'small', color: 'inherit' }} />}
                    sx={{
                      width: '100%', justifyContent: 'flex-start', color: theme.palette.common.white,
                      py: 2, px: 3, textTransform: 'none', borderRadius: 0,
                      '&:hover': { backgroundColor: 'rgba(155, 89, 182, 0.1)' },
                    }}
                  >
                    Logout
                  </Button>
                </ListItem>
              </>
            ) : (
              <>
                <ListItem disablePadding>
                  <Button
                    component={Link}
                    href="/auth/login"
                    onClick={handleDrawerToggle}
                    sx={{
                      width: '100%', justifyContent: 'flex-start', color: theme.palette.common.white,
                      py: 2, px: 3, textTransform: 'none', borderRadius: 0,
                      '&:hover': { backgroundColor: 'rgba(155, 89, 182, 0.1)' },
                    }}
                  >
                    Login
                  </Button>
                </ListItem>
                <ListItem disablePadding>
                  <Button
                    component={Link}
                    href="/auth/signup"
                    onClick={handleDrawerToggle}
                    sx={{
                      width: '100%', justifyContent: 'flex-start', color: '#C8B6DB',
                      py: 2, px: 3, textTransform: 'none', borderRadius: 0,
                      '&:hover': { backgroundColor: 'rgba(155, 89, 182, 0.1)' },
                    }}
                  >
                    Sign Up
                  </Button>
                </ListItem>
              </>
            )}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default NavigationWithCategories;