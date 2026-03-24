import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { SavedAnalysis } from '../storage';
import { SecondaryButton } from './SecondaryButton';

type Props = {
  item: SavedAnalysis;
  comparisonLabel?: string;
  onPress: () => void;
  onDelete: () => void;
};

export function SavedAnalysisCard({ item, comparisonLabel, onPress, onDelete }: Props) {
  const lead = item.photos.find((photo) => photo.id === item.bestPhotoId) ?? item.photos[0];
  const date = new Date(item.createdAt).toLocaleString();

  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Open saved analysis ${item.id}`} onPress={onPress} style={styles.pressable}>
        <Image source={{ uri: lead?.uri }} style={styles.image} />
        <View style={styles.body}>
          <View style={styles.row}>
            <Text style={styles.score}>{item.score}</Text>
            <Text style={styles.meta}>{item.source === 'real' ? 'Real' : 'Mock'} · {item.confidence}</Text>
          </View>
          <Text style={styles.date}>{date}</Text>
          {comparisonLabel ? <Text style={styles.compare}>{comparisonLabel}</Text> : null}
          <Text style={styles.summary}>{item.summary}</Text>
        </View>
      </Pressable>
      <SecondaryButton label={`Delete saved analysis ${item.id}`} onPress={onDelete} tone="danger" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  pressable: {
    flexDirection: 'row',
    gap: theme.spacing.md,
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
  compare: {
    color: theme.colors.positive,
    fontSize: 12,
    fontWeight: '700',
  },
  summary: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
});
