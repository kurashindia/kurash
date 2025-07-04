'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Event {
  id: string;
  title: string;
  state: string;
  city: string;
  age: number;
  weight_category: string;
  fees: number;
  gender: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching events:', error);
      } else {
        setEvents(data || []);
      }
      setLoading(false);
    }

    fetchEvents();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Events</h2>
        <Link href="/events/create">
          <Button>Create New Event</Button>
        </Link>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <p>No events found</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id} className="p-6">
              <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Location: {event.city}, {event.state}</p>
                <p>Age: {event.age} years</p>
                <p>Weight Category: {event.weight_category}</p>
                <p>Gender: {event.gender}</p>
                <p>Entry Fee: ₹{event.fees}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <Link href={`/events/${event.id}`} className="flex-1">
                  <Button className="w-full">View Event</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}