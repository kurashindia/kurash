import { SubEventClient } from './client';

export default function SubEventPage({ params }: { params: { id: string, subEventId: string } }) {
  // Destructure params directly (no async/await needed)
  const { id: eventId, subEventId } = params;

  return <SubEventClient eventId={eventId} subEventId={subEventId} />;
} 