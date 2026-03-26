import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, CheckCircle, Calendar, User, Phone, ArrowLeft, CreditCard, MessageCircle } from "lucide-react";
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
  const [phone, setPhone] = useState("");
  const [dni, setDni] = useState("");
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
    if (!name || !phone || !dni || !type) {
      toast.error("Complete todos los campos requeridos");
      return;
    }
    if (dni.length < 6 || dni.length > 15) {
      toast.error("DNI inválido — debe tener entre 6 y 15 dígitos");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("create_public_booking", {
        p_doctor_id: doctorId!,
        p_patient_name: name,
        p_patient_email: "",
        p_patient_phone: phone,
        p_date: selectedDate,
        p_time: selectedTime,
        p_type: type,
        p_patient_dni: dni,
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

  const resetForm = () => {
    setStep("slots");
    setSelectedTime("");
    setName("");
    setPhone("");
    setDni("");
    setType("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Sonner />

      <header className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center justify-between">
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
          {clinic.phone && (
            <a 
              href={`https://wa.me/${clinic.phone.replace(/[\D]/g, "")}`} 
              target="_blank" 
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1 text-xs text-success font-semibold hover:underline"
            >
              <MessageCircle className="w-4 h-4" />
              Consulta por WhatsApp
            </a>
          )}
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
            <Button variant="outline" onClick={resetForm}>
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
                <Label className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Nombre completo <span className="text-destructive">*</span>
                </Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre completo" required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Teléfono (WhatsApp) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+51 999 999 999"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> DNI / Documento <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={dni}
                    onChange={e => setDni(e.target.value.replace(/\D/g, ""))}
                    placeholder="Ej: 12345678"
                    maxLength={15}
                    inputMode="numeric"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo de consulta <span className="text-destructive">*</span></Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {APPOINTMENT_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <p className="text-xs text-muted-foreground">
                <span className="text-destructive">*</span> Campos obligatorios
              </p>

              <Button type="submit" className="w-full" disabled={submitting || !name || !phone || !dni || !type}>
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
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium text-foreground">Día no laborable</p>
                <p className="text-sm mt-1">La clínica no atiende este día. Selecciona otro.</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Horarios disponibles
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {allSlots.map(slot => {
                    const occupied = isSlotOccupied(slot, bookedSlots);
                    return (
                      <button
                        key={slot}
                        disabled={occupied}
                        onClick={() => handleSelectTime(slot)}
                        className={cn(
                          "py-3 rounded-xl text-sm font-semibold border transition-all",
                          occupied
                            ? "bg-muted text-muted-foreground border-border cursor-not-allowed opacity-50 line-through"
                            : "bg-card text-foreground border-border hover:border-primary hover:bg-primary/5 hover:text-primary active:scale-95"
                        )}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
                {allSlots.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No hay horarios disponibles para este día.
                  </p>
                )}
              </div>
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

      {clinic.phone && (
        <a 
          href={`https://wa.me/${clinic.phone.replace(/[\D]/g, "")}`} 
          target="_blank" 
          rel="noreferrer"
          className="fixed bottom-6 right-6 w-14 h-14 bg-success text-success-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-success/90 hover:scale-110 active:scale-95 transition-all z-50 group sm:bottom-8 sm:right-8"
          aria-label="Contactar por WhatsApp"
        >
          <MessageCircle className="w-7 h-7" />
          <span className="absolute right-full mr-3 bg-card border border-border px-3 py-1.5 rounded-lg text-sm text-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden pointer-events-none md:block">
            ¿Tienes dudas? Escríbenos
          </span>
        </a>
      )}
    </div>
  );
}
