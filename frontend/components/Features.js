import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, useTheme, useMediaQuery } from '@mui/material';
import { motion } from 'framer-motion';
import SpaIcon from '@mui/icons-material/Spa';
import HandymanIcon from '@mui/icons-material/Handyman';
import HourglassFullIcon from '@mui/icons-material/HourglassFull';

const Features = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));

  const features = [
    {
      icon: <SpaIcon sx={{ fontSize: { xs: 48, md: 64 } }} />,
      title: 'Natural Ingredients',
      description: 'Our products are crafted with 100% natural soy wax and essential oils, ensuring a clean and eco-friendly burning experience that\'s safe for you and the environment.',
      color: theme.palette.success.main
    },
    {
      icon: <HandymanIcon sx={{ fontSize: { xs: 48, md: 64 } }} />,
      title: 'Handcrafted Products',
      description: 'Each wax melt and candle is meticulously handcrafted in small batches to ensure the highest quality and attention to detail in every piece.',
      color: theme.palette.warning.main
    },
    {
      icon: <HourglassFullIcon sx={{ fontSize: { xs: 48, md: 64 } }} />,
      title: 'Long-lasting Scents',
      description: 'Our premium fragrance blends are specially formulated to provide hours of consistent, long-lasting aroma that transforms your space into a sanctuary.',
      color: theme.palette.secondary.main
    }
  ];

  return (
    <Box
      component="section"
      id="features"
      sx={{
        py: { xs: 8, md: 12, lg: 16 },
        backgroundColor: theme.palette.background.default,
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
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          textAlign="center"
          mb={{ xs: 8, md: 10, lg: 12 }}
        >
          <Typography
            variant="h2"
            component="h2"
            sx={{
              fontWeight: 700,
              mb: 3,
              fontSize: { xs: '2.5rem', md: '3rem', lg: '3.5rem' },
              color: theme.palette.text.primary,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Why Choose Our Products
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              maxWidth: '700px',
              mx: 'auto',
              fontWeight: 400,
              fontSize: { xs: '1.1rem', md: '1.25rem' },
              lineHeight: 1.6,
            }}
          >
            Discover the exceptional qualities that make our wax melts and candles stand out
          </Typography>
        </Box>

        <Grid
          container
          spacing={{ xs: 4, md: 6, lg: 8 }}
          justifyContent="center"
        >
          {features.map((feature, index) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              key={index}
              component={motion.div}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              viewport={{ once: true }}
            >
              <Card
                component={motion.div}
                whileHover={{
                  y: -12,
                  boxShadow: `0 20px 40px ${feature.color}30`
                }}
                transition={{ duration: 0.3 }}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  p: { xs: 4, md: 5, lg: 6 },
                  borderRadius: { xs: 3, md: 4 },
                  boxShadow: `0 8px 25px ${theme.palette.shadow}`,
                  backgroundColor: theme.palette.background.paper,
                  transition: 'all 0.4s ease',
                  border: `2px solid transparent`,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '6px',
                    background: `linear-gradient(90deg, ${feature.color}, ${feature.color}80)`,
                    transform: 'scaleX(0)',
                    transformOrigin: 'left',
                    transition: 'transform 0.4s ease',
                  },
                  '&:hover::before': {
                    transform: 'scaleX(1)',
                  },
                  '&:hover': {
                    borderColor: `${feature.color}40`,
                    transform: 'translateY(-4px)',
                  }
                }}
              >
                {/* Icon Container */}
                <Box
                  component={motion.div}
                  whileHover={{
                    scale: 1.15,
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 0.6 }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: { xs: 100, md: 120 },
                    height: { xs: 100, md: 120 },
                    borderRadius: '50%',
                    backgroundColor: `${feature.color}15`,
                    color: feature.color,
                    mb: { xs: 3, md: 4 },
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: -10,
                      left: -10,
                      right: -10,
                      bottom: -10,
                      borderRadius: '50%',
                      background: `radial-gradient(circle, ${feature.color}10 0%, transparent 70%)`,
                      zIndex: -1,
                    }
                  }}
                >
                  {feature.icon}
                </Box>

                <CardContent sx={{ p: 0, flexGrow: 1, width: '100%' }}>
                  <Typography
                    variant="h5"
                    component="h3"
                    sx={{
                      fontWeight: 700,
                      mb: 3,
                      fontSize: { xs: '1.4rem', md: '1.5rem', lg: '1.6rem' },
                      color: theme.palette.text.primary,
                      lineHeight: 1.3,
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                      lineHeight: 1.7,
                      fontSize: { xs: '1rem', md: '1.1rem' },
                      fontWeight: 400,
                    }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Features;