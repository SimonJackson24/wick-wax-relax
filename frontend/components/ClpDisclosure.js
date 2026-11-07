import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Divider,
  useTheme,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

// CLP (Regulation (EC) No 1272/2008) safety disclosure for scented
// candles and wax melts. UK/EU law requires allergen disclosures, hazard
// pictograms, signal word, H/P statements and (EU sales) the UFI on the
// product page and packaging. This component renders whatever CLP data a
// product carries; if a product has none (e.g. a bath bomb), it renders
// nothing.

// Human-readable text for the H/P codes most relevant to home fragrance.
// Raw codes still render if not listed here.
const H_STATEMENTS = {
  H225: 'Highly flammable liquid and vapour',
  H226: 'Flammable liquid and vapour',
  H228: 'Flammable solid',
  H304: 'May be fatal if swallowed and enters airways',
  H315: 'Causes skin irritation',
  H317: 'May cause an allergic skin reaction',
  H318: 'Causes serious eye damage',
  H319: 'Causes serious eye irritation',
  H334: 'May cause allergy or asthma symptoms or breathing difficulties if inhaled',
  H336: 'May cause drowsiness or dizziness',
  H411: 'Toxic to aquatic life with long lasting effects',
  H412: 'Harmful to aquatic life with long lasting effects',
};

const P_STATEMENTS = {
  P101: 'If medical advice is needed, have product container or label at hand',
  P102: 'Keep out of reach of children',
  P103: 'Read label before use',
  P210: 'Keep away from heat, hot surfaces, sparks, open flames and other ignition sources. No smoking',
  P233: 'Keep container tightly closed',
  P240: 'Ground and bond container and receiving equipment',
  P261: 'Avoid breathing dust/fume/gas/mist/vapours/spray',
  P264: 'Wash hands thoroughly after handling',
  P271: 'Use only outdoors or in a well-ventilated area',
  P273: 'Avoid release to the environment',
  P280: 'Wear protective gloves/eye protection',
  P302352: 'IF ON SKIN: Wash with plenty of water',
  P305351338: 'IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses if present and easy to do. Continue rinsing',
  P313: 'Get medical advice/attention',
  P321: 'Specific treatment (see instructions on this label)',
  P333313: 'If skin irritation or rash occurs: Get medical advice/attention',
  P362364: 'Take off contaminated clothing and wash it before reuse',
  P370378: 'In case of fire: Use dry sand, dry chemical or alcohol-resistant foam to extinguish',
  P403235: 'Store in a well-ventilated place. Keep cool',
  P405: 'Store locked up',
  P501: 'Dispose of contents/container in accordance with local regulations',
};

// Canonical pictogram names for the GHS codes stored in the database.
const PICTOGRAM_LABELS = {
  GHS01: 'Exploding bomb (explosive)',
  GHS02: 'Flame (flammable)',
  GHS03: 'Flame over circle (oxidising)',
  GHS04: 'Gas cylinder (compressed gas)',
  GHS05: 'Corrosion',
  GHS06: 'Skull and crossbones (acute toxicity)',
  GHS07: 'Exclamation mark (irritant / harmful)',
  GHS08: 'Health hazard (serious health hazard)',
  GHS09: 'Environment (aquatic toxicity)',
};

const hasClpData = (product) =>
  product && (
    (product.clp_allergens && product.clp_allergens.length > 0) ||
    (product.clp_hazard_pictograms && product.clp_hazard_pictograms.length > 0) ||
    product.clp_signal_word ||
    (product.clp_hazard_statements && product.clp_hazard_statements.length > 0) ||
    (product.clp_precautionary_statements && product.clp_precautionary_statements.length > 0) ||
    product.ufi_code
  );

const ClpDisclosure = ({ product }) => {
  const theme = useTheme();

  if (!hasClpData(product)) return null;

  const allergens = product.clp_allergens || [];
  const pictograms = product.clp_hazard_pictograms || [];
  const hazardStatements = product.clp_hazard_statements || [];
  const precautionaryStatements = product.clp_precautionary_statements || [];
  const isDanger = product.clp_signal_word === 'DANGER';

  return (
    <Box>
      {product.clp_signal_word && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <WarningIcon color={isDanger ? 'error' : 'warning'} />
          <Typography
            variant="body1"
            sx={{ fontWeight: 700, textTransform: 'uppercase' }}
            color={isDanger ? 'error' : 'warning.main'}
          >
            {product.clp_signal_word}
          </Typography>
        </Box>
      )}

      {pictograms.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Hazard pictograms
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {pictograms.map((code) => (
              <Chip
                key={code}
                label={PICTOGRAM_LABELS[code] || code}
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      )}

      {hazardStatements.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Hazard statements
          </Typography>
          {hazardStatements.map((code) => (
            <Typography key={code} variant="body2" sx={{ lineHeight: 1.8 }}>
              <strong>{code}</strong> — {H_STATEMENTS[code] || 'See product label'}
            </Typography>
          ))}
        </Box>
      )}

      {allergens.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Contains the following fragrance allergens (Regulation (EC) No 1223/2009)
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {allergens.map((a) => (
              <Chip key={a} label={a} size="small" sx={{ fontWeight: 600 }} />
            ))}
          </Box>
        </Box>
      )}

      {precautionaryStatements.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Precautionary statements
          </Typography>
          {precautionaryStatements.map((code) => (
            <Typography key={code} variant="body2" sx={{ lineHeight: 1.8 }}>
              <strong>{code}</strong> — {P_STATEMENTS[code] || 'See product label'}
            </Typography>
          ))}
        </Box>
      )}

      {(product.ufi_code || product.clp_responsible_name) && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
            {product.clp_responsible_name && (
              <>Responsible for placing on the market: <strong>{product.clp_responsible_name}</strong>.</>
            )}
            {product.ufi_code && (
              <> UFI: <strong>{product.ufi_code}</strong>.</>
            )}
          </Typography>
        </>
      )}

      <Divider sx={{ my: 2 }} />
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.6 }}>
        Safety information provided in accordance with CLP Regulation (EC) No 1272/2008.
        Keep candles and wax melts away from children and pets. Never leave a burning
        candle unattended. Full labelling is reproduced on the product packaging.
      </Typography>
    </Box>
  );
};

export default ClpDisclosure;
