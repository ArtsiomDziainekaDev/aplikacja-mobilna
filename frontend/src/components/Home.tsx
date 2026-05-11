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
  type SelectChangeEvent,
} from '@mui/material';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import CalculateIcon from '@mui/icons-material/Calculate';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface CryptoPrice {
  symbol: string;
  name: string;
  icon: string;
  price: number;
  change24h: number;
}

const CRYPTOS: { symbol: string; name: string; icon: string }[] = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ' },
  { symbol: 'SOL', name: 'Solana', icon: '◎' },
  { symbol: 'BNB', name: 'Binance Coin', icon: '◆' },
  { symbol: 'ADA', name: 'Cardano', icon: '₳' },
  { symbol: 'XRP', name: 'Ripple', icon: '✕' },
  { symbol: 'DOGE', name: 'Dogecoin', icon: 'Ð' },
];

const Home: React.FC = () => {
  const [fromCrypto, setFromCrypto] = useState('BTC');
  const [toCrypto, setToCrypto] = useState('ETH');
  const [fromAmount, setFromAmount] = useState('1');
  const [prices, setPrices] = useState<Record<string, CryptoPrice>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
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
              price: parseFloat(item.lastPrice),
              change24h: parseFloat(item.priceChangePercent),
            };
          }
        });
        setPrices(priceMap);
      } catch (err) {
        console.error('Failed to fetch prices:', err);
        // Fallback mock data
        setPrices({
          BTC: { symbol: 'BTC', name: 'Bitcoin', icon: '₿', price: 62500, change24h: 2.5 },
          ETH: { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', price: 4032, change24h: 1.8 },
          SOL: { symbol: 'SOL', name: 'Solana', icon: '◎', price: 148, change24h: -0.5 },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const calculateConversion = () => {
    const from = prices[fromCrypto];
    const to = prices[toCrypto];
    if (!from || !to || !fromAmount) return '0';
    const result = (parseFloat(fromAmount) * from.price) / to.price;
    return result.toFixed(8);
  };

  const getExchangeRate = () => {
    const from = prices[fromCrypto];
    const to = prices[toCrypto];
    if (!from || !to) return '...';
    return (from.price / to.price).toFixed(6);
  };

  const handleSwap = () => {
    setFromCrypto(toCrypto);
    setToCrypto(fromCrypto);
  };

  const topCryptos = ['BTC', 'ETH', 'SOL']
    .map(s => prices[s])
    .filter(Boolean);

  const fromInfo = CRYPTOS.find(c => c.symbol === fromCrypto);
  const toInfo = CRYPTOS.find(c => c.symbol === toCrypto);

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
                  value={fromCrypto}
                  onChange={(e: SelectChangeEvent) => setFromCrypto(e.target.value)}
                  sx={{
                    flex: { sm: 1 },
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 2.5,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.25)' },
                  }}
                >
                  {CRYPTOS.map(c => (
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
                  value={toCrypto}
                  onChange={(e: SelectChangeEvent) => setToCrypto(e.target.value)}
                  sx={{
                    flex: { sm: 1 },
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 2.5,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.25)' },
                  }}
                >
                  {CRYPTOS.map(c => (
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                  Exchange Rate
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                  1 {fromCrypto} = {getExchangeRate()} {toCrypto}
                </Typography>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Price Cards */}
      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
        {topCryptos.map((crypto, index) => {
          const isPositive = crypto.change24h >= 0;
          return (
            <Card
              key={crypto.symbol}
              sx={{
                flex: 1,
                p: 2.5,
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
      </Box>
    </Box>
  );
};

export default Home;