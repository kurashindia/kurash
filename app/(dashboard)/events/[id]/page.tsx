import { createClient } from '@supabase/supabase-js';
import ClientWrapper from './ClientWrapper';

// Initialize Supabase client for server-side operation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// For static generation
export async function generateStaticParams() {
  const { data, error } = await supabase
    .from('events')
    .select('id');

  if (error) {
    console.error('Error fetching events:', error);
    return [
      { id: '4409e94d-61fd-4a61-84a7-06b687d09e50' },
      { id: '73947ce4-70fc-428d-b211-9f1b6e97905e' },
      { id: '8d1f333e-5a72-487d-aa1c-deb03e1dcd51' },
      { id: '6dfc7f04-d93c-4706-b24e-dae1b67442a2' },
      { id: '6842330a-c934-44b9-8ec4-746b41cc3fb6' }
    ];
  }

  return data.map((event) => ({ id: event.id }));
}

// ✅ FIXED HERE
export default function EventPage({ params }: { params: { id: string } }) {
  return <ClientWrapper id={params.id} />;
}
