import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { toast } from "sonner";
import { useClinicSettings, useUpsertClinicSettings } from "@/hooks/use-data";
import { TIMEZONES } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function SettingsPage() {
  const { data: settings, isLoading } = useClinicSettings();
  const upsert = useUpsertClinicSettings();

  const [clinicName, setClinicName] = useState("Mi Clínica Dental");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [openingTime, setOpeningTime] = useState("08:00");
  const [closingTime, setClosingTime] = useState("18:00");
  const [workingDays, setWorkingDays] = useState([true, true, true, true, true, true, false]);
  const [timezone, setTimezone] = useState("America/Lima");
  const [paymentBcp, setPaymentBcp] = useState("");
  const [paymentYape, setPaymentYape] = useState("");
  const [paymentPlin, setPaymentPlin] = useState("");
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isCheckingGoogle, setIsCheckingGoogle] = useState(true);

  useEffect(() => {
    if (settings) {
      setClinicName(settings.clinic_name ?? "");
      setPhone(settings.phone ?? "");
      setAddress(settings.address ?? "");
      setOpeningTime(settings.opening_time ?? "08:00");
      setClosingTime(settings.closing_time ?? "18:00");
      setWorkingDays(settings.working_days ?? [true, true, true, true, true, true, false]);
      setTimezone((settings as any).timezone ?? "America/Lima");
      setPaymentBcp((settings as any).payment_bcp ?? "");
      setPaymentYape((settings as any).payment_yape ?? "");
      setPaymentPlin((settings as any).payment_plin ?? "");
    }
  }, [settings]);

  useEffect(() => {
    // Check if coming back from Google Auth
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('calendar_connect') === 'success') {
      toast.success('Google Calendar conectado exitosamente');
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Check integration status
    const checkIntegration = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('user_integrations')
            .select('id')
            .eq('user_id', user.id)
            .eq('provider', 'google_calendar')
            .maybeSingle();
          
          if (data) setIsGoogleConnected(true);
        }
      } catch (error) {
        console.error('Error checking integration:', error);
      } finally {
        setIsCheckingGoogle(false);
      }
    };

    checkIntegration();
  }, []);

  const handleSave = async () => {
    try {
      await upsert.mutateAsync({
        clinic_name: clinicName,
        phone,
        address,
        opening_time: openingTime,
        closing_time: closingTime,
        working_days: workingDays,
        timezone,
        payment_bcp: paymentBcp,
        payment_yape: paymentYape,
        payment_plin: paymentPlin,
      } as any);
      toast.success("Configuración guardada");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (isLoading) return <div className="p-8 text-muted-foreground">Cargando...</div>;

  const handleConnectCalendar = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-auth?action=connect', {
        method: 'GET'
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No se recibió URL de autenticación");
      }
    } catch (error: any) {
      toast.error('Error al iniciar conexión con Google: ' + error.message);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-1">Personaliza tu clínica dental</p>
      </div>

      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-foreground">Datos de la Clínica</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Nombre de la clínica</Label>
            <Input value={clinicName} onChange={e => setClinicName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Teléfono</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Dirección</Label>
            <Input value={address} onChange={e => setAddress(e.target.value)} />
          </div>
        </div>
      </section>

      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-foreground">Horario de Atención</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Hora de apertura</Label>
            <Input type="time" value={openingTime} onChange={e => setOpeningTime(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Hora de cierre</Label>
            <Input type="time" value={closingTime} onChange={e => setClosingTime(e.target.value)} />
          </div>
        </div>
        <div className="space-y-3 pt-2">
          {DAYS.map((day, i) => (
            <div key={day} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{day}</span>
              <Switch checked={workingDays[i]} onCheckedChange={v => { const d = [...workingDays]; d[i] = v; setWorkingDays(d); }} />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-foreground">Zona Horaria</h2>
        <div className="space-y-2 max-w-xs">
          <Label>Zona horaria de la clínica</Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar zona horaria" />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map(tz => (
                <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Los horarios de citas se mostrarán en esta zona horaria</p>
        </div>
      </section>

      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-foreground">Datos de Pago</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Cuenta BCP</Label>
            <Input placeholder="Ej. 191-00000000-0-00 (Juan Pérez)" value={paymentBcp} onChange={e => setPaymentBcp(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Número Yape</Label>
            <Input placeholder="Ej. 999 888 777 (Juan Pérez)" value={paymentYape} onChange={e => setPaymentYape(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Número Plin</Label>
            <Input placeholder="Ej. 999 888 777 (Juan Pérez)" value={paymentPlin} onChange={e => setPaymentPlin(e.target.value)} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Estos datos se enviarán por WhatsApp a los pacientes de la lista de espera para que confirmen su cita.</p>
      </section>

      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-foreground">Integraciones</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <p className="font-medium">Google Calendar</p>
              <p className="text-sm text-muted-foreground">Sincroniza tus citas automáticamente con Google Calendar</p>
            </div>
            {isCheckingGoogle ? (
              <span className="text-sm text-muted-foreground">Verificando...</span>
            ) : isGoogleConnected ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                  Conectado
                </span>
                <Button variant="ghost" size="sm" onClick={handleConnectCalendar} className="text-xs text-muted-foreground underline">Reconectar</Button>
              </div>
            ) : (
              <Button variant="outline" onClick={handleConnectCalendar}>Conectar Google</Button>
            )}
          </div>
        </div>
      </section>

      <Button onClick={handleSave} className="w-full sm:w-auto" disabled={upsert.isPending}>
        {upsert.isPending ? "Guardando..." : "Guardar Cambios"}
      </Button>
    </div>
  );
}
