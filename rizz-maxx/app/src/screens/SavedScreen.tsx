import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { AppShell } from '../components/AppShell';
import { InsightCard } from '../components/InsightCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { SavedAnalysisCard } from '../components/SavedAnalysisCard';
import { ScreenHeader } from '../components/ScreenHeader';
import { listSavedAnalyses, SavedAnalysis } from '../storage';
import { theme } from '../theme';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Saved'>;

export function SavedScreen({ navigation }: Props) {
  const [items, setItems] = useState<SavedAnalysis[]>([]);

  useFocusEffect(
    useCallback(() => {
      listSavedAnalyses().then(setItems).catch(() => setItems([]));
    }, []),
  );

  return (
    <AppShell>
      <ScreenHeader
        eyebrow="History"
        title="Saved analyses"
        subtitle="Phase 6 now persists completed reports locally and lets you reopen them."
      />

      {items.length === 0 ? (
        <InsightCard title="No saved analyses yet">
          <Text style={styles.body}>Run an analysis first, then it will appear here automatically.</Text>
        </InsightCard>
      ) : (
        items.map((item) => (
          <SavedAnalysisCard
            key={item.id}
            item={item}
            onPress={() => navigation.navigate('Results', { photos: item.photos, result: item.result, savedId: item.id })}
          />
        ))
      )}

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
