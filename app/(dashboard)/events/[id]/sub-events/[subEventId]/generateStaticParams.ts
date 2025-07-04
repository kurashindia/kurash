// @ts-ignore: If you get module not found for supabase-js, ensure it's installed in your project
import { createClient } from '@supabase/supabase-js';
// If you get process type errors, install @types/node as a dev dependency

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function generateStaticParams() {
  // Fetch all sub_events with their event_id
  const { data, error } = await supabase
    .from('sub_events')
    .select('id, event_id');

  if (error) {
    console.error('Error fetching sub_events for static generation:', error);
    return [];
  }

  // Return array of params for static generation
  return (data || []).map((subEvent: { id: string; event_id: string }) => ({
    id: subEvent.event_id,
    subEventId: subEvent.id,
  }));
} 