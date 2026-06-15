import * as FileSystem from 'expo-file-system/legacy';
import { deleteProfileAvatar, persistProfileAvatar } from '../utils/profileAvatarStorage';

describe('profileAvatarStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1234567890);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('copies picked avatar into app document directory', async () => {
    const result = await persistProfileAvatar('file:///picker/avatar.png?edited=true');

    expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledWith(
      'file:///mock-document-directory/profile-avatars/',
      { intermediates: true },
    );
    expect(FileSystem.copyAsync).toHaveBeenCalledWith({
      from: 'file:///picker/avatar.png?edited=true',
      to: 'file:///mock-document-directory/profile-avatars/avatar-1234567890.png',
    });
    expect(result).toBe('file:///mock-document-directory/profile-avatars/avatar-1234567890.png');
  });

  it('returns already persisted avatar without copying again', async () => {
    const storedUri = 'file:///mock-document-directory/profile-avatars/avatar-1.jpg';

    const result = await persistProfileAvatar(storedUri);

    expect(FileSystem.copyAsync).not.toHaveBeenCalled();
    expect(result).toBe(storedUri);
  });

  it('deletes stored avatar files only', async () => {
    await deleteProfileAvatar('file:///mock-document-directory/profile-avatars/avatar-1.jpg');
    await deleteProfileAvatar('file:///picker/avatar.jpg');

    expect(FileSystem.deleteAsync).toHaveBeenCalledTimes(1);
    expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
      'file:///mock-document-directory/profile-avatars/avatar-1.jpg',
      { idempotent: true },
    );
  });
});
