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
    backgroundColor: theme.colors.surfaceLuxury,
    borderRadius: theme.radius.luxury,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    position: 'relative',
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  image: {
    width: '100%',
    aspectRatio: 0.82,
    backgroundColor: theme.colors.surfaceElevated,
  },
  badge: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    backgroundColor: 'rgba(10,10,15,0.72)',
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  badgeBest: {
    backgroundColor: 'rgba(45,212,191,0.92)',
  },
  badgeWeak: {
    backgroundColor: 'rgba(200,30,58,0.92)',
  },
  badgeText: {
    color: theme.colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  controlButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
  },
  controlButtonDisabled: {
    opacity: 0.35,
  },
  removeButton: {
    backgroundColor: 'rgba(200,30,58,0.14)',
  },
  controlText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
});
