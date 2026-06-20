import { api } from './client';
import type { NewsItem } from '../types';

export async function fetchNews(): Promise<NewsItem[]> {
  const response = await api.get<NewsItem[]>('/api/news');
  return response.data;
}

export async function triggerNewsRefresh(): Promise<void> {
  // Sync refresh on backend: NewsAPI + up to 10 Gemini calls can take ~30s.
  await api.post('/api/news/refresh', null, { timeout: 120000 });
}
