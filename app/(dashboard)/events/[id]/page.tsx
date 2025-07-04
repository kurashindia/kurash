// This is a server component
import { createClient } from '@supabase/supabase-js';
import ClientWrapper from './ClientWrapper';

// Initialize Supabase client for server-side operation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// This function is required for static site generation with the 'export' output setting
export async function generateStaticParams() {
  // Fetch all event IDs from Supabase
  const { data, error } = await supabase
    .from('events')
    .select('id');
  
  if (error) {
    console.error('Error fetching events for static generation:', error);
    // Return a default set of IDs as a fallback to prevent build failures
    return [
      { id: '4409e94d-61fd-4a61-84a7-06b687d09e50' },
      { id: '73947ce4-70fc-428d-b211-9f1b6e97905e' },
      { id: '8d1f333e-5a72-487d-aa1c-deb03e1dcd51' },
      { id: '6dfc7f04-d93c-4706-b24e-dae1b67442a2' },
      { id: '6842330a-c934-44b9-8ec4-746b41cc3fb6' } // Add the missing ID
    ];
  }

  // Map each event ID to the format expected by Next.js
  return data.map((event) => ({
    id: event.id
  }));
}

// The main page component that renders the client component
export default function EventPage() {
  return <ClientWrapper />;
}