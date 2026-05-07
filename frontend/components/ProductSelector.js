import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Alert,
  LinearProgress,
  Collapse,
  IconButton,
  Badge,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  LocalFlorist as ScentIcon,
  ShoppingBag as ProductIcon,
} from '@mui/icons-material';
import axios from 'axios';

const ProductSelector = ({ onSelect, selectedProduct = null, selectedVariant = null }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [localSelectedProduct, setLocalSelectedProduct] = useState(selectedProduct);
  const [localSelectedVariant, setLocalSelectedVariant] = useState(selectedVariant);
  const [productDetails, setProductDetails] = useState({});

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/products');
      const productData = response.data.products || response.data.data || [];
      setProducts(productData);
      
      // Pre-select first product if none selected
      if (!localSelectedProduct && productData.length > 0) {
        setLocalSelectedProduct(productData[0]);
        loadProductDetails(productData[0].id);
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadProductDetails = async (productId) => {
    try {
      const response = await axios.get(`/api/products/${productId}`);
      setProductDetails(prev => ({
        ...prev,
        [productId]: response.data
      }));
    } catch (err) {
      console.error('Error loading product details:', err);
    }
  };

  const toggleExpand = async (productId) => {
    if (expandedProduct === productId) {
      setExpandedProduct(null);
      return;
    }
    setExpandedProduct(productId);
    
    if (!productDetails[productId]) {
      await loadProductDetails(productId);
    }
  };

  const handleProductSelect = (product) => {
    setLocalSelectedProduct(product);
    setLocalSelectedVariant(null); // Reset variant when product changes
    
    if (!productDetails[product.id]) {
      loadProductDetails(product.id);
    }
  };

  const handleVariantSelect = (variant) => {
    setLocalSelectedVariant(variant);
  };

  const handleConfirm = () => {
    if (localSelectedProduct && localSelectedVariant) {
      onSelect?.({
        product: localSelectedProduct,
        variant: localSelectedVariant,
        price: localSelectedVariant.price,
      });
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(price);
  };

  const parseScentProfile = (scentProfile) => {
    if (!scentProfile) return null;
    
    try {
      if (typeof scentProfile === 'string') {
        return JSON.parse(scentProfile);
      }
      return scentProfile;
    } catch {
      return null;
    }
  };

  const getScentNotes = (scentProfile) => {
    const parsed = parseScentProfile(scentProfile);
    if (!parsed) return [];
    
    if (Array.isArray(parsed)) return parsed;
    if (parsed.notes) return parsed.notes;
    if (parsed.scent_notes) return parsed.scent_notes;
    
    return [];
  };

  const getScentType = (scentProfile) => {
    const parsed = parseScentProfile(scentProfile);
    if (!parsed) return null;
    
    if (parsed.type) return parsed.type;
    if (parsed.category) return parsed.category;
    
    return null;
  };

  const renderScentChips = (scentProfile) => {
    const notes = getScentNotes(scentProfile);
    const type = getScentType(scentProfile);
    
    if (notes.length === 0 && !type) return null;

    return (
      <Box sx={{ mt: 2 }}>
        {type && (
          <Chip 
            icon={<ScentIcon sx={{ fontSize: 16 }} />}
            label={type}
            size="small"
            color="secondary"
            sx={{ mr: 1, mb: 1 }}
          />
        )}
        {notes.slice(0, 4).map((note, idx) => (
          <Chip
            key={idx}
            label={note}
            size="small"
            variant="outlined"
            sx={{ mr: 0.5, mb: 1 }}
          />
        ))}
        {notes.length > 4 && (
          <Chip
            label={`+${notes.length - 4} more`}
            size="small"
            sx={{ mb: 1 }}
          />
        )}
      </Box>
    );
  };

  if (loading && products.length === 0) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
          Loading products...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
        <Button onClick={loadProducts} sx={{ ml: 2 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  if (products.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No products available at the moment. Please check back later.
      </Alert>
    );
  }

  const selectedProductDetails = localSelectedProduct ? (productDetails[localSelectedProduct.id] || localSelectedProduct) : null;
  const variants = selectedProductDetails?.variants || selectedProductDetails?.sizes || [];
  const scentProfile = selectedProductDetails?.scent_profile || selectedProductDetails?.scentProfile;

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Select Your Product
      </Typography>
      
      {/* Product List */}
      <Grid container spacing={2}>
        {products.map((product) => (
          <Grid item xs={12} sm={6} md={4} key={product.id}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: localSelectedProduct?.id === product.id ? 2 : 0,
                borderColor: 'primary.main',
                transition: 'all 0.2s',
                '&:hover': { boxShadow: 4 },
              }}
              onClick={() => handleProductSelect(product)}
            >
              {product.image_url && (
                <CardMedia
                  component="img"
                  height="140"
                  image={product.image_url}
                  alt={product.name}
                />
              )}
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {product.name}
                  </Typography>
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(product.id); }}>
                    {expandedProduct === product.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
                
                {product.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {product.description.substring(0, 80)}...
                  </Typography>
                )}
                
                {renderScentChips(product.scent_profile || product.scentProfile)}
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" color="primary">
                    From {formatPrice(product.base_price || product.price || 0)}
                  </Typography>
                  {localSelectedProduct?.id === product.id && (
                    <Chip label="Selected" size="small" color="primary" />
                  )}
                </Box>
              </CardContent>
              
              {/* Expanded Details */}
              <Collapse in={expandedProduct === product.id} timeout="auto" unmountOnExit>
                <Box sx={{ px: 2, pb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom color="primary">
                    Product Details
                  </Typography>
                  {productDetails[product.id] && (
                    <Box>
                      <Typography variant="body2">
                        {productDetails[product.id].description || 'No additional details available.'}
                      </Typography>
                      
                      {productDetails[product.id].ingredients && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>Ingredients:</strong> {productDetails[product.id].ingredients}
                        </Typography>
                      )}
                      
                      {productDetails[product.id].burn_time && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>Burn Time:</strong> {productDetails[product.id].burn_time}
                        </Typography>
                      )}
                      
                      {productDetails[product.id].weight && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>Weight:</strong> {productDetails[product.id].weight}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              </Collapse>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Variant Selection for Selected Product */}
      {localSelectedProduct && variants.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <FormControl component="fieldset" sx={{ width: '100%' }}>
            <FormLabel component="legend">
              <Typography variant="h6">
                Select Size / Variant for {localSelectedProduct.name}
              </Typography>
            </FormLabel>
            
            <RadioGroup
              value={localSelectedVariant?.id || ''}
              onChange={(e) => {
                const variant = variants.find(v => v.id === parseInt(e.target.value));
                if (variant) handleVariantSelect(variant);
              }}
            >
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {variants.map((variant) => (
                  <Grid item xs={12} sm={6} key={variant.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: localSelectedVariant?.id === variant.id ? 2 : 1,
                        borderColor: localSelectedVariant?.id === variant.id ? 'primary.main' : 'divider',
                        '&:hover': { borderColor: 'primary.main' },
                      }}
                      onClick={() => handleVariantSelect(variant)}
                    >
                      <CardContent>
                        <FormControlLabel
                          value={variant.id}
                          control={<Radio />}
                          label={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                              <Box>
                                <Typography variant="subtitle1" fontWeight="bold">
                                  {variant.name || variant.size || `Variant ${variant.id}`}
                                </Typography>
                                {variant.stock !== undefined && variant.stock !== null && (
                                  <Typography variant="body2" color={variant.stock > 0 ? 'success.main' : 'error.main'}>
                                    {variant.stock > 0 ? `${variant.stock} in stock` : 'Out of stock'}
                                  </Typography>
                                )}
                              </Box>
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="h6" color="primary">
                                  {formatPrice(variant.price)}
                                </Typography>
                                {variant.subscription_price && (
                                  <Typography variant="caption" color="secondary">
                                    Subscription: {formatPrice(variant.subscription_price)}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          }
                          sx={{ width: '100%', mr: 0 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </RadioGroup>
          </FormControl>
        </Box>
      )}

      {/* Scent Selection */}
      {localSelectedProduct && scentProfile && getScentNotes(scentProfile).length > 0 && (
        <Box sx={{ mt: 4 }}>
          <FormControl fullWidth>
            <InputLabel>Scent Preference (Optional)</InputLabel>
            <Select
              label="Scent Preference (Optional)"
              value=""
              onChange={() => {}}
            >
              {getScentNotes(scentProfile).map((note, idx) => (
                <MenuItem key={idx} value={note}>
                  {note}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Confirm Button */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Typography variant="body1" color="text.secondary" sx={{ alignSelf: 'center' }}>
          {localSelectedProduct && localSelectedVariant
            ? `Selected: ${localSelectedProduct.name} - ${localSelectedVariant.name || localSelectedVariant.size} @ ${formatPrice(localSelectedVariant.price)}`
            : 'Please select a product and variant'}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          disabled={!localSelectedProduct || !localSelectedVariant}
          onClick={handleConfirm}
        >
          Confirm Selection
        </Button>
      </Box>
    </Box>
  );
};

export default ProductSelector;
