-- Migración para Integración con Google Calendar

-- 1. Crear tabla user_integrations
CREATE TABLE IF NOT EXISTS public.user_integrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider text NOT NULL, -- Ej: 'google_calendar'
    refresh_token text,
    access_token text,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(user_id, provider)
);

-- Habilitar RLS
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

-- Políticas para user_integrations
CREATE POLICY "Users can view their own integrations" ON public.user_integrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own integrations" ON public.user_integrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own integrations" ON public.user_integrations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own integrations" ON public.user_integrations FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Service Role full access to integrations" ON public.user_integrations FOR ALL USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_user_integrations_updated_at
  BEFORE UPDATE ON public.user_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Modificar tabla appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS google_event_id text;
