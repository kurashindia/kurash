'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import SummaryResults from './SummaryResults';
import ClubbedResults from './ClubbedResults';
import SubEvents from './SubEvents';

interface Player {
  id: string;
  name: string;
  association: string;
  gender: string;
  weight_category: string;
}

interface Pool {
  name: string;
  groups: {
    name: string;
    players: Player[];
  }[];
}

interface MatchResult {
  id: string;
  player1_id: string;
  player2_id: string;
  winner_id: string;
  match_stage: string;
}

interface KnockoutMatch {
  id: string;
  player1?: Player;
  player2?: Player;
  winner_id?: string;
  stage: string;
}

interface SummaryResult {
  id: string;
  group_name: string;
  player_id: string;
  result_type: 'pool' | 'final';
  position: 'winner' | 'runner_up' | 'bronze' | 'semi_finalist' | 'participant';
  player?: Player;
}

interface ClubbedResult {
  id: string;
  player_id: string;
  rank: string;
  remarks: string;
  player?: Player;
}

export function EventMatchPlannerPage() {
  const params = useParams();
  const [event, setEvent] = useState<any>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [selectedWinners, setSelectedWinners] = useState<Record<string, string>>({});
  const [poolKnockoutMatches, setPoolKnockoutMatches] = useState<Record<string, KnockoutMatch[]>>({});
  const [finalMatch, setFinalMatch] = useState<KnockoutMatch | null>(null);
  const [thirdPlaceSelections, setThirdPlaceSelections] = useState<Record<string, string>>({});
  const [summaryResults, setSummaryResults] = useState<SummaryResult[]>([]);
  const [clubbedResults, setClubbedResults] = useState<ClubbedResult[]>([]);

  useEffect(() => {
    fetchEventAndPlayers();
    fetchMatchResults();
  }, []);

  async function fetchEventAndPlayers() {
    if (!params.id) return;

    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', params.id)
      .single();

    if (eventError) {
      console.error('Error fetching event:', eventError);
      return;
    }

    setEvent(eventData);

    const { data: playersData, error: playersError } = await supabase
      .from('event_participants')
      .select('*')
      .eq('event_id', params.id)
      .order('name');

    if (playersError) {
      console.error('Error fetching players:', playersError);
      return;
    }

    setPlayers(playersData || []);
    generatePools(playersData || []);
    setLoading(false);
    
    // After setting players, fetch results that depend on player data
    await fetchResults();
  }

  async function fetchMatchResults() {
    if (!params.id) return;

    const { data, error } = await supabase
      .from('match_results')
      .select('*')
      .eq('event_id', params.id);

    if (error) {
      console.error('Error fetching match results:', error);
      return;
    }

    setMatchResults(data || []);
    
    // After loading match results, organize knockout stages
    if (data && data.length > 0) {
      generateKnockoutMatches();
    }
  }

  async function saveMatchResult(groupName: string, player1Id: string, player2Id: string, winnerId: string) {
    if (!params.id) return;

    const { data, error } = await supabase
      .from('match_results')
      .insert([{
        event_id: params.id,
        player1_id: player1Id,
        player2_id: player2Id,
        winner_id: winnerId,
        match_stage: `${groupName}`
      }])
      .select();

    if (error) {
      console.error('Error saving match result:', error);
      return;
    }

    setMatchResults([...matchResults, ...(data || [])]);
    
    // After saving a match result, reorganize knockout stages
    generateKnockoutMatches();
  }

  function generatePools(players: Player[]) {
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    const midPoint = Math.ceil(shuffledPlayers.length / 2);
    const poolAPlayers = shuffledPlayers.slice(0, midPoint);
    const poolBPlayers = shuffledPlayers.slice(midPoint);

    const poolA = createPoolGroups(poolAPlayers, 'A');
    const poolB = createPoolGroups(poolBPlayers, 'B');

    setPools([poolA, poolB]);
  }

  function createPoolGroups(players: Player[], poolName: string): Pool {
    const groups = [];
    let currentPlayers = [...players];
    let groupIndex = 0;
    
    // Get pool number for hierarchical naming (A=1, B=2)
    const poolNumber = poolName === 'A' ? 1 : 2;

    while (currentPlayers.length > 0) {
      // Create hierarchical group name (e.g., 1.1, 1.2 for Pool A; 2.1, 2.2 for Pool B)
      const groupName = `${poolNumber}.${groupIndex + 1}`;
      
      const group = {
        name: groupName,
        players: [] as Player[]
      };

      group.players.push(currentPlayers[0]);
      currentPlayers = currentPlayers.slice(1);

      if (currentPlayers.length > 0) {
        const differentStatePlayerIndex = currentPlayers.findIndex(
          p => p.association !== group.players[0].association
        );

        if (differentStatePlayerIndex !== -1) {
          group.players.push(currentPlayers[differentStatePlayerIndex]);
          currentPlayers = currentPlayers.filter((_, i) => i !== differentStatePlayerIndex);
        }
      }

      groups.push(group);
      groupIndex++;
    }

    return {
      name: `Pool ${poolName}`,
      groups
    };
  }

  function handleWinnerSelection(groupId: string, winnerId: string) {
    setSelectedWinners(prev => ({ ...prev, [groupId]: winnerId }));
  }

  async function handleSaveWinner(pool: string, group: string, players: Player[]) {
    const groupId = `${pool}-${group}`;
    const winnerId = selectedWinners[groupId];
    
    if (!winnerId || players.length < 2) return;

    await saveMatchResult(
      groupId,
      players[0].id,
      players[1].id,
      winnerId
    );
  }

  function getMatchResult(pool: string, groupName: string) {
    // Create the match stage ID using the hierarchical format
    const matchStageId = `${pool}-${groupName}`;
    return matchResults.find(result => result.match_stage === matchStageId);
  }

  // New functions for knockout stages
  
  function generateKnockoutMatches() {
    const poolAMatches: KnockoutMatch[] = [];
    const poolBMatches: KnockoutMatch[] = [];
    
    // Get group winners for Pool A
    const poolAWinners = getPoolWinners('Pool A');
    
    // Get group winners for Pool B  
    const poolBWinners = getPoolWinners('Pool B');
    
    // Recursive function to create matches for a pool until we have a winner
    function createKnockoutMatchesForPool(
      poolPlayers: Player[], 
      poolName: string,
      matchesArray: KnockoutMatch[]
    ) {
      if (poolPlayers.length <= 1) {
        return; // We have a winner or no players
      }
      
      // For odd number of players, the first player gets a bye to the next round
      const remainingPlayers = [...poolPlayers];
      const nextRoundPlayers: Player[] = [];
      
      // Keep track of which round we're in
      const roundIndex = matchesArray.length > 0 ? 
        Math.floor(matchesArray.length / Math.ceil(poolPlayers.length / 2)) + 1 : 1;
      
      // If odd number of players, first player gets a bye
      if (remainingPlayers.length % 2 !== 0) {
        nextRoundPlayers.push(remainingPlayers.shift()!);
      }
      
      // Create matches for this round
      while (remainingPlayers.length > 0) {
        const player1 = remainingPlayers.shift();
        const player2 = remainingPlayers.shift();
        
        if (player1 && player2) {
          // Use pool number for hierarchical naming (A=1, B=2)
          const poolNumber = poolName === 'A' ? 1 : 2;
          const matchId = `knockout-${poolNumber}.${roundIndex}-match${matchesArray.length}`;
          
          const existingResult = matchResults.find(r => r.match_stage === matchId);
          
          const match: KnockoutMatch = {
            id: matchId,
            player1,
            player2,
            winner_id: existingResult?.winner_id,
            stage: `Round ${roundIndex} Match ${matchesArray.length + 1}`
          };
          
          matchesArray.push(match);
          
          // If we have a winner for this match, add them to the next round
          if (existingResult?.winner_id) {
            const winner = players.find(p => p.id === existingResult.winner_id);
            if (winner) {
              nextRoundPlayers.push(winner);
            }
          }
        }
      }
      
      // If we have players for the next round, continue creating matches
      if (nextRoundPlayers.length > 1) {
        createKnockoutMatchesForPool(nextRoundPlayers, poolName, matchesArray);
      }
    }
    
    // Create knockout matches for each pool
    createKnockoutMatchesForPool(poolAWinners, 'A', poolAMatches);
    createKnockoutMatchesForPool(poolBWinners, 'B', poolBMatches);
    
    // Update state with knockout matches
    setPoolKnockoutMatches({
      'Pool A': poolAMatches,
      'Pool B': poolBMatches
    });
    
    // Create final match between Pool A winner and Pool B winner
    const poolAFinalWinner = getPoolFinalWinner('Pool A');
    const poolBFinalWinner = getPoolFinalWinner('Pool B');
    
    if (poolAFinalWinner && poolBFinalWinner) {
      const existingFinalResult = matchResults.find(r => r.match_stage === 'final');
      
      setFinalMatch({
        id: 'final',
        player1: poolAFinalWinner,
        player2: poolBFinalWinner,
        winner_id: existingFinalResult?.winner_id,
        stage: 'Final'
      });
    }
  }
  
  function getPoolWinners(poolName: string): Player[] {
    const pool = pools.find(p => p.name === poolName);
    if (!pool) return [];
    
    return pool.groups
      .map(group => {
        const matchResult = getMatchResult(poolName, group.name);
        if (matchResult) {
          return players.find(p => p.id === matchResult.winner_id);
        } else if (group.players.length === 1) {
          // Auto-qualified player
          return group.players[0];
        }
        return undefined;
      })
      .filter((player): player is Player => player !== undefined);
  }
  
  function getPoolFinalWinner(poolName: string): Player | undefined {
    const poolWinners = getPoolWinners(poolName);
    if (poolWinners.length === 0) return undefined;
    
    const knockoutMatches = poolKnockoutMatches[poolName] || [];
    if (knockoutMatches.length === 0) {
      // If there are no knockout matches but we have a winner (only one player in the pool)
      return poolWinners.length === 1 ? poolWinners[0] : undefined;
    }
    
    // Find the last knockout match with a winner
    const completedMatches = knockoutMatches.filter(m => m.winner_id);
    if (completedMatches.length === 0) return undefined;
    
    // In a properly structured tournament, the last match winner is the pool winner
    const finalRoundMatches = knockoutMatches.filter(match => {
      // Count how many times this player appears in other matches as player1 or player2
      const player1AppearanceCount = knockoutMatches.filter(m => 
        m.player1?.id === match.player1?.id || m.player2?.id === match.player1?.id
      ).length;
      
      const player2AppearanceCount = knockoutMatches.filter(m => 
        m.player1?.id === match.player2?.id || m.player2?.id === match.player2?.id
      ).length;
      
      // If both players only appear once, this is likely a first-round match
      // If either player appears more than once, this is a later-round match
      return player1AppearanceCount > 1 || player2AppearanceCount > 1;
    });
    
    if (finalRoundMatches.length > 0) {
      // Use the last match with a winner from the final round
      const finalMatch = finalRoundMatches.find(m => m.winner_id);
      if (finalMatch?.winner_id) {
        return players.find(p => p.id === finalMatch.winner_id);
      }
    }
    
    // Fallback: use the last completed match's winner
    const lastCompletedMatch = completedMatches[completedMatches.length - 1];
    return players.find(p => p.id === lastCompletedMatch.winner_id);
  }
  
  async function handleKnockoutWinnerSelection(matchId: string, winnerId: string, player1Id: string, player2Id: string) {
    await saveMatchResult(matchId, player1Id, player2Id, winnerId);
  }
  
  async function handleFinalWinnerSelection(winnerId: string) {
    if (!finalMatch || !finalMatch.player1 || !finalMatch.player2) return;
    
    await saveMatchResult('final', finalMatch.player1.id, finalMatch.player2.id, winnerId);
  }
  
  function handleThirdPlaceSelection(pool: string, playerId: string) {
    setThirdPlaceSelections(prev => ({ ...prev, [pool]: playerId }));
  }
  
  async function saveThirdPlace(pool: string, playerId: string) {
    if (!params.id) return;
    
    const { data, error } = await supabase
      .from('match_results')
      .insert([{
        event_id: params.id,
        player1_id: playerId,
        player2_id: playerId, // Same as player1 since it's a manual selection
        winner_id: playerId,
        match_stage: `third-place-${pool}`
      }])
      .select();
      
    if (error) {
      console.error('Error saving third place:', error);
      return;
    }
    
    setMatchResults([...matchResults, ...(data || [])]);
  }
  
  function getThirdPlaceResult(pool: string) {
    return matchResults.find(result => result.match_stage === `third-place-${pool}`);
  }

  async function fetchResults() {
    if (!params.id) return;
    
    // Fetch summary results
    const { data: summaryData, error: summaryError } = await supabase
      .from('summary_results')
      .select('*')
      .eq('event_id', params.id);
      
    if (summaryError) {
      console.error('Error fetching summary results:', summaryError);
    } else {
      // Attach player data to each result
      const resultsWithPlayers = await Promise.all((summaryData || []).map(async (result) => {
        const player = players.find(p => p.id === result.player_id);
        return { ...result, player };
      }));
      
      setSummaryResults(resultsWithPlayers);
    }
    
    // Fetch clubbed results
    const { data: clubbedData, error: clubbedError } = await supabase
      .from('clubbed_results')
      .select('*')
      .eq('event_id', params.id);
      
    if (clubbedError) {
      console.error('Error fetching clubbed results:', clubbedError);
    } else {
      // Attach player data to each result
      const resultsWithPlayers = await Promise.all((clubbedData || []).map(async (result) => {
        const player = players.find(p => p.id === result.player_id);
        return { ...result, player };
      }));
      
      setClubbedResults(resultsWithPlayers);
    }
  }

  async function saveSummaryResult(groupName: string, playerId: string, resultType: 'pool' | 'final', position: 'winner' | 'runner_up' | 'bronze' | 'semi_finalist' | 'participant') {
    if (!params.id) return;
    
    const { data, error } = await supabase
      .from('summary_results')
      .insert([{
        event_id: params.id,
        group_name: groupName,
        player_id: playerId,
        result_type: resultType,
        position: position
      }])
      .select();
      
    if (error) {
      console.error('Error saving summary result:', error);
      return;
    }
    
    // Refresh the results
    await fetchResults();
  }

  async function saveClubbedResult(playerId: string, rank: string, remarks: string) {
    if (!params.id) return;
    
    const { data, error } = await supabase
      .from('clubbed_results')
      .insert([{
        event_id: params.id,
        player_id: playerId,
        rank: rank,
        remarks: remarks
      }])
      .select();
      
    if (error) {
      console.error('Error saving clubbed result:', error);
      return;
    }
    
    // Refresh the results
    await fetchResults();
  }

  if (loading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">{event?.title}</h2>
        <div className="flex gap-2">
          <Link href="/events">
            <Button variant="outline">Back to Events</Button>
          </Link>
        </div>
      </div>

      <Card className="p-8 bg-white border border-gray-200 rounded-xl shadow-md">
        <div className="flex flex-col gap-4">
          <h3 className="text-xl font-semibold mb-2 text-gray-800">Event Details</h3>
          <div className="space-y-2 text-base text-gray-700">
            <p><span className="font-semibold">Weight Category:</span> {event?.weight_category}</p>
            <p><span className="font-semibold">Gender:</span> {event?.gender}</p>
            <p><span className="font-semibold">Date:</span> {event?.date ? new Date(event.date).toLocaleDateString() : 'TBD'}</p>
          </div>
        </div>
      </Card>

      {/* Sub-Events Section */}
      <h2 className="text-xl font-bold mb-4">Sub-Event Management</h2>
      {event && (
        <SubEvents 
          eventId={params.id as string} 
          eventTitle={event.title} 
          weightCategory={event.weight_category} 
        />
      )}
    </div>
  );
} 