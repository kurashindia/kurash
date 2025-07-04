-- First, create a sub-event under the main event
-- Using RETURNING to capture the IDs explicitly for later use
WITH inserted_events AS (
  INSERT INTO public.sub_events (
    event_id, title, exact_weight
  )
  VALUES
  (
    (SELECT id FROM public.events WHERE title = 'State Wrestling Championship' LIMIT 1),
    'Under 71kg Exact Weight',
    71.0
  ),
  (
    (SELECT id FROM public.events WHERE title = 'State Wrestling Championship' LIMIT 1),
    'Under 73kg Exact Weight',
    73.0
  ),
  (
    (SELECT id FROM public.events WHERE title = 'State Wrestling Championship' LIMIT 1),
    'Under 65kg Exact Weight',
    65.0
  ),
  (
    (SELECT id FROM public.events WHERE title = 'State Wrestling Championship' LIMIT 1),
    'Under 68kg Exact Weight',
    68.0
  ),
  (
    (SELECT id FROM public.events WHERE title = 'State Wrestling Championship' LIMIT 1),
    'Under 60kg Exact Weight',
    60.0
  )
  RETURNING id, title
)
SELECT * FROM inserted_events;

-- Now we'll use DO block to ensure everything runs correctly in sequence
DO $$
DECLARE
    event71_id UUID;
    event73_id UUID;
    event65_id UUID;
    event68_id UUID;
    event60_id UUID;
    karan_id UUID;
    dev_id UUID;
    saurabh_id UUID;
    vivek_id UUID;
    amit_id UUID;
    rahul_id UUID;
    pradeep_id UUID;
    rajiv_id UUID;
    anil_id UUID;
    sunil_id UUID;
    nikhil_id UUID;
    ajay_id UUID;
    vijay_id UUID;
    deepak_id UUID;
    sandeep_id UUID;
