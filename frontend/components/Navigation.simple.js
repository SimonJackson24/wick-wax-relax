import React, { useState, useEffect, useRef } from 'react';
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
  Badge
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import MenuIcon from '@mui/icons-material/Menu';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CloseIcon from '@mui/icons-material/Close';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';

const Navigation = () => {
  const theme = useTheme();
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [isClient, setIsClient] = useState(false);
  const navRef = useRef(null);

  // Navigation links
  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Products', href: '#products' },
    { name: 'Categories', href: '#categories' },
    { name: 'About Us', href: '#about' },
    { name: 'Contact', href: '#contact' },
    { name: 'Account', href: '/account' },
    { name: 'Orders', href: '/account/orders' },
  ];

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle scroll events for sticky header and active section detection
  useEffect(() => {
    if (!isClient) return;

    const handleScroll = () => {
      // Set sticky header when scrolled
      setIsScrolled(window.scrollY > 50);

      // Detect active section
      const sections = navLinks
        .filter(link => link.href.startsWith('#'))
        .map(link => link.href.substring(1));

      // Check for account pages
      const currentPath = router.pathname;
      if (currentPath === '/account/orders') {
        setActiveSection('orders');
        return;
      }
      if (currentPath === '/account' || currentPath === '/account/profile') {
        setActiveSection('account');
        return;
      }

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, [navLinks, router.pathname, isClient]);

  // Handle mobile menu toggle
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Handle smooth scrolling to sections
  const scrollToSection = (href) => {
    if (!isClient) return;

    if (href.startsWith('#')) {
      const sectionId = href.substring(1);
      const element = document.getElementById(sectionId);
      if (element) {
        window.scrollTo({
          top: element.offsetTop - theme.custom.spacing.headerHeight.desktop,
          behavior: 'smooth'
        });
      }
    }
    // Close mobile menu if open
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  // Check if link is active
  const isLinkActive = (link) => {
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
  };

  return (
    <>
      <AppBar
        ref={navRef}
        component="nav"
        position="fixed"
        sx={{
          backgroundColor: isScrolled
            ? theme.palette.background.overlay
            : 'rgba(26, 26, 46, 0.7)',
          backdropFilter: 'blur(10px)',
          boxShadow: isScrolled
            ? theme.custom.shape.shadows.md
            : 'none',
          transition: 'all 0.3s ease',
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Container maxWidth="xl">
          <Toolbar
            disableGutters
            sx={{
              minHeight: {
                xs: `${theme.custom.spacing.headerHeight.mobile}px`,
                md: `${theme.custom.spacing.headerHeight.desktop}px`
              },
              px: { xs: 1, md: 2 },
            }}
          >
            {/* Logo */}
            <Box
              component={motion.div}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                mr: { xs: 1, md: 3 }
              }}
            >
              <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <Image
                  src="/images/logo.webp"
                  alt="Wick Wax Relax Logo"
                  width={isMobile ? 40 : 50}
                  height={isMobile ? 40 : 50}
                  style={{ borderRadius: theme.custom.shape.borderRadius.circle }}
                />
                <Typography
                  variant="h6"
                  noWrap
                  component="span"
                  sx={{
                    ml: 1,
                    fontFamily: theme.custom.typography.h1.fontFamily,
                    fontWeight: theme.custom.typography.h1.fontWeight,
                    color: theme.palette.text.inverse,
                    fontSize: { xs: '1rem', md: '1.25rem' },
                    display: { xs: 'none', sm: 'block' },
                  }}
                >
                  Wick Wax & Relax
                </Typography>
              </Link>
            </Box>

            {/* Desktop Navigation */}
            <Box
              sx={{
                flexGrow: 1,
                display: { xs: 'none', md: 'flex' },
                justifyContent: 'center'
              }}
            >
              <Box sx={{ display: 'flex', gap: 1 }}>
                {navLinks.map((link) => (
                  <Button
                    key={link.name}
                    component={link.href.startsWith('#') ? 'button' : Link}
                    href={link.href.startsWith('#') ? undefined : link.href}
                    onClick={link.href.startsWith('#') ? () => scrollToSection(link.href) : undefined}
                    sx={{
                      color: isLinkActive(link)
                        ? theme.palette.secondary.main
                        : theme.palette.text.inverse,
                      fontWeight: isLinkActive(link)
                        ? 600
                        : 400,
                      fontSize: theme.custom.typography.button.fontSize,
                      px: 2,
                      py: 1,
                      position: 'relative',
                      textTransform: theme.custom.typography.button.textTransform,
                      borderRadius: theme.custom.shape.borderRadius.sm,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        color: theme.palette.secondary.main,
                        backgroundColor: 'rgba(255, 215, 0, 0.1)',
                      },
                      '&::after': isLinkActive(link)
                        ? {
                            content: '""',
                            position: 'absolute',
                            bottom: 0,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '30%',
                            height: '2px',
                            backgroundColor: theme.palette.secondary.main,
                          }
                        : {},
                    }}
                  >
                    {link.name}
                  </Button>
                ))}
              </Box>
            </Box>

            {/* Cart Icon */}
            <Box
              component={motion.div}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <IconButton
                component={Link}
                href="/checkout"
                aria-label="Shopping cart"
                sx={{
                  color: theme.palette.text.inverse,
                  p: { xs: 1, md: 1.5 },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                    color: theme.palette.secondary.main,
                  },
                }}
              >
                <Badge badgeContent={3} color="secondary">
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
            </Box>

            {/* Mobile Menu Icon */}
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{
                display: { md: 'none' },
                color: theme.palette.text.inverse,
                ml: 1,
              }}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: '100%',
            backgroundColor: theme.palette.background.overlay,
            backdropFilter: 'blur(10px)',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontFamily: theme.custom.typography.h1.fontFamily,
              fontWeight: theme.custom.typography.h1.fontWeight,
              color: theme.palette.text.inverse,
            }}
          >
            Menu
          </Typography>
          <IconButton
            onClick={handleDrawerToggle}
            sx={{ color: theme.palette.text.inverse }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Box
          sx={{
            width: '100%',
            px: 2,
            pb: 4,
          }}
          role="navigation"
        >
          <List>
            {navLinks.map((link) => (
              <ListItem
                key={link.name}
                disablePadding
                sx={{ mb: 1 }}
              >
                <Button
                  component={link.href.startsWith('#') ? 'button' : Link}
                  href={link.href.startsWith('#') ? undefined : link.href}
                  onClick={link.href.startsWith('#') ? () => scrollToSection(link.href) : undefined}
                  fullWidth
                  sx={{
                    justifyContent: 'flex-start',
                    color: isLinkActive(link)
                      ? theme.palette.secondary.main
                      : theme.palette.text.inverse,
                    fontWeight: isLinkActive(link)
                      ? 600
                      : 400,
                    fontSize: '1.1rem',
                    py: 1.5,
                    px: 2,
                    textAlign: 'left',
                    textTransform: theme.custom.typography.button.textTransform,
                    borderRadius: theme.custom.shape.borderRadius.md,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 215, 0, 0.1)',
                      color: theme.palette.secondary.main,
                    },
                  }}
                >
                  {link.name}
                </Button>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Spacer to prevent content from being hidden under fixed header */}
      <Box sx={{
        height: {
          xs: `${theme.custom.spacing.headerHeight.mobile}px`,
          md: `${theme.custom.spacing.headerHeight.desktop}px`
        }
      }} />
    </>
  );
};

export default Navigation;