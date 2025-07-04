// app/(dashboard)/events/[id]/sub-events/[subEventId]/page.tsx
import { redirect } from 'next/navigation';

interface PageProps {
  params: {
    id: string;
    subEventId: string;
  };
}

export default function SubEventPage({ params }: PageProps) {
  redirect('/dashboard');
}
