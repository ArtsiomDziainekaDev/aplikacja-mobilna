import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { useAppDispatch, useAppSelector } from '../../src/hooks/useRedux';
import { fetchCrypto } from '../../src/store/slices/cryptoSlice';
import { fetchKlines } from '../../src/services/cryptoService';
import type { CryptoView } from '../../src/types';
import type { TimeFilter } from '../../src/services/cryptoService';

const TIME_FILTERS: ReadonlyArray<TimeFilter> = ['1H', '24H', '7D', '1M', '1Y'];
const REFRESH_INTERVAL_MS = 30_000;

const formatPrice = (p: number): string => {
  if (p >= 1000) return `$${p.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (p >= 1) return `$${p.toFixed(2)}`;
  return `$${p.toFixed(4)}`;
};

function CoinRow({
  item,
  index,
  isSelected,
  onPress,
}: {
  item: CryptoView;
  index: number;
  isSelected: boolean;
  onPress: () => void;
}): React.JSX.Element {
  const positive = item.priceChangePercent24h >= 0;
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
          <Text style={styles.coinPrice}>{formatPrice(item.marketPrice)}</Text>
          <View style={styles.changeRow}>
            <MaterialCommunityIcons
              name={positive ? 'trending-up' : 'trending-down'}
              size={12}
              color={positive ? colors.success : colors.error}
            />
            <Text style={[styles.changeText, { color: positive ? colors.success : colors.error }]}>
              {positive ? '+' : ''}{item.priceChangePercent24h.toFixed(2)}%
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
  const dispatch = useAppDispatch();
  const { list: cryptos, loading, fromCache } = useAppSelector((s) => s.crypto);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('24H');
  const [chartData, setChartData] = useState<number[]>([]);
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchCrypto());
    const interval = setInterval(() => {
      dispatch(fetchCrypto());
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchCrypto()).unwrap();
    } catch {
      /* Refresh control nie powinien sypać tutaj — error trzymamy w sliceu. */
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (cryptos.length === 0) return;
    let cancelled = false;
    const symbol = cryptos[selectedIndex]?.symbol;
    if (!symbol) return;

    const loadChart = async () => {
      setChartLoading(true);
      try {
        const points = await fetchKlines(symbol, timeFilter);
        if (cancelled) return;
        const prices = points.map((p) => p.close);
        setChartData(prices);
        const step = Math.max(1, Math.floor(points.length / 5));
        setChartLabels(points
          .filter((_, i) => i % step === 0)
          .map((p) => {
            const d = new Date(p.timestamp);
            if (timeFilter === '1H' || timeFilter === '24H') {
              return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
            }
            return `${d.getDate()}/${d.getMonth() + 1}`;
          }));
      } catch {
        if (!cancelled) {
          setChartData([]);
          setChartLabels([]);
        }
      } finally {
        if (!cancelled) setChartLoading(false);
      }
    };

    loadChart();
    return () => { cancelled = true; };
  }, [cryptos, selectedIndex, timeFilter]);

  const activeCrypto = cryptos[selectedIndex];
  const isPositive = (activeCrypto?.priceChangePercent24h ?? 0) >= 0;
  const chartWidth = width - spacing.md * 2 - 8;

  const renderHeader = useMemo(() => () => (
    <View>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="chart-line" size={20} color={colors.textSecondary} />
        </View>
        <View>
          <Text style={styles.title}>Crypto Charts</Text>
          <Text style={styles.subtitle}>Track real-time prices</Text>
        </View>
      </View>

      {fromCache && (
        <View style={styles.offlineBanner}>
          <MaterialCommunityIcons name="cloud-off-outline" size={14} color={colors.warning} />
          <Text style={styles.offlineText}>Cached data (offline)</Text>
        </View>
      )}

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
            <Text style={styles.chartPrice}>{formatPrice(activeCrypto.marketPrice)}</Text>
            <View style={[styles.changeBadge, { backgroundColor: isPositive ? colors.successLight : colors.errorLight }]}>
              <MaterialCommunityIcons
                name={isPositive ? 'trending-up' : 'trending-down'}
                size={14}
                color={isPositive ? colors.success : colors.error}
              />
              <Text style={[styles.changeBadgeText, { color: isPositive ? colors.success : colors.error }]}>
                {isPositive ? '+' : ''}{activeCrypto.priceChangePercent24h.toFixed(2)}%
              </Text>
            </View>
          </View>

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

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>All Cryptocurrencies</Text>
        <Text style={styles.listCount}>{cryptos.length} coins</Text>
      </View>
    </View>
  ), [activeCrypto, chartData, chartLabels, chartLoading, chartWidth, cryptos.length, fromCache, isPositive, timeFilter]);

  if (loading && cryptos.length === 0) {
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
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

  offlineBanner: {
    backgroundColor: colors.warningLight, padding: spacing.sm, borderRadius: 8, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  offlineText: { color: colors.warning, fontSize: 12, fontWeight: '500' },

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

  chartContainer: { minHeight: 200, justifyContent: 'center', alignItems: 'center' },
  chartLoading: { height: 200, justifyContent: 'center', alignItems: 'center' },
  noChart: { color: colors.textMuted, textAlign: 'center', paddingVertical: 60, fontSize: 14 },

  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8, paddingHorizontal: 4,
  },
  listTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  listCount: { fontSize: 12, color: colors.textMuted },

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
