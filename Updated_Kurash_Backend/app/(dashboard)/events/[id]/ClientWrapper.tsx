'use client';

import dynamic from 'next/dynamic';

// Dynamically import the client component with ssr: false
const ClientMatchPlanner = dynamic(
  () => import('./client').then((mod) => ({ default: mod.EventMatchPlannerPage })),
  { ssr: false }
);

export default function ClientWrapper() {
  return <ClientMatchPlanner />;
} 