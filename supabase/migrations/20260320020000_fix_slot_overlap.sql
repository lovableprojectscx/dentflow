-- Fix create_public_booking: use overlap detection instead of exact time match
-- A new booking conflicts if ANY existing appointment's [start, start+duration) overlaps with the new slot
CREATE OR REPLACE FUNCTION public.create_public_booking(
  p_doctor_id UUID,
  p_patient_name TEXT,
  p_patient_email TEXT,
  p_patient_phone TEXT,
  p_date DATE,
  p_time TIME,
  p_type TEXT,
  p_duration INTEGER DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id UUID;
  v_appointment_id UUID;
  v_conflict BOOLEAN;
  v_new_start INTEGER;
  v_new_end INTEGER;
BEGIN
  -- Convert new booking time to minutes for overlap comparison
  v_new_start := EXTRACT(HOUR FROM p_time)::INTEGER * 60 + EXTRACT(MINUTE FROM p_time)::INTEGER;
  v_new_end := v_new_start + p_duration;

  -- Check for overlap: existing [start, start+duration) overlaps with new [new_start, new_end)
  SELECT EXISTS(
    SELECT 1 FROM appointments
    WHERE user_id = p_doctor_id
      AND date = p_date
      AND status != 'cancelled'
      AND (
        -- existing appointment starts within new booking's range
        (EXTRACT(HOUR FROM time)::INTEGER * 60 + EXTRACT(MINUTE FROM time)::INTEGER) < v_new_end
        AND
        (EXTRACT(HOUR FROM time)::INTEGER * 60 + EXTRACT(MINUTE FROM time)::INTEGER + duration) > v_new_start
      )
  ) INTO v_conflict;

  IF v_conflict THEN
    RETURN json_build_object('success', false, 'error', 'Ese horario ya está ocupado');
  END IF;

  -- Create patient
  INSERT INTO patients (user_id, name, email, phone)
  VALUES (p_doctor_id, p_patient_name, p_patient_email, p_patient_phone)
  RETURNING id INTO v_patient_id;

  -- Create appointment with source = 'public'
  INSERT INTO appointments (user_id, patient_id, date, time, type, duration, status, source)
  VALUES (p_doctor_id, v_patient_id, p_date, p_time, p_type, p_duration, 'pending', 'public')
  RETURNING id INTO v_appointment_id;

  RETURN json_build_object('success', true, 'appointment_id', v_appointment_id);
END;
$$;
