import { SubEventClient } from './client';

export default async function SubEventPage({ params }: { params: { id: string, subEventId: string } }) {
  // Destructure params at the top level to ensure they are properly awaited
  const { id: eventId, subEventId } = await Promise.resolve(params);

  return <SubEventClient eventId={eventId} subEventId={subEventId} />;
} 