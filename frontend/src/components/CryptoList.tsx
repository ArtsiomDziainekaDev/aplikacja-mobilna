import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  ButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

interface CryptoData {
  symbol: string;
  name: string;
  icon: string;
  price: number;
  change24h: number;
  volume24h: number;
  chartColor: string;
}

interface ChartDataPoint {
  time: string;
  price: number;
}

const CRYPTO_CONFIG: { symbol: string; name: string; icon: string; chartColor: string }[] = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿', chartColor: '#f7931a' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', chartColor: '#627eea' },
  { symbol: 'BNB', name: 'BNB', icon: '◆', chartColor: '#f3ba2f' },
  { symbol: 'SOL', name: 'Solana', icon: '◎', chartColor: '#00e5a0' },
  { symbol: 'XRP', name: 'Ripple', icon: '✕', chartColor: '#00aae4' },
  { symbol: 'ADA', name: 'Cardano', icon: '₳', chartColor: '#0033ad' },
  { symbol: 'DOGE', name: 'Dogecoin', icon: 'Ð', chartColor: '#c2a633' },
  { symbol: 'AVAX', name: 'Avalanche', icon: '▲', chartColor: '#e84142' },
  { symbol: 'DOT', name: 'Polkadot', icon: '●', chartColor: '#e6007a' },
  { symbol: 'MATIC', name: 'Polygon', icon: '⬡', chartColor: '#8247e5' },
  { symbol: 'LINK', name: 'Chainlink', icon: '⬢', chartColor: '#375bd2' },
  { symbol: 'UNI', name: 'Uniswap', icon: '🦄', chartColor: '#ff007a' },
  { symbol: 'LTC', name: 'Litecoin', icon: 'Ł', chartColor: '#bfbbbb' },
  { symbol: 'ATOM', name: 'Cosmos', icon: '⚛', chartColor: '#6f7390' },
  { symbol: 'FIL', name: 'Filecoin', icon: '⨎', chartColor: '#42c1ca' },
];

const TIME_FILTERS = ['1H', '24H', '7D', '1M', '1Y'] as const;
type TimeFilter = typeof TIME_FILTERS[number];

const getKlineInterval = (filter: TimeFilter): { interval: string; limit: number } => {
  switch (filter) {
    case '1H': return { interval: '1m', limit: 60 };
    case '24H': return { interval: '1h', limit: 24 };
    case '7D': return { interval: '4h', limit: 42 };
    case '1M': return { interval: '1d', limit: 30 };
    case '1Y': return { interval: '1w', limit: 52 };
  }
};

const formatTimeLabel = (timestamp: number, filter: TimeFilter): string => {
  const date = new Date(timestamp);
  switch (filter) {
    case '1H':
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    case '24H':
      return `${date.getHours().toString().padStart(2, '0')}:00`;
    case '7D':
    case '1M':
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    case '1Y':
      return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
  }
};

