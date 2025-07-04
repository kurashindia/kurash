"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Player {
  id: string;
  name: string;
  association: string;
}

interface SubEvent {
  id: string;
  event_id: string;
  title: string;
  min_weight: number;
  max_weight: number;
  participants_count: number;
  created_at: string;
}

interface SubEventsProps {
  eventId: string;
  eventTitle: string;
  weightCategory: string;
}

export default function SubEvents({
  eventId,
  eventTitle,
  weightCategory,
}: SubEventsProps) {
  const [subEvents, setSubEvents] = useState<SubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSubEvent, setNewSubEvent] = useState({
    title: "",
    min_weight: "",
    max_weight: "",
    dob_start: "",
    dob_end: "",
    event_end_date: "",
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchSubEvents();
  }, [eventId]);

  async function fetchSubEvents() {
    setLoading(true);
    try {
      // Fetch sub-events
      const { data: subEventsData, error: subEventsError } = await supabase
        .from("sub_events")
        .select("*")
        .eq("event_id", eventId)
        .order("min_weight", { ascending: true });

      if (subEventsError) {
        console.error("Error fetching sub-events:", subEventsError);
        setLoading(false);
        return;
      }

      // If no sub-events found, return an empty array
      if (!subEventsData || subEventsData.length === 0) {
        setSubEvents([]);
        setLoading(false);
        return;
      }

      // Get participant counts for each sub-event
      const subEventsWithCounts = await Promise.all(
        subEventsData.map(async (subEvent) => {
          const { count, error: countError } = await supabase
            .from("sub_event_participants")
            .select("*", { count: "exact", head: false })
            .eq("sub_event_id", subEvent.id);

          if (countError) {
            console.error("Error fetching participant count:", countError);
            return { ...subEvent, participants_count: 0 };
          }

          return { ...subEvent, participants_count: count || 0 };
        })
      );

      setSubEvents(subEventsWithCounts);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewSubEvent((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (
      !newSubEvent.title ||
      !newSubEvent.min_weight ||
      !newSubEvent.max_weight
    ) {
      alert("Please fill all fields");
      return;
    }
    if (!newSubEvent.dob_start || !newSubEvent.dob_end) {
      alert("Please enter both start and end dates for DOB range");
      return;
    }

    try {
      // Extract weight range from the main event's weight category
      const minWeight = parseFloat(newSubEvent.min_weight);
      const maxWeight = parseFloat(newSubEvent.max_weight);

      const eventRange = weightCategory.match(/(\d+)[-\s]*(\d+)/);
      if (eventRange) {
        const eventMin = parseInt(eventRange[1]);
        const eventMax = parseInt(eventRange[2]);

        if (minWeight < eventMin || maxWeight > eventMax) {
          alert(
            `Sub-event weight must be within main event range (${eventMin}–${eventMax} kg)`
          );
          return;
        }
      }

      const { data, error } = await supabase
        .from("sub_events")
        .insert([
          {
            event_id: eventId,
            title: newSubEvent.title,
            min_weight: minWeight,
            max_weight: maxWeight,
            dob_range: `[${newSubEvent.dob_start},${newSubEvent.dob_end}]`,
            event_date: new Date().toISOString().split("T")[0],
            event_end_date: newSubEvent.event_end_date,
          },
        ])
        .select();

      if (error) {
        console.error("Error creating sub-event:", error);
        alert("Failed to create sub-event: " + error.message);
      } else {
        setNewSubEvent({
          title: "",
          min_weight: "",
          max_weight: "",
          dob_start: "",
          dob_end: "",
          event_end_date: "",
        });
        setIsDialogOpen(false);
        fetchSubEvents();
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An unexpected error occurred");
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Sub-Events by Precise Weights</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create Sub-Event</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Sub-Event for {eventTitle}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Sub-Event Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={newSubEvent.title}
                  onChange={handleChange}
                  placeholder="e.g., 55kg Exact Weight"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_weight">Min Weight (kg)</Label>
                <Input
                  id="min_weight"
                  name="min_weight"
                  type="number"
                  step="0.1"
                  value={newSubEvent.min_weight}
                  onChange={handleChange}
                  placeholder="e.g., 50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_weight">Max Weight (kg)</Label>
                <Input
                  id="max_weight"
                  name="max_weight"
                  type="number"
                  step="0.1"
                  value={newSubEvent.max_weight}
                  onChange={handleChange}
                  placeholder="e.g., 55"
                />
                <p className="text-xs text-muted-foreground">
                  Should be within main event’s weight category:{" "}
                  {weightCategory}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob_start">DOB Start Date</Label>
                <Input
                  id="dob_start"
                  name="dob_start"
                  type="date"
                  value={newSubEvent.dob_start}
                  onChange={handleChange}
                  placeholder="Start Date of Birth"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob_end">DOB End Date</Label>
                <Input
                  id="dob_end"
                  name="dob_end"
                  type="date"
                  value={newSubEvent.dob_end}
                  onChange={handleChange}
                  placeholder="End Date of Birth"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Select date range for participants' birth dates
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event_end_date">Sub-Event End Date</Label>
                <Input
                  id="event_end_date"
                  name="event_end_date"
                  type="date"
                  value={newSubEvent.event_end_date}
                  onChange={handleChange}
                  placeholder="End Date of Sub-Event"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Select date for the end of the sub-event
                </p>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSubmit}>Create Sub-Event</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <p>Loading sub-events...</p>
        </div>
      ) : subEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 space-y-2 text-center">
          <p className="text-muted-foreground">
            No sub-events created yet for this weight category
          </p>
          <p className="text-sm text-muted-foreground">
            Create sub-events to manage precise weight categories like 51kg,
            55kg, etc.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {subEvents.map((subEvent) => (
              <Card
                key={subEvent.id}
                className="p-4 hover:shadow-md transition-all"
              >
                <h4 className="font-semibold">{subEvent.title}</h4>
                <p className="text-sm text-muted-foreground">
                  Weight Range: {subEvent.min_weight.toFixed(1)}kg –{" "}
                  {subEvent.max_weight.toFixed(1)}kg
                </p>

                <p className="text-sm mb-4">
                  Participants: {subEvent.participants_count || 0}
                </p>
                <div className="flex gap-2">
                  <Link
                    href={`/events/${eventId}/sub-events/${subEvent.id}`}
                    className="flex-1"
                  >
                    <Button variant="default" className="w-full">
                      Manage
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
