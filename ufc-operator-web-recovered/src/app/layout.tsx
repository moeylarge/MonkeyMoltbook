import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/app-shell';
import { getOperatorSnapshot } from '@/lib/ufc-data';
import { getFreshnessDiagnostics } from '@/lib/live-odds';

export const metadata: Metadata = {
  title: 'UFC Operator',
  description: 'Internal operator dashboard for the UFC analytics system.',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [snapshot, freshness] = await Promise.all([
    getOperatorSnapshot(),
    getFreshnessDiagnostics().catch(() => null),
  ]);
  const status = snapshot?.status ?? {};
  const productState = snapshot?.product_state ?? {};
  const eventName =
    snapshot?.command_center?.bestApprovedSpots?.[0]?.eventName ||
    snapshot?.command_center?.reviewQueue?.[0]?.eventName ||
    'UFC command center';

  return (
    <html lang="en">
      <body>
        <AppShell
          status={{
            approved: status.approved,
            review: status.review,
            suppressed: status.suppressed,
            mode: productState.mode,
            eventName,
            updatedAt: freshness?.dbTimestamp ?? freshness?.syncTimestamp ?? snapshot?.generated_at,
          }}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
