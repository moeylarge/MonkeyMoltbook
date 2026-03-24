import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

type Props = {
  items: string[];
  tone?: 'default' | 'positive' | 'negative';
};

export function ListBlock({ items, tone = 'default' }: Props) {
  return (
    <View style={styles.wrap}>
      {items.map((item) => (
        <View
          key={item}
          style={[
            styles.row,
            tone === 'positive' ? styles.positive : null,
            tone === 'negative' ? styles.negative : null,
          ]}
        >
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.text}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'flex-start',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceElevated,
  },
  positive: {
    backgroundColor: 'rgba(45,212,191,0.08)',
  },
  negative: {
    backgroundColor: 'rgba(255,93,115,0.08)',
  },
  bullet: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
  },
  text: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 15,
    lineHeight: 21,
  },
});
