import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchNews, triggerNewsRefresh } from '../../src/api/news';
import type { NewsItem } from '../../src/types';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { useI18n } from '../../src/i18n';

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  Market: { bg: colors.tagMarket, text: '#000' },
  BTC: { bg: colors.tagBtc, text: '#000' },
  ETH: { bg: colors.tagEth, text: '#fff' },
  DeFi: { bg: colors.tagDefi, text: '#fff' },
  NFT: { bg: '#e040fb', text: '#fff' },
  Regulation: { bg: colors.tagRegulation, text: '#fff' },
  Crypto: { bg: colors.tagCrypto, text: '#fff' },
};

function getTagStyle(tag: string): { bg: string; text: string } {
  return TAG_COLORS[tag] || { bg: colors.tagCrypto, text: '#fff' };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function formatTimeAgo(value: string): string {
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function NewsCard({ item, onOpen, featured }: { item: NewsItem; onOpen: (url: string) => void; featured?: boolean }): React.JSX.Element {
  const { t } = useI18n();

  return (
    <TouchableOpacity
      style={[styles.card, featured && styles.cardFeatured]}
      activeOpacity={0.85}
      onPress={() => onOpen(item.url)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.tagsRow}>
          {item.tags.slice(0, 2).map((tag) => {
            const tagStyle = getTagStyle(tag);
            return (
              <View key={`${item.id}-${tag}`} style={[styles.tag, { backgroundColor: tagStyle.bg }]}>
                <Text style={[styles.tagText, { color: tagStyle.text }]}>{tag}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.timeRow}>
          <MaterialCommunityIcons name="clock-outline" size={12} color={colors.textMuted} />
          <Text style={styles.timeText}>{formatTimeAgo(item.publishedAt)}</Text>
        </View>
      </View>

      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.summary} numberOfLines={3}>{item.summary}</Text>

      <View style={styles.cardFooter}>
        <Text style={styles.source}>{t('news.source', { source: item.source || t('news.sourceFallback') })}</Text>
        <View style={styles.readMoreRow}>
          <Text style={styles.readMore}>{t('news.readMore')}</Text>
          <MaterialCommunityIcons name="open-in-new" size={14} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function NewsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNews = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') setLoading(true);
    else setRefreshing(true);

    try {
      let items = await fetchNews();
      if (items.length === 0) {
        await triggerNewsRefresh();
        await wait(mode === 'initial' ? 1800 : 2500);
        items = await fetchNews();
      }
      setNews(items);
      setError(null);
    } catch {
      setError(t('news.error'));
    } finally {
      if (mode === 'initial') setLoading(false);
      else setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    void loadNews();
  }, [loadNews]);

  const handleRefresh = useCallback(() => {
    void loadNews('refresh');
  }, [loadNews]);

  const handleOpen = useCallback(async (url: string) => {
    if (!url) return;
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: NewsItem; index: number }) => (
      <NewsCard item={item} onOpen={handleOpen} featured={index < 2} />
    ),
    [handleOpen]
  );

  const keyExtractor = useCallback((item: NewsItem) => item.id, []);

  const contentContainerStyle = useMemo(
    () => ({
      padding: spacing.md,
      paddingBottom: spacing.xl,
      paddingTop: insets.top + 70,
      flexGrow: news.length === 0 ? 1 : undefined,
    }),
    [news.length, insets.top]
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('news.loading')}</Text>
      </View>
    );
  }

  if (error && news.length === 0) {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => void loadNews()}>
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={news}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={contentContainerStyle}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons name="newspaper-variant-outline" size={20} color={colors.textSecondary} />
            </View>
            <View>
              <Text style={styles.heroTitle}>{t('news.title')}</Text>
              <Text style={styles.heroSubtitle}>{t('news.subtitle')}</Text>
            </View>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="file-document-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>{t('news.emptyTitle')}</Text>
            <Text style={styles.emptyText}>{t('news.emptySubtitle')}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: spacing.lg, backgroundColor: colors.background,
  },
  loadingText: { marginTop: spacing.md, color: colors.textSecondary, fontSize: 14 },
  errorText: { marginTop: spacing.md, textAlign: 'center', color: colors.error, fontSize: 15 },
  retryButton: {
    marginTop: spacing.md, backgroundColor: colors.primary,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14,
  },
  retryButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  headerIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center',
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  heroSubtitle: { marginTop: 2, fontSize: 13, color: colors.textSecondary },

  card: {
    backgroundColor: colors.surface, borderRadius: 18,
    padding: spacing.md, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  cardFeatured: {
    borderColor: 'rgba(233, 30, 140, 0.15)',
    backgroundColor: 'rgba(233, 30, 140, 0.06)',
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: spacing.sm,
  },
  tagsRow: { flexDirection: 'row', gap: 6 },
  tag: {
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
  },
  tagText: { fontSize: 11, fontWeight: '700' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { color: colors.textMuted, fontSize: 11 },
  title: { color: colors.text, fontSize: 17, fontWeight: '800', lineHeight: 22, marginBottom: 6 },
  summary: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 12 },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10,
  },
  source: { fontSize: 11, color: colors.textMuted },
  readMoreRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  readMore: { color: colors.primary, fontWeight: '700', fontSize: 13 },

  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.lg },
  emptyTitle: { marginTop: spacing.md, fontSize: 18, fontWeight: '700', color: colors.text },
  emptyText: { marginTop: spacing.xs, color: colors.textSecondary, textAlign: 'center' },
});
