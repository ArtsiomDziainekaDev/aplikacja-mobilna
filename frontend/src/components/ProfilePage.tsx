import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Avatar,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import axiosInstance from '../api/axios';

interface Order {
  id: number;
  currencyCode: string;
  amount: number;
  totalPrice: number;
  status: string;
  createdAt: string;
}

interface Holding {
  symbol: string;
  amount: number;
  value: number;
  icon: string;
}

const getCryptoIcon = (symbol: string): string => {
  const icons: Record<string, string> = {
    BTC: '₿',
    ETH: 'Ξ',
    SOL: '◎',
    BNB: '◆',
    ADA: '₳',
    DOT: '●',
    LINK: '⬡',
    LTC: 'Ł',
    XRP: '✕',
    DOGE: 'Ð',
    AVAX: '▲',
    MATIC: '⬟',
    UNI: '🦄',
    ATOM: '⚛',
    FIL: '◈',
  };
  return icons[symbol] ?? '◇';
};

const buildHoldings = (orders: Order[]): Holding[] => {
  const holdings = new Map<string, Holding>();
  for (const order of orders) {
    if (order.status !== 'COMPLETED') continue;
    const current = holdings.get(order.currencyCode) ?? {
      symbol: order.currencyCode,
      amount: 0,
      value: 0,
      icon: getCryptoIcon(order.currencyCode),
    };
    current.amount += order.amount;
    current.value += order.totalPrice ?? 0;
    holdings.set(order.currencyCode, current);
  }
  return Array.from(holdings.values()).sort((a, b) => b.value - a.value);
};

const getStatusColor = (status: string): string => {
  if (status === 'COMPLETED') return '#00e676';
  if (status === 'CANCELLED') return '#ff5252';
  return '#ffd600';
};

