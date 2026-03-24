import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { PhotoItem } from '../types';

type Props = {
  photo: PhotoItem;
  rankLabel?: string;
  badgeTone?: 'default' | 'best' | 'weak';
  onRemove?: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  disableMoveLeft?: boolean;
  disableMoveRight?: boolean;
};

export function PhotoTile({
  photo,
  rankLabel,
  badgeTone = 'default',
  onRemove,
  onMoveLeft,
  onMoveRight,
  disableMoveLeft,
  disableMoveRight,
}: Props) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: photo.uri }} style={styles.image} />
      {rankLabel ? (
        <View style={[styles.badge, badgeTone === 'best' ? styles.badgeBest : null, badgeTone === 'weak' ? styles.badgeWeak : null]}>
          <Text style={styles.badgeText}>{rankLabel}</Text>
        </View>
      ) : null}
      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Move ${photo.id} left`}
          disabled={disableMoveLeft}
          onPress={onMoveLeft}
          style={[styles.controlButton, disableMoveLeft && styles.controlButtonDisabled]}
        >
          <Text style={styles.controlText}>←</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Move ${photo.id} right`}
          disabled={disableMoveRight}
          onPress={onMoveRight}
          style={[styles.controlButton, disableMoveRight && styles.controlButtonDisabled]}
        >
          <Text style={styles.controlText}>→</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${photo.id}`}
          onPress={onRemove}
          style={[styles.controlButton, styles.removeButton]}
        >
          <Text style={styles.controlText}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    position: 'relative',
  },
  image: {
    width: '100%',
    aspectRatio: 0.82,
    backgroundColor: theme.colors.surfaceElevated,
  },
  badge: {
    position: 'absolute',
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    backgroundColor: 'rgba(10,10,15,0.78)',
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
  },
  badgeBest: {
    backgroundColor: theme.colors.positive,
  },
  badgeWeak: {
    backgroundColor: theme.colors.negative,
  },
  badgeText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  controlButton: {
    flex: 1,
    minHeight: 36,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  controlButtonDisabled: {
    opacity: 0.35,
  },
  removeButton: {
    backgroundColor: 'rgba(255,93,115,0.12)',
  },
  controlText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
});
