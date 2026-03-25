import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

serve(async (req) => {
  try {
    const payload = await req.json()
    // payload sent by Supabase Database Webhook
    
    if (payload.type !== 'INSERT' || payload.table !== 'appointments') {
      return new Response('Not an appointment insert', { status: 200 })
    }

    const appointment = payload.record
    if (appointment.status !== 'pending' && appointment.status !== 'confirmed') {
      return new Response('Appointment status not eligible for sync', { status: 200 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Get user (doctor) Google Calendar integration
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('refresh_token')
      .eq('user_id', appointment.user_id)
      .eq('provider', 'google_calendar')
      .single()

    if (integrationError || !integration || !integration.refresh_token) {
      console.log('No Google Calendar integration found for user', appointment.user_id)
      return new Response('No integration, skipping', { status: 200 })
    }

    // 2. Refresh Google Access Token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
        refresh_token: integration.refresh_token,
        grant_type: 'refresh_token',
      }),
    })

    const tokenData = await tokenResponse.json()
    if (tokenData.error) {
       console.error('Failed to get fresh Google token:', tokenData)
       return new Response('Failed to authenticate with Google', { status: 500 })
    }

    // 3. Get patient details to include in event description
    const { data: patient } = await supabase
      .from('patients')
      .select('name, email, phone')
      .eq('id', appointment.patient_id)
      .single()

    const patientName = patient?.name ?? 'Paciente'
    
    // Parse times (date + time) matching the clinic timezone if needed
    // In Supabase, date is typically YYYY-MM-DD
    const startDateStr = `${appointment.date}T${appointment.time}`
    const startDate = new Date(startDateStr)
    const endDate = new Date(startDate.getTime() + appointment.duration * 60000)

    const eventData = {
      summary: `Cita: ${patientName} - ${appointment.type}`,
      description: `
Paciente: ${patientName}
Teléfono: ${patient?.phone || 'No registrado'}
Correo: ${patient?.email || 'No registrado'}
Tipo: ${appointment.type}
Notas: ${appointment.notes || 'Sin notas adicionales'}
      `.trim(),
      start: {
        dateTime: startDate.toISOString(),
      },
      end: {
        dateTime: endDate.toISOString(),
      },
      reminders: {
        useDefault: true,
      }
    }

    // 4. Create event in Google Calendar
    const calResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    })

    const calData = await calResponse.json()
    if (calData.error) {
        throw new Error(JSON.stringify(calData.error))
    }

    // 5. Update appointment with google_event_id
    await supabase
      .from('appointments')
      .update({ google_event_id: calData.id })
      .eq('id', appointment.id)

    return new Response(JSON.stringify({ success: true, eventId: calData.id }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
