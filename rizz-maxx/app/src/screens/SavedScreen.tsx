import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { AppShell } from '../components/AppShell';
import { CompareDetailsCard } from '../components/CompareDetailsCard';
import { CompareSummaryCard } from '../components/CompareSummaryCard';
import { HistoryStatsCard } from '../components/HistoryStatsCard';
import { InsightCard } from '../components/InsightCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { SavedAnalysisCard } from '../components/SavedAnalysisCard';
import { SecondaryButton } from '../components/SecondaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { clearSavedAnalyses, deleteSavedAnalysis, listSavedAnalyses, SavedAnalysis } from '../storage';
import { theme } from '../theme';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Saved'>;

export function SavedScreen({ navigation }: Props) {
  const [items, setItems] = useState<SavedAnalysis[]>([]);

  const refresh = useCallback(() => {
    listSavedAnalyses().then(setItems).catch(() => setItems([]));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const comparisons = useMemo(() => {
    return items.map((item, index) => {
      const previous = items[index + 1];
      if (!previous) return null;
      const delta = item.score - previous.score;
      if (delta === 0) return 'No score change';
      const leadChanged = item.bestPhotoId !== previous.bestPhotoId;
      return `${delta > 0 ? '+' : ''}${delta} vs previous${leadChanged ? ' · new lead' : ''}`;
    });
  }, [items]);

  const handleDelete = async (id: string) => {
    await deleteSavedAnalysis(id);
    refresh();
  };

  const handleClear = async () => {
    await clearSavedAnalyses();
    refresh();
  };

  return (
    <AppShell>
      <ScreenHeader
        eyebrow="History"
        title="Saved analyses"
        subtitle="Phase 6 now persists completed reports locally, lets you reopen them, and gives lightweight trend comparison."
      />

      <HistoryStatsCard items={items} />
      <CompareSummaryCard latest={items[0]} previous={items[1]} />
      <CompareDetailsCard latest={items[0]} previous={items[1]} />

      {items.length >= 2 ? <PrimaryButton label="Open compare view" onPress={() => navigation.navigate('Compare')} /> : null}

      {items.length === 0 ? (
        <InsightCard title="No saved analyses yet">
          <Text style={styles.body}>Run an analysis first, then it will appear here automatically.</Text>
        </InsightCard>
      ) : (
        <>
          {items.map((item, index) => (
            <SavedAnalysisCard
              key={item.id}
              item={item}
              comparisonLabel={comparisons[index] ?? undefined}
              onPress={() => navigation.navigate('Results', { photos: item.photos, result: item.result, savedId: item.id })}
              onDelete={() => handleDelete(item.id)}
            />
          ))}
          <SecondaryButton label="Clear saved analyses" onPress={handleClear} tone="danger" />
        </>
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
