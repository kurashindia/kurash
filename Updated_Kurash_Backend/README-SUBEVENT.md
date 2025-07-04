# Sub-Event System for Tournament Management

This feature allows tournament organizers to create sub-events with precise weight categories within the main weight range events.

## Overview

In the tournament system, events have weight categories like "50-55kg" as ranges. The sub-event system allows creating more precise weight divisions like "51kg" or "53kg" within these ranges for more accurate competitions.

## Database Setup

To enable this feature, run the SQL migration in `lib/db/migration.sql` on your Supabase database:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy the contents of `lib/db/migration.sql`
5. Run the SQL query

This will create two new tables:
- `sub_events`: Stores sub-event data including exact weight categories
- `sub_event_participants`: Tracks participants for each sub-event

## Database Tables

To implement the updated UI in the subevent system, the following tables need to be created:

```sql
-- Table for subevent match results (should already exist)
CREATE TABLE IF NOT EXISTS sub_event_match_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_event_id UUID REFERENCES sub_events(id) ON DELETE CASCADE,
  player1_id UUID REFERENCES players(id) ON DELETE CASCADE,
  player2_id UUID REFERENCES players(id) ON DELETE CASCADE,
  winner_id UUID REFERENCES players(id) ON DELETE CASCADE,
  match_stage TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for subevent summary results
CREATE TABLE IF NOT EXISTS sub_event_summary_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_event_id UUID REFERENCES sub_events(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  result_type TEXT NOT NULL CHECK (result_type IN ('pool', 'final')),
  position TEXT NOT NULL CHECK (position IN ('winner', 'runner_up', 'bronze', 'semi_finalist', 'participant')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for subevent clubbed results
CREATE TABLE IF NOT EXISTS sub_event_clubbed_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_event_id UUID REFERENCES sub_events(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  rank TEXT NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

Run these SQL queries in your Supabase SQL editor to create the necessary tables.

## Features

- **Create Sub-Events**: Add specific weight categories within the main event's weight range
- **Manage Participants**: Assign existing event participants to specific sub-events
- **Tournament Structure**: Each sub-event has its own tournament structure with pools and brackets
- **Independent Results**: Track results for each precise weight category independently

## Usage

1. Navigate to an event page
2. Find the "Sub-Events by Precise Weights" section
3. Click "Create Sub-Event" to add a new precise weight category
4. Add participants to the sub-event
5. Manage the tournament structure for each sub-event

## Technical Implementation

The system consists of:

1. `SubEvents.tsx` - Component for managing sub-events on the main event page
2. `/events/[id]/sub-events/[subEventId]` - Pages for managing individual sub-events
3. Database tables to store sub-event data and participants

## Default Pool Structure

Sub-events use the same pool structure as main events:
- Participants are divided into Pool A and Pool B
- Each pool is further divided into groups with 3-4 players each
- The tournament follows the same knockout logic as the main event system 

## Testing with Sample Data

To quickly test the sub-event system with sample data, you can use the included test script:

1. Go to your Supabase SQL Editor
2. Create a new query
3. Copy the contents of `lib/db/insert_sub_event_test.sql`
4. Run the SQL query

This will create:
- A main event named "Under 19 Boys" with weight category 50-60kg
- A sub-event named "Under 19 Boys 55kg" with exact weight 55kg
- 10 test players from different Indian states with weights around 55kg
- All players will be automatically added to both the main event and sub-event

After running the script, you can:
1. Navigate to the "Under 19 Boys" event in your application
2. You should see the "Under 19 Boys 55kg" sub-event in the "Sub-Events by Precise Weights" section
3. Click "Manage" to see the 10 participants and organize the tournament

The script is designed to be idempotent (safe to run multiple times) and will:
- Skip creating the event/sub-event if they already exist
- Skip adding players if they already exist (checking by Aadhar number)
- Use dynamic SQL to adapt to different database column naming conventions

## Troubleshooting

If you encounter issues with the sub-event system, here are some common problems and solutions:

### SQL Script Errors

- **Column name errors**: The test script uses dynamic SQL to detect column names in your database schema. If you get an error about column names not found, check your event_participants table structure and verify the column names match one of the expected patterns.

- **Permission errors**: Make sure your Supabase connection has the necessary permissions to create and modify tables.

- **Duplicate key violations**: If you see errors about duplicate keys, it might be because you're trying to insert participants that already exist. The script includes ON CONFLICT DO NOTHING clauses to handle this, but if you're running a modified version, make sure to include these.

### UI Issues

- **Sub-events not appearing**: After running the script, refresh your browser to make sure the UI picks up the new data.

- **Can't add participants**: Check that the player is already part of the main event before trying to add them to a sub-event.

- **Tournament structure not generating**: You need at least 3 participants to generate a tournament structure.

### Database Inspection

If you need to verify that the data was correctly inserted, you can run these queries in your Supabase SQL Editor:

```sql
-- Check main event
SELECT * FROM events WHERE title = 'Under 19 Boys';

-- Check sub-event
SELECT * FROM sub_events WHERE title = 'Under 19 Boys 55kg';

-- Check players
SELECT * FROM players WHERE aadhar_number LIKE '1%';

-- Check sub-event participants
SELECT sep.*, p.first_name, p.last_name
FROM sub_event_participants sep
JOIN players p ON sep.player_id = p.id
JOIN sub_events se ON sep.sub_event_id = se.id
WHERE se.title = 'Under 19 Boys 55kg';
``` 