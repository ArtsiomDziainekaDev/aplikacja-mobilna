import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PublicIcon from '@mui/icons-material/Public';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface NewsItem {
  id: number;
  title: string;
  description: string;
  category: 'Market' | 'Technology' | 'Regulation' | 'DeFi';
  source: string;
  time: string;
  featured?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  Market: '#ffd600',
  Technology: '#e91e63',
  Regulation: '#4caf50',
  DeFi: '#42a5f5',
};

const IMPORTANT_NEWS: NewsItem[] = [
  {
    id: 1,
    title: 'Bitcoin Surges Past $62,000 Mark',
    description: 'Bitcoin reaches new monthly high as institutional investors show renewed interest in cryptocurrency markets.',
    category: 'Market',
    source: 'CryptoNews',
    time: '2 hours ago',
    featured: true,
  },
  {
    id: 2,
    title: 'Ethereum 2.0 Upgrade Successful',
    description: 'The latest Ethereum network upgrade has been completed successfully, bringing improved scalability and reduced gas fees.',
    category: 'Technology',
    source: 'BlockchainDaily',
    time: '5 hours ago',
    featured: true,
  },
];

const LATEST_NEWS: NewsItem[] = [
  {
    id: 3,
    title: 'New Regulations for Crypto Trading',
    description: 'Financial regulators announce new framework for cryptocurrency exchanges to enhance investor protection.',
    category: 'Regulation',
    source: 'FinanceWatch',
    time: '8 hours ago',
  },
  {
    id: 4,
    title: 'Solana Network Upgrades Complete',
    description: 'Solana successfully implements performance improvements, targeting faster transaction speeds and lower costs.',
    category: 'Technology',
    source: 'CryptoTech',
    time: '12 hours ago',
  },
  {
    id: 5,
    title: 'Major Exchange Lists New Tokens',
    description: 'Leading cryptocurrency exchange announces support for five new digital assets, expanding trading options.',
    category: 'Market',
    source: 'ExchangeNews',
    time: '1 day ago',
  },
  {
    id: 6,
    title: 'DeFi Protocol Reaches $1B TVL',
    description: 'Decentralized finance platform celebrates milestone of $1 billion in total value locked.',
    category: 'DeFi',
    source: 'DeFiInsider',
    time: '1 day ago',
  },
];

const MARKET_SUMMARY = [
  { label: 'BTC Price', value: '$62,500', change: '+2.5%' },
  { label: 'ETH Price', value: '$4,032', change: '+1.8%' },
  { label: 'Market Cap', value: '$2.4T', change: '+3.2%' },
  { label: '24h Volume', value: '$128B', change: 'Trading' },
];

const NewsPage: React.FC = () => {
  return (
    <Box sx={{ animation: 'fadeInUp 0.5s ease-out' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', md: '1.8rem' }, mb: 0.5 }}>
          News & Updates
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          Stay informed with the latest crypto news
        </Typography>
      </Box>

      {/* Important Updates */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <NotificationsActiveIcon sx={{ color: '#ffd600', fontSize: 20 }} />
          <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>
            Important Updates
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
          {IMPORTANT_NEWS.map((news, index) => (
            <Card
              key={news.id}
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
            >
              <CardContent sx={{ p: '0 !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Chip
                    label={news.category}
                    size="small"
                    sx={{
                      bgcolor: CATEGORY_COLORS[news.category],
                      color: news.category === 'Market' ? '#000' : '#fff',
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      height: 24,
                    }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AccessTimeIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }} />
                    <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                      {news.time}
                    </Typography>
                  </Box>
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', mb: 1, lineHeight: 1.3 }}>
                  {news.title}
                </Typography>
                <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', mb: 1.5, lineHeight: 1.5 }}>
                  {news.description}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>
                  Source: {news.source}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>

      {/* Latest News */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <PublicIcon sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 20 }} />
          <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>
            Latest News
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {LATEST_NEWS.map((news, index) => (
            <Card
              key={news.id}
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
            >
              <CardContent sx={{ p: '0 !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <Chip
                        label={news.category}
                        size="small"
                        sx={{
                          bgcolor: CATEGORY_COLORS[news.category],
                          color: news.category === 'Market' ? '#000' : '#fff',
                          fontWeight: 700,
                          fontSize: '0.68rem',
                          height: 22,
                        }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccessTimeIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }} />
                        <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>
                          {news.time}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '1rem', mb: 0.5 }}>
                      {news.title}
                    </Typography>
                    <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', mb: 1, lineHeight: 1.5 }}>
                      {news.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>
                        Source: {news.source}
                      </Typography>
                      <Button
                        size="small"
                        sx={{
                          color: '#e91e8c',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          textTransform: 'none',
                          '&:hover': { background: 'rgba(233,30,140,0.08)' },
                        }}
                      >
                        Read More →
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>

      {/* Market Summary */}
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
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
              gap: 3,
            }}
          >
            {MARKET_SUMMARY.map((item, index) => (
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
    </Box>
  );
};

export default NewsPage;