BEGIN
    -- Get the sub-event IDs we just created
    SELECT id INTO event71_id FROM public.sub_events 
    WHERE title = 'Under 71kg Exact Weight' LIMIT 1;
    
    SELECT id INTO event73_id FROM public.sub_events 
    WHERE title = 'Under 73kg Exact Weight' LIMIT 1;
    
    SELECT id INTO event65_id FROM public.sub_events 
    WHERE title = 'Under 65kg Exact Weight' LIMIT 1;
    
    SELECT id INTO event68_id FROM public.sub_events 
    WHERE title = 'Under 68kg Exact Weight' LIMIT 1;
    
    SELECT id INTO event60_id FROM public.sub_events 
    WHERE title = 'Under 60kg Exact Weight' LIMIT 1;
    
    -- Get existing player IDs
    SELECT id INTO karan_id FROM public.players 
    WHERE first_name = 'Karan' AND last_name = 'Thakur' LIMIT 1;
    
    SELECT id INTO dev_id FROM public.players 
    WHERE first_name = 'Dev' AND last_name = 'Chauhan' LIMIT 1;
    
    SELECT id INTO saurabh_id FROM public.players 
    WHERE first_name = 'Saurabh' AND last_name = 'Yadav' LIMIT 1;
    
    SELECT id INTO vivek_id FROM public.players 
    WHERE first_name = 'Vivek' AND last_name = 'Singh' LIMIT 1;
    
    -- Insert new players if not already present
    -- 65kg category players
    IF NOT EXISTS (SELECT 1 FROM public.players WHERE first_name = 'Amit' AND last_name = 'Kumar') THEN
        INSERT INTO public.players (
            first_name, last_name, birth_date, gender, weight, 
            registered_association, email, phone, state, aadhar_number
        )
        VALUES (
            'Amit', 'Kumar', '1996-05-15', 'Male', 64.5, 
            'Delhi Wrestling Association', 'amit@example.com', '9876543210', 'Delhi', '111122223333'
        )
        RETURNING id INTO amit_id;
    ELSE 
        SELECT id INTO amit_id FROM public.players 
        WHERE first_name = 'Amit' AND last_name = 'Kumar' LIMIT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.players WHERE first_name = 'Rahul' AND last_name = 'Sharma') THEN
        INSERT INTO public.players (
            first_name, last_name, birth_date, gender, weight, 
            registered_association, email, phone, state, aadhar_number
        )
        VALUES (
            'Rahul', 'Sharma', '1997-03-21', 'Male', 64.8, 
            'UP Wrestling Federation', 'rahul@example.com', '9876543211', 'Uttar Pradesh', '222233334444'
        )
        RETURNING id INTO rahul_id;
    ELSE 
        SELECT id INTO rahul_id FROM public.players 
        WHERE first_name = 'Rahul' AND last_name = 'Sharma' LIMIT 1;
    END IF;
    
    -- 68kg category players
    IF NOT EXISTS (SELECT 1 FROM public.players WHERE first_name = 'Pradeep' AND last_name = 'Malik') THEN
        INSERT INTO public.players (
            first_name, last_name, birth_date, gender, weight, 
            registered_association, email, phone, state, aadhar_number
        )
        VALUES (
            'Pradeep', 'Malik', '1995-08-12', 'Male', 67.5, 
            'Haryana Wrestling Academy', 'pradeep@example.com', '9876543212', 'Haryana', '333344445555'
        )
        RETURNING id INTO pradeep_id;
    ELSE 
        SELECT id INTO pradeep_id FROM public.players 
        WHERE first_name = 'Pradeep' AND last_name = 'Malik' LIMIT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.players WHERE first_name = 'Rajiv' AND last_name = 'Verma') THEN
        INSERT INTO public.players (
            first_name, last_name, birth_date, gender, weight, 
            registered_association, email, phone, state, aadhar_number
        )
        VALUES (
            'Rajiv', 'Verma', '1994-11-30', 'Male', 67.9, 
            'Punjab Wrestling Club', 'rajiv@example.com', '9876543213', 'Punjab', '444455556666'
        )
        RETURNING id INTO rajiv_id;
    ELSE 
        SELECT id INTO rajiv_id FROM public.players 
        WHERE first_name = 'Rajiv' AND last_name = 'Verma' LIMIT 1;
    END IF;
    
    -- 60kg category players
    IF NOT EXISTS (SELECT 1 FROM public.players WHERE first_name = 'Anil' AND last_name = 'Rana') THEN
        INSERT INTO public.players (
            first_name, last_name, birth_date, gender, weight, 
            registered_association, email, phone, state, aadhar_number
        )
        VALUES (
            'Anil', 'Rana', '1998-02-25', 'Male', 59.5, 
            'Uttarakhand Wrestling Association', 'anil@example.com', '9876543214', 'Uttarakhand', '555566667777'
        )
        RETURNING id INTO anil_id;
    ELSE 
        SELECT id INTO anil_id FROM public.players 
        WHERE first_name = 'Anil' AND last_name = 'Rana' LIMIT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.players WHERE first_name = 'Sunil' AND last_name = 'Kapoor') THEN
        INSERT INTO public.players (
            first_name, last_name, birth_date, gender, weight, 
            registered_association, email, phone, state, aadhar_number
        )
        VALUES (
            'Sunil', 'Kapoor', '1997-07-14', 'Male', 59.8, 
            'Maharashtra Wrestling Federation', 'sunil@example.com', '9876543215', 'Maharashtra', '666677778888'
        )
        RETURNING id INTO sunil_id;
    ELSE 
        SELECT id INTO sunil_id FROM public.players 
        WHERE first_name = 'Sunil' AND last_name = 'Kapoor' LIMIT 1;
    END IF;
    
    -- Additional players for 71kg category
    IF NOT EXISTS (SELECT 1 FROM public.players WHERE first_name = 'Nikhil' AND last_name = 'Joshi') THEN
        INSERT INTO public.players (
            first_name, last_name, birth_date, gender, weight, 
            registered_association, email, phone, state, aadhar_number
        )
        VALUES (
            'Nikhil', 'Joshi', '1995-04-18', 'Male', 70.7, 
            'Gujarat Wrestling Association', 'nikhil@example.com', '9876543216', 'Gujarat', '777788889999'
        )
        RETURNING id INTO nikhil_id;
    ELSE 
        SELECT id INTO nikhil_id FROM public.players 
        WHERE first_name = 'Nikhil' AND last_name = 'Joshi' LIMIT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.players WHERE first_name = 'Ajay' AND last_name = 'Patil') THEN
        INSERT INTO public.players (
            first_name, last_name, birth_date, gender, weight, 
            registered_association, email, phone, state, aadhar_number
        )
        VALUES (
            'Ajay', 'Patil', '1996-09-22', 'Male', 70.9, 
            'Karnataka Wrestling Academy', 'ajay@example.com', '9876543217', 'Karnataka', '888899990000'
        )
        RETURNING id INTO ajay_id;
    ELSE 
        SELECT id INTO ajay_id FROM public.players 
        WHERE first_name = 'Ajay' AND last_name = 'Patil' LIMIT 1;
    END IF;
    
    -- Additional players for 73kg category
    IF NOT EXISTS (SELECT 1 FROM public.players WHERE first_name = 'Vijay' AND last_name = 'Yadav') THEN
        INSERT INTO public.players (
            first_name, last_name, birth_date, gender, weight, 
            registered_association, email, phone, state, aadhar_number
        )
        VALUES (
            'Vijay', 'Yadav', '1994-06-11', 'Male', 72.6, 
            'Bihar Wrestling Federation', 'vijay@example.com', '9876543218', 'Bihar', '999900001111'
        )
        RETURNING id INTO vijay_id;
    ELSE 
        SELECT id INTO vijay_id FROM public.players 
        WHERE first_name = 'Vijay' AND last_name = 'Yadav' LIMIT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.players WHERE first_name = 'Deepak' AND last_name = 'Negi') THEN
        INSERT INTO public.players (
            first_name, last_name, birth_date, gender, weight, 
            registered_association, email, phone, state, aadhar_number
        )
        VALUES (
            'Deepak', 'Negi', '1993-12-05', 'Male', 72.8, 
            'Himachal Wrestling Association', 'deepak@example.com', '9876543219', 'Himachal Pradesh', '000011112222'
        )
        RETURNING id INTO deepak_id;
    ELSE 
        SELECT id INTO deepak_id FROM public.players 
        WHERE first_name = 'Deepak' AND last_name = 'Negi' LIMIT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.players WHERE first_name = 'Sandeep' AND last_name = 'Tanwar') THEN
        INSERT INTO public.players (
            first_name, last_name, birth_date, gender, weight, 
            registered_association, email, phone, state, aadhar_number
        )
        VALUES (
            'Sandeep', 'Tanwar', '1995-10-19', 'Male', 72.3, 
            'Rajasthan Wrestling Club', 'sandeep@example.com', '9876543220', 'Rajasthan', '121212121212'
        )
        RETURNING id INTO sandeep_id;
    ELSE 
        SELECT id INTO sandeep_id FROM public.players 
        WHERE first_name = 'Sandeep' AND last_name = 'Tanwar' LIMIT 1;
    END IF;
    
    -- Verify we have all the IDs we need for sub-events
    IF event71_id IS NULL THEN
        RAISE EXCEPTION 'Under 71kg Exact Weight sub-event not found';
    END IF;
    
    IF event73_id IS NULL THEN
        RAISE EXCEPTION 'Under 73kg Exact Weight sub-event not found';
    END IF;
    
    IF event65_id IS NULL THEN
        RAISE EXCEPTION 'Under 65kg Exact Weight sub-event not found';
    END IF;
    
    IF event68_id IS NULL THEN
        RAISE EXCEPTION 'Under 68kg Exact Weight sub-event not found';
    END IF;
    
    IF event60_id IS NULL THEN
        RAISE EXCEPTION 'Under 60kg Exact Weight sub-event not found';
    END IF;

    -- Add participants to the sub-events
    
    -- 71kg category
    INSERT INTO public.sub_event_participants (sub_event_id, player_id)
    VALUES
    (event71_id, karan_id),
    (event71_id, dev_id),
    (event71_id, nikhil_id),
    (event71_id, ajay_id)
    ON CONFLICT (sub_event_id, player_id) DO NOTHING;
    
    -- 73kg category
    INSERT INTO public.sub_event_participants (sub_event_id, player_id)
    VALUES
    (event73_id, saurabh_id),
    (event73_id, vivek_id),
    (event73_id, vijay_id),
    (event73_id, deepak_id),
    (event73_id, sandeep_id)
    ON CONFLICT (sub_event_id, player_id) DO NOTHING;
    
    -- 65kg category
    INSERT INTO public.sub_event_participants (sub_event_id, player_id)
    VALUES
    (event65_id, amit_id),
    (event65_id, rahul_id)
    ON CONFLICT (sub_event_id, player_id) DO NOTHING;
    
    -- 68kg category
    INSERT INTO public.sub_event_participants (sub_event_id, player_id)
    VALUES
    (event68_id, pradeep_id),
    (event68_id, rajiv_id)
    ON CONFLICT (sub_event_id, player_id) DO NOTHING;
    
    -- 60kg category
    INSERT INTO public.sub_event_participants (sub_event_id, player_id)
    VALUES
    (event60_id, anil_id),
    (event60_id, sunil_id)
    ON CONFLICT (sub_event_id, player_id) DO NOTHING;
    
    -- Add match results for 71kg category
    INSERT INTO public.sub_event_match_results (
      sub_event_id, player1_id, player2_id, winner_id, match_stage
    )
    VALUES
    (
      event71_id,
      karan_id,
      dev_id,
      karan_id,
      'Pool A-1.1'
    ),
    (
      event71_id,
      nikhil_id,
      ajay_id,
      nikhil_id,
      'Pool A-1.2'
    ),
    (
      event71_id,
      karan_id,
      nikhil_id,
      karan_id,
      'Semi-Final 1'
    )
    ON CONFLICT DO NOTHING;
    
    -- Add match results for 73kg category
    INSERT INTO public.sub_event_match_results (
      sub_event_id, player1_id, player2_id, winner_id, match_stage
    )
    VALUES
    (
      event73_id,
      saurabh_id,
      vivek_id,
      saurabh_id,
      'Pool A-1.1'
    ),
    (
      event73_id,
      vijay_id,
      deepak_id,
      vijay_id,
      'Pool A-1.2'
    ),
    (
      event73_id,
      sandeep_id,
      saurabh_id,
      saurabh_id,
      'Pool A-2.1'
    ),
    (
      event73_id,
      vijay_id,
      saurabh_id,
      saurabh_id,
      'Semi-Final 1'
    )
    ON CONFLICT DO NOTHING;
    
    -- Add match results for 65kg category
    INSERT INTO public.sub_event_match_results (
      sub_event_id, player1_id, player2_id, winner_id, match_stage
    )
    VALUES
    (
      event65_id,
      amit_id,
      rahul_id,
      amit_id,
      'Final'
    )
    ON CONFLICT DO NOTHING;
    
    -- Add match results for 68kg category
    INSERT INTO public.sub_event_match_results (
      sub_event_id, player1_id, player2_id, winner_id, match_stage
    )
    VALUES
    (
      event68_id,
      pradeep_id,
      rajiv_id,
      pradeep_id,
      'Final'
    )
    ON CONFLICT DO NOTHING;
    
    -- Add match results for 60kg category
    INSERT INTO public.sub_event_match_results (
      sub_event_id, player1_id, player2_id, winner_id, match_stage
    )
    VALUES
    (
      event60_id,
      anil_id,
      sunil_id,
      sunil_id,
      'Final'
    )
    ON CONFLICT DO NOTHING;
