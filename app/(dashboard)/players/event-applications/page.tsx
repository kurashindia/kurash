"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  gender: string;
  weight: number;
  registered_association: string;
  state: string;
}

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

interface Application {
  id: string;
  player_id: string;
  event_id: string;
  sub_event_id?: string;
  status: string;
  created_at: string;
  transaction_id?: string;
  events: Event;
  sub_events?: SubEvent;
  players: Player;
  type: "main_event" | "sub_event";
}

interface SubEvent {
  id: string;
  title: string;
  min_weight: number;
  max_weight: number;
  event_id: string;
}

export default function EventApplicationsPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPlayers();
    fetchEvents();
    fetchApplications();
  }, []);

  async function fetchPlayers() {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .order("first_name");

    if (error) {
      console.error("Error fetching players:", error);
    } else {
      setPlayers(data || []);
    }
    setLoading(false);
  }

  async function fetchEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching events:", error);
    } else {
      setEvents(data || []);
    }
  }

  async function fetchApplications() {
    try {
      // Fetch main event applications
      const { data: mainEventApplications, error: mainEventError } =
        await supabase
          .from("player_event_applications")
          .select(
            `
          *,
          events (*),
          players (*)
        `
          )
          .order("created_at", { ascending: false });

      const enrichedMainEventApps = await Promise.all(
        (mainEventApplications || []).map(async (app) => {
          const { data: subParticipants, error } = await supabase
            .from("sub_event_participants")
            .select(
              `
        sub_event_id,
        sub_events (
          id,
          title,
          event_id
        )
      `
            )
            .eq("player_id", app.player_id);

          if (error) {
            console.error(
              "Failed to fetch sub_event for player:",
              app.player_id,
              error
            );
          }

          type SubParticipant = {
            sub_event_id: string;
            sub_events: {
              id: string;
              title: string;
              event_id: string;
            }[];
          };

          const participantArray = subParticipants as SubParticipant[];

          const matchedSubEvent = participantArray
            ?.flatMap((p) => p.sub_events)
            .find((se) => se.event_id === app.event_id);

          return {
            ...app,
            type: "main_event",
            sub_events: matchedSubEvent || null,
          };
        })
      );

      // Fetch sub-event applications
      const { data: subEventApplications, error: subEventError } =
        await supabase
          .from("sub_event_applications")
          .select(
            `
          *,
          sub_events (*),
          events (*),
          players (*)
        `
          )
          .order("created_at", { ascending: false });

      if (mainEventError || subEventError) {
        console.error(
          "Error fetching applications:",
          mainEventError || subEventError
        );
        return;
      }

      // Combine and sort applicationsaa
      const combinedApplications = [
        ...enrichedMainEventApps,
        ...(subEventApplications || []).map((app) => ({
          ...app,
          type: "sub_event",
        })),
      ].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setApplications(combinedApplications);
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async function applyForEvent() {
    if (!selectedPlayer || !selectedEvent) return;

    // Check if already applied
    const existingApplication = applications.find(
      (app) =>
        app.player_id === selectedPlayer && app.event_id === selectedEvent
    );

    if (existingApplication) {
      alert("You have already applied for this event.");
      return;
    }

    const { error } = await supabase.from("player_event_applications").insert([
      {
        player_id: selectedPlayer,
        event_id: selectedEvent,
        status: "pending",
      },
    ]);

    if (error) {
      console.error("Error applying for event:", error);
      alert("There was a problem with your application");
    } else {
      fetchApplications();
      setSelectedPlayer("");
      setSelectedEvent("");
    }
  }

  async function updateApplicationStatus(
    applicationId: string,
    newStatus: string,
    type: string
  ) {
    try {
      let result;
      if (type === "main_event") {
        // Update status in player_event_applications
        result = await supabase
          .from("player_event_applications")
          .update({ status: newStatus })
          .eq("id", applicationId);

        if (result.error) {
          console.error("Error updating application status:", result.error);
          alert("Failed to update application status");
          return;
        }

        // If status is accepted, insert into sub_event_participants
        if (newStatus === "accepted") {
          // 1. Get player and event info from application
          const { data: applicationData, error: fetchError } = await supabase
            .from("player_event_applications")
            .select("player_id, event_id")
            .eq("id", applicationId)
            .single();

          if (fetchError) {
            console.error("Error fetching application details:", fetchError);
            alert("Failed to fetch application details");
            return;
          }

          // 2. Get player weight
          const { data: playerData, error: playerError } = await supabase
            .from("players")
            .select("weight")
            .eq("id", applicationData.player_id)
            .single();

          if (playerError) {
            console.error("Error fetching player weight:", playerError);
            alert("Failed to fetch player details");
            return;
          }

          // 3. Get matching sub_event by event_id and weight
          const { data: subEventData, error: subEventError } = await supabase
            .from("sub_events")
            .select("id")
            .eq("event_id", applicationData.event_id)
            .lte("min_weight", playerData.weight)
            .gt("max_weight", playerData.weight)
            .maybeSingle(); // Use maybeSingle in case no match or 1 match

          if (subEventError || !subEventData) {
            console.error(
              "Error fetching sub event:",
              subEventError || "No matching sub_event"
            );
            alert("No matching sub-event found for this player weight.");
            return;
          }

          // 4. Insert into sub_event_participants
          const { error: insertError } = await supabase
            .from("sub_event_participants")
            .insert([
              {
                player_id: applicationData.player_id,
                sub_event_id: subEventData.id,
                created_at: new Date().toISOString(),
              },
            ]);

          if (insertError) {
            console.error(
              "Error inserting into sub_event_participants:",
              insertError
            );
            alert("Failed to add participant to sub event");
            return;
          }
        }
      } else {
        result = await supabase
          .from("sub_event_applications")
          .update({ status: newStatus })
          .eq("id", applicationId);
      }

      const { error } = result;

      if (error) {
        console.error("Error updating application status:", error);
        alert("Failed to update application status");
      } else {
        // Refresh applications
        fetchApplications();
        window.location.reload();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }

  function getFilteredPlayers() {
    if (!searchTerm) return players;

    const term = searchTerm.toLowerCase();
    return players.filter(
      (player) =>
        player.first_name.toLowerCase().includes(term) ||
        player.last_name.toLowerCase().includes(term) ||
        player.registered_association.toLowerCase().includes(term)
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Event Applications</h2>
        <Link href="/players">
          <Button variant="outline">Back to Players</Button>
        </Link>
      </div>

      <Card className="p-6">
        <h3 className="text-xl font-medium mb-4">Apply for an Event</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="player-search">Search Player</Label>
            <Input
              id="player-search"
              placeholder="Search by name or association"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
            />
            <div className="max-h-64 overflow-y-auto border rounded p-2">
              {getFilteredPlayers().length === 0 ? (
                <p className="text-center p-4 text-muted-foreground">
                  No matching players
                </p>
              ) : (
                getFilteredPlayers().map((player) => (
                  <div
                    key={player.id}
                    className={`p-2 cursor-pointer hover:bg-accent rounded ${
                      selectedPlayer === player.id ? "bg-accent" : ""
                    }`}
                    onClick={() => setSelectedPlayer(player.id)}
                  >
                    <p className="font-medium">
                      {player.first_name} {player.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {player.registered_association} • {player.state} •{" "}
                      {player.weight} kg
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="event-select">Select Event</Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger id="event-select">
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title} ({event.weight_category}, {event.gender})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={applyForEvent}
              className="w-full mt-4"
              disabled={!selectedPlayer || !selectedEvent}
            >
              Submit Application
            </Button>
          </div>
        </div>
      </Card>

      <h3 className="text-xl font-medium mt-8">Your Applications</h3>
      {applications.length === 0 ? (
        <p className="text-center p-4 text-muted-foreground">
          No applications found
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {applications.map((app) => (
            <Card key={app.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">
                    {app.events.title}
                    {" - "}
                    {app.sub_events?.title ?? "Main Event"}
                  </h4>

                  <p className="text-sm text-muted-foreground">
                    {app.type === "main_event"
                      ? `${app.events.weight_category}, ${app.events.gender}`
                      : `${app.events.weight_category}, ${app.events.gender}, ${app.sub_events?.min_weight}–${app.sub_events?.max_weight}kg`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`px-2 py-1 rounded text-xs ${
                      app.status === "accepted"
                        ? "bg-green-100 text-green-800"
                        : app.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </div>
                  {app.status === "pending" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateApplicationStatus(app.id, "accepted", app.type)
                      }
                    >
                      Approve
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-2">
                <p className="text-sm">
                  <span className="text-muted-foreground">Player: </span>
                  {app.players.first_name} {app.players.last_name}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Association: </span>
                  {app.players.registered_association}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">State: </span>
                  {app.players.state}
                </p>
                {app.transaction_id && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">
                      Transaction ID:{" "}
                    </span>
                    {app.transaction_id}
                  </p>
                )}
                <p className="text-sm">
                  <span className="text-muted-foreground">Applied on: </span>
                  {new Date(app.created_at).toLocaleDateString()}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
