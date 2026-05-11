import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  ButtonGroup,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
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
  chartColor: string;
}

interface ChartDataPoint {
  time: string;
  price: number;
}

const CRYPTO_CONFIG = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿', chartColor: '#f7931a' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', chartColor: '#627eea' },
  { symbol: 'SOL', name: 'Solana', icon: '◎', chartColor: '#00e5a0' },
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
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    case '1M':
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    case '1Y':
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months[date.getMonth()];
  }
};

const CryptoList: React.FC = () => {
  const [cryptos, setCryptos] = useState<CryptoData[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState(0);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('24H');
  const [mainChartData, setMainChartData] = useState<ChartDataPoint[]>([]);
  const [miniChartsData, setMiniChartsData] = useState<Record<string, ChartDataPoint[]>>({});
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch prices
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
          };
        });
        setCryptos(cryptoList);
      } catch (err) {
        // Fallback data
        setCryptos(CRYPTO_CONFIG.map((config, i) => ({
          ...config,
          price: [62500, 4032, 148][i],
          change24h: [2.46, 1.82, -0.5][i],
        })));
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch main chart data
  useEffect(() => {
    if (cryptos.length === 0) return;
    const fetchChart = async () => {
      setChartLoading(true);
      try {
        const symbol = cryptos[selectedCrypto].symbol;
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
  }, [cryptos, selectedCrypto, timeFilter]);

  // Fetch mini charts (24H for all cryptos)
  useEffect(() => {
    if (cryptos.length === 0) return;
    const fetchMiniCharts = async () => {
      const results: Record<string, ChartDataPoint[]> = {};
      for (const crypto of cryptos) {
        try {
          const response = await fetch(
            `https://api.binance.com/api/v3/klines?symbol=${crypto.symbol}USDT&interval=1h&limit=24`
          );
          const data = await response.json();
          results[crypto.symbol] = data.map((item: any) => ({
            time: formatTimeLabel(item[0], '24H'),
            price: parseFloat(item[4]),
          }));
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

  if (error) {
    return <Alert severity="error" sx={{ mt: 2, borderRadius: 3 }}>{error}</Alert>;
  }

  const activeCrypto = cryptos[selectedCrypto];
  const isPositive = activeCrypto?.change24h >= 0;

  return (
    <Box sx={{ animation: 'fadeInUp 0.5s ease-out' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', md: '1.8rem' }, mb: 0.5 }}>
          Crypto Charts
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          Track real-time cryptocurrency prices
        </Typography>
      </Box>

      {/* Main Chart Card */}
      {activeCrypto && (
        <Card
          sx={{
            mb: 3,
            p: { xs: 2, md: 3 },
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <CardContent sx={{ p: { xs: 0, md: 1 } }}>
            {/* Crypto info + time filter */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography sx={{ fontSize: '1.5rem' }}>{activeCrypto.icon}</Typography>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.2rem' }}>
                      {activeCrypto.name}
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                      {activeCrypto.symbol}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mt: 1 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.6rem', md: '2rem' } }}>
                    ${activeCrypto.price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                    {isPositive ? (
                      <TrendingUpIcon sx={{ fontSize: 16, color: '#00e676' }} />
                    ) : (
                      <TrendingDownIcon sx={{ fontSize: 16, color: '#ff5252' }} />
                    )}
                    <Typography
                      sx={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: isPositive ? '#00e676' : '#ff5252',
                      }}
                    >
                      {isPositive ? '+' : ''}{activeCrypto.change24h.toFixed(2)}%
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Time Filters */}
              <ButtonGroup
                size="small"
                sx={{
                  '& .MuiButton-root': {
                    borderColor: 'rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '0.75rem',
                    px: 1.5,
                    py: 0.5,
                    minWidth: 40,
                    '&:hover': {
                      borderColor: 'rgba(255,255,255,0.3)',
                      background: 'rgba(255,255,255,0.05)',
                    },
                  },
                }}
              >
                {TIME_FILTERS.map(f => (
                  <Button
                    key={f}
                    onClick={() => setTimeFilter(f)}
                    sx={{
                      ...(timeFilter === f && {
                        background: '#00e676 !important',
                        color: '#000 !important',
                        fontWeight: '700 !important',
                        borderColor: '#00e676 !important',
                      }),
                    }}
                  >
                    {f}
                  </Button>
                ))}
              </ButtonGroup>
            </Box>

            {/* Chart */}
            <Box sx={{ height: { xs: 200, md: 280 }, width: '100%' }}>
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
                    <XAxis
                      dataKey="time"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                      domain={['auto', 'auto']}
                      tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toString()}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(0,0,0,0.85)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: 10,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                        color: '#fff',
                      }}
                      itemStyle={{ color: activeCrypto.chartColor, fontWeight: 700 }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'price']}
                      labelStyle={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={activeCrypto.chartColor}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#mainChartGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.3)' }}>
                    No chart data available
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Mini Crypto Cards */}
      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
        {cryptos.map((crypto, index) => {
          const positive = crypto.change24h >= 0;
          const miniData = miniChartsData[crypto.symbol] || [];
          const isSelected = index === selectedCrypto;

          return (
            <Card
              key={crypto.symbol}
              onClick={() => setSelectedCrypto(index)}
              sx={{
                flex: 1,
                cursor: 'pointer',
                p: 2,
                background: isSelected
                  ? 'rgba(233, 30, 140, 0.08)'
                  : 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(20px)',
                border: isSelected
                  ? '1px solid rgba(233, 30, 140, 0.3)'
                  : '1px solid rgba(255,255,255,0.08)',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  border: isSelected
                    ? '1px solid rgba(233, 30, 140, 0.4)'
                    : '1px solid rgba(255,255,255,0.15)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
                },
                transition: 'all 0.3s ease',
                animation: `fadeInUp 0.5s ease-out ${0.1 * (index + 1)}s both`,
              }}
            >
              <CardContent sx={{ p: '0 !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: '1.3rem' }}>{crypto.icon}</Typography>
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        {crypto.name}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                        {crypto.symbol}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                    {positive ? (
                      <TrendingUpIcon sx={{ fontSize: 14, color: '#00e676' }} />
                    ) : (
                      <TrendingDownIcon sx={{ fontSize: 14, color: '#ff5252' }} />
                    )}
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: positive ? '#00e676' : '#ff5252' }}>
                      {positive ? '+' : ''}{crypto.change24h.toFixed(2)}%
                    </Typography>
                  </Box>
                </Box>

                <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', mb: 1 }}>
                  ${crypto.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </Typography>

                {/* Mini Chart */}
                {miniData.length > 0 && (
                  <Box sx={{ height: 40, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={miniData}>
                        <Line
                          type="monotone"
                          dataKey="price"
                          stroke={crypto.chartColor}
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
};

export default CryptoList;