END
$$;

/*
-- Alternative simpler approach (only if the above doesn't work)
-- Make sure to run this only if the sub-events exist

-- First, verify that we have the events
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.sub_events WHERE title = 'Under 71kg Exact Weight') THEN
        RAISE NOTICE 'Under 71kg Exact Weight event not found, creating...';
        INSERT INTO public.sub_events (
            event_id, title, exact_weight
        )
        VALUES (
            (SELECT id FROM public.events WHERE title = 'State Wrestling Championship' LIMIT 1),
            'Under 71kg Exact Weight',
            71.0
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.sub_events WHERE title = 'Under 73kg Exact Weight') THEN
        RAISE NOTICE 'Under 73kg Exact Weight event not found, creating...';
        INSERT INTO public.sub_events (
            event_id, title, exact_weight
        )
        VALUES (
            (SELECT id FROM public.events WHERE title = 'State Wrestling Championship' LIMIT 1),
            'Under 73kg Exact Weight',
            73.0
        );
    END IF;
END
$$;

-- Now add the participants
INSERT INTO public.sub_event_participants (
  sub_event_id, player_id
)
VALUES
(
  (SELECT id FROM public.sub_events WHERE title = 'Under 71kg Exact Weight' LIMIT 1),
  (SELECT id FROM public.players WHERE first_name = 'Karan' AND last_name = 'Thakur' LIMIT 1)
),
(
  (SELECT id FROM public.sub_events WHERE title = 'Under 71kg Exact Weight' LIMIT 1),
  (SELECT id FROM public.players WHERE first_name = 'Dev' AND last_name = 'Chauhan' LIMIT 1)
),
(
  (SELECT id FROM public.sub_events WHERE title = 'Under 73kg Exact Weight' LIMIT 1),
  (SELECT id FROM public.players WHERE first_name = 'Saurabh' AND last_name = 'Yadav' LIMIT 1)
),
(
  (SELECT id FROM public.sub_events WHERE title = 'Under 73kg Exact Weight' LIMIT 1),
  (SELECT id FROM public.players WHERE first_name = 'Vivek' AND last_name = 'Singh' LIMIT 1)
);
*/ 