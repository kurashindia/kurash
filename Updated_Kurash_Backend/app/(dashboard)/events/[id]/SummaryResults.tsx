'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';

interface Player {
  id: string;
  name: string;
  association: string;
}

interface SummaryResult {
  id: string;
  group_name: string;
  player_id: string;
  result_type: 'pool' | 'final';
  position: 'winner' | 'runner_up' | 'bronze' | 'semi_finalist' | 'participant';
  player?: Player;
}

interface SummaryResultsProps {
  eventId: string;
  players: Player[];
}

export default function SummaryResults({ eventId, players }: SummaryResultsProps) {
  const [summaryResults, setSummaryResults] = useState<SummaryResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    groupName: '',
    playerId: '',
    resultType: '',
    position: ''
  });

  useEffect(() => {
    fetchSummaryResults();
  }, [eventId, players]);

  async function fetchSummaryResults() {
    setLoading(true);
    const { data, error } = await supabase
      .from('summary_results')
      .select('*')
      .eq('event_id', eventId);

    if (error) {
      console.error('Error fetching summary results:', error);
    } else {
      // Enrich results with player data
      const resultsWithPlayers = (data || []).map(result => {
        const player = players.find(p => p.id === result.player_id);
        return { ...result, player };
      });
      setSummaryResults(resultsWithPlayers);
    }
    setLoading(false);
  }

  async function handleSaveSummaryResult() {
    if (!eventId || !formData.playerId || !formData.groupName || !formData.resultType || !formData.position) {
      alert('Please fill all fields');
      return;
    }
    
    let error;
    if (editingId) {
      // Update existing result
      const { error: updateError } = await supabase
        .from('summary_results')
        .update({
          group_name: formData.groupName,
          player_id: formData.playerId,
          result_type: formData.resultType as 'pool' | 'final',
          position: formData.position as 'winner' | 'runner_up' | 'bronze' | 'semi_finalist' | 'participant'
        })
        .eq('id', editingId);
      error = updateError;
    } else {
      // Insert new result
      const { error: insertError } = await supabase
        .from('summary_results')
        .insert([{
          event_id: eventId,
          group_name: formData.groupName,
          player_id: formData.playerId,
          result_type: formData.resultType as 'pool' | 'final',
          position: formData.position as 'winner' | 'runner_up' | 'bronze' | 'semi_finalist' | 'participant'
        }]);
      error = insertError;
    }

    if (error) {
      console.error('Error saving summary result:', error);
      alert('Error saving result. Please try again.');
    } else {
      // Reset form and fetch updated results
      resetForm();
      fetchSummaryResults();
    }
  }
  
  function editResult(result: SummaryResult) {
    setEditingId(result.id);
    setFormData({
      groupName: result.group_name,
      playerId: result.player_id,
      resultType: result.result_type,
      position: result.position
    });
  }
  
  function resetForm() {
    setEditingId(null);
    setFormData({
      groupName: '',
      playerId: '',
      resultType: '',
      position: ''
    });
  }
  
  async function deleteResult(id: string) {
    if (confirm('Are you sure you want to delete this result?')) {
      const { error } = await supabase
        .from('summary_results')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('Error deleting result:', error);
        alert('Error deleting result. Please try again.');
      } else {
        fetchSummaryResults();
        if (editingId === id) {
          resetForm();
        }
      }
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Summary Results</h2>
      <Card className="p-6">
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
                {loading ? (
                  <tr>
                    <td colSpan={6} className="border p-4 text-center">Loading...</td>
                  </tr>
                ) : summaryResults.length > 0 ? (
                  summaryResults.map(result => (
                    <tr key={result.id} className={`hover:bg-gray-50 ${editingId === result.id ? 'bg-blue-50' : ''}`}>
                      <td className="border p-2">{result.group_name}</td>
                      <td className="border p-2">{result.player?.name || 'Unknown'}</td>
                      <td className="border p-2">{result.player?.association || 'Unknown'}</td>
                      <td className="border p-2 capitalize">{result.result_type}</td>
                      <td className="border p-2 capitalize">{result.position.replace('_', ' ')}</td>
                      <td className="border p-2">
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => editResult(result)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600"
                            onClick={() => deleteResult(result.id)}
                          >
                            Delete
                          </Button>
                        </div>
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
          
          {/* Add/Edit Summary Result form */}
          <div className="mt-6 border-t pt-4">
            <h4 className="font-medium mb-3">{editingId ? 'Edit Summary Result' : 'Add Summary Result'}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Group</label>
                <input 
                  type="text" 
                  placeholder="e.g., 1.1, 2.3" 
                  className="w-full p-2 border rounded"
                  value={formData.groupName}
                  onChange={e => setFormData({...formData, groupName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Player</label>
                <Select value={formData.playerId} onValueChange={value => setFormData({...formData, playerId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select player" />
                  </SelectTrigger>
                  <SelectContent>
                    {players.map(player => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Result Type</label>
                <Select value={formData.resultType} onValueChange={value => setFormData({...formData, resultType: value})}>
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
                <Select value={formData.position} onValueChange={value => setFormData({...formData, position: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="winner">Winner</SelectItem>
                    <SelectItem value="runner_up">Runner Up</SelectItem>
                    <SelectItem value="bronze">Bronze</SelectItem>
                    <SelectItem value="semi_finalist">Semi-Finalist</SelectItem>
                    <SelectItem value="participant">Participant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button 
                className="flex-1" 
                onClick={handleSaveSummaryResult}
              >
                {editingId ? 'Update' : 'Add'} Summary Result
              </Button>
              {editingId && (
                <Button 
                  variant="outline" 
                  onClick={resetForm}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 