const formatStatus = (status: string): string => status.replace(/_/g, ' ').toLowerCase();

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const { user } = useSelector((state: RootState) => state.auth);

  const holdings = buildHoldings(orders);
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  const totalPortfolio = holdings.reduce((sum, h) => sum + h.value, 0);
  const completedCount = orders.filter((order) => order.status === 'COMPLETED').length;

  useEffect(() => {
    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        const response = await axiosInstance.get<Order[]>('/api/orders/my');
        setOrders(response.data);
      } catch {
        setOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <Box sx={{ animation: 'fadeInUp 0.5s ease-out' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', md: '1.8rem' }, mb: 0.5 }}>
          Profile & Orders
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          Manage your account and track your trades
        </Typography>
      </Box>

      {/* Profile Card */}
      <Card
        sx={{
          mb: 3,
          p: { xs: 2.5, md: 3 },
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <CardContent sx={{ p: '0 !important' }}>
          {/* User Info */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  background: 'linear-gradient(135deg, #e91e8c, #7c4dff)',
                  border: '2px solid rgba(255,255,255,0.15)',
                }}
              >
                <PersonOutlineIcon sx={{ fontSize: 30 }} />
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '1.2rem' }}>
                  {user?.email?.split('@')[0] || 'Guest'}
                </Typography>
                <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', mb: 0.8 }}>
                  {user?.email || 'Not signed in'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={user?.role?.replace('ROLE_', '') || 'Guest'}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.6)',
                      fontWeight: 600,
                      fontSize: '0.68rem',
                      height: 22,
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Stats */}
          <Box
            sx={{
              display: 'flex',
              gap: { xs: 2, md: 4 },
              pt: 2.5,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              flexDirection: { xs: 'column', sm: 'row' },
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <AccountBalanceWalletIcon sx={{ fontSize: 15, color: 'rgba(255,255,255,0.35)' }} />
                <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                  Total Portfolio
                </Typography>
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.5rem' }}>
                {totalPortfolio.toLocaleString()} PLN
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <TrendingUpIcon sx={{ fontSize: 15, color: 'rgba(255,255,255,0.35)' }} />
                <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                  Completed
                </Typography>
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.5rem' }}>
                {completedCount}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            '& .MuiTabs-indicator': { display: 'none' },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.88rem',
              color: 'rgba(255,255,255,0.5)',
              borderRadius: 2.5,
              mr: 1,
              px: 3,
              py: 1,
              minHeight: 40,
              transition: 'all 0.2s ease',
              '&.Mui-selected': {
                color: '#fff',
                background: 'linear-gradient(90deg, #e91e8c 0%, #ff6ec7 100%)',
                boxShadow: '0 4px 15px rgba(233, 30, 140, 0.3)',
              },
              '&:not(.Mui-selected)': {
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                '&:hover': { background: 'rgba(255,255,255,0.1)' },
              },
            },
          }}
        >
          <Tab label="Portfolio Overview" />
          <Tab label="Order History" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Your Holdings */}
          <Card
            sx={{
              flex: 1,
              p: 2.5,
              background: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.06)',
              animation: 'fadeInUp 0.4s ease-out',
            }}
          >
            <CardContent sx={{ p: '0 !important' }}>
              <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', mb: 2 }}>
                Your Holdings
              </Typography>
              {holdings.length === 0 ? (
                <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>
                  No completed orders yet
                </Typography>
              ) : (
                holdings.map((holding, index) => (
                  <Box
                    key={holding.symbol}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 1.5,
                      borderBottom: index < holdings.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography sx={{ fontSize: '1.3rem' }}>{holding.icon}</Typography>
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.92rem' }}>
                          {holding.symbol}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                          {holding.amount} {holding.symbol}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                      {holding.value.toLocaleString()} PLN
                    </Typography>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card
            sx={{
              flex: 1,
              p: 2.5,
              background: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.06)',
              animation: 'fadeInUp 0.4s ease-out 0.1s both',
            }}
          >
            <CardContent sx={{ p: '0 !important' }}>
              <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', mb: 2 }}>
                Recent Activity
              </Typography>
              {recentOrders.length === 0 ? (
                <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>
                  No recent activity
                </Typography>
              ) : (
                recentOrders.map((order, index) => (
                  <Box
                    key={order.id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 1.5,
                      borderBottom: index < recentOrders.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <TrendingUpIcon sx={{ fontSize: 20, color: '#e91e8c' }} />
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.92rem' }}>
                          Order {order.currencyCode}
                        </Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>
                          {new Date(order.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        color: '#fff',
                      }}
                    >
                      {(order.totalPrice ?? 0).toLocaleString()} PLN
                    </Typography>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {activeTab === 1 && (
        <Card
          sx={{
            p: 0,
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.06)',
            overflow: 'auto',
            animation: 'fadeInUp 0.4s ease-out',
          }}
        >
          {loadingOrders ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: '#e91e8c' }} />
            </Box>
          ) : orders.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Crypto</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => {
                    const statusColor = getStatusColor(order.status);
                    const statusLabel = formatStatus(order.status);

                    return (
                      <TableRow
                        key={order.id}
                        sx={{
                          '&:hover': { background: 'rgba(255,255,255,0.02)' },
                          transition: 'background 0.2s',
                        }}
                      >
                        <TableCell sx={{ fontWeight: 600, color: '#fff' }}>
                          #ORD-{order.id.toString().padStart(3, '0')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{order.currencyCode}</TableCell>
                        <TableCell align="right">{order.amount}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#fff' }}>
                          {(order.totalPrice || 0).toFixed(2)} PLN
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={statusLabel}
                            size="small"
                            sx={{
                              bgcolor: `${statusColor}15`,
                              color: statusColor,
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              height: 24,
                              border: `1px solid ${statusColor}30`,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>
                          {new Date(order.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ py: 6, textAlign: 'center', color: 'rgba(255,255,255,0.45)' }}>
              No orders yet
            </Box>
          )}
        </Card>
      )}
    </Box>
  );
};

export default ProfilePage;
