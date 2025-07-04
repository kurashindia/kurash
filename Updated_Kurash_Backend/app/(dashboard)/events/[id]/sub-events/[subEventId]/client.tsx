'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

interface PlayerData {
  id: string;
  name: string;
  association: string;
  weight: number;
  birth_date?: string;
}

interface SubEventParticipantData {
  id: string;
  player_id: string;
  sub_event_id: string;
  player: PlayerData;
}

interface SubEvent {
  id: string;
  event_id: string;
  title: string;
  min_weight: number;
  max_weight: number;
  created_at: string;
  dob_range?: string;
}

interface Group {
  name: string;
  players: PlayerData[];
}

interface Pool {
  name: string;
  groups: Group[];
}

interface KnockoutMatch {
  id: string;
  player1?: PlayerData;
  player2?: PlayerData;
  winner_id?: string;
  stage: string;
}

interface SummaryResult {
  id: string;
  group_name: string;
  player_id: string;
  result_type: 'pool' | 'final';
  position: 'winner' | 'runner_up' | 'bronze' | 'semi_finalist' | 'participant';
  player?: PlayerData;
}

interface ClubbedResult {
  id: string;
  player_id: string;
  rank: string;
  remarks: string;
  player?: PlayerData;
}

interface Props {
  eventId: string;
  subEventId: string;
}

// Type alias for Player to maintain backward compatibility
type Player = PlayerData;

// Type guard to check if the data matches SubEventParticipantData
function isSubEventParticipantData(data: any): data is SubEventParticipantData {
  return data && 
    typeof data.id === 'string' && 
    typeof data.player_id === 'string' && 
    typeof data.sub_event_id === 'string' && 
    data.player && 
    typeof data.player.id === 'string';
}

