import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { SectionPill } from './SectionPill';

export function EmptyUploadState() {
  return (
    <View style={styles.wrap}>
      <SectionPill label="UPLOAD READY" tone="accent" />
      <Text style={styles.title}>Start with the photos you would actually use.</Text>
      <Text style={styles.body}>
        The goal is not to flatter the set. The goal is to find the photos helping your profile and the ones quietly hurting it.
      </Text>
      <View style={styles.bullets}>
        <Text style={styles.bullet}>• 4-10 photos works best</Text>
        <Text style={styles.bullet}>• Include the shots you would really post</Text>
        <Text style={styles.bullet}>• Reorder or remove before analysis</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 220,
    borderRadius: theme.radius.sheet,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: theme.colors.surfaceElevated,
    padding: theme.spacing.xxl,
    gap: theme.spacing.md,
    justifyContent: 'center',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  body: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  bullets: {
    gap: theme.spacing.sm,
  },
  bullet: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    lineHeight: 21,
  },
});
