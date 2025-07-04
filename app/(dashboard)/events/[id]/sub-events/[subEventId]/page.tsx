import { SubEventClient } from './client';

export default function SubEventPage({ params }: any) {
  const { id: eventId, subEventId } = params;
  return <SubEventClient eventId={eventId} subEventId={subEventId} />;
} 