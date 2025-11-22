import React from 'react';
import { Box, Container, Typography, Grid, Link, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { motion } from 'framer-motion';
import Image from 'next/image';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';

const Footer = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const footerLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Products', href: '#products' },
    { name: 'Categories', href: '#categories' },
    { name: 'About Us', href: '#about' },
    { name: 'Contact', href: '#contact' },
  ];

  const socialLinks = [
    { name: 'Facebook', icon: <FacebookIcon />, href: 'https://facebook.com/wickwaxrelax' },
    { name: 'Instagram', icon: <InstagramIcon />, href: 'https://instagram.com/wickwaxrelax' },
    { name: 'Twitter', icon: <TwitterIcon />, href: 'https://twitter.com/wickwaxrelax' },
  ];

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: theme.palette.primary.main,
        color: '#ffffff',
        py: { xs: 8, md: 12, lg: 16 },
        mt: 'auto',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background decoration */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '100%',
          backgroundImage: `
            radial-gradient(circle at 20% 80%, ${theme.palette.secondary.main}08 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, ${theme.palette.secondary.main}08 0%, transparent 50%)
          `,
          zIndex: 1,
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
        <Grid container spacing={{ xs: 4, md: 6, lg: 8 }}>
          {/* Company Info */}
          <Grid item xs={12} md={4}>
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.secondary.main,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: theme.palette.primary.main
                  }}
                >
                  W
                </Box>
                <Typography
                  variant="h5"
                  component="h3"
                  sx={{
                    fontWeight: 700,
                    color: '#ffffff',
                    fontSize: { xs: '1.4rem', md: '1.6rem' }
                  }}
                >
                  Wick Wax & Relax
                </Typography>
              </Box>

              <Typography
                variant="body2"
                sx={{
                  mb: 4,
                  lineHeight: 1.7,
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: { xs: '0.95rem', md: '1rem' }
                }}
              >
                Your premier destination for premium soy wax melts and candles.
                We specialize in creating handcrafted products designed to transform
                your space into a sanctuary of relaxation.
              </Typography>
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} sm={6} md={4}>
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              viewport={{ once: true }}
            >
              <Typography
                variant="h6"
                component="h4"
                sx={{
                  fontWeight: 700,
                  mb: 4,
                  fontSize: { xs: '1.2rem', md: '1.3rem' },
                  color: '#ffffff',
                  position: 'relative',
                  display: 'inline-block',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: -8,
                    left: 0,
                    width: '50px',
                    height: '3px',
                    backgroundColor: theme.palette.secondary.main,
                    borderRadius: '2px',
                  }
                }}
              >
                Quick Links
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {footerLinks.map((link, index) => (
                  <Link
                    key={index}
                    href={link.href}
                    underline="none"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      transition: 'all 0.3s ease',
                      fontSize: { xs: '0.95rem', md: '1rem' },
                      fontWeight: 500,
                      display: 'inline-flex',
                      alignItems: 'center',
                      '&:hover': {
                        color: theme.palette.secondary.main,
                        transform: 'translateX(8px)',
                      }
                    }}
                  >
                    {link.name}
                  </Link>
                ))}
              </Box>
            </Box>
          </Grid>

          {/* Contact Info */}
          <Grid item xs={12} sm={6} md={4}>
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <Typography
                variant="h6"
                component="h4"
                sx={{
                  fontWeight: 700,
                  mb: 4,
                  fontSize: { xs: '1.2rem', md: '1.3rem' },
                  color: '#ffffff',
                  position: 'relative',
                  display: 'inline-block',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: -8,
                    left: 0,
                    width: '50px',
                    height: '3px',
                    backgroundColor: theme.palette.secondary.main,
                    borderRadius: '2px',
                  }
                }}
              >
                Contact Us
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <LocationOnIcon sx={{ color: theme.palette.secondary.main, mr: 2, mt: 0.5, fontSize: '1.2rem' }} />
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      lineHeight: 1.6,
                      fontSize: { xs: '0.9rem', md: '0.95rem' }
                    }}
                  >
                    123 Relaxation Street<br />
                    Serenity City, SC 12345
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PhoneIcon sx={{ color: theme.palette.secondary.main, mr: 2, fontSize: '1.2rem' }} />
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: { xs: '0.9rem', md: '0.95rem' }
                    }}
                  >
                    (123) 456-7890
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EmailIcon sx={{ color: theme.palette.secondary.main, mr: 2, fontSize: '1.2rem' }} />
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: { xs: '0.9rem', md: '0.95rem' }
                    }}
                  >
                    info@wickwaxrelax.com
                  </Typography>
                </Box>
              </Box>

              {/* Social Media Links */}
              <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                {socialLinks.map((social, index) => (
                  <IconButton
                    key={index}
                    component="a"
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.name}
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      transition: 'all 0.3s ease',
                      width: { xs: 40, md: 44 },
                      height: { xs: 40, md: 44 },
                      '&:hover': {
                        backgroundColor: theme.palette.secondary.main,
                        color: theme.palette.primary.main,
                        transform: 'translateY(-3px)',
                        boxShadow: `0 8px 20px ${theme.palette.secondary.main}40`,
                      }
                    }}
                  >
                    {social.icon}
                  </IconButton>
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Copyright */}
        <Box
          component={motion.div}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          viewport={{ once: true }}
          sx={{
            mt: { xs: 6, md: 8, lg: 10 },
            pt: { xs: 4, md: 5, lg: 6 },
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center'
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: { xs: '0.85rem', md: '0.9rem' },
              fontWeight: 400
            }}
          >
            &copy; {new Date().getFullYear()} Wick Wax & Relax. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;