const formatPrice = (price: number): string => {
  if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(4)}`;
};

const formatVolume = (vol: number): string => {
  if (vol >= 1e9) return `$${(vol / 1e9).toFixed(1)}B`;
  if (vol >= 1e6) return `$${(vol / 1e6).toFixed(0)}M`;
  return `$${vol.toLocaleString()}`;
};

const CryptoList: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [cryptos, setCryptos] = useState<CryptoData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('24H');
  const [mainChartData, setMainChartData] = useState<ChartDataPoint[]>([]);
  const [miniChartsData, setMiniChartsData] = useState<Record<string, ChartDataPoint[]>>({});
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);

  // Fetch all prices
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const symbols = CRYPTO_CONFIG.map(c => c.symbol + 'USDT');
        const response = await fetch(
          `https://api.binance.com/api/v3/ticker/24hr?symbols=${JSON.stringify(symbols)}`
        );
        const data = await response.json();

        const cryptoList: CryptoData[] = CRYPTO_CONFIG.map(config => {
          const ticker = data.find((d: any) => d.symbol === config.symbol + 'USDT');
          return {
            ...config,
            price: ticker ? parseFloat(ticker.lastPrice) : 0,
            change24h: ticker ? parseFloat(ticker.priceChangePercent) : 0,
            volume24h: ticker ? parseFloat(ticker.quoteVolume) : 0,
          };
        }).filter(c => c.price > 0); // Remove coins that Binance didn't return

        setCryptos(cryptoList);
      } catch (err) {
        // Fallback
        setCryptos(CRYPTO_CONFIG.slice(0, 5).map((c, i) => ({
          ...c,
          price: [62500, 4032, 580, 148, 0.52][i],
          change24h: [2.46, 1.82, -0.8, -0.5, 3.1][i],
          volume24h: [28e9, 15e9, 1.8e9, 2.5e9, 1.2e9][i],
        })));
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch main chart
  useEffect(() => {
    if (cryptos.length === 0) return;
    const fetchChart = async () => {
      setChartLoading(true);
      try {
        const symbol = cryptos[selectedIndex]?.symbol;
        if (!symbol) return;
        const { interval, limit } = getKlineInterval(timeFilter);
        const response = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=${interval}&limit=${limit}`
        );
        const data = await response.json();
        const formatted = data.map((item: any) => ({
          time: formatTimeLabel(item[0], timeFilter),
          price: parseFloat(item[4]),
        }));
        setMainChartData(formatted);
      } catch {
        setMainChartData([]);
      } finally {
        setChartLoading(false);
      }
    };
    fetchChart();
  }, [cryptos, selectedIndex, timeFilter]);

  // Fetch mini sparklines for all coins (24h, lightweight)
  useEffect(() => {
    if (cryptos.length === 0) return;
    const fetchMiniCharts = async () => {
      const results: Record<string, ChartDataPoint[]> = {};
      // Fetch in batches to avoid rate limiting
      for (const crypto of cryptos) {
        try {
          const response = await fetch(
            `https://api.binance.com/api/v3/klines?symbol=${crypto.symbol}USDT&interval=2h&limit=12`
          );
          const data = await response.json();
          if (Array.isArray(data)) {
            results[crypto.symbol] = data.map((item: any) => ({
              time: '',
              price: parseFloat(item[4]),
            }));
          }
        } catch {
          results[crypto.symbol] = [];
        }
      }
      setMiniChartsData(results);
    };
    fetchMiniCharts();
  }, [cryptos]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#e91e8c' }} />
      </Box>
    );
  }

  const activeCrypto = cryptos[selectedIndex];
  const isPositive = activeCrypto?.change24h >= 0;

  return (
    <Box sx={{ animation: 'fadeInUp 0.5s ease-out' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
        <Box
          sx={{
            width: 40, height: 40, borderRadius: 2,
            background: 'rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ShowChartIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 22 }} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', md: '1.8rem' } }}>
            Crypto Charts
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Track real-time cryptocurrency prices
          </Typography>
        </Box>
      </Box>

      {/* Main Chart Card */}
      {activeCrypto && (
        <Card
          sx={{
            mb: 3, p: { xs: 2, md: 3 },
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <CardContent sx={{ p: { xs: 0, md: 1 } }}>
            {/* Info + Filters */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                  <Box
                    sx={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: `${activeCrypto.chartColor}25`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.1rem', border: `1px solid ${activeCrypto.chartColor}40`,
                    }}
                  >
                    {activeCrypto.icon}
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.15rem' }}>
                      {activeCrypto.name}
                    </Typography>
                    <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
                      {activeCrypto.symbol}/USDT
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mt: 1 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.6rem', md: '2rem' } }}>
                    {formatPrice(activeCrypto.price)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                    {isPositive ? (
                      <TrendingUpIcon sx={{ fontSize: 16, color: '#00e676' }} />
                    ) : (
                      <TrendingDownIcon sx={{ fontSize: 16, color: '#ff5252' }} />
                    )}
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: isPositive ? '#00e676' : '#ff5252' }}>
                      {isPositive ? '+' : ''}{activeCrypto.change24h.toFixed(2)}%
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Time Filters */}
              <ButtonGroup size="small" sx={{
                '& .MuiButton-root': {
                  borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)',
                  fontSize: '0.75rem', px: 1.5, py: 0.5, minWidth: 40,
                  '&:hover': { borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)' },
                },
              }}>
                {TIME_FILTERS.map(f => (
                  <Button key={f} onClick={() => setTimeFilter(f)} sx={{
                    ...(timeFilter === f && {
                      background: '#00e676 !important', color: '#000 !important',
                      fontWeight: '700 !important', borderColor: '#00e676 !important',
                    }),
                  }}>
                    {f}
                  </Button>
                ))}
              </ButtonGroup>
            </Box>

            {/* Chart */}
            <Box sx={{ height: { xs: 200, md: 300 }, width: '100%' }}>
              {chartLoading ? (
                <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <CircularProgress size={28} sx={{ color: '#e91e8c' }} />
                </Box>
              ) : mainChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mainChartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="mainChartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={activeCrypto.chartColor} stopOpacity={0.3} />
                        <stop offset="50%" stopColor="#e91e8c" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#7c4dff" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" axisLine={false} tickLine={false}
                      tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis axisLine={false} tickLine={false}
                      tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} domain={['auto', 'auto']}
                      tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(2)} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', color: '#fff',
                      }}
                      itemStyle={{ color: activeCrypto.chartColor, fontWeight: 700 }}
                      formatter={(value: number) => [`$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, 'Price']}
                      labelStyle={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}
                    />
                    <Area type="monotone" dataKey="price" stroke={activeCrypto.chartColor}
                      strokeWidth={2.5} fillOpacity={1} fill="url(#mainChartGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.3)' }}>No chart data</Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Crypto Table */}
      <Card sx={{
        background: 'rgba(255, 255, 255, 0.04)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden',
      }}>
        <Box sx={{ p: 2.5, pb: 1.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
            All Cryptocurrencies
          </Typography>
          <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
            {cryptos.length} coins · Click to view chart
          </Typography>
        </Box>

        <TableContainer sx={{ maxHeight: isMobile ? 400 : 520 }}>
          <Table stickyHeader size="small" sx={{
            '& .MuiTableCell-stickyHeader': {
              background: 'rgba(26, 5, 51, 0.95)',
              backdropFilter: 'blur(20px)',
            },
          }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 50 }}>#</TableCell>
                <TableCell>Coin</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>24h %</TableCell>
                <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>Volume</TableCell>
                <TableCell align="center" sx={{ width: 100, display: { xs: 'none', sm: 'table-cell' } }}>
                  24h Chart
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cryptos.map((crypto, index) => {
                const positive = crypto.change24h >= 0;
                const miniData = miniChartsData[crypto.symbol] || [];
                const isSelected = index === selectedIndex;

                return (
                  <TableRow
                    key={crypto.symbol}
                    onClick={() => setSelectedIndex(index)}
                    sx={{
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(233, 30, 140, 0.08)' : 'transparent',
                      borderLeft: isSelected ? '3px solid #e91e8c' : '3px solid transparent',
                      '&:hover': {
                        background: isSelected ? 'rgba(233, 30, 140, 0.12)' : 'rgba(255,255,255,0.04)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Rank */}
                    <TableCell sx={{ color: 'rgba(255,255,255,0.35)', fontWeight: 500, fontSize: '0.82rem' }}>
                      {index + 1}
                    </TableCell>

                    {/* Coin */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <Box sx={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: `${crypto.chartColor}20`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.9rem', border: `1px solid ${crypto.chartColor}35`,
                          flexShrink: 0,
                        }}>
                          {crypto.icon}
                        </Box>
                        <Box>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', lineHeight: 1.2 }}>
                            {crypto.name}
                          </Typography>
                          <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>
                            {crypto.symbol}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Price */}
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
                      {formatPrice(crypto.price)}
                    </TableCell>

                    {/* 24h % */}
                    <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.3 }}>
                        {positive ? (
                          <TrendingUpIcon sx={{ fontSize: 14, color: '#00e676' }} />
                        ) : (
                          <TrendingDownIcon sx={{ fontSize: 14, color: '#ff5252' }} />
                        )}
                        <Typography sx={{
                          fontSize: '0.82rem', fontWeight: 600,
                          color: positive ? '#00e676' : '#ff5252',
                        }}>
                          {positive ? '+' : ''}{crypto.change24h.toFixed(2)}%
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Volume */}
                    <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' }, color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>
                      {formatVolume(crypto.volume24h)}
                    </TableCell>

                    {/* Mini sparkline */}
                    <TableCell align="center" sx={{ display: { xs: 'none', sm: 'table-cell' }, p: 0.5 }}>
                      {miniData.length > 0 ? (
                        <Box sx={{ width: 80, height: 32, mx: 'auto' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={miniData}>
                              <Line
                                type="monotone" dataKey="price"
                                stroke={positive ? '#00e676' : '#ff5252'}
                                strokeWidth={1.5} dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </Box>
                      ) : (
                        <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)' }}>—</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default CryptoList;