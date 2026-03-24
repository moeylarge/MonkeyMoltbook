import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text } from 'react-native';
import { AppShell } from '../components/AppShell';
import { InsightCard } from '../components/InsightCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { theme } from '../theme';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  return (
    <AppShell>
      <ScreenHeader
        eyebrow="Settings"
        title="Settings shell"
        subtitle="Minimal account and support surface only for this phase."
      />

      <InsightCard title="Account">
        <Text style={styles.body}>Free plan · local shell mode</Text>
      </InsightCard>

      <InsightCard title="Support">
        <Text style={styles.body}>Privacy, terms, restore purchase, and help links will live here.</Text>
      </InsightCard>

      <PrimaryButton label="Back to onboarding" onPress={() => navigation.navigate('Onboarding')} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  body: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 21,
  },
});
