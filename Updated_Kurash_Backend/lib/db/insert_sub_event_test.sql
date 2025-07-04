-- First create the main event "Under 19 Boys"
DO $$
DECLARE
    main_event_id UUID;
    sub_event_id UUID;
BEGIN
    -- First check if the event already exists
    SELECT id INTO main_event_id FROM public.events 
    WHERE title = 'Under 19 Boys' LIMIT 1;
    
    -- Create the main event if it doesn't exist
    IF main_event_id IS NULL THEN
        INSERT INTO public.events (
            title, state, city, age, weight_category, fees, gender
        )
        VALUES (
            'Under 19 Boys', 'Delhi', 'New Delhi', 19, '50-60kg', 500, 'Male'
        )
        RETURNING id INTO main_event_id;

        RAISE NOTICE 'Created main event with ID: %', main_event_id;
    ELSE
        RAISE NOTICE 'Using existing main event with ID: %', main_event_id;
    END IF;
    
    -- Now check if the sub-event already exists
    SELECT id INTO sub_event_id FROM public.sub_events 
    WHERE title = 'Under 19 Boys 55kg' AND event_id = main_event_id LIMIT 1;
    
    -- Create the sub-event if it doesn't exist
    IF sub_event_id IS NULL THEN
        INSERT INTO public.sub_events (
            event_id, title, exact_weight
        )
        VALUES (
            main_event_id,
            'Under 19 Boys 55kg',
            55.0
        )
        RETURNING id INTO sub_event_id;
        
        RAISE NOTICE 'Created sub-event with ID: %', sub_event_id;
    ELSE
        RAISE NOTICE 'Using existing sub-event with ID: %', sub_event_id;
    END IF;
END
$$;

-- Debug query to see the actual table columns
DO $$
DECLARE
    col_record RECORD;
BEGIN
    RAISE NOTICE '--- Checking event_participants table columns ---';
    
    -- Check if table exists first
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'event_participants'
    ) THEN
        RAISE NOTICE 'Table event_participants exists';
    ELSE
        RAISE NOTICE 'Table event_participants does not exist!';
        RETURN;
    END IF;
    
    -- Print out all column names in the table using a record variable
    FOR col_record IN 
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'event_participants'
    LOOP
        RAISE NOTICE 'Column found: %', col_record.column_name;
    END LOOP;
END
$$;

-- Insert 10 unique players with Indian names and add them to both the main event and sub-event
DO $$
DECLARE
    main_event_id UUID;
    sub_event_id UUID;
    arjun_id UUID;
    vikram_id UUID;
    rohit_id UUID;
    ravi_id UUID;
    anand_id UUID;
    suresh_id UUID;
    rajesh_id UUID;
    akash_id UUID;
    mohit_id UUID;
    dinesh_id UUID;
    
    -- For event_participants
    arjun_participant_id UUID;
    vikram_participant_id UUID;
    rohit_participant_id UUID;
    ravi_participant_id UUID;
    anand_participant_id UUID;
    suresh_participant_id UUID;
    rajesh_participant_id UUID;
    akash_participant_id UUID;
    mohit_participant_id UUID;
    dinesh_participant_id UUID;
