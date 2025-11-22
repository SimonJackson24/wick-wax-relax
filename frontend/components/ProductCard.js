import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Typography,
  Button,
  Chip,
  Box,
  Rating,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Visibility as VisibilityIcon,
  LocalShipping as ShippingIcon,
  Inventory as InventoryIcon,
  Star as StarIcon
} from '@mui/icons-material';

const ProductCard = ({
  product,
  variant = 'default',
  showQuickAdd = false,
  onProductClick,
  onAddToCart,
  viewMode = 'grid',
  compact = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Get the first variant for pricing
  const firstVariant = product.variants?.[0];
  const price = firstVariant?.price || product.base_price || 0;
  const originalPrice = firstVariant?.attributes?.originalPrice;
  const isOnSale = originalPrice && originalPrice > price;
  const isNew = product.isNew || product.created_at && 
    (new Date() - new Date(product.created_at)) < (30 * 24 * 60 * 60 * 1000); // 30 days

  // Calculate discount percentage
  const discountPercent = isOnSale
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  // Check stock status
  const totalStock = product.variants?.reduce((sum, variant) => sum + (variant.inventory_quantity || 0), 0) || 0;
  const isInStock = totalStock > 0;
  const isLowStock = totalStock > 0 && totalStock <= 5;

  // Get categories as string
  const categories = product.categories?.join(', ') || '';

  // Rating data (using provided rating or default)
  const rating = product.rating || 4.2;
  const reviewCount = product.reviewCount || product.total_reviews || 12;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (onAddToCart && isInStock) {
      onAddToCart(product.id, firstVariant?.id);
    }
  };

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    if (onAddToCart && isInStock) {
      onAddToCart(product.id, firstVariant?.id);
    }
  };

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    // Here you would typically call an API to save the favorite status
  };

  const handleProductClick = () => {
    if (onProductClick) {
      onProductClick(product.id);
    }
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  // List view implementation
  if (viewMode === 'list') {
    return (
      <Card
        sx={{
          display: 'flex',
          mb: 2,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          borderRadius: 3,
          overflow: 'hidden',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            transform: 'translateY(-2px)',
          },
        }}
        onClick={handleProductClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="article"
        aria-labelledby={`product-${product.id}-title`}
      >
        {/* Product Image */}
        <Box sx={{ width: 200, height: 150, position: 'relative', overflow: 'hidden' }}>
          <CardMedia
            component="img"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: imageLoaded ? 1 : 0,
              transition: 'transform 0.5s ease, opacity 0.3s ease-in-out',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
            }}
            image={product.image || '/images/placeholder-product.jpg'}
            alt={product.name}
            onLoad={() => setImageLoaded(true)}
          />
          {!imageLoaded && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: theme.palette.grey[200],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Loading...
              </Typography>
            </Box>
          )}

          {/* Product badges */}
          <Box sx={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 0.5 }}>
            {isNew && (
              <Chip
                label="New"
                size="small"
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.7rem'
                }}
              />
            )}
            {isOnSale && (
              <Chip
                label={`${discountPercent}% OFF`}
                size="small"
                sx={{
                  backgroundColor: theme.palette.secondary.main,
                  color: theme.palette.text.primary,
                  fontWeight: 'bold',
                  fontSize: '0.7rem'
                }}
              />
            )}
          </Box>

          {/* Stock Status */}
          {!isInStock && (
            <Chip
              label="Out of Stock"
              color="error"
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                fontSize: '0.7rem'
              }}
            />
          )}
          {isLowStock && isInStock && (
            <Chip
              label="Low Stock"
              color="warning"
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                fontSize: '0.7rem'
              }}
            />
          )}
        </Box>

        {/* Product Details */}
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <CardContent sx={{ flex: 1, pb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant="h6" 
                  component="h2" 
                  gutterBottom
                  id={`product-${product.id}-title`}
                  sx={{
                    fontFamily: theme.typography.h6.fontFamily,
                    fontWeight: theme.typography.h6.fontWeight,
                  }}
                >
                  {product.name}
                </Typography>

                {categories && (
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    {categories}
                  </Typography>
                )}

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    mb: 2,
                  }}
                >
                  {product.description}
                </Typography>

                {/* Product Rating */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Rating 
                    value={rating} 
                    precision={0.5} 
                    readOnly 
                    size="small"
                    sx={{ color: theme.palette.secondary.main }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    ({reviewCount})
                  </Typography>
                </Box>

                {/* Variants Info */}
                {product.variants && product.variants.length > 1 && (
                  <Typography variant="caption" color="text.secondary">
                    {product.variants.length} variants available
                  </Typography>
                )}
              </Box>

              {/* Favorite Button */}
              <IconButton
                onClick={handleToggleFavorite}
                sx={{ ml: 1 }}
                color={isFavorite ? 'error' : 'default'}
                aria-label={isFavorite ? `Remove ${product.name} from favorites` : `Add ${product.name} to favorites`}
                aria-pressed={isFavorite}
              >
                {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </IconButton>
            </Box>
          </CardContent>

          <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" color="primary">
                  {formatPrice(price)}
                </Typography>
                {isOnSale && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textDecoration: 'line-through' }}
                  >
                    {formatPrice(originalPrice)}
                  </Typography>
                )}
              </Box>

              {/* Stock Info */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                {isInStock ? (
                  <>
                    <InventoryIcon fontSize="small" color="success" aria-hidden="true" />
                    <Typography variant="caption" color="success.main">
                      {totalStock} in stock
                    </Typography>
                  </>
                ) : (
                  <>
                    <InventoryIcon fontSize="small" color="error" aria-hidden="true" />
                    <Typography variant="caption" color="error.main">
                      Out of stock
                    </Typography>
                  </>
                )}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {showQuickAdd && isInStock && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<CartIcon />}
                  onClick={handleAddToCart}
                  aria-label={`Add ${product.name} to cart`}
                  sx={{
                    backgroundColor: theme.palette.tertiary.main,
                    color: 'white',
                    '&:hover': {
                      backgroundColor: theme.palette.tertiary.dark,
                    }
                  }}
                >
                  Add to Cart
                </Button>
              )}
              <Button 
                variant="outlined" 
                size="small"
                startIcon={<VisibilityIcon />}
                onClick={handleProductClick}
                aria-label={`View details for ${product.name}`}
                sx={{
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                  '&:hover': {
                    borderColor: theme.palette.primary.dark,
                    color: theme.palette.primary.dark,
                  }
                }}
              >
                View
              </Button>
            </Box>
          </CardActions>
        </Box>
      </Card>
    );
  }

  // Grid view (default)
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        borderRadius: variant === 'featured' ? 3 : 2,
        overflow: 'hidden',
        position: 'relative',
        '&:hover': {
          boxShadow: variant === 'featured' 
            ? '0 12px 28px rgba(0,0,0,0.15)' 
            : '0 8px 24px rgba(0,0,0,0.12)',
          transform: 'translateY(-5px)',
        },
      }}
      onClick={handleProductClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="article"
      aria-labelledby={`product-${product.id}-title`}
    >
      {/* Product Image */}
      <Box sx={{ position: 'relative', pt: variant === 'featured' ? '75%' : '100%', overflow: 'hidden' }}>
        <CardMedia
          component="img"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: imageLoaded ? 1 : 0,
            transition: 'transform 0.5s ease, opacity 0.3s ease-in-out',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          }}
          image={product.image || '/images/placeholder-product.jpg'}
          alt={product.name}
          onLoad={() => setImageLoaded(true)}
        />

        {!imageLoaded && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: theme.palette.grey[200],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Loading...
            </Typography>
          </Box>
        )}

        {/* Product badges */}
        <Box sx={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 0.5, zIndex: 1 }}>
          {isNew && (
            <Chip
              label="New"
              size="small"
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.7rem'
              }}
            />
          )}
          {isOnSale && (
            <Chip
              label={`${discountPercent}% OFF`}
              size="small"
              sx={{
                backgroundColor: theme.palette.secondary.main,
                color: theme.palette.text.primary,
                fontWeight: 'bold',
                fontSize: '0.7rem'
              }}
            />
          )}
        </Box>

        {/* Favorite Button */}
        <IconButton
          onClick={handleToggleFavorite}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
            },
            zIndex: 1,
          }}
          size="small"
          aria-label={isFavorite ? `Remove ${product.name} from favorites` : `Add ${product.name} to favorites`}
          aria-pressed={isFavorite}
        >
          {isFavorite ? (
            <FavoriteIcon color="error" fontSize="small" />
          ) : (
            <FavoriteBorderIcon fontSize="small" />
          )}
        </IconButton>

        {/* Quick Add Button - Appears on hover */}
        {showQuickAdd && isHovered && isInStock && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 10,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              zIndex: 1,
              opacity: isHovered ? 1 : 0,
              transform: isHovered ? 'translateY(0)' : 'translateY(10px)',
              transition: 'opacity 0.3s ease, transform 0.3s ease',
            }}
          >
            <Button
              variant="contained"
              size="small"
              onClick={handleQuickAdd}
              sx={{
                backgroundColor: theme.palette.tertiary.main,
                color: 'white',
                px: 2,
                py: 0.8,
                borderRadius: 50,
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                '&:hover': {
                  backgroundColor: theme.palette.tertiary.dark,
                  boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                }
              }}
            >
              Quick Add
            </Button>
          </Box>
        )}

        {/* Stock Status */}
        <Box sx={{ position: 'absolute', bottom: 8, right: 8, zIndex: 1 }}>
          {!isInStock && (
            <Chip
              label="Out of Stock"
              color="error"
              size="small"
              sx={{ fontSize: '0.7rem' }}
            />
          )}
          {isLowStock && isInStock && (
            <Chip
              label="Low Stock"
              color="warning"
              size="small"
              sx={{ fontSize: '0.7rem' }}
            />
          )}
        </Box>
      </Box>

      {/* Product Details */}
      <CardContent sx={{ 
        flex: 1, 
        pb: 1, 
        pt: 2,
        px: variant === 'featured' ? 2 : 1.5
      }}>
        <Typography 
          variant="h6" 
          component="h2" 
          gutterBottom 
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.3,
            height: variant === 'featured' ? '2.6em' : 'auto',
            fontFamily: theme.typography.h6.fontFamily,
            fontWeight: theme.typography.h6.fontWeight,
            fontSize: variant === 'featured' ? '1.1rem' : '1rem',
          }}
          id={`product-${product.id}-title`}
        >
          {product.name}
        </Typography>

        {categories && !compact && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            {categories}
          </Typography>
        )}

        {!compact && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: variant === 'featured' ? 3 : 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: 2,
            }}
          >
            {product.description}
          </Typography>
        )}

        {/* Product Rating */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <Rating 
            value={rating} 
            precision={0.5} 
            readOnly 
            size="small"
            sx={{ 
              color: theme.palette.secondary.main,
              '& .MuiRating-iconFilled': {
                color: theme.palette.secondary.main,
              }
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            ({reviewCount})
          </Typography>
        </Box>

        {/* Price */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography 
            variant="h6" 
            color="primary"
            sx={{
              fontFamily: theme.typography.h6.fontFamily,
              fontWeight: theme.typography.h6.fontWeight,
            }}
          >
            {formatPrice(price)}
          </Typography>
          {isOnSale && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textDecoration: 'line-through' }}
            >
              {formatPrice(originalPrice)}
            </Typography>
          )}
        </Box>

        {/* Stock Info */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {isInStock ? (
              <>
                <InventoryIcon fontSize="small" color="success" aria-hidden="true" />
                <Typography variant="caption" color="success.main">
                  {totalStock} left
                </Typography>
              </>
            ) : (
              <>
                <InventoryIcon fontSize="small" color="error" aria-hidden="true" />
                <Typography variant="caption" color="error.main">
                  Out of stock
                </Typography>
              </>
            )}
          </Box>

          {product.total_sold > 0 && (
            <Typography variant="caption" color="text.secondary">
              {product.total_sold} sold
            </Typography>
          )}
        </Box>
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ 
        pt: 0, 
        px: variant === 'featured' ? 2 : 1.5, 
        pb: variant === 'featured' ? 2 : 1.5,
        flexDirection: 'column',
        gap: 1
      }}>
        <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={handleProductClick}
            sx={{
              flex: 1,
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
              '&:hover': {
                borderColor: theme.palette.primary.dark,
                color: theme.palette.primary.dark,
              }
            }}
          >
            View
          </Button>
          {isInStock && (
            <Button
              variant="contained"
              size="small"
              startIcon={<CartIcon />}
              onClick={handleAddToCart}
              sx={{
                flex: 1,
                backgroundColor: theme.palette.tertiary.main,
                color: 'white',
                '&:hover': {
                  backgroundColor: theme.palette.tertiary.dark,
                }
              }}
            >
              Add
            </Button>
          )}
        </Box>
        {!isInStock && (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<ShippingIcon />}
            disabled
            size="small"
            sx={{
              borderColor: theme.palette.error.main,
              color: theme.palette.error.main,
            }}
          >
            Notify When Available
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default ProductCard;