import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, CheckCircle, Calendar, User, Phone, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { APPOINTMENT_TYPES } from "@/lib/constants";

interface ClinicInfo {
  clinic_name: string;
  phone: string | null;
  address: string | null;
  opening_time: string;
  closing_time: string;
  working_days: boolean[];
}

interface BookedSlot {
  time: string;
  duration: number;
}

function generateSlots(open: string, close: string) {
  const slots: string[] = [];
  const [oH] = open.split(":").map(Number);
  const [cH] = close.split(":").map(Number);
  for (let h = oH; h < cH; h++) {
    slots.push(`${h.toString().padStart(2, "0")}:00`);
    slots.push(`${h.toString().padStart(2, "0")}:30`);
  }
  return slots;
}

function toMinutes(t: string) {
  const [h, m] = t.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

function isSlotOccupied(slot: string, bookedSlots: BookedSlot[]): boolean {
  const slotMin = toMinutes(slot);
  return bookedSlots.some(b => {
    const start = toMinutes(b.time);
    const end = start + b.duration;
    return slotMin >= start && slotMin < end;
  });
}

export default function PublicBooking() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const [clinic, setClinic] = useState<ClinicInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState("");

  const [step, setStep] = useState<"slots" | "form" | "success">("slots");
  const [name, setName] = useState("");
  const [email] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!doctorId) return;
    supabase.rpc("get_clinic_info", { p_doctor_id: doctorId }).then(({ data, error }) => {
      if (error || !data) {
        setNotFound(true);
      } else {
        setClinic(data as unknown as ClinicInfo);
      }
      setLoading(false);
    });
  }, [doctorId]);

  useEffect(() => {
    if (!doctorId || !selectedDate) return;
    supabase.rpc("get_booked_slots", { p_doctor_id: doctorId, p_date: selectedDate }).then(({ data }) => {
      setBookedSlots((data as unknown as BookedSlot[]) || []);
    });
  }, [doctorId, selectedDate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (notFound || !clinic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Clínica no encontrada</h1>
          <p className="text-muted-foreground">El enlace de reserva no es válido.</p>
        </div>
      </div>
    );
  }

  const allSlots = generateSlots(clinic.opening_time, clinic.closing_time);

  const dayOfWeek = new Date(selectedDate + "T12:00:00").getDay();
  const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const isWorkingDay = clinic.working_days?.[adjustedDay] ?? true;

  const handleSelectTime = (time: string) => {
    setSelectedTime(time);
    setStep("form");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !type) {
      toast.error("Complete todos los campos");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("create_public_booking", {
        p_doctor_id: doctorId!,
        p_patient_name: name,
        p_patient_email: email,
        p_patient_phone: phone,
        p_date: selectedDate,
        p_time: selectedTime,
        p_type: type,
      });

      if (error) throw error;

      const result = data as unknown as { success: boolean; error?: string };
      if (!result.success) {
        toast.error(result.error || "No se pudo agendar");
        setSubmitting(false);
        return;
      }

      setStep("success");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d: string) => {
    return new Date(d + "T12:00:00").toLocaleDateString("es-ES", {
      weekday: "long", day: "numeric", month: "long",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Sonner />

      <header className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">
                {clinic.clinic_name.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="font-bold text-foreground text-lg">{clinic.clinic_name}</h1>
              {clinic.address && (
                <p className="text-xs text-muted-foreground">{clinic.address}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {step === "success" ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">¡Solicitud enviada!</h2>
            <p className="text-muted-foreground mb-1">
              Tu solicitud fue registrada para el <span className="font-medium capitalize">{formatDate(selectedDate)}</span> a las <span className="font-medium">{selectedTime}</span>.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              La clínica confirmará tu cita por WhatsApp pronto.
            </p>
            <Button variant="outline" onClick={() => { setStep("slots"); setSelectedTime(""); setName(""); setPhone(""); setType(""); }}>
              Agendar otra cita
            </Button>
          </div>
        ) : step === "form" ? (
          <div className="animate-fade-in space-y-6">
            <button onClick={() => setStep("slots")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> Cambiar horario
            </button>

            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-sm text-muted-foreground">Horario seleccionado</p>
              <p className="text-lg font-bold text-foreground capitalize">
                {formatDate(selectedDate)} — {selectedTime}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Tus datos</h2>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Nombre completo</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" required />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Teléfono (WhatsApp)</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+51 999 999 999" required />
              </div>
              <div className="space-y-2">
                <Label>Tipo de consulta</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {APPOINTMENT_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Enviando solicitud..." : "Solicitar Cita"}
              </Button>
            </form>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-foreground">Agendar Cita</h2>
              <p className="text-sm text-muted-foreground mt-1">Selecciona un horario disponible</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Fecha
              </Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                min={today}
                className="w-48"
              />
            </div>

            {!isWorkingDay ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>La clínica no atiende este día</p>
                <p className="text-sm mt-1">Selecciona otro día</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground capitalize">{formatDate(selectedDate)}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {allSlots.map(slot => {
                    const isBooked = isSlotOccupied(slot, bookedSlots);
                    return (
                      <button
                        key={slot}
                        disabled={isBooked}
                        onClick={() => handleSelectTime(slot)}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-lg border transition-all text-left",
                          isBooked
                            ? "border-border bg-muted/50 opacity-50 cursor-not-allowed"
                            : "border-success/30 bg-success/5 hover:bg-success/15 hover:border-success/50 cursor-pointer"
                        )}
                      >
                        <Clock className={cn("w-4 h-4", isBooked ? "text-muted-foreground" : "text-success")} />
                        <span className={cn("font-medium text-sm", isBooked ? "text-muted-foreground" : "text-foreground")}>
                          {slot}
                        </span>
                        {isBooked && <span className="text-xs text-muted-foreground ml-auto">Ocupado</span>}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-border mt-16">
        <div className="max-w-2xl mx-auto px-4 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by <span className="font-semibold text-primary">SmileFlow</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
