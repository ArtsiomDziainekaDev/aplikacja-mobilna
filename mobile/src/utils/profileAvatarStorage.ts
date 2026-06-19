import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

const AVATAR_DIR = `${FileSystem.documentDirectory ?? ''}profile-avatars/`;
const AVATAR_FILE_PREFIX = 'avatar';

function extensionFromUri(uri: string): string {
  const cleanUri = uri.split('?')[0].split('#')[0];
  const match = cleanUri.match(/\.([a-zA-Z0-9]+)$/);
  return match?.[1]?.toLowerCase() ?? 'jpg';
}

function isStoredAvatarUri(uri: string | null): uri is string {
  return !!uri && !!FileSystem.documentDirectory && uri.startsWith(AVATAR_DIR);
}

async function ensureAvatarDirectory(): Promise<void> {
  if (!FileSystem.documentDirectory) {
    throw new Error('File system document directory is unavailable.');
  }

  await FileSystem.makeDirectoryAsync(AVATAR_DIR, { intermediates: true });
}

export async function deleteProfileAvatar(uri: string | null): Promise<void> {
  if (!isStoredAvatarUri(uri)) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    /* Avatar cleanup is best-effort and should not block profile saves. */
  }
}

export async function persistProfileAvatar(sourceUri: string | null): Promise<string | null> {
  if (!sourceUri) {
    return null;
  }

  if (Platform.OS === 'web' || isStoredAvatarUri(sourceUri)) {
    return sourceUri;
  }

  await ensureAvatarDirectory();

  const destinationUri = `${AVATAR_DIR}${AVATAR_FILE_PREFIX}-${Date.now()}.${extensionFromUri(sourceUri)}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destinationUri });

  return destinationUri;
}
