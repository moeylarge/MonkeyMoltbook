import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { AppShell } from '../components/AppShell';
import { InsightCard } from '../components/InsightCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { theme } from '../theme';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Saved'>;

const sessions = [
  { label: 'Today · 78', summary: 'Lead photo improved, weakest mirror selfie still dragging.' },
  { label: 'Last week · 71', summary: 'Stronger variety needed across the set.' },
];

export function SavedScreen({ navigation }: Props) {
  return (
    <AppShell>
      <ScreenHeader
        eyebrow="History"
        title="Saved analyses shell"
        subtitle="This proves the return-user route before real persistence exists."
      />

      {sessions.map((session) => (
        <InsightCard key={session.label} title={session.label}>
          <Text style={styles.body}>{session.summary}</Text>
        </InsightCard>
      ))}

      <View style={styles.actions}>
        <PrimaryButton label="Premium shell" onPress={() => navigation.navigate('Premium')} />
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  body: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 21,
  },
  actions: {
    marginTop: theme.spacing.sm,
  },
});
