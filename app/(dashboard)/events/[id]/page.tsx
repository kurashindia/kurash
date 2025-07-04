// app/(dashboard)/events/[id]/page.tsx
import { createClient } from '@supabase/supabase-js';
import ClientWrapper from './ClientWrapper';
import { notFound } from 'next/navigation';

// Initialize Supabase client for server-side operation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Generate static params for pre-rendering
export async function generateStaticParams() {
  const { data, error } = await supabase
    .from('events')
    .select('id');

  if (error || !data) {
    console.error('Error fetching events:', error);
    return [];
  }

  return data.map((event) => ({ id: event.id }));
}

// ✅ CORRECTED COMPONENT SIGNATURE
type EventPageProps = {
  params: {
    id: string;
  };
};

export default function EventPage({ params }: EventPageProps) {
  if (!params?.id) {
    notFound(); // Handle missing ID
  }

  return <ClientWrapper id={params.id} />;
}
