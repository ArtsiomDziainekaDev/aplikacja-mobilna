import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import axiosInstance from '../api/axios';
import type { OrderStatus } from '../types';

interface Order {
  id: number;
  userEmail: string;
  currency: {
    id: number;
    code: string;
    name: string;
    rate: number;
    baseCode: string;
  };
  currencyCode?: string;
  amount: number;
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

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

const getStatusColor = (status: OrderStatus): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
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

const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get<Order[]>('/api/admin/orders');
      setOrders(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Błąd podczas ładowania historii zamówień');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Typography variant="h5" component="h2">
          Historia zamówień
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

      {orders.length === 0 ? (
        <Alert severity="info">
          Brak zamówień do wyświetlenia
        </Alert>
      ) : (
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
                <TableCell>Użytkownik</TableCell>
                <TableCell>Waluta</TableCell>
                <TableCell align="right">Ilość</TableCell>
                <TableCell align="right">Kwota (PLN)</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Data utworzenia</TableCell>
                <TableCell>Data aktualizacji</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow
                  key={order.id}
                  hover
                  sx={{ '&:last-child td, &:last-child th': { borderBottom: 0 } }}
                >
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.userEmail}</TableCell>
                  <TableCell>{order.currencyCode}</TableCell>
                  <TableCell align="right">{order.amount}</TableCell>
                  <TableCell align="right">{(order.totalPrice ?? 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(order.status)}
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {new Date(order.updatedAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default OrderHistory; 