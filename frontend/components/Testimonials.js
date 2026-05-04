import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Rating,
  useTheme
} from '@mui/material';
import { motion } from 'framer-motion';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import VerifiedIcon from '@mui/icons-material/Verified';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    location: 'London, UK',
    rating: 5,
    text: 'The lavender wax melts have transformed my evening routine. The scent is so relaxing and lasts for hours!',
    product: 'Lavender Dreams Wax Melts',
    verified: true,
    date: '2 weeks ago'
  },
  {
    id: 2,
    name: 'Michael Chen',
    location: 'Manchester, UK',
    rating: 5,
    text: 'I bought the citrus candle as a gift and my friend absolutely loved it. The packaging was beautiful and the scent was amazing.',
    product: 'Citrus Burst Candle',
    verified: true,
    date: '1 month ago'
  },
  {
    id: 3,
    name: 'Emma Wilson',
    location: 'Bristol, UK',
    rating: 5,
    text: 'The bath bombs are incredible! They leave my skin feeling so soft and the scents are divine. Will definitely order again.',
    product: 'Rose Garden Bath Bomb',
    verified: true,
    date: '3 weeks ago'
  },
  {
    id: 4,
    name: 'James Taylor',
    location: 'Edinburgh, UK',
    rating: 5,
    text: 'The reed diffuser fills my entire living room with a subtle, pleasant fragrance. It lasts for months!',
    product: 'Ocean Breeze Reed Diffuser',
    verified: true,
    date: '6 weeks ago'
  },
  {
    id: 5,
    name: 'Olivia Brown',
    location: 'Birmingham, UK',
    rating: 5,
    text: 'I\'ve tried many wax melts before, but none compare to the quality and longevity of Wick Wax Relax products.',
    product: 'Vanilla Bean Wax Melts',
    verified: true,
    date: '1 week ago'
  },
  {
    id: 6,
    name: 'William Davis',
    location: 'Leeds, UK',
    rating: 5,
    text: 'The seasonal collection is always fantastic. The autumn spices made my home feel so cozy and welcoming.',
    product: 'Autumn Spice Collection',
    verified: true,
    date: '2 months ago'
  }
];

const Testimonials = () => {
  const theme = useTheme();
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };
  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6 } }
  };

  return (
    <Box sx={{ py: 8, bgcolor: theme.palette.background.paper }}>
      <Container maxWidth="lg">
        <Box
          component={motion.div}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          sx={{ textAlign: 'center', mb: 6 }}
        >
          <Typography
            variant="h3"
            component="h2"
            gutterBottom
            sx={{
              fontFamily: '"Playfair Display", serif',
              fontWeight: 400,
              color: theme.palette.text.primary
            }}
          >
            What Our Customers Say
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 1 }}>
            <Rating value={4.9} precision={0.1} readOnly size="medium" sx={{ color: theme.palette.secondary.main }} />
            <Typography variant="body1" color="text.secondary">
              <strong>4.9/5</strong> from 847 reviews
            </Typography>
          </Box>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: '600px', mx: 'auto' }}
          >
            Join hundreds of happy customers who have transformed their homes with our handcrafted products
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {testimonials.map((testimonial, index) => (
            <Grid
              item
              key={testimonial.id}
              xs={12}
              md={4}
              component={motion.div}
              variants={itemVariants}
              viewport={{ once: true }}
              custom={index}
            >
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  p: 3,
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  position: 'relative',
                  overflow: 'visible',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 8px 25px rgba(0,0,0,0.12)' }
                }}
              >
                <FormatQuoteIcon
                  sx={{
                    fontSize: 40,
                    color: theme.palette.primary.main,
                    opacity: 0.2,
                    position: 'absolute',
                    top: -10,
                    left: 10
                  }}
                />
                <CardContent sx={{ flexGrow: 1, pt: 2 }}>
                  <Rating
                    value={testimonial.rating}
                    precision={0.5}
                    readOnly
                    size="small"
                    sx={{ mb: 2, color: theme.palette.secondary.main }}
                  />
                  <Typography variant="body1" paragraph sx={{ fontStyle: 'italic', lineHeight: 1.6 }}>
                    "{testimonial.text}"
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Purchased: <strong>{testimonial.product}</strong>
                  </Typography>
                  {testimonial.verified && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                      <VerifiedIcon sx={{ fontSize: 16, color: theme.palette.success.main }} />
                      <Typography variant="caption" color="success.main" sx={{ fontWeight: 500 }}>
                        Verified Purchase
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto' }}>
                    <Avatar
                      sx={{
                        mr: 2,
                        width: 48,
                        height: 48,
                        bgcolor: theme.palette.primary.main,
                        color: 'white',
                        fontSize: '1rem'
                      }}
                    >
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {testimonial.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {testimonial.location} · {testimonial.date}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Testimonials;