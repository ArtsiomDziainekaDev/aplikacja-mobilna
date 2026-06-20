import React, { useState } from 'react';
import { 
  Typography, 
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useSelector, useDispatch } from 'react-redux';
import { removeFromCart, updateCartItemAmount, clearCart } from '../store/slices/cartSlice';
import type { RootState } from '../store';
import axiosInstance from '../api/axios';
import { useNavigate } from 'react-router-dom';

const Cart: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, total } = useSelector((state: RootState) => state.cart);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRemoveItem = (currencyId: number) => {
    dispatch(removeFromCart(currencyId));
  };

  const handleUpdateAmount = (currencyId: number, amount: number) => {
    if (amount > 0) {
      dispatch(updateCartItemAmount({ currencyId, amount }));
    }
  };

  const handleCreateOrder = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      // Создаем массив заказов для каждой waluzy w koszyku
      const orderPromises = items.map(item => {
        const orderData = {
          currencyCode: item.code,
          amount: item.amount
        };
        return axiosInstance.post('/api/orders', orderData);
      });

      await Promise.all(orderPromises);
      
      // Очищаем koszyk po pomyślnym utworzeniu zamówień
      dispatch(clearCart());
      setIsOrderDialogOpen(false);
      
      // Przekierowujemy na stronę zamówień
      navigate('/orders');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Błąd podczas tworzenia zamówienia');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <ShoppingCartIcon color="primary" />
          <Typography variant="h5" component="h2">
            Koszyk
          </Typography>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          borderRadius: 3,
          p: 3,
          bgcolor: 'background.paper',
          boxShadow: 2,
        }}>
          <ShoppingCartIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Twój koszyk jest pusty
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            sx={{ mt: 2 }}
            onClick={() => navigate('/')}
          >
            Przejdź do zakupów
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <ShoppingCartIcon color="primary" />
        <Typography variant="h5" component="h2">
          Koszyk
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <List sx={{ borderRadius: 3, bgcolor: 'background.paper', boxShadow: 2, px: 1 }}>
        {items.map((item, index) => (
          <React.Fragment key={item.currencyId}>
            <ListItem
              secondaryAction={
                <IconButton 
                  edge="end" 
                  aria-label="delete"
                  onClick={() => handleRemoveItem(item.currencyId)}
                  sx={{ transition: 'transform 0.2s ease', '&:hover': { transform: 'scale(1.05)' } }}
                >
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText
                primary={`${item.code}`}
                secondary={`Kurs: ${item.rate} PLN`}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mr: 2 }}>
                <TextField
                  size="small"
                  type="number"
                  value={item.amount}
                  onChange={(e) => handleUpdateAmount(item.currencyId, parseFloat(e.target.value))}
                  sx={{ width: '100px' }}
                />
                <Typography variant="body2" sx={{ minWidth: '80px' }}>
                  {item.total.toFixed(2)} PLN
                </Typography>
              </Box>
            </ListItem>
            {index < items.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Razem: {total.toFixed(2)} PLN
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          size="large"
          onClick={() => setIsOrderDialogOpen(true)}
          disabled={isProcessing}
          sx={{
            borderRadius: 2,
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': { transform: 'translateY(-1px)', boxShadow: 4 },
          }}
        >
          Złóż zamówienie
        </Button>
      </Box>

      <Dialog
        open={isOrderDialogOpen}
        onClose={() => !isProcessing && setIsOrderDialogOpen(false)}
      >
        <DialogTitle>Potwierdzenie zamówienia</DialogTitle>
        <DialogContent>
          <Typography>
            Zamierzasz złożyć zamówienie na kwotę: {total.toFixed(2)} PLN
          </Typography>
          <List>
            {items.map((item) => (
              <ListItem key={item.currencyId}>
                <ListItemText
                  primary={`${item.code}: ${item.amount}`}
                  secondary={`Kwota: ${item.total.toFixed(2)} PLN`}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setIsOrderDialogOpen(false)} 
            disabled={isProcessing}
          >
            Anuluj
          </Button>
          <Button 
            onClick={handleCreateOrder} 
            variant="contained" 
            color="primary"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Potwierdź'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Cart; 