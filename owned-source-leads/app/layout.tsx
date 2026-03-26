import './globals.css';
import Link from 'next/link';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Owned-Source Leads',
  description: 'Hot lead dashboard and intake system',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <div className="h1">Owned-Source Leads</div>
              <div className="muted">Phase 2 foundation: datastore, attribution, scoring, dashboard, lead detail view</div>
            </div>
            <div className="row">
              <Link className="button" href="/">Dashboard</Link>
              <Link className="button" href="/leads/new">Test Intake</Link>
              <Link className="button" href="/prospecting">Prospecting</Link>
              <Link className="button" href="/export">Export</Link>
              <Link className="button" href="/proof">Proof</Link>
              <Link className="button" href="/routing">Routing</Link>
              <Link className="button" href="/postback-test">Postback</Link>
            </div>
          </div>
          {children}
        </div>
      </body>
    </html>
  );
}
