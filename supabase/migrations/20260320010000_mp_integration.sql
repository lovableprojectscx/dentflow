-- Add source and payment_status columns to track public bookings
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'internal',
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'waived'));

-- Update create_public_booking to mark source = 'public'
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

  INSERT INTO patients (user_id, name, email, phone)
  VALUES (p_doctor_id, p_patient_name, p_patient_email, p_patient_phone)
  RETURNING id INTO v_patient_id;

  INSERT INTO appointments (user_id, patient_id, date, time, type, duration, status, source)
  VALUES (p_doctor_id, v_patient_id, p_date, p_time, p_type, p_duration, 'pending', 'public')
  RETURNING id INTO v_appointment_id;

  RETURN json_build_object('success', true, 'appointment_id', v_appointment_id);
END;
$$;
