import React, { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import FadeInScreen from '../../src/components/FadeInScreen';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

interface CryptoPrice {
  symbol: string;
  name: string;
  icon: string;
  price: number;
  change24h: number;
}

const CRYPTOS = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ' },
  { symbol: 'SOL', name: 'Solana', icon: '◎' },
  { symbol: 'BNB', name: 'BNB', icon: '◆' },
  { symbol: 'XRP', name: 'Ripple', icon: '✕' },
  { symbol: 'ADA', name: 'Cardano', icon: '₳' },
  { symbol: 'DOGE', name: 'Dogecoin', icon: 'Ð' },
];

export default function HomeScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [prices, setPrices] = useState<Record<string, CryptoPrice>>({});
  const [loading, setLoading] = useState(true);
  const [fromCrypto, setFromCrypto] = useState('BTC');
  const [toCrypto, setToCrypto] = useState('ETH');
  const [fromAmount, setFromAmount] = useState('1');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const symbols = CRYPTOS.map((c) => c.symbol + 'USDT');
        const response = await fetch(
          `https://api.binance.com/api/v3/ticker/24hr?symbols=${JSON.stringify(symbols)}`
        );
        const data = await response.json();
        const priceMap: Record<string, CryptoPrice> = {};
        data.forEach((item: any) => {
          const symbol = item.symbol.replace('USDT', '');
          const info = CRYPTOS.find((c) => c.symbol === symbol);
          if (info) {
            priceMap[symbol] = {
              symbol,
              name: info.name,
              icon: info.icon,
              price: parseFloat(item.lastPrice),
              change24h: parseFloat(item.priceChangePercent),
            };
          }
        });
        setPrices(priceMap);
      } catch {
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
    return ((parseFloat(fromAmount) * from.price) / to.price).toFixed(8);
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

  const fromInfo = CRYPTOS.find((c) => c.symbol === fromCrypto);
  const toInfo = CRYPTOS.find((c) => c.symbol === toCrypto);
  const topCryptos = ['BTC', 'ETH', 'SOL'].map((s) => prices[s]).filter(Boolean);

  return (
    <FadeInScreen>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 70 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name="calculator-variant" size={22} color={colors.textSecondary} />
          </View>
          <View>
            <Text style={styles.title}>Crypto Calculator</Text>
            <Text style={styles.subtitle}>Real-time cryptocurrency converter</Text>
          </View>
        </View>

        {/* Calculator Card */}
        <View style={styles.calcCard}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ paddingVertical: 40 }} />
          ) : (
            <>
              {/* From */}
              <Text style={styles.label}>From</Text>
              <TouchableOpacity
                style={styles.selector}
                onPress={() => setShowFromPicker(!showFromPicker)}
                activeOpacity={0.8}
              >
                <Text style={styles.selectorIcon}>{fromInfo?.icon}</Text>
                <Text style={styles.selectorText}>{fromInfo?.name} ({fromCrypto})</Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textMuted} />
              </TouchableOpacity>
              {showFromPicker && (
                <View style={styles.pickerList}>
                  {CRYPTOS.map((c) => (
                    <TouchableOpacity
                      key={c.symbol}
                      style={[styles.pickerItem, c.symbol === fromCrypto && styles.pickerItemActive]}
                      onPress={() => { setFromCrypto(c.symbol); setShowFromPicker(false); }}
                    >
                      <Text style={styles.pickerItemText}>{c.icon} {c.name} ({c.symbol})</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <TextInput
                style={styles.amountInput}
                value={fromAmount}
                onChangeText={setFromAmount}
                keyboardType="decimal-pad"
                placeholderTextColor={colors.textMuted}
                placeholder="0.00"
              />

              {/* Swap */}
              <View style={styles.swapRow}>
                <TouchableOpacity style={styles.swapButton} onPress={handleSwap} activeOpacity={0.8}>
                  <MaterialCommunityIcons name="swap-vertical" size={22} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* To */}
              <Text style={styles.label}>To</Text>
              <TouchableOpacity
                style={styles.selector}
                onPress={() => setShowToPicker(!showToPicker)}
                activeOpacity={0.8}
              >
                <Text style={styles.selectorIcon}>{toInfo?.icon}</Text>
                <Text style={styles.selectorText}>{toInfo?.name} ({toCrypto})</Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textMuted} />
              </TouchableOpacity>
              {showToPicker && (
                <View style={styles.pickerList}>
                  {CRYPTOS.map((c) => (
                    <TouchableOpacity
                      key={c.symbol}
                      style={[styles.pickerItem, c.symbol === toCrypto && styles.pickerItemActive]}
                      onPress={() => { setToCrypto(c.symbol); setShowToPicker(false); }}
                    >
                      <Text style={styles.pickerItemText}>{c.icon} {c.name} ({c.symbol})</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={styles.resultInput}>
                <Text style={styles.resultText}>{calculateConversion()}</Text>
              </View>

              {/* Exchange Rate */}
              <View style={styles.rateRow}>
                <Text style={styles.rateLabel}>Exchange Rate</Text>
                <Text style={styles.rateValue}>1 {fromCrypto} = {getExchangeRate()} {toCrypto}</Text>
              </View>
            </>
          )}
        </View>

        {/* Quick Price Cards */}
        {topCryptos.map((crypto) => {
          const isPositive = crypto.change24h >= 0;
          return (
            <View key={crypto.symbol} style={styles.priceCard}>
              <View style={styles.priceCardTop}>
                <Text style={styles.priceCardIcon}>{crypto.icon}</Text>
                <View style={styles.priceCardChange}>
                  <MaterialCommunityIcons
                    name={isPositive ? 'trending-up' : 'trending-down'}
                    size={14}
                    color={isPositive ? colors.success : colors.error}
                  />
                  <Text style={[styles.priceCardChangeText, { color: isPositive ? colors.success : colors.error }]}>
                    {isPositive ? '+' : ''}{crypto.change24h.toFixed(1)}%
                  </Text>
                </View>
              </View>
              <Text style={styles.priceCardName}>{crypto.name}</Text>
              <Text style={styles.priceCardSymbol}>1 {crypto.symbol}</Text>
              <Text style={styles.priceCardPrice}>
                ${crypto.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </FadeInScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.md, paddingBottom: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.lg },
  headerIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  calcCard: {
    backgroundColor: colors.surface,
    borderRadius: 20, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.md,
  },
  label: { fontSize: 13, color: colors.textSecondary, fontWeight: '500', marginBottom: 8 },
  selector: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surfaceLight, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: colors.border, marginBottom: 8,
  },
  selectorIcon: { fontSize: 20, color: '#fff' },
  selectorText: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '600' },
  pickerList: {
    backgroundColor: colors.surfaceLight, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border, marginBottom: 8, overflow: 'hidden',
  },
  pickerItem: { paddingHorizontal: 14, paddingVertical: 12 },
  pickerItemActive: { backgroundColor: colors.surfaceActive },
  pickerItemText: { color: colors.text, fontSize: 14 },
  amountInput: {
    backgroundColor: colors.surfaceLight, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: colors.border,
    color: colors.text, fontSize: 20, fontWeight: '600',
    marginBottom: 4,
  },
  swapRow: { alignItems: 'center', marginVertical: 12 },
  swapButton: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
    backgroundColor: colors.primary,
  },
  resultInput: {
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: colors.borderActive,
    backgroundColor: colors.surfaceActive, marginBottom: 16,
  },
  resultText: { color: colors.text, fontSize: 20, fontWeight: '600' },
  rateRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12,
  },
  rateLabel: { fontSize: 13, color: colors.textMuted },
  rateValue: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  priceCard: {
    backgroundColor: colors.surface, borderRadius: 18,
    padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  priceCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  priceCardIcon: { fontSize: 24, color: '#fff' },
  priceCardChange: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceCardChangeText: { fontSize: 13, fontWeight: '600' },
  priceCardName: { fontSize: 16, fontWeight: '700', color: colors.text },
  priceCardSymbol: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  priceCardPrice: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 8 },
});
