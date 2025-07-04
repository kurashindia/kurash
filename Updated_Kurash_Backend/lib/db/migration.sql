-- Table for sub-events with exact weight categories
CREATE TABLE IF NOT EXISTS sub_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  exact_weight NUMERIC(5, 1) NOT NULL, -- Allows decimal weights like 55.5kg
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_sub_events_event_id ON sub_events(event_id);

-- Table for participants of sub-events
CREATE TABLE IF NOT EXISTS sub_event_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_event_id UUID NOT NULL REFERENCES sub_events(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (sub_event_id, player_id) -- Prevent duplicate entries
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_sub_event_participants_sub_event_id ON sub_event_participants(sub_event_id);
CREATE INDEX IF NOT EXISTS idx_sub_event_participants_player_id ON sub_event_participants(player_id);

-- Table for match results specifically for sub-events
CREATE TABLE IF NOT EXISTS sub_event_match_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_event_id UUID NOT NULL REFERENCES sub_events(id) ON DELETE CASCADE,
  player1_id UUID NOT NULL REFERENCES players(id),
  player2_id UUID NOT NULL REFERENCES players(id),
  winner_id UUID NOT NULL REFERENCES players(id),
  match_stage TEXT NOT NULL, -- Pool A-1.1, Pool B-2.1, knockout, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_sub_event_match_results_sub_event_id ON sub_event_match_results(sub_event_id);
CREATE INDEX IF NOT EXISTS idx_sub_event_match_results_player1_id ON sub_event_match_results(player1_id);
CREATE INDEX IF NOT EXISTS idx_sub_event_match_results_player2_id ON sub_event_match_results(player2_id);
CREATE INDEX IF NOT EXISTS idx_sub_event_match_results_winner_id ON sub_event_match_results(winner_id);

-- Create a view that joins sub-events with their participants for easy access
CREATE OR REPLACE VIEW sub_event_participants_view AS
SELECT 
  sep.id as participant_id,
  se.id as sub_event_id,
  se.title as sub_event_title,
  se.exact_weight,
  p.id as player_id,
  CONCAT(p.first_name, ' ', p.last_name) as player_name,
  p.registered_association as player_association,
  p.weight as player_weight
FROM 
  sub_event_participants sep
JOIN 
  sub_events se ON sep.sub_event_id = se.id
JOIN 
  players p ON sep.player_id = p.id; 