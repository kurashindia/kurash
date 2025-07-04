'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  MapPin, 
  Users, 
  Weight, 
  Calendar, 
  Medal, 
  Award,
  Loader2,
  User
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: string;
  weight: number;
  registered_association: string;
  email: string;
  phone: string;
  passport_number: string;
  state: string;
  aadhar_number: string;
  user_id: string;
}

interface Event {
  id: string;
  title: string;
}

interface SubEvent {
  id: string;
  title: string;
  event_id: string;
}

interface EventParticipant {
  player_id: string;
}

interface SubEventParticipant {
  player_id: string;
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    state: '',
    gender: '',
    weight: '',
    event: '',
    subEvent: ''
  });
  const [states, setStates] = useState<string[]>([]);
  const [weights, setWeights] = useState<number[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [subEvents, setSubEvents] = useState<SubEvent[]>([]);
  const [filteredSubEvents, setFilteredSubEvents] = useState<SubEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  useEffect(() => {
    fetchPlayers();
    fetchEvents();
    fetchSubEvents();
  }, [filters]);

  useEffect(() => {
    // Filter sub-events based on selected event
    if (filters.event) {
      setFilteredSubEvents(subEvents.filter(se => se.event_id === filters.event));
    } else {
      setFilteredSubEvents(subEvents);
    }
    
    // Clear sub-event filter if the parent event changes
    if (filters.event && filters.subEvent) {
      const subEventExists = subEvents.some(
        se => se.id === filters.subEvent && se.event_id === filters.event
      );
      
      if (!subEventExists) {
        setFilters(prev => ({ ...prev, subEvent: '' }));
      }
    }
  }, [filters.event, subEvents]);

  async function fetchEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('id, title')
      .order('title');
    
    if (error) {
      console.error('Error fetching events:', error);
    } else {
      setEvents(data || []);
    }
  }

  async function fetchSubEvents() {
    const { data, error } = await supabase
      .from('sub_events')
      .select('id, title, event_id')
      .order('title');
    
    if (error) {
      console.error('Error fetching sub-events:', error);
    } else {
      setSubEvents(data || []);
    }
  }

  async function fetchPlayers() {
    setLoading(true);
    
    // Start with a basic query
    let query = supabase.from('players').select('*');

    // Apply basic filters
    if (filters.state) {
      query = query.eq('state', filters.state);
    }
    if (filters.gender) {
      query = query.eq('gender', filters.gender);
    }
    if (filters.weight) {
      query = query.eq('weight', parseFloat(filters.weight));
    }
    
    // If there's a search term, apply it to first_name or last_name
    if (searchTerm) {
      query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`);
    }

    // Execute the query
    const { data: allPlayers, error } = await query.order('first_name');

    if (error) {
      console.error('Error fetching players:', error);
      setLoading(false);
      return;
    }
    
    // If event or sub-event filters are applied, we need additional filtering
    let filteredPlayers = allPlayers || [];
    
    if (filters.event) {
      // Get players participating in the selected event
      const { data: eventParticipants } = await supabase
        .from('event_participants')
        .select('player_id')
        .eq('event_id', filters.event);
      
      if (eventParticipants) {
        const eventPlayerIds = (eventParticipants as EventParticipant[]).map(p => p.player_id);
        filteredPlayers = filteredPlayers.filter(player => 
          eventPlayerIds.includes(player.id)
        );
      }
    }
    
    if (filters.subEvent) {
      // Get players participating in the selected sub-event
      const { data: subEventParticipants } = await supabase
        .from('sub_event_participants')
        .select('player_id')
        .eq('sub_event_id', filters.subEvent);
      
      if (subEventParticipants) {
        const subEventPlayerIds = (subEventParticipants as SubEventParticipant[]).map(p => p.player_id);
        filteredPlayers = filteredPlayers.filter(player => 
          subEventPlayerIds.includes(player.id)
        );
      }
    }
    
    setPlayers(filteredPlayers);
    
    // Extract unique states and weights for filters
    if (!filters.state && !filters.gender && !filters.weight && !filters.event && !filters.subEvent) {
      const uniqueStates = Array.from(new Set((allPlayers || []).map((player: Player) => player.state).filter(Boolean)));
      setStates(uniqueStates as string[]);
      
      const uniqueWeights = Array.from(new Set((allPlayers || []).map((player: Player) => player.weight).filter(Boolean)));
      setWeights(uniqueWeights as number[]);
    }
    
    setLoading(false);
  }

  function handleFilterChange(key: keyof typeof filters, value: string) {
    setFilters(prev => ({
      ...prev,
      [key]: value === "all" ? "" : value
    }));
  }

  function resetFilters() {
    setFilters({
      state: '',
      gender: '',
      weight: '',
      event: '',
      subEvent: ''
    });
    setSearchTerm('');
  }
  
  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchPlayers();
  }

  // Function to get initials from a name
  function getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  // Function to get a color based on a string (for consistent avatar colors)
  function getColorFromString(str: string): string {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-pink-500', 'bg-purple-500', 'bg-red-500',
      'bg-indigo-500', 'bg-orange-500'
    ];
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-800 rounded-lg shadow-lg p-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Player Directory</h1>
            <p className="mt-2 text-blue-100">
              Browse and filter registered Kurash players in the system
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <Link href="/players/event-applications">
              <Button variant="secondary" className="font-medium">
                <Calendar className="mr-2 h-4 w-4" />
                Event Applications
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Search and filter bar */}
        <div className="mt-6 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
              <Input
                placeholder="Search by player name..."
                className="bg-transparent border-white/20 pl-10 text-white placeholder:text-gray-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit" variant="secondary">
              Search
            </Button>
            <Button 
              type="button" 
              variant={isFiltersExpanded ? "default" : "outline"} 
              className={isFiltersExpanded ? "bg-white text-blue-800" : "border-white/20 text-white"} 
              onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="ml-2 bg-blue-200 text-blue-800 hover:bg-blue-200">{activeFilterCount}</Badge>
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Filters Panel */}
      {isFiltersExpanded && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center text-gray-800">
              <Filter className="mr-2 h-5 w-5 text-blue-600" />
              Advanced Filters
            </h2>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-gray-500 hover:text-gray-700">
              Reset All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <div>
              <Label htmlFor="state-filter" className="flex items-center text-gray-700">
                <MapPin className="mr-2 h-4 w-4 text-blue-600" />
                State
              </Label>
              <Select 
                value={filters.state || "all"} 
                onValueChange={(value) => handleFilterChange('state', value)}
              >
                <SelectTrigger id="state-filter" className="mt-1 bg-gray-50">
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {states.map(state => (
                    <SelectItem key={`state-${state}`} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="gender-filter" className="flex items-center text-gray-700">
                <Users className="mr-2 h-4 w-4 text-blue-600" />
                Gender
              </Label>
              <Select 
                value={filters.gender || "all"} 
                onValueChange={(value) => handleFilterChange('gender', value)}
              >
                <SelectTrigger id="gender-filter" className="mt-1 bg-gray-50">
                  <SelectValue placeholder="All Genders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="weight-filter" className="flex items-center text-gray-700">
                <Weight className="mr-2 h-4 w-4 text-blue-600" />
                Weight
              </Label>
              <Select 
                value={filters.weight || "all"} 
                onValueChange={(value) => handleFilterChange('weight', value)}
              >
                <SelectTrigger id="weight-filter" className="mt-1 bg-gray-50">
                  <SelectValue placeholder="All Weights" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Weights</SelectItem>
                  {weights.map(weight => (
                    <SelectItem key={`weight-${weight}`} value={weight.toString()}>{weight} kg</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="event-filter" className="flex items-center text-gray-700">
                <Medal className="mr-2 h-4 w-4 text-blue-600" />
                Event
              </Label>
              <Select 
                value={filters.event || "all"} 
                onValueChange={(value) => handleFilterChange('event', value)}
              >
                <SelectTrigger id="event-filter" className="mt-1 bg-gray-50">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events.map(event => (
                    <SelectItem key={`event-${event.id}`} value={event.id}>{event.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sub-event-filter" className="flex items-center text-gray-700">
                <Award className="mr-2 h-4 w-4 text-blue-600" />
                Sub Event
              </Label>
              <Select 
                value={filters.subEvent || "all"} 
                onValueChange={(value) => handleFilterChange('subEvent', value)}
                disabled={!filters.event}
              >
                <SelectTrigger id="sub-event-filter" className="mt-1 bg-gray-50">
                  <SelectValue placeholder="All Sub Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sub Events</SelectItem>
                  {filteredSubEvents.map(subEvent => (
                    <SelectItem key={`sub-event-${subEvent.id}`} value={subEvent.id}>{subEvent.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      <div>
        {/* Results Count */}
        {!loading && (
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              {players.length === 0 ? 'No players found' : `Showing ${players.length} player${players.length !== 1 ? 's' : ''}`}
            </h2>
            
            {activeFilterCount > 0 && (
              <Badge variant="outline" className="px-3 py-1">
                {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied
              </Badge>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-3" />
            <p className="text-gray-500">Loading players...</p>
          </div>
        ) : players.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <User className="h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No players found</h3>
            <p className="text-gray-500 mt-1">Try adjusting your filters or search criteria</p>
            {activeFilterCount > 0 && (
              <Button variant="outline" className="mt-4" onClick={resetFilters}>
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {players.map((player) => {
              const initials = getInitials(player.first_name, player.last_name);
              const avatarColor = getColorFromString(player.id);
              
              return (
                <Card key={player.id} className="overflow-hidden transition-all duration-200 hover:shadow-md hover:translate-y-[-2px]">
                  <div className="flex p-6">
                    <div className={`flex-shrink-0 w-16 h-16 ${avatarColor} rounded-full flex items-center justify-center text-white text-xl font-bold mr-4`}>
                      {initials}
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-xl font-semibold mb-1 text-gray-900">{player.first_name} {player.last_name}</h3>
                      <div className="space-y-1.5 text-sm text-gray-600">
                        <p className="flex items-center">
                          <span className="inline-block w-4 h-4 mr-2 text-blue-600">
                            <MapPin className="h-4 w-4" />
                          </span>
                          {player.state || 'No state'}
                        </p>
                        <p className="flex items-center">
                          <span className="inline-block w-4 h-4 mr-2 text-blue-600">
                            <Users className="h-4 w-4" />
                          </span>
                          {player.gender || 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-gray-500">Association</p>
                        <p className="font-medium text-gray-900 mt-0.5">{player.registered_association || 'None'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Weight</p>
                        <p className="font-medium text-gray-900 mt-0.5">{player.weight ? `${player.weight} kg` : 'Not set'}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}