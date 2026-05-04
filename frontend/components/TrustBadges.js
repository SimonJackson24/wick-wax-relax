import {
  Box,
  Container,
  Typography,
  Grid,
  useTheme
} from '@mui/material';
import {
  Eco as EcoIcon,
  Public as UkIcon,
  Pets as PetsIcon,
  Recycling as RecyclingIcon,
  Lock as SecureIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const trustBadges = [
  { id: 'ethical-beeswax', icon: EcoIcon, title: 'Ethical Beeswax', description: 'Queen bees kept with intact wings' },
  { id: 'sustainable', icon: EcoIcon, title: 'Sustainable Wax', description: 'Premium plant-based blend' },
  { id: 'handmade-uk', icon: UkIcon, title: 'Handmade in UK', description: 'Handcrafted with care' },
  { id: 'vegan', icon: PetsIcon, title: '100% Vegan', description: 'Cruelty-free products' },
  { id: 'eco-packaging', icon: RecyclingIcon, title: 'Eco Packaging', description: 'Glassine bags & biodegradable labels' },
  { id: 'secure', icon: SecureIcon, title: 'Secure Checkout', description: 'Protected payments' }
];

const TrustBadge = ({ badge, index }) => {
  const theme = useTheme();
  return (
    <Box component={motion.div} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: index * 0.1 }}
      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', p: 2 }}>
      <Box sx={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: `${theme.palette.primary.main}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5, border: `2px solid ${theme.palette.primary.main}30` }}>
        <badge.icon sx={{ fontSize: 28, color: theme.palette.primary.main }} />
      </Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 0.5 }}>{badge.title}</Typography>
      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>{badge.description}</Typography>
    </Box>
  );
};

const TrustBadges = () => {
  const theme = useTheme();
  return (
    <Box sx={{ py: 4, backgroundColor: theme.palette.background.default,
      borderTop: `1px solid ${theme.palette.primary.main}20`, borderBottom: `1px solid ${theme.palette.primary.main}20` }}>
      <Container maxWidth="lg">
        <Grid container spacing={2}>
          {trustBadges.map((badge, index) => (
            <Grid item xs={6} sm={4} md={2} key={badge.id}>
              <TrustBadge badge={badge} index={index} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default TrustBadges;