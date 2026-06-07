import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import FadeInScreen from '../../src/components/FadeInScreen';
import { api } from '../../src/api/client';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { useAppDispatch, useAppSelector } from '../../src/hooks/useRedux';
import { fetchCrypto } from '../../src/store/slices/cryptoSlice';
import { createOrder } from '../../src/store/slices/ordersSlice';
import { getCryptoMeta } from '../../src/services/cryptoService';

interface Currency {
  symbol: string;
  name: string;
  icon: string;
  price: number;
  change24h: number;
  type: 'crypto' | 'fiat';
}

const FIATS: Currency[] = [
  { symbol: 'USD', name: 'US Dollar', icon: '$', price: 1, change24h: 0, type: 'fiat' },
  { symbol: 'EUR', name: 'Euro', icon: '€', price: 1.08, change24h: 0, type: 'fiat' },
  { symbol: 'GBP', name: 'British Pound', icon: '£', price: 1.25, change24h: 0, type: 'fiat' },
  { symbol: 'PLN', name: 'Polish Zloty', icon: 'zł', price: 0.25, change24h: 0, type: 'fiat' },
];

const REFRESH_INTERVAL_MS = 30_000;
const MAX_FAVORITES = 3;

export default function HomeScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { list: cryptoList, loading: cryptoLoading } = useAppSelector((s) => s.crypto);
  const { createLoading, error: orderError } = useAppSelector((s) => s.orders);

  const [fromCurrency, setFromCurrency] = useState('BTC');
  const [toCurrency, setToCurrency] = useState('ETH');
  const [fromAmount, setFromAmount] = useState('1');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const [favorites, setFavorites] = useState<string[]>(['BTC', 'ETH', 'SOL']);
  const [isEditingFavs, setIsEditingFavs] = useState(false);

  useEffect(() => {
    dispatch(fetchCrypto());
    const interval = setInterval(() => {
      dispatch(fetchCrypto());
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;
    const fetchFavorites = async () => {
      try {
        const { data } = await api.get<string[]>('/api/crypto/favorites');
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setFavorites(data);
        }
      } catch {
        /* zostawiamy domyślne BTC/ETH/SOL */
      }
    };
    fetchFavorites();
    return () => { cancelled = true; };
  }, []);

  const cryptoCurrencies = useMemo<Currency[]>(
    () =>
      cryptoList.map((c) => ({
        symbol: c.symbol,
        name: c.name,
        icon: c.icon,
        price: c.marketPrice,
        change24h: c.priceChangePercent24h,
        type: 'crypto',
      })),
    [cryptoList]
  );

  const allCurrencies = useMemo<Currency[]>(
    () => [...cryptoCurrencies, ...FIATS],
    [cryptoCurrencies]
  );

  const pricesByCode = useMemo(() => {
    const map = new Map<string, Currency>();
    for (const c of allCurrencies) map.set(c.symbol, c);
    return map;
  }, [allCurrencies]);

  const fromInfo = pricesByCode.get(fromCurrency);
  const toInfo = pricesByCode.get(toCurrency);

  const parsedAmount = Number.parseFloat(fromAmount.replace(',', '.'));
  const isAmountValid = Number.isFinite(parsedAmount) && parsedAmount > 0;

  const converted = useMemo(() => {
    if (!fromInfo || !toInfo || !isAmountValid || toInfo.price === 0) return '0';
    const value = (parsedAmount * fromInfo.price) / toInfo.price;
    return value.toFixed(8).replace(/\.?0+$/, '');
  }, [fromInfo, toInfo, isAmountValid, parsedAmount]);

  const exchangeRate = useMemo(() => {
    if (!fromInfo || !toInfo || toInfo.price === 0) return '...';
    return (fromInfo.price / toInfo.price).toFixed(6).replace(/\.?0+$/, '');
  }, [fromInfo, toInfo]);

  const handleSwap = useCallback(() => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  }, [fromCurrency, toCurrency]);

  const handlePlaceOrder = useCallback(async () => {
    if (!isAmountValid) {
      Alert.alert('Invalid amount', 'Please enter a positive number.');
      return;
    }
    const targetAmount = Number.parseFloat(converted);
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      Alert.alert('Invalid conversion', 'Conversion result is not a valid number.');
      return;
    }
    const result = await dispatch(createOrder({ currencyCode: toCurrency, amount: targetAmount }));
    if (createOrder.fulfilled.match(result)) {
      Alert.alert('Order placed', `Created order #${result.payload.id} for ${result.payload.amount} ${result.payload.currencyCode}.`);
    } else {
      const message = (result.payload as string | undefined) ?? orderError ?? 'Failed to place order.';
      Alert.alert('Order failed', message);
    }
  }, [dispatch, toCurrency, converted, isAmountValid, orderError]);

  const handleRemoveFavorite = useCallback(async (symbol: string) => {
    try {
      await api.delete(`/api/crypto/favorites/${symbol}`);
      setFavorites((prev) => prev.filter((f) => f !== symbol));
    } catch {
      /* best-effort: brak sieci nie powinien blokować UI */
    }
  }, []);

  const handleAddFavorite = useCallback(async (symbol: string) => {
    if (favorites.length >= MAX_FAVORITES) {
      Alert.alert('Limit reached', `Maximum ${MAX_FAVORITES} favorite coins allowed.`);
      return;
    }
    try {
      await api.post(`/api/crypto/favorites/${symbol}`);
      setFavorites((prev) => (prev.includes(symbol) ? prev : [...prev, symbol]));
    } catch {
      /* best-effort */
    }
  }, [favorites.length]);

  const favoriteCryptos = useMemo(
    () => favorites
      .map((s) => cryptoCurrencies.find((c) => c.symbol === s))
      .filter((c): c is Currency => Boolean(c)),
    [favorites, cryptoCurrencies]
  );

  const availableToAdd = useMemo(
    () => cryptoCurrencies.filter((c) => !favorites.includes(c.symbol)),
    [cryptoCurrencies, favorites]
  );

  const initialLoading = cryptoLoading && cryptoList.length === 0;

  return (
    <FadeInScreen>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 70 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name="calculator-variant" size={22} color={colors.textSecondary} />
          </View>
          <View>
            <Text style={styles.title}>Crypto Calculator</Text>
            <Text style={styles.subtitle}>Real-time cryptocurrency converter</Text>
          </View>
        </View>

        <View style={styles.calcCard}>
          {initialLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ paddingVertical: 40 }} />
          ) : (
            <>
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
                  {allCurrencies.map((c) => (
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
                style={[styles.amountInput, !isAmountValid && styles.amountInputInvalid]}
                value={fromAmount}
                onChangeText={setFromAmount}
                keyboardType="decimal-pad"
                placeholderTextColor={colors.textMuted}
                placeholder="0.00"
              />
              {!isAmountValid && (
                <Text style={styles.errorText}>Enter a positive number</Text>
              )}

              <View style={styles.swapRow}>
                <TouchableOpacity style={styles.swapButton} onPress={handleSwap} activeOpacity={0.8}>
                  <MaterialCommunityIcons name="swap-vertical" size={22} color="#fff" />
                </TouchableOpacity>
              </View>

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
                  {allCurrencies.map((c) => (
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
                <Text style={styles.resultText}>{converted}</Text>
              </View>

              <View style={styles.rateRow}>
                <Text style={styles.rateLabel}>Exchange Rate</Text>
                <Text style={styles.rateValue}>1 {fromCurrency} = {exchangeRate} {toCurrency}</Text>
              </View>

              <TouchableOpacity
                style={[styles.placeOrderBtn, (createLoading || !isAmountValid) && { opacity: 0.7 }]}
                onPress={handlePlaceOrder}
                disabled={createLoading || !isAmountValid}
                activeOpacity={0.8}
              >
                {createLoading ? (
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

        <View style={styles.favHeader}>
          <Text style={styles.favTitle}>Favorite Coins</Text>
          <TouchableOpacity
            style={[styles.favEditBtn, isEditingFavs && styles.favEditBtnActive]}
            onPress={() => setIsEditingFavs(!isEditingFavs)}
          >
            <MaterialCommunityIcons name="pencil" size={16} color={isEditingFavs ? '#e91e8c' : colors.textMuted} />
          </TouchableOpacity>
        </View>

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

          {isEditingFavs && favorites.length < MAX_FAVORITES && availableToAdd.length > 0 && (
            <View style={styles.addFavCard}>
              <Text style={styles.addFavText}>Add Coin</Text>
              {availableToAdd.map((c) => (
                <TouchableOpacity
                  key={c.symbol}
                  style={styles.addFavItem}
                  onPress={() => handleAddFavorite(c.symbol)}
                >
                  <MaterialCommunityIcons name="plus" size={16} color={colors.text} />
                  <Text style={styles.addFavItemText}>{getCryptoMeta(c.symbol).icon} {c.symbol}</Text>
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
  amountInputInvalid: { borderColor: colors.error },
  errorText: { color: colors.error, fontSize: 12, marginBottom: 4 },
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