export function SubEventClient({ eventId, subEventId }: Props) {
  const [subEvent, setSubEvent] = useState<SubEvent | null>(null);
  const [parentEvent, setParentEvent] = useState<any>(null);
  const [participants, setParticipants] = useState<PlayerData[]>([]);
  const [eligiblePlayers, setEligiblePlayers] = useState<PlayerData[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [pools, setPools] = useState<Pool[]>([]);
  const [matchResults, setMatchResults] = useState<any[]>([]);
  const [selectedWinners, setSelectedWinners] = useState<Record<string, string>>({});
  const [poolKnockoutMatches, setPoolKnockoutMatches] = useState<Record<string, KnockoutMatch[]>>({});
  const [finalMatch, setFinalMatch] = useState<KnockoutMatch | null>(null);
  const [thirdPlaceSelections, setThirdPlaceSelections] = useState<Record<string, string>>({});
  const [summaryResults, setSummaryResults] = useState<SummaryResult[]>([]);
  const [clubbedResults, setClubbedResults] = useState<ClubbedResult[]>([]);
  
  // Form states
  const [summaryFormData, setSummaryFormData] = useState({
    groupName: '',
    playerId: '',
    resultType: '',
    position: ''
  });
  
  const [clubbedFormData, setClubbedFormData] = useState({
    playerId: '',
    rank: '',
    remarks: ''
  });

  useEffect(() => {
    fetchSubEventAndParticipants();
    fetchEligiblePlayers();
    fetchMatchResults();
  }, [eventId, subEventId]);

  useEffect(() => {
    // After fetching sub-event and participants, check for approved applications
    async function checkAndAddApprovedPlayers() {
      if (!subEvent || !parentEvent) return;

      try {
        // Fetch approved sub-event applications for this specific sub-event
        const { data: approvedApplications, error: applicationError } = await supabase
          .from('sub_event_applications')
          .select('player_id')
          .eq('sub_event_id', subEventId)
          .eq('status', 'accepted');

        if (applicationError) {
          console.error('Error fetching approved applications:', applicationError);
          return;
        }

        // Get the list of approved player IDs
        const approvedPlayerIds = approvedApplications?.map(app => app.player_id) || [];

        // Check which of these players are not already participants
        const newParticipantIds = approvedPlayerIds.filter(
          playerId => !participants.some(p => p.id === playerId)
        );

        // Add new participants
        if (newParticipantIds.length > 0) {
          const participantInserts = newParticipantIds.map(playerId => ({
            sub_event_id: subEventId,
            player_id: playerId
          }));

          const { error: insertError } = await supabase
            .from('sub_event_participants')
            .insert(participantInserts);

          if (insertError) {
            console.error('Error adding new participants:', insertError);
          } else {
            // Refresh participants
            fetchSubEventAndParticipants();
          }
        }
      } catch (error) {
        console.error('Error checking approved players:', error);
      }
    }

    checkAndAddApprovedPlayers();
  }, [subEventId, parentEvent, subEvent, participants.length]);

  useEffect(() => {
    if (participants.length > 0) {
      generatePools(participants);
      // Also regenerate knockout matches when participants change
      generateKnockoutMatches();
    }
  }, [participants]);

  useEffect(() => {
    // Regenerate knockout matches when match results change
    if (matchResults.length > 0 && participants.length > 0) {
      generateKnockoutMatches();
    }
  }, [matchResults, participants]);

  useEffect(() => {
  const poolAFinalWinner = getPoolFinalWinner('Pool A');
  const poolBFinalWinner = getPoolFinalWinner('Pool B');

  if (poolAFinalWinner && poolBFinalWinner) {
    const existingFinalResult = matchResults.find(r => r.match_stage === 'final');

    setFinalMatch({
      id: 'final',
      player1: poolAFinalWinner,
      player2: poolBFinalWinner,
      winner_id: existingFinalResult?.winner_id,
      stage: 'Championship Final'
    });
  }
}, [poolKnockoutMatches, matchResults]);


  async function fetchMatchResults() {
    try {
      const { data, error } = await supabase
        .from('sub_event_match_results')
        .select('*')
        .eq('sub_event_id', subEventId);

      if (error) {
        console.error('Error fetching match results:', error);
        return;
      }

      setMatchResults(data || []);
      
      // After loading match results, organize knockout stages
      if (data && data.length > 0) {
        generateKnockoutMatches();
      }
      
      // Also fetch additional results after loading matches
      await fetchResults();
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  async function fetchResults() {
  try {
    // Fetch summary results with joined player
    const { data: summaryData, error: summaryError } = await supabase
      .from('sub_event_summary_results')
      .select(`
        *,
        player:players (
          id,
          first_name,
          last_name,
          registered_association
        )
      `)
      .eq('sub_event_id', subEventId);

    if (summaryError) {
      console.error('Error fetching summary results:', summaryError);
    } else {
      const resultsWithPlayers = (summaryData || []).map(result => {
        const name = `${result.player?.first_name || ''} ${result.player?.last_name || ''}`.trim();
        const association = result.player?.registered_association || 'Unknown';
        return {
          ...result,
          player: {
            id: result.player?.id,
            name,
            association
          }
        };
      });

      setSummaryResults(resultsWithPlayers);
    }

    // Fetch clubbed results with joined player
    const { data: clubbedData, error: clubbedError } = await supabase
      .from('sub_event_clubbed_results')
      .select(`
        *,
        player:players (
          id,
          first_name,
          last_name,
          registered_association
        )
      `)
      .eq('sub_event_id', subEventId);

    if (clubbedError) {
      console.error('Error fetching clubbed results:', clubbedError);
    } else {
      const resultsWithPlayers = (clubbedData || []).map(result => {
        const name = `${result.player?.first_name || ''} ${result.player?.last_name || ''}`.trim();
        const association = result.player?.registered_association || 'Unknown';
        return {
          ...result,
          player: {
            id: result.player?.id,
            name,
            association
          }
        };
      });

      setClubbedResults(resultsWithPlayers);
    }
  } catch (error) {
    console.error('Error fetching results:', error);
  }
}


  async function fetchSubEventAndParticipants() {
    setLoading(true);
    try {
      // Fetch sub-event details
      const { data: subEventData, error: subEventError } = await supabase
        .from('sub_events')
        .select('*')
        .eq('id', subEventId)
        .single();

      if (subEventError) {
        console.error('Sub-Event Fetch Error:', {
          message: subEventError.message,
          details: subEventError,
          subEventId: subEventId
        });
        throw new Error(`Failed to fetch sub-event details: ${subEventError.message}`);
      }

      if (!subEventData) {
        throw new Error(`No sub-event found with ID: ${subEventId}`);
      }

      // Fetch parent event details
      const { data: parentEventData, error: parentEventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', subEventData.event_id)
        .single();

      if (parentEventError) {
        console.error('Parent Event Fetch Error:', {
          message: parentEventError.message,
          details: parentEventError,
          eventId: subEventData.event_id
        });
        throw new Error(`Failed to fetch parent event details: ${parentEventError.message}`);
      }

      if (!parentEventData) {
        throw new Error(`No parent event found with ID: ${subEventData.event_id}`);
      }

      // Fetch participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('sub_event_participants')
        .select(`
          id,
          player_id,
          sub_event_id,
          player:players(
            id,
            first_name,
            last_name,
            registered_association,
            weight,
            birth_date
          )
        `)
        .eq('sub_event_id', subEventId);

      if (participantsError) {
        console.error('Participants Fetch Error:', {
          message: participantsError.message,
          details: participantsError,
          subEventId: subEventId
        });
        throw new Error(`Failed to fetch participants: ${participantsError.message}`);
      }

      // Set state
      setSubEvent(subEventData);
      setParentEvent(parentEventData);

      // Transform participants data
      const formattedParticipants: Player[] = (participantsData || [])
        .map((p: any) => ({
          id: p.player?.id || '',
          name: `${p.player?.first_name || ''} ${p.player?.last_name || ''}`.trim(),
          association: p.player?.registered_association || 'Unknown',
          weight: p.player?.weight || 0,
          birth_date: p.player?.birth_date
        }));

      setParticipants(formattedParticipants);

      // Fetch additional data
      await Promise.all([
        fetchMatchResults(),
        fetchEligiblePlayers()
      ]);

    } catch (error: unknown) {
      console.error('Comprehensive Error in fetchSubEventAndParticipants:', {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        fullError: error,
        subEventId: subEventId
      });

      // More informative error message
      alert(`Failed to load sub-event details: ${error instanceof Error ? error.message : 'Unknown error'}. 
        Please check the following:
        1. Ensure the sub-event exists
        2. Check your network connection
        3. Verify database permissions`);
    } finally {
      setLoading(false);
    }
  }

  async function fetchEligiblePlayers() {
    if (!subEvent || !parentEvent) return;

    try {
      // First, get approved applications for this event
      const { data: approvedApplications, error: applicationError } = await supabase
        .from('player_event_applications')
        .select('player_id')
        .eq('event_id', parentEvent.id)
        .eq('status', 'accepted');

      if (applicationError) {
        console.error('Error fetching approved applications:', applicationError);
        return;
      }

      // Get the list of approved player IDs
      const approvedPlayerIds = approvedApplications?.map(app => app.player_id) || [];

      // Fetch eligible players based on event criteria and approved applications
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .in('id', approvedPlayerIds)
        .gte('birth_date', subEvent.dob_range 
          ? new Date(subEvent.dob_range.split(',')[0].replace('[', '')) 
          : undefined)
        .lte('birth_date', subEvent.dob_range 
          ? new Date(subEvent.dob_range.split(',')[1].replace(']', '')) 
          : undefined)
        .gte('weight', subEvent.min_weight)
        .lt('weight', subEvent.max_weight)
        .eq('gender', parentEvent.gender);

      if (error) {
        console.error('Error fetching eligible players:', error);
        return;
      }

      // Filter out players already in this sub-event
      const { data: existingParticipants, error: participantError } = await supabase
        .from('sub_event_participants')
        .select('player_id')
        .eq('sub_event_id', subEventId);

      if (participantError) {
        console.error('Error fetching existing participants:', participantError);
        return;
      }

      const existingParticipantIds = existingParticipants?.map(p => p.player_id) || [];
      
      const filteredPlayers = data?.filter(
        player => !existingParticipantIds.includes(player.id)
      ) || [];

      setEligiblePlayers(filteredPlayers);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  function generatePools(players: Player[]) {
    // Randomly shuffle players
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    
    // Split players into two pools
    const midPoint = Math.ceil(shuffledPlayers.length / 2);
    const poolAPlayers = shuffledPlayers.slice(0, midPoint);
    const poolBPlayers = shuffledPlayers.slice(midPoint);

    // Create groups within pools
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

  // New functions for knockout stages
  function generateKnockoutMatches() {
    // Get winners from each pool
    const poolAWinners = getPoolWinners('Pool A');
    const poolBWinners = getPoolWinners('Pool B');
    
    // Create knockout matches for each pool
    const poolAMatches: KnockoutMatch[] = [];
    const poolBMatches: KnockoutMatch[] = [];
    
    createKnockoutMatchesForPool(poolAWinners, 'Pool A', poolAMatches);
    createKnockoutMatchesForPool(poolBWinners, 'Pool B', poolBMatches);
    
    // Update the poolKnockoutMatches state
    setPoolKnockoutMatches({
      'Pool A': poolAMatches,
      'Pool B': poolBMatches
    });
    
    // Set up final match
    if (poolAWinners.length > 0 && poolBWinners.length > 0) {
      const poolAFinalWinner = getPoolFinalWinner('Pool A');
      const poolBFinalWinner = getPoolFinalWinner('Pool B');
      
    }
  }
  
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
        const poolNumber = poolName === 'Pool A' ? 1 : 2;
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
          const winner = participants.find(p => p.id === existingResult.winner_id);
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
  
  function getPoolWinners(poolName: string): Player[] {
    const pool = pools.find(p => p.name === poolName);
    if (!pool) return [];
    
    return pool.groups
      .map(group => {
        const matchResult = getMatchResult(poolName, group.name);
        if (matchResult) {
          return participants.find(p => p.id === matchResult.winner_id);
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
        return participants.find(p => p.id === finalMatch.winner_id);
      }
    }
    
    // Fallback: use the last completed match's winner
    const lastCompletedMatch = completedMatches[completedMatches.length - 1];
    return participants.find(p => p.id === lastCompletedMatch.winner_id);
  }
  
  function getThirdPlaceResult(pool: string) {
    return matchResults.find(result => result.match_stage === `third-place-${pool}`);
  }

  function getMatchResult(pool: string, groupName: string) {
    // Create the match stage ID using the hierarchical format
    const matchStageId = `${pool}-${groupName}`;
    return matchResults.find(result => result.match_stage === matchStageId);
  }

  async function addParticipant() {
    if (!selectedPlayerId) {
      alert('Please select a player to add');
      return;
    }

    try {
      const { error } = await supabase
        .from('sub_event_participants')
        .insert([{
          sub_event_id: subEventId,
          player_id: selectedPlayerId
        }]);

      if (error) {
        console.error('Error adding participant:', error);
        alert('Failed to add participant');
        return;
      }

      // Refresh data
      fetchSubEventAndParticipants();
      fetchEligiblePlayers();
      setSelectedPlayerId('');
    } catch (error) {
      console.error('Error:', error);
      alert('An unexpected error occurred');
    }
  }
  
  function handleWinnerSelection(groupId: string, winnerId: string) {
    setSelectedWinners(prev => ({ ...prev, [groupId]: winnerId }));
  }

  async function handleSaveWinner(pool: string, group: string, players: Player[]) {
    if (players.length < 2) return;
    
    const groupId = `${pool}-${group}`;
    const winnerId = selectedWinners[groupId];
    
    if (!winnerId) return;
    
    try {
      // Check if a result already exists for this group
      const { data: existingResults, error: fetchError } = await supabase
        .from('sub_event_match_results')
        .select('*')
        .eq('sub_event_id', subEventId)
        .eq('match_stage', groupId)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking existing match result:', fetchError);
        return;
      }
      
      if (existingResults) {
        // Update existing result
        const { error: updateError } = await supabase
          .from('sub_event_match_results')
          .update({
            player1_id: players[0].id,
            player2_id: players[1].id,
            winner_id: winnerId
          })
          .eq('id', existingResults.id);
          
        if (updateError) {
          console.error('Error updating match result:', updateError);
          return;
        }
      } else {
        // Insert new result
        const { data, error } = await supabase
          .from('sub_event_match_results')
          .insert([{
            sub_event_id: subEventId,
            player1_id: players[0].id,
            player2_id: players[1].id,
            winner_id: winnerId,
            match_stage: groupId
          }])
          .select();
          
        if (error) {
          console.error('Error saving match result:', error);
          return;
        }
        
        // Update local match results state
        setMatchResults(prev => [...prev, ...(data || [])]);
      }
      
      // Check if summary result already exists
      const { data: existingSummary, error: summaryError } = await supabase
        .from('sub_event_summary_results')
        .select('*')
        .eq('sub_event_id', subEventId)
        .eq('group_name', groupId)
        .eq('player_id', winnerId)
        .single();
      
      if (summaryError && summaryError.code !== 'PGRST116') {
        console.error('Error checking existing summary result:', summaryError);
        return;
      }
      
      // Create summary result if it doesn't exist
      if (!existingSummary) {
        await saveSummaryResult(groupId, winnerId, 'pool', 'winner');
      }
      
      // Regenerate knockout matches to update the UI
      generateKnockoutMatches();
      
      // Refresh match results
      await fetchMatchResults();
    } catch (error) {
      console.error('Error in handleSaveWinner:', error);
    }
  }
  
  async function handleKnockoutWinnerSelection(matchId: string, winnerId: string, player1Id: string, player2Id: string) {
    try {
      // Check if a result already exists
      const existingResult = matchResults.find(
        result => result.match_stage === matchId
      );
      
      if (existingResult) {
        // Update existing result
        const { error } = await supabase
          .from('sub_event_match_results')
          .update({
            winner_id: winnerId
          })
          .eq('id', existingResult.id);
          
        if (error) {
          console.error('Error updating knockout match result:', error);
          return;
        }
      } else {
        // Create new result
        const { data, error } = await supabase
          .from('sub_event_match_results')
          .insert([{
            sub_event_id: subEventId,
            player1_id: player1Id,
            player2_id: player2Id,
            winner_id: winnerId,
            match_stage: matchId
          }])
          .select();
          
        if (error) {
          console.error('Error saving knockout match result:', error);
          return;
        }
        
        // Update local state
        setMatchResults([...matchResults, ...(data || [])]);
        
        // For semifinal matches, record the loser as a semifinalist in summary results
        if (matchId.includes('knockout') && matchId.includes('Round 2')) {
          const loserId = winnerId === player1Id ? player2Id : player1Id;
          const loserPlayer = participants.find(p => p.id === loserId);
          
          if (loserPlayer) {
            // Check if this semifinalist entry already exists
            const { data: existingSemifinalist } = await supabase
              .from('sub_event_summary_results')
              .select('*')
              .eq('sub_event_id', subEventId)
              .eq('player_id', loserId)
              .eq('position', 'semi_finalist');
              
            if (!existingSemifinalist || existingSemifinalist.length === 0) {
              await saveSummaryResult(matchId, loserId, 'pool', 'semi_finalist');
            }
          }
        }
      }
      
      // Regenerate knockout matches to update the UI
      generateKnockoutMatches();
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  async function handleFinalWinnerSelection(winnerId: string) {
    if (!finalMatch || !finalMatch.player1 || !finalMatch.player2) return;
    
    try {
      // Determine winner and runner-up
      const player1Id = finalMatch.player1.id;
      const player2Id = finalMatch.player2.id;
      const runnerId = winnerId === player1Id ? player2Id : player1Id;
      
      // Save final match result
      const { data, error } = await supabase
        .from('sub_event_match_results')
        .insert([{
          sub_event_id: subEventId,
          player1_id: player1Id,
          player2_id: player2Id,
          winner_id: winnerId,
          match_stage: 'final'
        }])
        .select();
        
      if (error) {
        console.error('Error saving final match result:', error);
        return;
      }
      
      // Update local state
      setMatchResults([...matchResults, ...(data || [])]);
      
      // Update final match state
      setFinalMatch(prev => prev ? { ...prev, winner_id: winnerId } : null);
      
      // Create summary results for champion and runner-up
      await saveSummaryResult('Final', winnerId, 'final', 'winner');
      await saveSummaryResult('Final', runnerId, 'final', 'runner_up');
      
      // Optionally, create clubbed results
      const winnerPlayer = participants.find(p => p.id === winnerId);
      const runnerPlayer = participants.find(p => p.id === runnerId);
      
      if (winnerPlayer) {
        await saveClubbedResult(
          winnerId, 
          '1st', 
          `Champion - ${subEvent?.title || 'Sub Event'}`
        );
      }
      
      if (runnerPlayer) {
        await saveClubbedResult(
          runnerId, 
          '2nd', 
          `Runner-up - ${subEvent?.title || 'Sub Event'}`
        );
      }
      
      // Refresh match results to update UI
      await fetchMatchResults();
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  function handleThirdPlaceSelection(pool: string, playerId: string) {
    setThirdPlaceSelections(prev => ({ ...prev, [pool]: playerId }));
  }
  
  async function saveThirdPlace(pool: string, playerId: string) {
    try {
      const { data, error } = await supabase
        .from('sub_event_match_results')
        .insert([{
          sub_event_id: subEventId,
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
      
      // Automatically create summary result for third place
      const { data: existingSummary } = await supabase
        .from('sub_event_summary_results')
        .select('*')
        .eq('sub_event_id', subEventId)
        .eq('player_id', playerId)
        .eq('position', 'bronze');
        
      if (!existingSummary || existingSummary.length === 0) {
        await saveSummaryResult(pool, playerId, 'pool', 'bronze');
        
        // Also create clubbed result
        const player = participants.find(p => p.id === playerId);
        if (player) {
          await saveClubbedResult(
            playerId,
            '3rd',
            `Bronze medal - ${pool}`
          );
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  // Functions for saving summary and clubbed results
  async function saveSummaryResult(groupName: string, playerId: string, resultType: 'pool' | 'final', position: 'winner' | 'runner_up' | 'bronze' | 'semi_finalist' | 'participant') {
    try {
      const { data, error } = await supabase
        .from('sub_event_summary_results')
        .insert([{
          sub_event_id: subEventId,
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
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function saveClubbedResult(playerId: string, rank: string, remarks: string) {
    try {
      const { data, error } = await supabase
        .from('sub_event_clubbed_results')
        .insert([{
          sub_event_id: subEventId,
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
    } catch (error) {
      console.error('Error:', error);
    }
  }

  // Render loading spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading sub-event details...</p>
        </div>
      </div>
    );
  }

  if (!subEvent) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center p-8 bg-red-100 rounded-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Sub-Event</h2>
          <p className="text-red-800 mb-4">
            Unable to retrieve sub-event details. The event may have been deleted or is currently unavailable.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">{subEvent?.title || 'Sub Event'}</h2>
        <Link href={`/events/${eventId}`}>
          <Button variant="outline">Back to Event</Button>
        </Link>
      </div>
      
      <Card className="p-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Sub-Event Details</h3>
            <p><strong>Title:</strong> {subEvent?.title}</p>
            <p><strong>Weight Range:</strong> {subEvent?.min_weight} – {subEvent?.max_weight} kg</p>
            <p><strong>Main Event:</strong> {parentEvent?.title}</p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Participants ({participants.length})</h3>
            <div className="max-h-32 overflow-y-auto">
              {participants.length > 0 ? (
                <ul className="text-sm">
                  {participants.map(player => (
                    <li key={player.id} className="mb-1">
                      {player.name} - {player.association}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No participants registered yet</p>
              )}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Add Participant Form */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Add Participant</h3>
        <div className="flex gap-2">
          <div className="flex-grow">
            <Select 
              value={selectedPlayerId} 
              onValueChange={setSelectedPlayerId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select player to add" />
              </SelectTrigger>
              <SelectContent>
                {eligiblePlayers.map(player => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name} - {player.weight} kg
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={addParticipant} 
            disabled={!selectedPlayerId || eligiblePlayers.length === 0}
          >
            Add to Sub-Event
          </Button>
        </div>
      </Card>
      
      {/* Tournament Management Tabs */}
      <Tabs defaultValue="group-stage" className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="group-stage">Group Stage</TabsTrigger>
          <TabsTrigger value="knockout-stage">Knockout Stage</TabsTrigger>
          <TabsTrigger value="finals">Finals</TabsTrigger>
          <TabsTrigger value="summary-results">Summary Results</TabsTrigger>
          <TabsTrigger value="clubbed-results">Clubbed Results</TabsTrigger>
        </TabsList>
        
        {/* Group Stage */}
        <TabsContent value="group-stage">
          <div className="grid md:grid-cols-2 gap-6">
            {pools.map((pool) => (
              <Card key={pool.name} className="p-6">
                <h2 className="text-xl font-bold mb-4">{pool.name}</h2>
                <div className="space-y-4">
                  {pool.groups.map((group) => {
                    const groupId = `${pool.name}-${group.name}`;
                    const matchResult = getMatchResult(pool.name, group.name);

                    return (
                      <div key={group.name} className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-2">Group {group.name}</h3>
                        <div className="space-y-2">
                          {group.players.map((player) => (
                            <div key={player.id} className="bg-gray-50 p-2 rounded">
                              <p className="font-medium">{player.name}</p>
                              <p className="text-sm text-gray-600">{player.association}</p>
                            </div>
                          ))}
                          {group.players.length === 1 && (
                            <p className="text-sm text-green-600">Auto-qualified (Bye)</p>
                          )}
                          {group.players.length === 2 && !matchResult && (
                            <div className="mt-2">
                              <Select
                                value={selectedWinners[groupId]}
                                onValueChange={(value) => handleWinnerSelection(groupId, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select winner" />
                                </SelectTrigger>
                                <SelectContent>
                                  {group.players.map((player) => (
                                    <SelectItem key={player.id} value={player.id}>
                                      {player.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                onClick={() => handleSaveWinner(pool.name, group.name, group.players)}
                                className="w-full mt-2"
                                disabled={!selectedWinners[groupId]}
                              >
                                Save Winner
                              </Button>
                            </div>
                          )}
                          {matchResult && (
                            <div className="mt-2 p-2 bg-green-50 rounded">
                              <p className="text-sm font-medium text-green-600">
                                Winner: {participants.find(p => p.id === matchResult.winner_id)?.name}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
          {participants.length > 0 && (
            <div className="mt-6 space-x-2">
              <Button onClick={() => generatePools(participants)}>
                Regenerate Pools
              </Button>
              <Button variant="outline" onClick={() => generateKnockoutMatches()}>
                Regenerate Knockout Matches
              </Button>
            </div>
          )}
        </TabsContent>
        
        {/* Knockout Stage */}
        <TabsContent value="knockout-stage">
          <div className="grid md:grid-cols-2 gap-6">
            {['Pool A', 'Pool B'].map(poolName => {
              const knockoutMatches = poolKnockoutMatches[poolName] || [];
              return (
                <Card key={poolName} className="p-6">
                  <h3 className="text-lg font-bold mb-4">{poolName} Knockout</h3>
                  <div className="mb-4 text-sm text-gray-600">
                    <p>Pool Winners: {getPoolWinners(poolName).map(p => p.name).join(', ')}</p>
                    <p>Knockout Matches: {knockoutMatches.length}</p>
                  </div>
                  {knockoutMatches.length > 0 ? (
                    <div className="space-y-4">
                      {knockoutMatches.map((match) => {
                        const matchResult = matchResults.find(r => r.match_stage === match.id);
                        return (
                          <div key={match.id} className="border rounded-lg p-4">
                            <h4 className="font-medium mb-2">{match.stage}</h4>
                            <div className="grid grid-cols-1 gap-2">
                              {match.player1 && (
                                <div className={`p-2 rounded ${matchResult?.winner_id === match.player1.id ? 'bg-green-50' : 'bg-gray-50'}`}>
                                  <p className="font-medium">{match.player1.name}</p>
                                  <p className="text-sm text-gray-600">{match.player1.association}</p>
                                </div>
                              )}
                              {match.player2 && (
                                <div className={`p-2 rounded ${matchResult?.winner_id === match.player2.id ? 'bg-green-50' : 'bg-gray-50'}`}>
                                  <p className="font-medium">{match.player2.name}</p>
                                  <p className="text-sm text-gray-600">{match.player2.association}</p>
                                </div>
                              )}
                            </div>
                            
                            {!matchResult && match.player1 && match.player2 && (
                              <div className="mt-3">
                                <Select
                                  value={match.winner_id}
                                  onValueChange={(value) => {
                                    if (match.player1 && match.player2) {
                                      handleKnockoutWinnerSelection(
                                        match.id, 
                                        value, 
                                        match.player1.id, 
                                        match.player2.id
                                      );
                                    }
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select winner" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {match.player1 && (
                                      <SelectItem value={match.player1.id}>{match.player1.name}</SelectItem>
                                    )}
                                    {match.player2 && (
                                      <SelectItem value={match.player2.id}>{match.player2.name}</SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            
                            {matchResult && (
                              <div className="mt-2 p-2 bg-green-50 rounded">
                                <p className="text-sm font-medium text-green-600">
                                  Winner: {participants.find(p => p.id === matchResult.winner_id)?.name}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500">Complete group matches to see knockout stage</p>
                  )}
                  
                  {/* Third Place Selection */}
                  <div className="mt-6 border-t pt-4">
                    <h4 className="font-medium mb-3">Select 3rd Place Winner</h4>
                    {getPoolWinners(poolName).length > 0 ? (
                      <>
                        {!getThirdPlaceResult(poolName) ? (
                          <>
                            <Select
                              value={thirdPlaceSelections[poolName]}
                              onValueChange={(value) => handleThirdPlaceSelection(poolName, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select 3rd place" />
                              </SelectTrigger>
                              <SelectContent>
                                {getPoolWinners(poolName)
                                  .filter(player => {
                                    // Filter out the pool winner
                                    const poolWinner = getPoolFinalWinner(poolName);
                                    
                                    // For a knockout tournament, we should exclude the winner
                                    // but include everyone else who participated in the knockout
                                    return poolWinner ? player.id !== poolWinner.id : true;
                                  })
                                  .map(player => (
                                    <SelectItem key={player.id} value={player.id}>
                                      {player.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            {thirdPlaceSelections[poolName] && (
                              <Button
                                onClick={() => saveThirdPlace(poolName, thirdPlaceSelections[poolName])}
                                className="w-full mt-2"
                              >
                                Save 3rd Place
                              </Button>
                            )}
                          </>
                        ) : (
                          <div className="p-2 bg-green-50 rounded">
                            <p className="text-sm font-medium text-green-600">
                              3rd Place: {participants.find(p => p.id === getThirdPlaceResult(poolName)?.winner_id)?.name}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-500">Complete group matches first</p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        {/* Finals */}
        <TabsContent value="finals">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Championship Match</h3>
            <div className="mb-4 text-sm text-gray-600">
              <p>Pool A Final Winner: {getPoolFinalWinner('Pool A')?.name || 'Not determined'}</p>
              <p>Pool B Final Winner: {getPoolFinalWinner('Pool B')?.name || 'Not determined'}</p>
              <p>Final Match: {finalMatch ? 'Available' : 'Not available'}</p>
            </div>
            {finalMatch && finalMatch.player1 && finalMatch.player2 ? (
              <div className="border rounded-lg p-4">
                <div className="grid grid-cols-1 gap-2">
                  <div className={`p-3 rounded ${finalMatch.winner_id === finalMatch.player1.id ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <p className="font-medium">{finalMatch.player1.name} (Pool A Winner)</p>
                    <p className="text-sm text-gray-600">{finalMatch.player1.association}</p>
                  </div>
                  <div className="text-center py-2">vs</div>
                  <div className={`p-3 rounded ${finalMatch.winner_id === finalMatch.player2.id ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <p className="font-medium">{finalMatch.player2.name} (Pool B Winner)</p>
                    <p className="text-sm text-gray-600">{finalMatch.player2.association}</p>
                  </div>
                </div>
                
                {(() => {
                  const finalResult = matchResults.find(r => r.match_stage === 'final');
                  const hasWinner = finalResult?.winner_id || finalMatch.winner_id;
                  
                  if (!hasWinner) {
                    return (
                      <div className="mt-4">
                        <Select
                          onValueChange={(value) => handleFinalWinnerSelection(value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select champion" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={finalMatch.player1.id}>{finalMatch.player1.name}</SelectItem>
                            <SelectItem value={finalMatch.player2.id}>{finalMatch.player2.name}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  } else {
                    const winnerId = finalResult?.winner_id || finalMatch.winner_id;
                    return (
                      <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                        <p className="text-lg font-bold text-yellow-700">
                          Champion: {participants.find(p => p.id === winnerId)?.name}
                        </p>
                      </div>
                    );
                  }
                })()}
              </div>
            ) : (
              <p className="text-gray-500">Complete knockout matches to see finals</p>
            )}
          </Card>
        </TabsContent>
        
        {/* Summary Results */}
        <TabsContent value="summary-results">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Summary Results</h3>
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Group</th>
                      <th className="border p-2 text-left">Player</th>
                      <th className="border p-2 text-left">Association</th>
                      <th className="border p-2 text-left">Result Type</th>
                      <th className="border p-2 text-left">Position</th>
                      <th className="border p-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryResults.length > 0 ? (
                      summaryResults.map(result => (
                        <tr key={result.id} className="hover:bg-gray-50">
                          <td className="border p-2">{result.group_name}</td>
                          <td className="border p-2">{result.player?.name || 'Unknown'}</td>
                          <td className="border p-2">{result.player?.association || 'Unknown'}</td>
                          <td className="border p-2 capitalize">{result.result_type}</td>
                          <td className="border p-2 capitalize">{result.position.replace('_', ' ')}</td>
                          <td className="border p-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-600"
                              onClick={async () => {
                                if (confirm('Are you sure you want to delete this result?')) {
                                  await supabase
                                    .from('sub_event_summary_results')
                                    .delete()
                                    .eq('id', result.id);
                                  await fetchResults();
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="border p-4 text-center text-gray-500">
                          No summary results available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Add Summary Result form */}
              <div className="mt-6 border-t pt-4">
                <h4 className="font-medium mb-3">Add Summary Result</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Group</label>
                    <input 
                      type="text" 
                      placeholder="e.g., 1.1, 2.3" 
                      className="w-full p-2 border rounded"
                      value={summaryFormData.groupName}
                      onChange={e => setSummaryFormData({...summaryFormData, groupName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Player</label>
                    <Select 
                      value={summaryFormData.playerId} 
                      onValueChange={value => setSummaryFormData({...summaryFormData, playerId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select player" />
                      </SelectTrigger>
                      <SelectContent>
                        {participants.map(player => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Result Type</label>
                    <Select 
                      value={summaryFormData.resultType}
                      onValueChange={value => setSummaryFormData({...summaryFormData, resultType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pool">Pool</SelectItem>
                        <SelectItem value="final">Final</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Position</label>
                    <Select 
                      value={summaryFormData.position}
                      onValueChange={value => setSummaryFormData({...summaryFormData, position: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="winner">Winner</SelectItem>
                        <SelectItem value="runner_up">Runner Up</SelectItem>
                        <SelectItem value="bronze">Bronze</SelectItem>
                        <SelectItem value="semi_finalist">Semi Finalist</SelectItem>
                        <SelectItem value="participant">Participant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button 
                  className="mt-4" 
                  onClick={() => {
                    if (summaryFormData.groupName && summaryFormData.playerId && 
                        summaryFormData.resultType && summaryFormData.position) {
                      saveSummaryResult(
                        summaryFormData.groupName, 
                        summaryFormData.playerId, 
                        summaryFormData.resultType as 'pool' | 'final',
                        summaryFormData.position as 'winner' | 'runner_up' | 'bronze' | 'semi_finalist' | 'participant'
                      );
                      setSummaryFormData({groupName: '', playerId: '', resultType: '', position: ''});
                    } else {
                      alert('Please fill all fields');
                    }
                  }}
                >
                  Add Summary Result
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
        
        {/* Clubbed Results */}
        <TabsContent value="clubbed-results">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Clubbed Results</h3>
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Rank</th>
                      <th className="border p-2 text-left">Player</th>
                      <th className="border p-2 text-left">Association</th>
                      <th className="border p-2 text-left">Remarks</th>
                      <th className="border p-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clubbedResults.length > 0 ? (
                      clubbedResults.map(result => (
                        <tr key={result.id} className="hover:bg-gray-50">
                          <td className="border p-2">{result.rank}</td>
                          <td className="border p-2">{result.player?.name || 'Unknown'}</td>
                          <td className="border p-2">{result.player?.association || 'Unknown'}</td>
                          <td className="border p-2">{result.remarks}</td>
                          <td className="border p-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-600"
                              onClick={async () => {
                                if (confirm('Are you sure you want to delete this result?')) {
                                  await supabase
                                    .from('sub_event_clubbed_results')
                                    .delete()
                                    .eq('id', result.id);
                                  await fetchResults();
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="border p-4 text-center text-gray-500">
                          No clubbed results available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Add Clubbed Result form */}
              <div className="mt-6 border-t pt-4">
                <h4 className="font-medium mb-3">Add Clubbed Result</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Player</label>
                    <Select 
                      value={clubbedFormData.playerId}
                      onValueChange={value => setClubbedFormData({...clubbedFormData, playerId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select player" />
                      </SelectTrigger>
                      <SelectContent>
                        {participants.map(player => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Rank</label>
                    <Select 
                      value={clubbedFormData.rank}
                      onValueChange={value => setClubbedFormData({...clubbedFormData, rank: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select rank" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1st">1st</SelectItem>
                        <SelectItem value="2nd">2nd</SelectItem>
                        <SelectItem value="3rd">3rd</SelectItem>
                        <SelectItem value="4th">4th</SelectItem>
                        <SelectItem value="Participant">Participant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Remarks</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Won Pool A, Lost Final, etc." 
                      className="w-full p-2 border rounded"
                      value={clubbedFormData.remarks}
                      onChange={e => setClubbedFormData({...clubbedFormData, remarks: e.target.value})}
                    />
                  </div>
                </div>
                <Button 
                  className="mt-4" 
                  onClick={() => {
                    if (clubbedFormData.playerId && clubbedFormData.rank) {
                      saveClubbedResult(clubbedFormData.playerId, clubbedFormData.rank, clubbedFormData.remarks || '');
                      setClubbedFormData({playerId: '', rank: '', remarks: ''});
                    } else {
                      alert('Please select player and rank');
                    }
                  }}
                >
                  Add Clubbed Result
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}