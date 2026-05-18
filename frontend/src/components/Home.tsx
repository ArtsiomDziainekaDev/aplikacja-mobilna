import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Card,
  CardContent,
  CircularProgress,
  Button,
  type SelectChangeEvent,
} from '@mui/material';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import CalculateIcon from '@mui/icons-material/Calculate';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import axiosInstance from '../api/axios';

interface CryptoPrice {
  symbol: string;
  name: string;
  icon: string;
  price: number;
  change24h: number;
}

const CRYPTOS = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿', type: 'crypto' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', type: 'crypto' },
  { symbol: 'SOL', name: 'Solana', icon: '◎', type: 'crypto' },
  { symbol: 'BNB', name: 'Binance Coin', icon: '◆', type: 'crypto' },
  { symbol: 'ADA', name: 'Cardano', icon: '₳', type: 'crypto' },
  { symbol: 'XRP', name: 'Ripple', icon: '✕', type: 'crypto' },
  { symbol: 'DOGE', name: 'Dogecoin', icon: 'Ð', type: 'crypto' },
];

const FIATS = [
  { symbol: 'USD', name: 'US Dollar', icon: '$', type: 'fiat' },
  { symbol: 'EUR', name: 'Euro', icon: '€', type: 'fiat' },
  { symbol: 'GBP', name: 'British Pound', icon: '£', type: 'fiat' },
  { symbol: 'PLN', name: 'Polish Zloty', icon: 'zł', type: 'fiat' },
];

const ALL_CURRENCIES = [...CRYPTOS, ...FIATS];

