import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
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
import SettingsIcon from '@mui/icons-material/Settings';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PercentIcon from '@mui/icons-material/Percent';
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

interface Activity {
  type: 'Bought' | 'Sold';
  symbol: string;
  date: string;
  value: number;
}

// Mock portfolio data
const MOCK_HOLDINGS: Holding[] = [
  { symbol: 'BTC', amount: 1.75, value: 109375, icon: '₿' },
  { symbol: 'ETH', amount: 8.2, value: 33062, icon: 'Ξ' },
  { symbol: 'SOL', amount: 120, value: 17760, icon: '◎' },
];

const MOCK_ACTIVITY: Activity[] = [
  { type: 'Bought', symbol: 'BTC', date: '2026-05-05 14:30', value: 31250 },
  { type: 'Sold', symbol: 'ETH', date: '2026-05-04 09:15', value: 10080 },
  { type: 'Bought', symbol: 'SOL', date: '2026-05-05 16:45', value: 7400 },
];

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const { user } = useSelector((state: RootState) => state.auth);

  const totalPortfolio = MOCK_HOLDINGS.reduce((sum, h) => sum + h.value, 0);
  const totalProfit = 8750;
  const profitPercent = 7.5;

  // Fetch orders when Order History tab is selected
  useEffect(() => {
    if (activeTab === 1) {
      const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
          const response = await axiosInstance.get<Order[]>('/api/orders/my');
          setOrders(response.data);
        } catch (err) {
          console.error('Error fetching orders:', err);
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchOrders();
    }
  }, [activeTab]);

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
                  {user?.email?.split('@')[0] || 'John Crypto'}
                </Typography>
                <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', mb: 0.8 }}>
                  {user?.email || 'john.crypto@example.com'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label="Verified Account"
                    size="small"
                    sx={{
                      bgcolor: 'rgba(0,230,118,0.15)',
                      color: '#00e676',
                      fontWeight: 600,
                      fontSize: '0.68rem',
                      height: 22,
                      border: '1px solid rgba(0,230,118,0.2)',
                    }}
                  />
                  <Chip
                    label="Pro Trader"
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
            <IconButton
              sx={{
                bgcolor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.6)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              <SettingsIcon />
            </IconButton>
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
                ${totalPortfolio.toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <TrendingUpIcon sx={{ fontSize: 15, color: 'rgba(255,255,255,0.35)' }} />
                <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                  Total Profit
                </Typography>
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: '#00e676' }}>
                +${totalProfit.toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <PercentIcon sx={{ fontSize: 15, color: 'rgba(255,255,255,0.35)' }} />
                <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                  Profit %
                </Typography>
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: '#00e676' }}>
                +{profitPercent}%
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
              {MOCK_HOLDINGS.map((holding, index) => (
                <Box
                  key={holding.symbol}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1.5,
                    borderBottom: index < MOCK_HOLDINGS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
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
                    ${holding.value.toLocaleString()}
                  </Typography>
                </Box>
              ))}
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
              {MOCK_ACTIVITY.map((activity, index) => {
                const isBuy = activity.type === 'Bought';
                return (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 1.5,
                      borderBottom: index < MOCK_ACTIVITY.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {isBuy ? (
                        <TrendingUpIcon sx={{ fontSize: 20, color: '#00e676' }} />
                      ) : (
                        <TrendingDownIcon sx={{ fontSize: 20, color: '#ff5252' }} />
                      )}
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.92rem' }}>
                          {activity.type} {activity.symbol}
                        </Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>
                          {activity.date}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        color: isBuy ? '#00e676' : '#ff5252',
                      }}
                    >
                      ${activity.value.toLocaleString()}
                    </Typography>
                  </Box>
                );
              })}
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
                    <TableCell>Type</TableCell>
                    <TableCell>Crypto</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => {
                    const isBuy = order.totalPrice > 0;
                    const statusColor =
                      order.status === 'COMPLETED' ? '#00e676' :
                      order.status === 'CANCELLED' ? '#ff5252' : '#ffd600';
                    const statusLabel =
                      order.status === 'COMPLETED' ? 'completed' :
                      order.status === 'CANCELLED' ? 'cancelled' : 'pending';

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
                        <TableCell>
                          <Chip
                            icon={isBuy ? <TrendingUpIcon /> : <TrendingDownIcon />}
                            label={isBuy ? 'BUY' : 'SELL'}
                            size="small"
                            sx={{
                              bgcolor: isBuy ? 'rgba(0,230,118,0.15)' : 'rgba(255,82,82,0.15)',
                              color: isBuy ? '#00e676' : '#ff5252',
                              fontWeight: 700,
                              fontSize: '0.72rem',
                              height: 26,
                              '& .MuiChip-icon': { color: isBuy ? '#00e676' : '#ff5252', fontSize: 14 },
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{order.currencyCode}</TableCell>
                        <TableCell align="right">{order.amount}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#fff' }}>
                          ${(order.totalPrice || 0).toFixed(2)}
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
            /* Fallback mock data when no real orders */
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Crypto</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    { id: '#ORD-001', type: 'BUY', crypto: 'BTC', amount: '0.5', price: '$62,500', total: '$31,250', status: 'completed', statusColor: '#00e676', date: '2026-05-05 14:30' },
                    { id: '#ORD-002', type: 'SELL', crypto: 'ETH', amount: '2.5', price: '$4,032', total: '$10,080', status: 'completed', statusColor: '#00e676', date: '2026-05-04 09:15' },
                    { id: '#ORD-003', type: 'BUY', crypto: 'SOL', amount: '50', price: '$148', total: '$7,400', status: 'pending', statusColor: '#ffd600', date: '2026-05-05 16:45' },
                    { id: '#ORD-004', type: 'BUY', crypto: 'BTC', amount: '0.25', price: '$61,000', total: '$15,250', status: 'completed', statusColor: '#00e676', date: '2026-05-03 11:20' },
                    { id: '#ORD-005', type: 'SELL', crypto: 'ADA', amount: '1000', price: '$0.46', total: '$460', status: 'cancelled', statusColor: '#ff5252', date: '2026-05-02 08:00' },
                  ].map((row, index) => {
                    const isBuy = row.type === 'BUY';
                    return (
                      <TableRow key={index} sx={{ '&:hover': { background: 'rgba(255,255,255,0.02)' } }}>
                        <TableCell sx={{ fontWeight: 600, color: '#fff' }}>{row.id}</TableCell>
                        <TableCell>
                          <Chip
                            icon={isBuy ? <TrendingUpIcon /> : <TrendingDownIcon />}
                            label={row.type}
                            size="small"
                            sx={{
                              bgcolor: isBuy ? 'rgba(0,230,118,0.15)' : 'rgba(255,82,82,0.15)',
                              color: isBuy ? '#00e676' : '#ff5252',
                              fontWeight: 700,
                              fontSize: '0.72rem',
                              height: 26,
                              '& .MuiChip-icon': { color: isBuy ? '#00e676' : '#ff5252', fontSize: 14 },
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{row.crypto}</TableCell>
                        <TableCell align="right">{row.amount}</TableCell>
                        <TableCell align="right">{row.price}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#fff' }}>{row.total}</TableCell>
                        <TableCell>
                          <Chip
                            label={row.status}
                            size="small"
                            sx={{
                              bgcolor: `${row.statusColor}15`,
                              color: row.statusColor,
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              height: 24,
                              border: `1px solid ${row.statusColor}30`,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>{row.date}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      )}
    </Box>
  );
};

export default ProfilePage;
