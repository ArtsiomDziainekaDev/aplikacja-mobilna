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
import { api } from '../../src/api/client';
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
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿', type: 'crypto' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', type: 'crypto' },
  { symbol: 'SOL', name: 'Solana', icon: '◎', type: 'crypto' },
  { symbol: 'BNB', name: 'BNB', icon: '◆', type: 'crypto' },
  { symbol: 'XRP', name: 'Ripple', icon: '✕', type: 'crypto' },
  { symbol: 'ADA', name: 'Cardano', icon: '₳', type: 'crypto' },
  { symbol: 'DOGE', name: 'Dogecoin', icon: 'Ð', type: 'crypto' },
];

const FIATS = [
  { symbol: 'USD', name: 'US Dollar', icon: '$', type: 'fiat' },
  { symbol: 'EUR', name: 'Euro', icon: '€', type: 'fiat' },
  { symbol: 'GBP', name: 'British Pound', icon: '£', type: 'fiat' },
  { symbol: 'PLN', name: 'Polish Zloty', icon: 'zł', type: 'fiat' },
];

const ALL_CURRENCIES = [...CRYPTOS, ...FIATS];

export default function HomeScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [prices, setPrices] = useState<Record<string, CryptoPrice>>({});
  const [loading, setLoading] = useState(true);
  const [fromCurrency, setFromCurrency] = useState('BTC');
  const [toCurrency, setToCurrency] = useState('ETH');
  const [fromAmount, setFromAmount] = useState('1');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  
  // Favorites State
  const [favorites, setFavorites] = useState<string[]>(['BTC', 'ETH', 'SOL']);
  const [isEditingFavs, setIsEditingFavs] = useState(false);

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

        // Add Fiat static rates
        priceMap['USD'] = { symbol: 'USD', name: 'US Dollar', icon: '$', price: 1, change24h: 0 };
        priceMap['EUR'] = { symbol: 'EUR', name: 'Euro', icon: '€', price: 1.08, change24h: 0 };
        priceMap['GBP'] = { symbol: 'GBP', name: 'British Pound', icon: '£', price: 1.25, change24h: 0 };
        priceMap['PLN'] = { symbol: 'PLN', name: 'Polish Zloty', icon: 'zł', price: 0.25, change24h: 0 };

        setPrices(priceMap);
      } catch {
        setPrices({
          BTC: { symbol: 'BTC', name: 'Bitcoin', icon: '₿', price: 62500, change24h: 2.5 },
          ETH: { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', price: 4032, change24h: 1.8 },
          SOL: { symbol: 'SOL', name: 'Solana', icon: '◎', price: 148, change24h: -0.5 },
          USD: { symbol: 'USD', name: 'US Dollar', icon: '$', price: 1, change24h: 0 },
          EUR: { symbol: 'EUR', name: 'Euro', icon: '€', price: 1.08, change24h: 0 },
          GBP: { symbol: 'GBP', name: 'British Pound', icon: '£', price: 1.25, change24h: 0 },
          PLN: { symbol: 'PLN', name: 'Polish Zloty', icon: 'zł', price: 0.25, change24h: 0 },
        });
      } finally {
        setLoading(false);
      }
    };
    const fetchFavorites = async () => {
      try {
        const { data } = await api.get('/api/crypto/favorites');
        if (data && data.length > 0) {
          setFavorites(data);
        }
      } catch (err) {
        console.error('Failed to fetch favorites');
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
    return ((parseFloat(fromAmount) * from.price) / to.price).toFixed(8).replace(/\.?0+$/, '');
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
      const amount = parseFloat(calculateConversion());
      await api.post('/api/orders', { currencyCode: toCurrency, amount });
      alert('Order placed successfully!');
    } catch (err) {
      alert('Failed to place order.');
    } finally {
      setIsOrdering(false);
    }
  };

  const handleRemoveFavorite = async (symbol: string) => {
    try {
      await api.delete(`/api/crypto/favorites/${symbol}`);
      setFavorites((prev) => prev.filter((f) => f !== symbol));
    } catch {
      console.error('Failed to remove favorite');
    }
  };

  const handleAddFavorite = async (symbol: string) => {
    if (favorites.length >= 3) {
      alert('Maximum 3 favorite coins allowed.');
      return;
    }
    try {
      await api.post(`/api/crypto/favorites/${symbol}`);
      setFavorites((prev) => [...prev, symbol]);
    } catch {
      console.error('Failed to add favorite');
    }
  };

  const fromInfo = ALL_CURRENCIES.find((c) => c.symbol === fromCurrency);
  const toInfo = ALL_CURRENCIES.find((c) => c.symbol === toCurrency);
  const favoriteCryptos = favorites.map((s) => prices[s]).filter(Boolean);
  const availableToAdd = CRYPTOS.filter((c) => !favorites.includes(c.symbol));

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
                <Text style={styles.selectorText}>{fromInfo?.name} ({fromCurrency})</Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textMuted} />
              </TouchableOpacity>
              {showFromPicker && (
                <View style={styles.pickerList}>
                  {ALL_CURRENCIES.map((c) => (
                    <TouchableOpacity
                      key={c.symbol}
                      style={[styles.pickerItem, c.symbol === fromCurrency && styles.pickerItemActive]}
                      onPress={() => { setFromCurrency(c.symbol); setShowFromPicker(false); }}
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
                <Text style={styles.selectorText}>{toInfo?.name} ({toCurrency})</Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textMuted} />
              </TouchableOpacity>
              {showToPicker && (
                <View style={styles.pickerList}>
                  {ALL_CURRENCIES.map((c) => (
                    <TouchableOpacity
                      key={c.symbol}
                      style={[styles.pickerItem, c.symbol === toCurrency && styles.pickerItemActive]}
                      onPress={() => { setToCurrency(c.symbol); setShowToPicker(false); }}
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
                <Text style={styles.rateValue}>1 {fromCurrency} = {getExchangeRate()} {toCurrency}</Text>
              </View>

              {/* Place Order Button */}
              <TouchableOpacity
                style={[styles.placeOrderBtn, isOrdering && { opacity: 0.7 }]}
                onPress={handlePlaceOrder}
                disabled={isOrdering}
                activeOpacity={0.8}
              >
                {isOrdering ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="cart" size={20} color="#000" style={{ marginRight: 8 }} />
                    <Text style={styles.placeOrderText}>Place Order</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Favorite Coins Header */}
        <View style={styles.favHeader}>
          <Text style={styles.favTitle}>Favorite Coins</Text>
          <TouchableOpacity
            style={[styles.favEditBtn, isEditingFavs && styles.favEditBtnActive]}
            onPress={() => setIsEditingFavs(!isEditingFavs)}
          >
            <MaterialCommunityIcons name="pencil" size={16} color={isEditingFavs ? '#e91e8c' : colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Favorite Coins List */}
        <View style={styles.favGrid}>
          {favoriteCryptos.map((crypto) => {
            const isPositive = crypto.change24h >= 0;
            return (
              <TouchableOpacity
                key={crypto.symbol}
                style={styles.favCard}
                activeOpacity={0.7}
              >
                {isEditingFavs && (
                  <TouchableOpacity
                    style={styles.favCloseBtn}
                    onPress={() => handleRemoveFavorite(crypto.symbol)}
                  >
                    <MaterialCommunityIcons name="close" size={14} color="#ff5252" />
                  </TouchableOpacity>
                )}
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
              </TouchableOpacity>
            );
          })}

          {isEditingFavs && favorites.length < 3 && availableToAdd.length > 0 && (
            <View style={styles.addFavCard}>
              <Text style={styles.addFavText}>Add Coin</Text>
              {availableToAdd.map(c => (
                <TouchableOpacity
                  key={c.symbol}
                  style={styles.addFavItem}
                  onPress={() => handleAddFavorite(c.symbol)}
                >
                  <MaterialCommunityIcons name="plus" size={16} color={colors.text} />
                  <Text style={styles.addFavItemText}>{c.icon} {c.symbol}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
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
    borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginBottom: 16,
  },
  rateLabel: { fontSize: 13, color: colors.textMuted },
  rateValue: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  placeOrderBtn: {
    backgroundColor: '#00e676', borderRadius: 14,
    paddingVertical: 16, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center',
  },
  placeOrderText: { color: '#000', fontSize: 16, fontWeight: '700' },
  favHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  favTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  favEditBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center',
  },
  favEditBtnActive: { backgroundColor: 'rgba(233,30,140,0.2)' },
  favGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  favCard: {
    width: '45%', backgroundColor: colors.surface, borderRadius: 18,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
    position: 'relative',
  },
  favCloseBtn: {
    position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(255,0,0,0.1)', justifyContent: 'center', alignItems: 'center', zIndex: 1,
  },
  addFavCard: {
    width: '45%', backgroundColor: colors.surfaceLight, borderRadius: 18,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
  },
  addFavText: { fontSize: 13, color: colors.textMuted, marginBottom: 8 },
  addFavItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, marginBottom: 4, width: '100%',
  },
  addFavItemText: { color: colors.text, fontSize: 12, marginLeft: 4 },
  priceCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  priceCardIcon: { fontSize: 24, color: '#fff' },
  priceCardChange: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceCardChangeText: { fontSize: 13, fontWeight: '600' },
  priceCardName: { fontSize: 16, fontWeight: '700', color: colors.text },
  priceCardSymbol: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  priceCardPrice: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 8 },
});
