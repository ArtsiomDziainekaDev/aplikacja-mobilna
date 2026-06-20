import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Select,
  MenuItem,
  FormControl
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import axiosInstance from '../api/axios';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/index';

interface Order {
  id: number;
  userId: number;
  userEmail: string;
  currencyId: number;
  currencyCode: string;
  amount: number;
  totalPrice: number;
  status: 'PENDING_PAYMENT' | 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'IN_PROGRESS' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

const getStatusLabel = (status: Order['status']): string => {
  switch (status) {
    case 'PENDING_PAYMENT':
      return 'Oczekuje płatności';
    case 'PENDING_CONFIRMATION':
      return 'Oczekuje potwierdzenia';
    case 'CONFIRMED':
      return 'Potwierdzony';
    case 'IN_PROGRESS':
      return 'W trakcie';
    case 'READY_FOR_PICKUP':
      return 'Gotowy do odbioru';
    case 'COMPLETED':
      return 'Zakończony';
    case 'CANCELLED':
      return 'Anulowany';
    default:
      return status;
  }
};

const getStatusColor = (status: Order['status']) => {
  switch (status) {
    case 'PENDING_PAYMENT':
      return 'warning';
    case 'PENDING_CONFIRMATION':
      return 'info';
    case 'CONFIRMED':
      return 'primary';
    case 'IN_PROGRESS':
      return 'secondary';
    case 'READY_FOR_PICKUP':
      return 'success';
    case 'COMPLETED':
      return 'success';
    case 'CANCELLED':
      return 'error';
    default:
      return 'default';
  }
};

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useSelector((state: RootState) => state.auth);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get<Order[]>(
        isAdmin ? '/api/orders' : '/api/orders/my'
      );
      setOrders(response.data);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || 'Błąd podczas ładowania zamówień');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: Order['status']) => {
    try {
      setError(null);
      await axiosInstance.put(`/api/orders/${orderId}/status`, newStatus);
      await fetchOrders();
    } catch (err: any) {
      console.error('Error updating order status:', err);
      setError(err.response?.data?.message || 'Błąd podczas aktualizacji statusu zamówienia');
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [isAdmin]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (orders.length === 0) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="info">
          {isAdmin ? 'Brak zamówień w systemie' : 'Nie masz jeszcze żadnych zamówień'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Typography variant="h5" component="h2">
          {isAdmin ? 'Wszystkie zamówienia' : 'Moje zamówienia'}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={fetchOrders}
          startIcon={<RefreshIcon />}
          sx={{
            borderRadius: 2,
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': { transform: 'translateY(-1px)', boxShadow: 4 },
          }}
        >
          Odśwież
        </Button>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          transition: 'box-shadow 0.2s ease',
          '&:hover': { boxShadow: 6 },
        }}
      >
        <Table>
          <TableHead sx={{ backgroundColor: 'rgba(25, 118, 210, 0.06)' }}>
            <TableRow>
              <TableCell>ID</TableCell>
              {isAdmin && <TableCell>Użytkownik</TableCell>}
              <TableCell>Waluta</TableCell>
              <TableCell align="right">Ilość</TableCell>
              <TableCell align="right">Kwota (PLN)</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Data utworzenia</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow
                key={order.id}
                hover
                sx={{
                  '&:last-child td, &:last-child th': { borderBottom: 0 },
                }}
              >
                <TableCell>{order.id}</TableCell>
                {isAdmin && <TableCell>{order.userEmail}</TableCell>}
                <TableCell>{order.currencyCode}</TableCell>
                <TableCell align="right">{order.amount}</TableCell>
                <TableCell align="right">{(order.totalPrice || 0).toFixed(2)}</TableCell>
                <TableCell>
                  {isAdmin ? (
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                      <Select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                      >
                        <MenuItem value="PENDING_PAYMENT">{getStatusLabel('PENDING_PAYMENT')}</MenuItem>
                        <MenuItem value="PENDING_CONFIRMATION">{getStatusLabel('PENDING_CONFIRMATION')}</MenuItem>
                        <MenuItem value="CONFIRMED">{getStatusLabel('CONFIRMED')}</MenuItem>
                        <MenuItem value="IN_PROGRESS">{getStatusLabel('IN_PROGRESS')}</MenuItem>
                        <MenuItem value="READY_FOR_PICKUP">{getStatusLabel('READY_FOR_PICKUP')}</MenuItem>
                        <MenuItem value="COMPLETED">{getStatusLabel('COMPLETED')}</MenuItem>
                        <MenuItem value="CANCELLED">{getStatusLabel('CANCELLED')}</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <Chip
                      label={getStatusLabel(order.status)}
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                  )}
                </TableCell>
                <TableCell>
                  {new Date(order.createdAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Orders; 