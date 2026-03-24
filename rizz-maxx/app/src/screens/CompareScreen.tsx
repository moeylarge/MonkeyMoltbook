import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { AppShell } from '../components/AppShell';
import { CompareDetailsCard } from '../components/CompareDetailsCard';
import { CompareSummaryCard } from '../components/CompareSummaryCard';
import { InsightCard } from '../components/InsightCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { SavedAnalysisCard } from '../components/SavedAnalysisCard';
import { ScreenHeader } from '../components/ScreenHeader';
import { listSavedAnalyses, SavedAnalysis } from '../storage';
import { theme } from '../theme';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Compare'>;

export function CompareScreen({ navigation }: Props) {
  const [items, setItems] = useState<SavedAnalysis[]>([]);

  useFocusEffect(
    useCallback(() => {
      listSavedAnalyses().then(setItems).catch(() => setItems([]));
    }, []),
  );

  const latest = items[0];
  const previous = items[1];

  return (
    <AppShell>
      <ScreenHeader
        eyebrow="Compare"
        title="Retest comparison"
        subtitle="See what actually changed between your latest saved runs."
      />

      <CompareSummaryCard latest={latest} previous={previous} />
      <CompareDetailsCard latest={latest} previous={previous} />

      {!latest || !previous ? (
        <InsightCard title="Not enough saved runs">
          <Text style={styles.body}>Save at least two analyses to make the compare loop useful.</Text>
        </InsightCard>
      ) : (
        <>
          <SavedAnalysisCard
            item={latest}
            comparisonLabel="Latest run"
            onPress={() => navigation.navigate('Results', { photos: latest.photos, result: latest.result, savedId: latest.id })}
          />
          <SavedAnalysisCard
            item={previous}
            comparisonLabel="Previous run"
            onPress={() => navigation.navigate('Results', { photos: previous.photos, result: previous.result, savedId: previous.id })}
          />
        </>
      )}

      <View style={styles.actions}>
        <PrimaryButton label="Back to saved analyses" onPress={() => navigation.navigate('Saved')} />
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