BEGIN
    -- Get the event and sub-event IDs
    SELECT id INTO main_event_id FROM public.events 
    WHERE title = 'Under 19 Boys' LIMIT 1;
    
    IF main_event_id IS NULL THEN
        RAISE EXCEPTION 'Main event "Under 19 Boys" not found';
    END IF;
    
    SELECT id INTO sub_event_id FROM public.sub_events 
    WHERE title = 'Under 19 Boys 55kg' AND event_id = main_event_id LIMIT 1;
    
    IF sub_event_id IS NULL THEN
        RAISE EXCEPTION 'Sub-event "Under 19 Boys 55kg" not found';
    END IF;
    
    -- Check if players already exist to avoid duplicates
    SELECT id INTO arjun_id FROM public.players 
    WHERE first_name = 'Arjun' AND last_name = 'Sharma' AND aadhar_number = '111111111111' LIMIT 1;
    
    -- Insert new players only if they don't already exist
    IF arjun_id IS NULL THEN
        INSERT INTO public.players (
            first_name, last_name, birth_date, gender, weight, 
            registered_association, email, phone, state, aadhar_number
        )
        VALUES (
            'Arjun', 'Sharma', '2006-05-15', 'Male', 54.8, 
            'Delhi Wrestling Association', 'arjun@example.com', '9876543001', 'Delhi', '111111111111'
        )
        RETURNING id INTO arjun_id;
    END IF;

    -- Player 2
    SELECT id INTO vikram_id FROM public.players 
    WHERE first_name = 'Vikram' AND last_name = 'Singh' AND aadhar_number = '222222222222' LIMIT 1;
    
    IF vikram_id IS NULL THEN
        INSERT INTO public.players (
            first_name, last_name, birth_date, gender, weight, 
            registered_association, email, phone, state, aadhar_number
        )
        VALUES (
            'Vikram', 'Singh', '2006-07-12', 'Male', 55.0, 
            'Punjab Wrestling Club', 'vikram@example.com', '9876543002', 'Punjab', '222222222222'
        )
        RETURNING id INTO vikram_id;
    END IF;

    -- Player 3
    SELECT id INTO rohit_id FROM public.players 
    WHERE first_name = 'Rohit' AND last_name = 'Kumar' AND aadhar_number = '333333333333' LIMIT 1;
    
    IF rohit_id IS NULL THEN
        INSERT INTO public.players (
            first_name, last_name, birth_date, gender, weight, 
            registered_association, email, phone, state, aadhar_number
        )
        VALUES (
            'Rohit', 'Kumar', '2005-09-20', 'Male', 54.6, 
            'Haryana Wrestling Academy', 'rohit@example.com', '9876543003', 'Haryana', '333333333333'
        )
        RETURNING id INTO rohit_id;
    END IF;

    -- Player 4
    SELECT id INTO ravi_id FROM public.players 
    WHERE first_name = 'Ravi' AND last_name = 'Patel' AND aadhar_number = '444444444444' LIMIT 1;
    
    IF ravi_id IS NULL THEN
        INSERT INTO public.players (
            first_name, last_name, birth_date, gender, weight, 
            registered_association, email, phone, state, aadhar_number
        )
        VALUES (
            'Ravi', 'Patel', '2005-11-05', 'Male', 54.9, 
            'Gujarat Wrestling Club', 'ravi@example.com', '9876543004', 'Gujarat', '444444444444'
        )
        RETURNING id INTO ravi_id;
    END IF;

    -- Player 5
    SELECT id INTO anand_id FROM public.players 
    WHERE first_name = 'Anand' AND last_name = 'Kapoor' AND aadhar_number = '555555555555' LIMIT 1;
    
    IF anand_id IS NULL THEN
        INSERT INTO public.players (
            first_name, last_name, birth_date, gender, weight, 
            registered_association, email, phone, state, aadhar_number
        )
        VALUES (
            'Anand', 'Kapoor', '2006-02-18', 'Male', 55.0, 
            'Maharashtra Wrestling Academy', 'anand@example.com', '9876543005', 'Maharashtra', '555555555555'
        )
        RETURNING id INTO anand_id;
    END IF;

    -- Player 6
    SELECT id INTO suresh_id FROM public.players 
    WHERE first_name = 'Suresh' AND last_name = 'Reddy' AND aadhar_number = '666666666666' LIMIT 1;
    
    IF suresh_id IS NULL THEN
        INSERT INTO public.players (
            first_name, last_name, birth_date, gender, weight, 
            registered_association, email, phone, state, aadhar_number
        )
        VALUES (
            'Suresh', 'Reddy', '2005-04-30', 'Male', 54.7, 
            'Telangana Wrestling Club', 'suresh@example.com', '9876543006', 'Telangana', '666666666666'
        )
        RETURNING id INTO suresh_id;
    END IF;

    -- Player 7
    SELECT id INTO rajesh_id FROM public.players 
    WHERE first_name = 'Rajesh' AND last_name = 'Choudhary' AND aadhar_number = '777777777777' LIMIT 1;
    
    IF rajesh_id IS NULL THEN
        INSERT INTO public.players (
            first_name, last_name, birth_date, gender, weight, 
            registered_association, email, phone, state, aadhar_number
        )
        VALUES (
            'Rajesh', 'Choudhary', '2005-06-15', 'Male', 54.5, 
            'Rajasthan Wrestling Academy', 'rajesh@example.com', '9876543007', 'Rajasthan', '777777777777'
        )
        RETURNING id INTO rajesh_id;
    END IF;

    -- Player 8
    SELECT id INTO akash_id FROM public.players 
    WHERE first_name = 'Akash' AND last_name = 'Mishra' AND aadhar_number = '888888888888' LIMIT 1;
    
    IF akash_id IS NULL THEN
        INSERT INTO public.players (
            first_name, last_name, birth_date, gender, weight, 
            registered_association, email, phone, state, aadhar_number
        )
        VALUES (
            'Akash', 'Mishra', '2006-01-10', 'Male', 54.9, 
            'UP Wrestling Association', 'akash@example.com', '9876543008', 'Uttar Pradesh', '888888888888'
        )
        RETURNING id INTO akash_id;
    END IF;

    -- Player 9
    SELECT id INTO mohit_id FROM public.players 
    WHERE first_name = 'Mohit' AND last_name = 'Sinha' AND aadhar_number = '999999999999' LIMIT 1;
    
    IF mohit_id IS NULL THEN
        INSERT INTO public.players (
            first_name, last_name, birth_date, gender, weight, 
            registered_association, email, phone, state, aadhar_number
        )
        VALUES (
            'Mohit', 'Sinha', '2005-08-22', 'Male', 54.8, 
            'Bihar Wrestling Club', 'mohit@example.com', '9876543009', 'Bihar', '999999999999'
        )
        RETURNING id INTO mohit_id;
    END IF;

    -- Player 10
    SELECT id INTO dinesh_id FROM public.players 
    WHERE first_name = 'Dinesh' AND last_name = 'Verma' AND aadhar_number = '101010101010' LIMIT 1;
    
    IF dinesh_id IS NULL THEN
        INSERT INTO public.players (
            first_name, last_name, birth_date, gender, weight, 
            registered_association, email, phone, state, aadhar_number
        )
        VALUES (
            'Dinesh', 'Verma', '2006-03-05', 'Male', 54.7, 
            'MP Wrestling Federation', 'dinesh@example.com', '9876543010', 'Madhya Pradesh', '101010101010'
        )
        RETURNING id INTO dinesh_id;
    END IF;

    -- Add players to event_participants (directly with name, association, etc.)
    -- This table doesn't reference the players table but instead has its own columns
    -- Check if Arjun is already a participant
    SELECT id INTO arjun_participant_id FROM event_participants 
    WHERE name = 'Arjun Sharma' AND event_id = main_event_id LIMIT 1;
    
    -- Add Arjun as a participant if not already added
    IF arjun_participant_id IS NULL THEN
        INSERT INTO public.event_participants (
            name, association, gender, weight_category, event_id
        )
        VALUES (
            'Arjun Sharma', 'Delhi Wrestling Association', 'Male', '50-60kg', main_event_id
        )
        RETURNING id INTO arjun_participant_id;
    END IF;
    
    -- Check if Vikram is already a participant
    SELECT id INTO vikram_participant_id FROM event_participants 
    WHERE name = 'Vikram Singh' AND event_id = main_event_id LIMIT 1;
    
    -- Add Vikram as a participant if not already added
    IF vikram_participant_id IS NULL THEN
        INSERT INTO public.event_participants (
            name, association, gender, weight_category, event_id
        )
        VALUES (
            'Vikram Singh', 'Punjab Wrestling Club', 'Male', '50-60kg', main_event_id
        )
        RETURNING id INTO vikram_participant_id;
    END IF;
    
    -- Check if Rohit is already a participant
    SELECT id INTO rohit_participant_id FROM event_participants 
    WHERE name = 'Rohit Kumar' AND event_id = main_event_id LIMIT 1;
    
    -- Add Rohit as a participant if not already added
    IF rohit_participant_id IS NULL THEN
        INSERT INTO public.event_participants (
            name, association, gender, weight_category, event_id
        )
        VALUES (
            'Rohit Kumar', 'Haryana Wrestling Academy', 'Male', '50-60kg', main_event_id
        )
        RETURNING id INTO rohit_participant_id;
    END IF;
    
    -- Check if Ravi is already a participant
    SELECT id INTO ravi_participant_id FROM event_participants 
    WHERE name = 'Ravi Patel' AND event_id = main_event_id LIMIT 1;
    
    -- Add Ravi as a participant if not already added
    IF ravi_participant_id IS NULL THEN
        INSERT INTO public.event_participants (
            name, association, gender, weight_category, event_id
        )
        VALUES (
            'Ravi Patel', 'Gujarat Wrestling Club', 'Male', '50-60kg', main_event_id
        )
        RETURNING id INTO ravi_participant_id;
    END IF;
    
    -- Check if Anand is already a participant
    SELECT id INTO anand_participant_id FROM event_participants 
    WHERE name = 'Anand Kapoor' AND event_id = main_event_id LIMIT 1;
    
    -- Add Anand as a participant if not already added
    IF anand_participant_id IS NULL THEN
        INSERT INTO public.event_participants (
            name, association, gender, weight_category, event_id
        )
        VALUES (
            'Anand Kapoor', 'Maharashtra Wrestling Academy', 'Male', '50-60kg', main_event_id
        )
        RETURNING id INTO anand_participant_id;
    END IF;
    
    -- Check if Suresh is already a participant
    SELECT id INTO suresh_participant_id FROM event_participants 
    WHERE name = 'Suresh Reddy' AND event_id = main_event_id LIMIT 1;
    
    -- Add Suresh as a participant if not already added
    IF suresh_participant_id IS NULL THEN
        INSERT INTO public.event_participants (
            name, association, gender, weight_category, event_id
        )
        VALUES (
            'Suresh Reddy', 'Telangana Wrestling Club', 'Male', '50-60kg', main_event_id
        )
        RETURNING id INTO suresh_participant_id;
    END IF;
    
    -- Check if Rajesh is already a participant
    SELECT id INTO rajesh_participant_id FROM event_participants 
    WHERE name = 'Rajesh Choudhary' AND event_id = main_event_id LIMIT 1;
    
    -- Add Rajesh as a participant if not already added
    IF rajesh_participant_id IS NULL THEN
        INSERT INTO public.event_participants (
            name, association, gender, weight_category, event_id
        )
        VALUES (
            'Rajesh Choudhary', 'Rajasthan Wrestling Academy', 'Male', '50-60kg', main_event_id
        )
        RETURNING id INTO rajesh_participant_id;
    END IF;
    
    -- Check if Akash is already a participant
    SELECT id INTO akash_participant_id FROM event_participants 
    WHERE name = 'Akash Mishra' AND event_id = main_event_id LIMIT 1;
    
    -- Add Akash as a participant if not already added
    IF akash_participant_id IS NULL THEN
        INSERT INTO public.event_participants (
            name, association, gender, weight_category, event_id
        )
        VALUES (
            'Akash Mishra', 'UP Wrestling Association', 'Male', '50-60kg', main_event_id
        )
        RETURNING id INTO akash_participant_id;
    END IF;
    
    -- Check if Mohit is already a participant
    SELECT id INTO mohit_participant_id FROM event_participants 
    WHERE name = 'Mohit Sinha' AND event_id = main_event_id LIMIT 1;
    
    -- Add Mohit as a participant if not already added
    IF mohit_participant_id IS NULL THEN
        INSERT INTO public.event_participants (
            name, association, gender, weight_category, event_id
        )
        VALUES (
            'Mohit Sinha', 'Bihar Wrestling Club', 'Male', '50-60kg', main_event_id
        )
        RETURNING id INTO mohit_participant_id;
    END IF;
    
    -- Check if Dinesh is already a participant
    SELECT id INTO dinesh_participant_id FROM event_participants 
    WHERE name = 'Dinesh Verma' AND event_id = main_event_id LIMIT 1;
    
    -- Add Dinesh as a participant if not already added
    IF dinesh_participant_id IS NULL THEN
        INSERT INTO public.event_participants (
            name, association, gender, weight_category, event_id
        )
        VALUES (
            'Dinesh Verma', 'MP Wrestling Federation', 'Male', '50-60kg', main_event_id
        )
        RETURNING id INTO dinesh_participant_id;
    END IF;
    
    RAISE NOTICE 'Added all players to main event as participants';
    
    -- Add all players to the sub-event by their player IDs (which are in the players table)
    INSERT INTO public.sub_event_participants (sub_event_id, player_id)
    VALUES
    (sub_event_id, arjun_id),
    (sub_event_id, vikram_id),
    (sub_event_id, rohit_id),
    (sub_event_id, ravi_id),
    (sub_event_id, anand_id),
    (sub_event_id, suresh_id),
    (sub_event_id, rajesh_id),
    (sub_event_id, akash_id),
    (sub_event_id, mohit_id),
    (sub_event_id, dinesh_id)
    ON CONFLICT (sub_event_id, player_id) DO NOTHING;
    
    RAISE NOTICE 'Added players to sub-event';
    
    -- Output completion message
    RAISE NOTICE 'Successfully set up test data for the sub-event system';
END
$$; 