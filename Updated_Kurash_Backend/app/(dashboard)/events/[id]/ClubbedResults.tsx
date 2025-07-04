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

interface ClubbedResult {
  id: string;
  player_id: string;
  rank: string;
  remarks: string;
  player?: Player;
}

interface ClubbedResultsProps {
  eventId: string;
  players: Player[];
}

export default function ClubbedResults({ eventId, players }: ClubbedResultsProps) {
  const [clubbedResults, setClubbedResults] = useState<ClubbedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    playerId: '',
    rank: '',
    remarks: ''
  });

  useEffect(() => {
    fetchClubbedResults();
  }, [eventId, players]);

  async function fetchClubbedResults() {
    setLoading(true);
    const { data, error } = await supabase
      .from('clubbed_results')
      .select('*')
      .eq('event_id', eventId);

    if (error) {
      console.error('Error fetching clubbed results:', error);
    } else {
      // Enrich results with player data
      const resultsWithPlayers = (data || []).map(result => {
        const player = players.find(p => p.id === result.player_id);
        return { ...result, player };
      });
      setClubbedResults(resultsWithPlayers);
    }
    setLoading(false);
  }

  async function handleSaveClubbedResult() {
    if (!eventId || !formData.playerId || !formData.rank) {
      alert('Please fill all required fields');
      return;
    }

    let error;
    if (editingId) {
      // Update existing result
      const { error: updateError } = await supabase
        .from('clubbed_results')
        .update({
          player_id: formData.playerId,
          rank: formData.rank,
          remarks: formData.remarks || ''
        })
        .eq('id', editingId);
      error = updateError;
    } else {
      // Insert new result
      const { error: insertError } = await supabase
        .from('clubbed_results')
        .insert([{
          event_id: eventId,
          player_id: formData.playerId,
          rank: formData.rank,
          remarks: formData.remarks || ''
        }]);
      error = insertError;
    }

    if (error) {
      console.error('Error saving clubbed result:', error);
      alert('Error saving result. Please try again.');
    } else {
      // Reset form and fetch updated results
      resetForm();
      fetchClubbedResults();
    }
  }
  
  function editResult(result: ClubbedResult) {
    setEditingId(result.id);
    setFormData({
      playerId: result.player_id,
      rank: result.rank,
      remarks: result.remarks || ''
    });
  }
  
  function resetForm() {
    setEditingId(null);
    setFormData({
      playerId: '',
      rank: '',
      remarks: ''
    });
  }
  
  async function deleteResult(id: string) {
    if (confirm('Are you sure you want to delete this result?')) {
      const { error } = await supabase
        .from('clubbed_results')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('Error deleting result:', error);
        alert('Error deleting result. Please try again.');
      } else {
        fetchClubbedResults();
        if (editingId === id) {
          resetForm();
        }
      }
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Clubbed Results</h2>
      <Card className="p-6">
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
                {loading ? (
                  <tr>
                    <td colSpan={5} className="border p-4 text-center">Loading...</td>
                  </tr>
                ) : clubbedResults.length > 0 ? (
                  clubbedResults.map(result => (
                    <tr key={result.id} className={`hover:bg-gray-50 ${editingId === result.id ? 'bg-blue-50' : ''}`}>
                      <td className="border p-2">{result.rank}</td>
                      <td className="border p-2">{result.player?.name || 'Unknown'}</td>
                      <td className="border p-2">{result.player?.association || 'Unknown'}</td>
                      <td className="border p-2">{result.remarks}</td>
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
                    <td colSpan={5} className="border p-4 text-center text-gray-500">
                      No clubbed results available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Add/Edit Clubbed Result form */}
          <div className="mt-6 border-t pt-4">
            <h4 className="font-medium mb-3">{editingId ? 'Edit Clubbed Result' : 'Add Clubbed Result'}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium mb-1">Rank</label>
                <Select value={formData.rank} onValueChange={value => setFormData({...formData, rank: value})}>
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
                  value={formData.remarks}
                  onChange={e => setFormData({...formData, remarks: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button 
                className="flex-1" 
                onClick={handleSaveClubbedResult}
              >
                {editingId ? 'Update' : 'Add'} Clubbed Result
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