const Home: React.FC = () => {
  const [fromCurrency, setFromCurrency] = useState('BTC');
  const [toCurrency, setToCurrency] = useState('ETH');
  const [fromAmount, setFromAmount] = useState('1');
  const [prices, setPrices] = useState<Record<string, CryptoPrice>>({});
  const [loading, setLoading] = useState(true);
  const [isOrdering, setIsOrdering] = useState(false);
  
  // Favorites State
  const [favorites, setFavorites] = useState<string[]>(['BTC', 'ETH', 'SOL']);
  const [isEditingFavs, setIsEditingFavs] = useState(false);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        // Fetch Crypto
        const symbols = CRYPTOS.map(c => c.symbol + 'USDT');
        const response = await fetch(
          `https://api.binance.com/api/v3/ticker/24hr?symbols=${JSON.stringify(symbols)}`
        );
        const data = await response.json();
        
        const priceMap: Record<string, CryptoPrice> = {};
        data.forEach((item: any) => {
          const symbol = item.symbol.replace('USDT', '');
          const cryptoInfo = CRYPTOS.find(c => c.symbol === symbol);
          if (cryptoInfo) {
            priceMap[symbol] = {
              symbol,
              name: cryptoInfo.name,
              icon: cryptoInfo.icon,
              price: parseFloat(item.lastPrice), // Price in USD
              change24h: parseFloat(item.priceChangePercent),
            };
          }
        });

        // Add Fiat static rates to priceMap for calculator (Price relative to USD)
        priceMap['USD'] = { symbol: 'USD', name: 'US Dollar', icon: '$', price: 1, change24h: 0 };
        priceMap['EUR'] = { symbol: 'EUR', name: 'Euro', icon: '€', price: 1.08, change24h: 0 };
        priceMap['GBP'] = { symbol: 'GBP', name: 'British Pound', icon: '£', price: 1.25, change24h: 0 };
        priceMap['PLN'] = { symbol: 'PLN', name: 'Polish Zloty', icon: 'zł', price: 0.25, change24h: 0 };
        
        setPrices(priceMap);
      } catch (err) {
        console.error('Failed to fetch prices:', err);
        // Fallback mock data
        const fallback: Record<string, CryptoPrice> = {
          BTC: { symbol: 'BTC', name: 'Bitcoin', icon: '₿', price: 62500, change24h: 2.5 },
          ETH: { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', price: 4032, change24h: 1.8 },
          SOL: { symbol: 'SOL', name: 'Solana', icon: '◎', price: 148, change24h: -0.5 },
          USD: { symbol: 'USD', name: 'US Dollar', icon: '$', price: 1, change24h: 0 },
          EUR: { symbol: 'EUR', name: 'Euro', icon: '€', price: 1.08, change24h: 0 },
          GBP: { symbol: 'GBP', name: 'British Pound', icon: '£', price: 1.25, change24h: 0 },
          PLN: { symbol: 'PLN', name: 'Polish Zloty', icon: 'zł', price: 0.25, change24h: 0 },
        };
        setPrices(fallback);
      } finally {
        setLoading(false);
      }
    };

    const fetchFavorites = async () => {
      try {
        const { data } = await axiosInstance.get('/crypto/favorites');
        if (data && data.length > 0) {
          setFavorites(data);
        }
      } catch (err) {
        console.error('Failed to fetch favorites', err);
      }
    };

    fetchPrices();
    fetchFavorites();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const calculateConversion = () => {
    const from = prices[fromCurrency];
    const to = prices[toCurrency];
    if (!from || !to || !fromAmount) return '0';
    const result = (parseFloat(fromAmount) * from.price) / to.price;
    return result.toFixed(8).replace(/\.?0+$/, ''); // remove trailing zeros
  };

  const getExchangeRate = () => {
    const from = prices[fromCurrency];
    const to = prices[toCurrency];
    if (!from || !to) return '...';
    return (from.price / to.price).toFixed(6).replace(/\.?0+$/, '');
  };

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handlePlaceOrder = async () => {
    setIsOrdering(true);
    try {
      // The backend expects currencyCode (crypto) and amount (crypto).
      // If user is buying Crypto with Fiat, 'toCurrency' is the crypto.
      // If user selected two cryptos, we'll use 'toCurrency'.
      const cryptoCode = toCurrency;
      const amount = parseFloat(calculateConversion());
      await axiosInstance.post('/orders', { currencyCode: cryptoCode, amount });
      alert('Order placed successfully!');
    } catch (err) {
      console.error('Failed to place order:', err);
      alert('Failed to place order.');
    } finally {
      setIsOrdering(false);
    }
  };

  const handleRemoveFavorite = async (symbol: string) => {
    try {
      await axiosInstance.delete(`/crypto/favorites/${symbol}`);
      setFavorites(prev => prev.filter(f => f !== symbol));
    } catch (err) {
      console.error('Failed to remove favorite', err);
    }
  };

  const handleAddFavorite = async (symbol: string) => {
    if (favorites.length >= 3) {
      alert('Maximum 3 favorite coins allowed.');
      return;
    }
    try {
      await axiosInstance.post(`/crypto/favorites/${symbol}`);
      setFavorites(prev => [...prev, symbol]);
    } catch (err) {
      console.error('Failed to add favorite', err);
    }
  };

  const favoriteCryptos = favorites
    .map(s => prices[s])
    .filter(Boolean);

  // Remaining available cryptos for adding to favorites
  const availableToAdd = CRYPTOS.filter(c => !favorites.includes(c.symbol));

  return (
    <Box sx={{ animation: 'fadeInUp 0.5s ease-out' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CalculateIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 22 }} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', md: '1.8rem' } }}>
            Crypto Calculator
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Real-time cryptocurrency converter
          </Typography>
        </Box>
      </Box>

      {/* Calculator Card */}
      <Card
        sx={{
          mb: 3,
          p: { xs: 2, md: 3 },
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <CardContent sx={{ p: { xs: 1, md: 2 } }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: '#e91e8c' }} />
            </Box>
          ) : (
            <>
              {/* From */}
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 1.5, fontWeight: 500 }}>
                From
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Select
                  value={fromCurrency}
                  onChange={(e: SelectChangeEvent) => setFromCurrency(e.target.value)}
                  sx={{
                    flex: { sm: 1 },
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 2.5,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.25)' },
                  }}
                >
                  {ALL_CURRENCIES.map(c => (
                    <MenuItem key={c.symbol} value={c.symbol}>
                      {c.icon} {c.name} ({c.symbol})
                    </MenuItem>
                  ))}
                </Select>
                <TextField
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  type="number"
                  sx={{
                    flex: { sm: 1 },
                    '& .MuiOutlinedInput-root': {
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: 2.5,
                      fontSize: '1.2rem',
                      fontWeight: 600,
                    },
                  }}
                />
              </Box>

              {/* Swap Button */}
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <IconButton
                  onClick={handleSwap}
                  sx={{
                    width: 44,
                    height: 44,
                    background: 'linear-gradient(135deg, #e91e8c, #ff6ec7)',
                    color: '#fff',
                    boxShadow: '0 4px 15px rgba(233, 30, 140, 0.4)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #d81880, #f060b8)',
                      transform: 'rotate(180deg)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  <SwapVertIcon />
                </IconButton>
              </Box>

              {/* To */}
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 1.5, fontWeight: 500 }}>
                To
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Select
                  value={toCurrency}
                  onChange={(e: SelectChangeEvent) => setToCurrency(e.target.value)}
                  sx={{
                    flex: { sm: 1 },
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 2.5,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.25)' },
                  }}
                >
                  {ALL_CURRENCIES.map(c => (
                    <MenuItem key={c.symbol} value={c.symbol}>
                      {c.icon} {c.name} ({c.symbol})
                    </MenuItem>
                  ))}
                </Select>
                <TextField
                  value={calculateConversion()}
                  InputProps={{ readOnly: true }}
                  sx={{
                    flex: { sm: 1 },
                    '& .MuiOutlinedInput-root': {
                      background: 'linear-gradient(135deg, rgba(233,30,140,0.1), rgba(124,77,255,0.1))',
                      borderRadius: 2.5,
                      fontSize: '1.2rem',
                      fontWeight: 600,
                    },
                  }}
                />
              </Box>

              {/* Exchange Rate */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, mb: 2 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                  Exchange Rate
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                  1 {fromCurrency} = {getExchangeRate()} {toCurrency}
                </Typography>
              </Box>

              {/* Place Order Button */}
              <Button
                variant="contained"
                fullWidth
                disabled={isOrdering}
                onClick={handlePlaceOrder}
                startIcon={isOrdering ? <CircularProgress size={20} color="inherit" /> : <ShoppingCartIcon />}
                sx={{
                  background: '#00e676',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  '&:hover': {
                    background: '#00c853',
                  },
                }}
              >
                Place Order
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Favorite Coins Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.2rem' }}>
          Favorite Coins
        </Typography>
        <IconButton
          onClick={() => setIsEditingFavs(!isEditingFavs)}
          sx={{
            background: isEditingFavs ? 'rgba(233,30,140,0.2)' : 'rgba(255,255,255,0.06)',
            color: isEditingFavs ? '#e91e8c' : 'rgba(255,255,255,0.7)',
            '&:hover': { background: isEditingFavs ? 'rgba(233,30,140,0.3)' : 'rgba(255,255,255,0.1)' },
          }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Favorite Price Cards */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', flexDirection: { xs: 'column', sm: 'row' } }}>
        {favoriteCryptos.map((crypto, index) => {
          const isPositive = crypto.change24h >= 0;
          return (
            <Card
              key={crypto.symbol}
              sx={{
                flex: { xs: '1 1 100%', sm: '0 1 30%' },
                minWidth: 200,
                maxWidth: 300,
                p: 2.5,
                position: 'relative',
                cursor: 'pointer',
                background: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
                },
                animation: `fadeInUp 0.5s ease-out ${0.1 * (index + 1)}s both`,
              }}
            >
              {isEditingFavs && (
                <IconButton
                  onClick={(e) => { e.stopPropagation(); handleRemoveFavorite(crypto.symbol); }}
                  size="small"
                  sx={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,0,0,0.2)', color: '#ff5252', '&:hover': { background: 'rgba(255,0,0,0.4)' } }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
              <CardContent sx={{ p: '0 !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Typography sx={{ fontSize: '1.5rem' }}>{crypto.icon}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {isPositive ? (
                      <TrendingUpIcon sx={{ fontSize: 16, color: '#00e676' }} />
                    ) : (
                      <TrendingDownIcon sx={{ fontSize: 16, color: '#ff5252' }} />
                    )}
                    <Typography
                      sx={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: isPositive ? '#00e676' : '#ff5252',
                      }}
                    >
                      {isPositive ? '+' : ''}{crypto.change24h.toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: '1rem', mb: 0.3 }}>
                  {crypto.name}
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', mb: 1 }}>
                  1 {crypto.symbol}
                </Typography>
                <Typography sx={{ fontWeight: 800, fontSize: '1.3rem' }}>
                  ${crypto.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </Typography>
              </CardContent>
            </Card>
          );
        })}

        {isEditingFavs && favorites.length < 3 && availableToAdd.length > 0 && (
          <Card
            sx={{
              flex: { xs: '1 1 100%', sm: '0 1 30%' },
              minWidth: 200,
              maxWidth: 300,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              p: 2.5,
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed rgba(255,255,255,0.2)',
            }}
          >
            <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255,255,255,0.5)' }}>Add Coin</Typography>
            <Select
              value=""
              displayEmpty
              onChange={(e: SelectChangeEvent) => handleAddFavorite(e.target.value)}
              sx={{ width: '100%', mb: 1, background: 'rgba(255,255,255,0.05)' }}
            >
              <MenuItem value="" disabled>Select Coin</MenuItem>
              {availableToAdd.map(c => (
                <MenuItem key={c.symbol} value={c.symbol}>{c.icon} {c.name}</MenuItem>
              ))}
            </Select>
          </Card>
        )}
      </Box>
    </Box>
  );
};

export default Home;