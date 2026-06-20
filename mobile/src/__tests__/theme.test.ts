import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

describe('theme', () => {
  it('colors should have required keys', () => {
    expect(colors.primary).toBeDefined();
    expect(colors.background).toBeDefined();
    expect(colors.error).toBeDefined();
    expect(colors.text).toBeDefined();
  });

  it('spacing should have numeric values', () => {
    expect(typeof spacing.md).toBe('number');
    expect(typeof spacing.lg).toBe('number');
    expect(spacing.md).toBeGreaterThan(0);
  });
});
