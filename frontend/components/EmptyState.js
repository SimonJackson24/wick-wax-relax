import { Box, Typography, Button } from '@mui/material';
import { SearchOff, Add, Refresh } from '@mui/icons-material';

const EmptyState = ({
  icon = <SearchOff sx={{ fontSize: 64, color: 'text.secondary' }} />,
  title = 'No items found',
  description = 'There are no items to display at the moment.',
  actionText,
  onAction,
  actionIcon,
  showRefresh = false,
  onRefresh
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 4,
        textAlign: 'center',
        minHeight: 300
      }}
    >
      {icon}

      <Typography variant="h5" component="h2" sx={{ mt: 2, mb: 1, color: 'text.primary' }}>
        {title}
      </Typography>

      <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', maxWidth: 400 }}>
        {description}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2 }}>
        {actionText && onAction && (
          <Button
            variant="contained"
            startIcon={actionIcon || <Add />}
            onClick={onAction}
            size="large"
          >
            {actionText}
          </Button>
        )}

        {showRefresh && onRefresh && (
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={onRefresh}
            size="large"
          >
            Refresh
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default EmptyState;