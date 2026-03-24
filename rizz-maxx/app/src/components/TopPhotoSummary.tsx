import { Image, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { SectionPill } from './SectionPill';

type Props = {
  uri: string;
  title: string;
  body: string;
  tone?: 'positive' | 'negative';
};

export function TopPhotoSummary({ uri, title, body, tone = 'positive' }: Props) {
  return (
    <View style={styles.wrap}>
      <Image source={{ uri }} style={styles.image} />
      <View style={styles.textWrap}>
        <SectionPill label={tone === 'positive' ? 'KEEP / LEAD' : 'REMOVE FIRST'} tone={tone} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: theme.spacing.md,
  },
  image: {
    width: '100%',
    aspectRatio: 1.08,
    borderRadius: theme.radius.sheet,
    backgroundColor: theme.colors.surfaceElevated,
  },
  textWrap: {
    gap: theme.spacing.sm,
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
