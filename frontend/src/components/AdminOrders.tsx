import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Select,
  MenuItem,
  FormControl,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import axiosInstance from '../api/axios';
import type { OrderStatus } from '../types';

interface Order {
  id: number;
  userId: number;
  username: string;
  currencyCode: string;
  amount: number;
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/api/admin/orders');
      setOrders(response.data);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data || 'Błąd podczas ładowania zamówień');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    try {
      setError(null);
      await axiosInstance.put(`/api/admin/orders/${orderId}/status`, { newStatus });
      await fetchOrders();
    } catch (err: any) {
      console.error('Error updating order status:', err);
      setError(err.response?.data || 'Błąd podczas aktualizacji statusu zamówienia');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pl-PL');
  };

  const getStatusLabel = (status: OrderStatus): string => {
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Zarządzanie zamówieniami
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Użytkownik</TableCell>
                <TableCell>Waluta</TableCell>
                <TableCell>Ilość</TableCell>
                <TableCell>Kwota (PLN)</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Data utworzenia</TableCell>
                <TableCell>Data aktualizacji</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.username}</TableCell>
                  <TableCell>{order.currencyCode}</TableCell>
                  <TableCell>{order.amount}</TableCell>
                  <TableCell>{order.totalPrice}</TableCell>
                  <TableCell>
                    <FormControl fullWidth>
                      <Select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
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
                  </TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell>{formatDate(order.updatedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
};

export default AdminOrders; 