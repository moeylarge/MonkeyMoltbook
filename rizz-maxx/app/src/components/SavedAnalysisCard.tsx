import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { SavedAnalysis } from '../storage';

type Props = {
  item: SavedAnalysis;
  onPress: () => void;
};

export function SavedAnalysisCard({ item, onPress }: Props) {
  const lead = item.photos.find((photo) => photo.id === item.bestPhotoId) ?? item.photos[0];
  const date = new Date(item.createdAt).toLocaleString();

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Open saved analysis ${item.id}`} onPress={onPress} style={styles.card}>
      <Image source={{ uri: lead?.uri }} style={styles.image} />
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.score}>{item.score}</Text>
          <Text style={styles.meta}>{item.source === 'real' ? 'Real' : 'Mock'} · {item.confidence}</Text>
        </View>
        <Text style={styles.date}>{date}</Text>
        <Text style={styles.summary}>{item.summary}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  image: {
    width: 84,
    height: 104,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceElevated,
  },
  body: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  score: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  meta: {
    color: theme.colors.accentBlue,
    fontSize: 12,
    fontWeight: '700',
  },
  date: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  summary: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
});
