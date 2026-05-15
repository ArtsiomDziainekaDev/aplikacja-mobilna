import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  RefreshControl,
  Animated,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

interface CryptoItem {
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

const CRYPTO_CONFIG = [
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
type TimeFilter = (typeof TIME_FILTERS)[number];

const getKlineInterval = (f: TimeFilter): { interval: string; limit: number } => {
  switch (f) {
    case '1H': return { interval: '1m', limit: 60 };
    case '24H': return { interval: '1h', limit: 24 };
    case '7D': return { interval: '4h', limit: 42 };
    case '1M': return { interval: '1d', limit: 30 };
    case '1Y': return { interval: '1w', limit: 52 };
  }
};

const formatPrice = (p: number): string => {
  if (p >= 1000) return `$${p.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (p >= 1) return `$${p.toFixed(2)}`;
  return `$${p.toFixed(4)}`;
};

const formatVolume = (v: number): string => {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${v.toLocaleString()}`;
};

function CoinRow({
  item,
  index,
  isSelected,
  onPress,
}: {
  item: CryptoItem;
  index: number;
  isSelected: boolean;
  onPress: () => void;
}): React.JSX.Element {
  const positive = item.change24h >= 0;
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1, duration: 300, delay: index * 40, useNativeDriver: true,
    }).start();
  }, [opacity, index]);

  return (
    <Animated.View style={{ opacity }}>
      <TouchableOpacity
        style={[styles.coinRow, isSelected && styles.coinRowActive]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.coinRank}>{index + 1}</Text>
        <Text style={styles.coinIconPlain}>{item.icon}</Text>
        <View style={styles.coinInfo}>
          <Text style={styles.coinName}>{item.name}</Text>
          <Text style={styles.coinSymbol}>{item.symbol}</Text>
        </View>
        <View style={styles.coinPriceCol}>
          <Text style={styles.coinPrice}>{formatPrice(item.price)}</Text>
          <View style={styles.changeRow}>
            <MaterialCommunityIcons
              name={positive ? 'trending-up' : 'trending-down'}
              size={12}
              color={positive ? colors.success : colors.error}
            />
            <Text style={[styles.changeText, { color: positive ? colors.success : colors.error }]}>
              {positive ? '+' : ''}{item.change24h.toFixed(2)}%
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function CryptoScreen(): React.JSX.Element {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [cryptos, setCryptos] = useState<CryptoItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('24H');
  const [chartData, setChartData] = useState<number[]>([]);
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);

  // Fetch prices
  const fetchPrices = useCallback(async () => {
    try {
      const symbols = CRYPTO_CONFIG.map((c) => c.symbol + 'USDT');
      const resp = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${JSON.stringify(symbols)}`);
      const data = await resp.json();
      const list: CryptoItem[] = CRYPTO_CONFIG.map((cfg) => {
        const t = data.find((d: any) => d.symbol === cfg.symbol + 'USDT');
        return {
          ...cfg,
          price: t ? parseFloat(t.lastPrice) : 0,
          change24h: t ? parseFloat(t.priceChangePercent) : 0,
          volume24h: t ? parseFloat(t.quoteVolume) : 0,
        };
      }).filter((c) => c.price > 0);
      setCryptos(list);
    } catch {
      setCryptos(CRYPTO_CONFIG.slice(0, 5).map((c, i) => ({
        ...c,
        price: [62500, 4032, 580, 148, 0.52][i],
        change24h: [2.5, 1.8, -0.8, -0.5, 3.1][i],
        volume24h: [28e9, 15e9, 1.8e9, 2.5e9, 1.2e9][i],
      })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  // Fetch chart
  useEffect(() => {
    if (cryptos.length === 0) return;
    const fetchChart = async () => {
      setChartLoading(true);
      try {
        const symbol = cryptos[selectedIndex]?.symbol;
        if (!symbol) return;
        const { interval, limit } = getKlineInterval(timeFilter);
        const resp = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=${interval}&limit=${limit}`
        );
        const data = await resp.json();
        if (Array.isArray(data)) {
          setChartData(data.map((k: any) => parseFloat(k[4])));
          const step = Math.max(1, Math.floor(data.length / 5));
          setChartLabels(data.filter((_: any, i: number) => i % step === 0).map((k: any) => {
            const d = new Date(k[0]);
            if (timeFilter === '1H' || timeFilter === '24H') {
              return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
            }
            return `${d.getDate()}/${d.getMonth() + 1}`;
          }));
        }
      } catch {
        setChartData([]);
        setChartLabels([]);
      } finally {
        setChartLoading(false);
      }
    };
    fetchChart();
  }, [cryptos, selectedIndex, timeFilter]);

  const activeCrypto = cryptos[selectedIndex];
  const isPositive = activeCrypto?.change24h >= 0;
  const chartWidth = width - spacing.md * 2 - 8;

  const renderHeader = () => (
    <View>
      {/* Page Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="chart-line" size={20} color={colors.textSecondary} />
        </View>
        <View>
          <Text style={styles.title}>Crypto Charts</Text>
          <Text style={styles.subtitle}>Track real-time prices</Text>
        </View>
      </View>

      {/* Featured Chart */}
      {activeCrypto && (
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.chartCoinInfo}>
              <Text style={styles.chartCoinIconPlain}>{activeCrypto.icon}</Text>
              <View>
                <Text style={styles.chartCoinName}>{activeCrypto.name}</Text>
                <Text style={styles.chartCoinSymbol}>{activeCrypto.symbol}/USDT</Text>
              </View>
            </View>
          </View>

          <View style={styles.chartPriceRow}>
            <Text style={styles.chartPrice}>{formatPrice(activeCrypto.price)}</Text>
            <View style={[styles.changeBadge, { backgroundColor: isPositive ? colors.successLight : colors.errorLight }]}>
              <MaterialCommunityIcons
                name={isPositive ? 'trending-up' : 'trending-down'}
                size={14}
                color={isPositive ? colors.success : colors.error}
              />
              <Text style={[styles.changeBadgeText, { color: isPositive ? colors.success : colors.error }]}>
                {isPositive ? '+' : ''}{activeCrypto.change24h.toFixed(2)}%
              </Text>
            </View>
          </View>

          {/* Time Filters */}
          <View style={styles.timeFilters}>
            {TIME_FILTERS.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.timeBtn, timeFilter === f && styles.timeBtnActive]}
                onPress={() => setTimeFilter(f)}
                activeOpacity={0.7}
              >
                <Text style={[styles.timeBtnText, timeFilter === f && styles.timeBtnTextActive]}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Chart */}
          <View style={styles.chartContainer}>
            {chartLoading ? (
              <View style={styles.chartLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : chartData.length > 0 ? (
              <LineChart
                data={{
                  labels: chartLabels,
                  datasets: [{ data: chartData }],
                }}
                width={chartWidth}
                height={200}
                withInnerLines={false}
                withOuterLines={false}
                withDots={false}
                withShadow={false}
                chartConfig={{
                  backgroundColor: 'transparent',
                  backgroundGradientFrom: 'rgba(26, 5, 51, 0)',
                  backgroundGradientTo: 'rgba(26, 5, 51, 0)',
                  decimalPlaces: 2,
                  color: () => activeCrypto.chartColor,
                  labelColor: () => 'rgba(255, 255, 255, 0.3)',
                  propsForBackgroundLines: { stroke: 'transparent' },
                  propsForLabels: { fontSize: 10 },
                  fillShadowGradientFrom: activeCrypto.chartColor,
                  fillShadowGradientFromOpacity: 0.2,
                  fillShadowGradientTo: activeCrypto.chartColor,
                  fillShadowGradientToOpacity: 0,
                }}
                bezier
                style={{ borderRadius: 12, marginLeft: -16 }}
              />
            ) : (
              <Text style={styles.noChart}>No chart data</Text>
            )}
          </View>
        </View>
      )}

      {/* List Header */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>All Cryptocurrencies</Text>
        <Text style={styles.listCount}>{cryptos.length} coins</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={cryptos}
        keyExtractor={(item) => item.symbol}
        ListHeaderComponent={renderHeader}
        renderItem={({ item, index }) => (
          <CoinRow
            item={item}
            index={index}
            isSelected={index === selectedIndex}
            onPress={() => setSelectedIndex(index)}
          />
        )}
        contentContainerStyle={[styles.listContent, { paddingTop: insets.top + 70 }]}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={fetchPrices} tintColor={colors.primary} colors={[colors.primary]} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  listContent: { padding: spacing.md, paddingBottom: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  headerIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },

  /* Chart Card */
  chartCard: {
    backgroundColor: colors.surface, borderRadius: 20,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.md,
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  chartCoinInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chartCoinIconPlain: {
    fontSize: 26,
    color: '#fff',
    width: 32,
    textAlign: 'center',
  },
  chartCoinName: { fontSize: 15, fontWeight: '700', color: colors.text },
  chartCoinSymbol: { fontSize: 12, color: colors.textMuted },
  chartPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  chartPrice: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  changeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  changeBadgeText: { fontSize: 13, fontWeight: '700' },

  /* Time Filters */
  timeFilters: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  timeBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
    backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border,
  },
  timeBtnActive: {
    backgroundColor: colors.success, borderColor: colors.success,
  },
  timeBtnText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  timeBtnTextActive: { color: '#000', fontWeight: '700' },

  /* Chart */
  chartContainer: { minHeight: 200, justifyContent: 'center', alignItems: 'center' },
  chartLoading: { height: 200, justifyContent: 'center', alignItems: 'center' },
  noChart: { color: colors.textMuted, textAlign: 'center', paddingVertical: 60, fontSize: 14 },

  /* List */
  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8, paddingHorizontal: 4,
  },
  listTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  listCount: { fontSize: 12, color: colors.textMuted },

  /* Coin Row */
  coinRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, paddingHorizontal: 12, borderRadius: 14,
    marginBottom: 4, borderLeftWidth: 3, borderLeftColor: 'transparent',
  },
  coinRowActive: {
    backgroundColor: colors.surfaceActive,
    borderLeftColor: colors.primary,
  },
  coinRank: { width: 20, fontSize: 12, color: colors.textMuted, fontWeight: '500', textAlign: 'center' },
  coinIconPlain: {
    fontSize: 20,
    color: '#fff',
    width: 28,
    textAlign: 'center',
  },
  coinInfo: { flex: 1 },
  coinName: { fontSize: 14, fontWeight: '600', color: colors.text },
  coinSymbol: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  coinPriceCol: { alignItems: 'flex-end' },
  coinPrice: { fontSize: 14, fontWeight: '700', color: colors.text },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  changeText: { fontSize: 11, fontWeight: '600' },
});
