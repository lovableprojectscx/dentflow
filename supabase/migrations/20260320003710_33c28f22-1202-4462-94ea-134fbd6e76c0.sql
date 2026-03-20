-- Function to get doctor's clinic info (public access)
CREATE OR REPLACE FUNCTION public.get_clinic_info(p_doctor_id UUID)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'clinic_name', COALESCE(cs.clinic_name, 'Clínica Dental'),
    'phone', cs.phone,
    'address', cs.address,
    'opening_time', COALESCE(cs.opening_time, '08:00'),
    'closing_time', COALESCE(cs.closing_time, '18:00'),
    'working_days', COALESCE(cs.working_days, '{t,t,t,t,t,t,f}')
  )
  FROM clinic_settings cs
  WHERE cs.user_id = p_doctor_id;
$$;

-- Function to get booked time slots for a doctor on a date (public access)
CREATE OR REPLACE FUNCTION public.get_booked_slots(p_doctor_id UUID, p_date DATE)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(json_agg(json_build_object(
    'time', a.time,
    'duration', a.duration
  )), '[]'::json)
  FROM appointments a
  WHERE a.user_id = p_doctor_id
    AND a.date = p_date
    AND a.status != 'cancelled';
$$;

-- Function to create a public booking (patient + appointment)
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
BEGIN
  -- Check for time conflict
  SELECT EXISTS(
    SELECT 1 FROM appointments
    WHERE user_id = p_doctor_id
      AND date = p_date
      AND time = p_time
      AND status != 'cancelled'
  ) INTO v_conflict;

  IF v_conflict THEN
    RETURN json_build_object('success', false, 'error', 'Ese horario ya está ocupado');
  END IF;

  -- Create patient
  INSERT INTO patients (user_id, name, email, phone)
  VALUES (p_doctor_id, p_patient_name, p_patient_email, p_patient_phone)
  RETURNING id INTO v_patient_id;

  -- Create appointment
  INSERT INTO appointments (user_id, patient_id, date, time, type, duration, status)
  VALUES (p_doctor_id, v_patient_id, p_date, p_time, p_type, p_duration, 'pending')
  RETURNING id INTO v_appointment_id;

  RETURN json_build_object('success', true, 'appointment_id', v_appointment_id);
END;
$$;