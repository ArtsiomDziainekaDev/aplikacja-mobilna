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
  Select,
  MenuItem,
  FormControl,
  Alert,
  CircularProgress
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import axiosInstance from '../api/axios';
import type { OrderStatus } from '../types';
import { Link } from 'react-router-dom';

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

const getStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case 'PENDING_PAYMENT':
      return '#ff9800';
    case 'PENDING_CONFIRMATION':
      return '#2196f3';
    case 'CONFIRMED':
      return '#4caf50';
    case 'IN_PROGRESS':
      return '#9c27b0';
    case 'READY_FOR_PICKUP':
      return '#00bcd4';
    case 'COMPLETED':
      return '#388e3c';
    case 'CANCELLED':
      return '#f44336';
    default:
      return '#757575';
  }
};

const AdminPanel: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  const fetchActiveOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get<Order[]>('/api/admin/active-orders');
      setOrders(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Błąd podczas ładowania aktywnych zamówień');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
    try {
      setUpdating(orderId);
      await axiosInstance.put(`/api/admin/orders/${orderId}/status`, {
        newStatus: newStatus
      });
      await fetchActiveOrders();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Błąd podczas aktualizacji statusu zamówienia');
    } finally {
      setUpdating(null);
    }
  };

  const handleStatusChange = (orderId: number, event: SelectChangeEvent) => {
    const newStatus = event.target.value as OrderStatus;
    updateOrderStatus(orderId, newStatus);
  };

  const markAsCollected = async (orderId: number) => {
    try {
      await axiosInstance.post(`/api/admin/orders/${orderId}/collect`);
      await fetchActiveOrders();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Błąd podczas oznaczania zamówienia jako odebrane');
    }
  };

  useEffect(() => {
    fetchActiveOrders();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Typography variant="h5" component="h2">
          Panel administratora
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            component={Link}
            to="/admin/history"
            sx={{
              borderRadius: 2,
              transition: 'transform 0.2s ease',
              '&:hover': { transform: 'translateY(-1px)' },
            }}
          >
            Historia zamówień
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={fetchActiveOrders}
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
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {orders.length === 0 ? (
        <Alert severity="info">
          Brak aktywnych zamówień
        </Alert>
      ) : (
        <>
          <Typography variant="h6" gutterBottom>
            Aktywne zamówienia ({orders.length})
          </Typography>
          
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
                  <TableCell>Akcje</TableCell>
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
                    <TableCell>{order.currencyCode || order.currency?.code}</TableCell>
                    <TableCell align="right">{order.amount}</TableCell>
                    <TableCell align="right">{(order.totalPrice ?? 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Box sx={{ 
                        display: 'inline-block',
                        px: 2, 
                        py: 0.5, 
                        borderRadius: 1,
                        bgcolor: getStatusColor(order.status) + '20',
                        color: getStatusColor(order.status),
                        fontWeight: 'bold',
                        fontSize: '0.875rem'
                      }}>
                        {getStatusLabel(order.status)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 160 }}>
                        <Select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e)}
                          disabled={updating === order.id || order.status === 'COMPLETED' || order.status === 'CANCELLED'}
                        >
                          <MenuItem value="PENDING_PAYMENT">Oczekuje płatności</MenuItem>
                          <MenuItem value="PENDING_CONFIRMATION">Oczekuje potwierdzenia</MenuItem>
                          <MenuItem value="CONFIRMED">Potwierdzony</MenuItem>
                          <MenuItem value="IN_PROGRESS">W trakcie</MenuItem>
                          <MenuItem value="READY_FOR_PICKUP">Gotowy do odbioru</MenuItem>
                          <MenuItem value="COMPLETED">Zakończony</MenuItem>
                          <MenuItem value="CANCELLED">Anulowany</MenuItem>
                        </Select>
                        {updating === order.id && (
                          <Box sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>
                            <CircularProgress size={16} />
                          </Box>
                        )}
                      </FormControl>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

export default AdminPanel; 