import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { SectionPill } from './SectionPill';

export function UploadTipsCard() {
  return (
    <View style={styles.card}>
      <SectionPill label="SET-BUILDING RULE" tone="accent" />
      <Text style={styles.title}>Do not optimize the set by hiding the bad photos.</Text>
      <Text style={styles.body}>
        Load the shots you would actually use. If the weak ones never enter the set, the feedback becomes less honest.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sheet,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },
  body: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
});
