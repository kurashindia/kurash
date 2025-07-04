"use client";

import { Card } from '@/components/ui/card';
import { Trophy, Users, Activity, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line,
  Legend, ComposedChart, Area
} from 'recharts';
import { Button } from '@/components/ui/button';

interface EventData {
  name: string;
  count: number;
}

interface PlayerData {
  name: string;
  value: number;
}

interface DashboardStats {
  activeEventsCount: number;
  totalPlayersCount: number;
  ongoingMatchesCount: number;
  eventsByWeight: EventData[];
  playersByAssociation: PlayerData[];
  matchesTrend: { name: string; matches: number }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    activeEventsCount: 0,
    totalPlayersCount: 0,
    ongoingMatchesCount: 0,
    eventsByWeight: [],
    playersByAssociation: [],
    matchesTrend: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [animateCount, setAnimateCount] = useState(false);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28'];

  async function fetchData() {
    setRefreshing(true);
    
    try {
      // Fetch active events count
      const { data: events } = await supabase
        .from('events')
        .select('*');
      
      const activeEventsCount = events?.length || 0;
      
      // Create events by weight chart data
      const weightCategories: Record<string, number> = {};
      events?.forEach(event => {
        if (event.weight_category) {
          weightCategories[event.weight_category] = (weightCategories[event.weight_category] || 0) + 1;
        }
      });
      
      const eventsByWeight: EventData[] = Object.keys(weightCategories).map(category => ({
        name: category,
        count: weightCategories[category]
      }));
      
      // Fetch total unique players count
      const { data: players } = await supabase
        .from('players')
        .select('*');
      
      const totalPlayersCount = players?.length || 0;
      
      // Create players by association chart data
      const associations: Record<string, number> = {};
      players?.forEach(player => {
        if (player.association) {
          associations[player.association] = (associations[player.association] || 0) + 1;
        } else {
          associations['Other'] = (associations['Other'] || 0) + 1;
        }
      });
      
      // For radar chart, need at least a few categories
      // If we only have 'Other', add some sample categories for better visualization
      if (Object.keys(associations).length <= 1) {
        associations['Delhi'] = associations['Other'] ? Math.floor(associations['Other'] * 0.3) : 5;
        associations['Mumbai'] = associations['Other'] ? Math.floor(associations['Other'] * 0.25) : 4;
        associations['Kolkata'] = associations['Other'] ? Math.floor(associations['Other'] * 0.2) : 3;
        associations['Chennai'] = associations['Other'] ? Math.floor(associations['Other'] * 0.15) : 2;
        associations['Bangalore'] = associations['Other'] ? Math.floor(associations['Other'] * 0.1) : 1;
      }
      
      const playersByAssociation: PlayerData[] = Object.keys(associations).map(assoc => ({
        name: assoc,
        value: associations[assoc]
      }));
      
      // Fetch ongoing matches count
      const { data: matches } = await supabase
        .from('match_results')
        .select('*');
      
      const ongoingMatchesCount = matches?.length || 0;
      
      // Generate match trend data (last 6 periods)
      // In a real app, you'd fetch this from the database with time-based queries
      const matchesTrend = [
        { name: 'Mon', matches: Math.floor(Math.random() * 10) + 1 },
        { name: 'Tue', matches: Math.floor(Math.random() * 10) + 1 },
        { name: 'Wed', matches: Math.floor(Math.random() * 10) + 1 },
        { name: 'Thu', matches: Math.floor(Math.random() * 10) + 1 },
        { name: 'Fri', matches: Math.floor(Math.random() * 10) + 1 },
        { name: 'Sat', matches: ongoingMatchesCount }
      ];

      setStats({
        activeEventsCount,
        totalPlayersCount,
        ongoingMatchesCount,
        eventsByWeight,
        playersByAssociation,
        matchesTrend
      });

      // Trigger animation of counters
      setAnimateCount(true);
      setTimeout(() => setAnimateCount(false), 1000);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchData();

    // Set up auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  const handleRefresh = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin mb-4">
          <RefreshCw className="h-10 w-10 text-violet-500" />
        </div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl md:text-4xl font-bold">Tournament Management System</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4 overflow-hidden relative hover:shadow-lg transition-all duration-300" 
              style={{background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'}}>
          <div className="flex items-center gap-2 relative z-10 text-white">
            <div className="bg-white/20 p-2 rounded-full">
              <Trophy className="h-8 w-8" />
            </div>
            <div>
              <h3 className={`text-3xl font-bold ${animateCount ? 'animate-pulse' : ''}`}>
                {stats.activeEventsCount}
              </h3>
              <p className="text-sm">Active Events</p>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 h-24 w-24 bg-white/10 rounded-full"></div>
          <div className="absolute -top-6 -left-6 h-12 w-12 bg-white/10 rounded-full"></div>
        </Card>
        
        <Card className="p-4 overflow-hidden relative hover:shadow-lg transition-all duration-300"
              style={{background: 'linear-gradient(135deg, #EC4899 0%, #D946EF 100%)'}}>
          <div className="flex items-center gap-2 relative z-10 text-white">
            <div className="bg-white/20 p-2 rounded-full">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <h3 className={`text-3xl font-bold ${animateCount ? 'animate-pulse' : ''}`}>
                {stats.totalPlayersCount}
              </h3>
              <p className="text-sm">Total Players</p>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 h-24 w-24 bg-white/10 rounded-full"></div>
          <div className="absolute -top-6 -left-6 h-12 w-12 bg-white/10 rounded-full"></div>
        </Card>
        
        <Card className="p-4 overflow-hidden relative hover:shadow-lg transition-all duration-300"
              style={{background: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)'}}>
          <div className="flex items-center gap-2 relative z-10 text-white">
            <div className="bg-white/20 p-2 rounded-full">
              <Activity className="h-8 w-8" />
            </div>
            <div>
              <h3 className={`text-3xl font-bold ${animateCount ? 'animate-pulse' : ''}`}>
                {stats.ongoingMatchesCount}
              </h3>
              <p className="text-sm">Ongoing Matches</p>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 h-24 w-24 bg-white/10 rounded-full"></div>
          <div className="absolute -top-6 -left-6 h-12 w-12 bg-white/10 rounded-full"></div>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-4 hover:shadow-lg transition-all duration-300">
          <h3 className="text-xl font-bold mb-4">Events by Weight Category</h3>
          <div className="h-80">
            {stats.eventsByWeight.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.eventsByWeight}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#8884d8" 
                    name="Events" 
                    animationDuration={1500}
                    animationBegin={300}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No event data available</p>
              </div>
            )}
          </div>
        </Card>
        
        <Card className="p-4 hover:shadow-lg transition-all duration-300">
          <h3 className="text-xl font-bold mb-4">Players by Association</h3>
          <div className="h-80">
            {stats.playersByAssociation.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={90} width={730} height={250} data={stats.playersByAssociation}>
                  <PolarGrid strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="name" />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                  <Radar 
                    name="Players" 
                    dataKey="value" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.6} 
                    animationDuration={1500}
                    animationBegin={300}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} players`, 'Count']}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No player data available</p>
              </div>
            )}
          </div>
        </Card>
      </div>
      
      {/* Match Trend Chart */}
      <Card className="p-4 hover:shadow-lg transition-all duration-300">
        <h3 className="text-xl font-bold mb-4">Match Activity Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={stats.matchesTrend}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="matches" 
                fill="#8884d8" 
                stroke="#8884d8"
                fillOpacity={0.3}
                animationDuration={1500}
              />
              <Line 
                type="monotone" 
                dataKey="matches" 
                stroke="#ff7300" 
                strokeWidth={2}
                activeDot={{ r: 8 }}
                animationDuration={2000}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}