import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const CLINIC_OWNER_EMAIL = Deno.env.get('CLINIC_OWNER_EMAIL')

serve(async (req: Request) => {
  try {
    const payload = await req.json()
    // payload sent by Supabase Database Webhook
    
    if (payload.type !== 'INSERT' || payload.table !== 'appointments') {
      return new Response('Not an appointment insert', { status: 200 })
    }

    const appointment = payload.record
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Get patient details
    const { data: patient } = await supabase
      .from('patients')
      .select('name, email, phone')
      .eq('id', appointment.patient_id)
      .single()

    const patientName = patient?.name ?? 'Paciente'
    
    // 2. Prepare email body
    const emailHtml = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #2563eb;">¡Nueva Cita Registrada!</h2>
        <p>Hola, se ha registrado una nueva cita en <strong>Dentflow</strong>:</p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p><strong>Paciente:</strong> ${patientName}</p>
        <p><strong>Fecha:</strong> ${appointment.date}</p>
        <p><strong>Hora:</strong> ${appointment.time}</p>
        <p><strong>Tipo:</strong> ${appointment.type}</p>
        <p><strong>Teléfono:</strong> ${patient?.phone || 'No registrado'}</p>
        <p><strong>Email:</strong> ${patient?.email || 'No registrado'}</p>
        <p><strong>Notas:</strong> ${appointment.notes || 'Sin notas adicionales'}</p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #666;">Este es un aviso automático de Dentflow.</p>
      </div>
    `

    // 3. Send email via Resend
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured in Secrets')
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Dentflow <onboarding@resend.dev>', // You can change this once a domain is verified
        to: CLINIC_OWNER_EMAIL || 'your-email@example.com',
        subject: `Nueva Cita: ${patientName} - ${appointment.date}`,
        html: emailHtml,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
       throw new Error(JSON.stringify(data))
    }

    return new Response(JSON.stringify({ success: true, emailId: data.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
