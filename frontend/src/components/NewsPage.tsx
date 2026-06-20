import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PublicIcon from '@mui/icons-material/Public';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import axiosInstance from '../api/axios';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  imageUrl: string;
  publishedAt: string;
  tags: string[];
}

const TAG_COLORS: Record<string, string> = {
  Market: '#ffd600',
  BTC: '#f7931a',
  ETH: '#627eea',
  DeFi: '#42a5f5',
  NFT: '#e040fb',
  Regulation: '#4caf50',
  Crypto: '#7c4dff',
};

const getTagColor = (tag: string): string => {
  return TAG_COLORS[tag] || '#7c4dff';
};

const getTagTextColor = (tag: string): string => {
  return tag === 'Market' || tag === 'BTC' ? '#000' : '#fff';
};

const formatTimeAgo = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

interface MarketItem {
  label: string;
  value: string;
  change: string;
}

const NewsPage: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marketData, setMarketData] = useState<MarketItem[]>([]);

  // Fetch news from backend
  const fetchNews = async () => {
    try {
      setError(null);
      const response = await axiosInstance.get<NewsItem[]>('/api/news');
      setNews(response.data);
    } catch (err: any) {
      console.error('Error fetching news:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Authentication required to view news.');
      } else {
        setError('Failed to load news. Backend may be offline.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch live market data from Binance
  const fetchMarketData = async () => {
    try {
      const tickerRes = await fetch(
        'https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT"]',
      );
      const tickers = await tickerRes.json();
      const btc = tickers.find((t: any) => t.symbol === 'BTCUSDT');
      const eth = tickers.find((t: any) => t.symbol === 'ETHUSDT');

      if (btc && eth) {
        setMarketData([
          {
            label: 'BTC Price',
            value: `$${parseFloat(btc.lastPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            change: `${parseFloat(btc.priceChangePercent) >= 0 ? '+' : ''}${parseFloat(btc.priceChangePercent).toFixed(1)}%`,
          },
          {
            label: 'ETH Price',
            value: `$${parseFloat(eth.lastPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            change: `${parseFloat(eth.priceChangePercent) >= 0 ? '+' : ''}${parseFloat(eth.priceChangePercent).toFixed(1)}%`,
          },
          {
            label: '24h Volume',
            value: `$${(parseFloat(btc.quoteVolume) / 1e9).toFixed(0)}B`,
            change: 'Trading',
          },
        ]);
      }
    } catch {
      // Leave market summary empty rather than showing fabricated numbers.
      setMarketData([]);
    }
  };

  // Refresh news (triggers backend NewsAPI + Gemini pipeline)
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await axiosInstance.post('/api/news/refresh');
      // Wait a bit for backend to process, then fetch updated news
      setTimeout(async () => {
        await fetchNews();
        setRefreshing(false);
      }, 3000);
    } catch (err) {
      console.error('Error refreshing news:', err);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
    fetchMarketData();
  }, []);

  // Split news: first 2 are "Important Updates", rest are "Latest News"
  const importantNews = news.slice(0, 2);
  const latestNews = news.slice(2);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#e91e8c' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ animation: 'fadeInUp 0.5s ease-out' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', md: '1.8rem' }, mb: 0.5 }}>
            News & Updates
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Stay informed with the latest crypto news
          </Typography>
        </Box>
        <Tooltip title="Refresh news (fetches latest from NewsAPI + Gemini summary)">
          <IconButton
            onClick={handleRefresh}
            disabled={refreshing}
            sx={{
              bgcolor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.6)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
            }}
          >
            {refreshing ? (
              <CircularProgress size={20} sx={{ color: '#e91e8c' }} />
            ) : (
              <RefreshIcon />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Error state */}
      {error && (
        <Alert
          severity="warning"
          sx={{
            mb: 3,
            borderRadius: 3,
            bgcolor: 'rgba(255, 214, 0, 0.08)',
            border: '1px solid rgba(255, 214, 0, 0.2)',
            color: '#fff',
            '& .MuiAlert-icon': { color: '#ffd600' },
          }}
        >
          {error}
        </Alert>
      )}

      {/* Empty state */}
      {news.length === 0 && !error && (
        <Card
          sx={{
            p: 4,
            mb: 3,
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', mb: 2 }}>
            No news available yet. Click refresh to fetch the latest crypto news.
          </Typography>
          <Button
            variant="contained"
            onClick={handleRefresh}
            disabled={refreshing}
            startIcon={refreshing ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <RefreshIcon />}
            sx={{
              background: 'linear-gradient(90deg, #e91e8c 0%, #ff6ec7 100%)',
              '&:hover': { background: 'linear-gradient(90deg, #d81880 0%, #f060b8 100%)' },
            }}
          >
            {refreshing ? 'Fetching news...' : 'Fetch Latest News'}
          </Button>
        </Card>
      )}

      {/* Important Updates */}
      {importantNews.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <NotificationsActiveIcon sx={{ color: '#ffd600', fontSize: 20 }} />
            <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>
              Important Updates
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
            {importantNews.map((item, index) => (
              <Card
                key={item.id}
                sx={{
                  flex: 1,
                  p: 2.5,
                  background: 'linear-gradient(135deg, rgba(233,30,140,0.12) 0%, rgba(124,77,255,0.08) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(233,30,140,0.15)',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(233,30,140,0.25)',
                  },
                  transition: 'all 0.3s ease',
                  animation: `fadeInUp 0.5s ease-out ${0.1 * (index + 1)}s both`,
                }}
                onClick={() => item.url && window.open(item.url, '_blank')}
              >
                <CardContent sx={{ p: '0 !important' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {item.tags.slice(0, 2).map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          sx={{
                            bgcolor: getTagColor(tag),
                            color: getTagTextColor(tag),
                            fontWeight: 700,
                            fontSize: '0.68rem',
                            height: 22,
                          }}
                        />
                      ))}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTimeIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }} />
                      <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                        {formatTimeAgo(item.publishedAt)}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', mb: 1, lineHeight: 1.3 }}>
                    {item.title}
                  </Typography>
                  <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', mb: 1.5, lineHeight: 1.5 }}>
                    {item.summary}
                  </Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>
                    Source: {item.source}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {/* Latest News */}
      {latestNews.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PublicIcon sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 20 }} />
            <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>
              Latest News
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {latestNews.map((item, index) => (
              <Card
                key={item.id}
                sx={{
                  p: 2.5,
                  background: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateX(4px)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255, 255, 255, 0.06)',
                  },
                  transition: 'all 0.3s ease',
                  animation: `fadeInUp 0.5s ease-out ${0.05 * (index + 1)}s both`,
                }}
                onClick={() => item.url && window.open(item.url, '_blank')}
              >
                <CardContent sx={{ p: '0 !important' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        {item.tags.slice(0, 2).map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            sx={{
                              bgcolor: getTagColor(tag),
                              color: getTagTextColor(tag),
                              fontWeight: 700,
                              fontSize: '0.68rem',
                              height: 22,
                            }}
                          />
                        ))}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AccessTimeIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }} />
                          <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>
                            {formatTimeAgo(item.publishedAt)}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '1rem', mb: 0.5 }}>
                        {item.title}
                      </Typography>
                      <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', mb: 1, lineHeight: 1.5 }}>
                        {item.summary}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>
                          Source: {item.source}
                        </Typography>
                        <Button
                          size="small"
                          endIcon={<OpenInNewIcon sx={{ fontSize: '14px !important' }} />}
                          sx={{
                            color: '#e91e8c',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            textTransform: 'none',
                            '&:hover': { background: 'rgba(233,30,140,0.08)' },
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.url) window.open(item.url, '_blank');
                          }}
                        >
                          Read More
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {/* Market Summary */}
      {marketData.length > 0 && (
      <Card
        sx={{
          p: 2.5,
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.06)',
          animation: 'fadeInUp 0.5s ease-out 0.3s both',
        }}
      >
        <CardContent sx={{ p: '0 !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <TrendingUpIcon sx={{ color: '#00e676', fontSize: 20 }} />
            <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>
              Market Summary
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 3,
            }}
          >
            {marketData.map((item, index) => (
              <Box key={index}>
                <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', mb: 0.5 }}>
                  {item.label}
                </Typography>
                <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', mb: 0.3 }}>
                  {item.value}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: item.change === 'Trading' ? 'rgba(255,255,255,0.5)' : '#00e676',
                  }}
                >
                  {item.change}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
      )}
    </Box>
  );
};

export default NewsPage;
