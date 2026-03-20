import { Calendar, Users, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { AppointmentCard } from "@/components/AppointmentCard";
import { NewAppointmentDialog } from "@/components/NewAppointmentDialog";
import { BookingLinkCard } from "@/components/BookingLinkCard";
import { useAppointments, usePatients, useClinicSettings, useUpdateAppointment } from "@/hooks/use-data";
import OnboardingDialog from "@/components/OnboardingDialog";
import { useState } from "react";
import { toast } from "sonner";

export default function Dashboard() {
  const today = new Date().toISOString().split("T")[0];
  const { data: todayAppointments = [], isLoading } = useAppointments(today);
  const { data: allAppointments = [] } = useAppointments();
  const { data: patients = [] } = usePatients();
  const { data: settings, isLoading: settingsLoading } = useClinicSettings();
  const updateAppointment = useUpdateAppointment();
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  const showOnboarding = !settingsLoading && !settings && !onboardingDismissed;

  const confirmed = todayAppointments.filter(a => a.status === "confirmed").length;
  const completed = allAppointments.filter(a => a.status === "completed").length;
  const upcoming = allAppointments.filter(a => a.date > today).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const nextApt = todayAppointments.sort((a, b) => a.time.localeCompare(b.time))[0];
  const pendingPayments = allAppointments.filter(a =>
    (a as any).source === "public" && a.status === "pending"
  );

  const handleConfirmPayment = async (id: string) => {
    try {
      await updateAppointment.mutateAsync({ id, status: "confirmed" });
      toast.success("Cita confirmada");
    } catch {
      toast.error("Error al confirmar cita");
    }
  };

  const handleCancelAppointment = async (id: string) => {
    try {
      await updateAppointment.mutateAsync({ id, status: "cancelled" });
      toast.success("Solicitud rechazada");
    } catch {
      toast.error("Error al rechazar solicitud");
    }
  };

  const clinicName = settings?.clinic_name || "Doctor";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const formatToday = () => {
    const d = new Date();
    return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 md:space-y-8">
      <OnboardingDialog open={showOnboarding} onComplete={() => setOnboardingDismissed(true)} />

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">{getGreeting()}, {clinicName} 👋</h1>
          <p className="text-muted-foreground text-sm mt-1 capitalize">{formatToday()}</p>
        </div>
        <NewAppointmentDialog />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Citas Hoy" value={todayAppointments.length} subtitle={`${confirmed} confirmadas`} icon={Calendar} />
        <StatCard title="Pacientes" value={patients.length} icon={Users} />
        <StatCard title="Completadas" value={completed} subtitle="Total" icon={CheckCircle} />
        <StatCard title="Próxima Cita" value={nextApt?.time ?? "—"} subtitle={nextApt ? (nextApt as any).patients?.name : ""} icon={Clock} />
      </div>

      <BookingLinkCard />

      {pendingPayments.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-warning" />
            <h2 className="text-lg font-semibold text-foreground">Solicitudes pendientes de pago</h2>
            <span className="ml-auto bg-warning/10 text-warning text-xs font-bold px-2 py-0.5 rounded-full border border-warning/20">
              {pendingPayments.length}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Estos pacientes reservaron online. Contáctalos por WhatsApp y confirma la cita.
          </p>
          <div className="space-y-3">
            {pendingPayments.map(a => (
              <AppointmentCard
                key={a.id}
                id={a.id}
                time={a.time}
                duration={a.duration}
                patientName={(a as any).patients?.name ?? "—"}
                patientPhone={(a as any).patients?.phone}
                type={a.type}
                status={a.status}
                date={a.date}
                source={(a as any).source}
                paymentStatus={(a as any).payment_status}
                onConfirm={handleConfirmPayment}
                onCancel={handleCancelAppointment}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Citas de Hoy</h2>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Cargando...</p>
        ) : todayAppointments.length > 0 ? (
          <div className="space-y-3">
            {todayAppointments.map(a => (
              <AppointmentCard key={a.id} id={a.id} time={a.time} duration={a.duration} patientName={(a as any).patients?.name ?? "—"} patientPhone={(a as any).patients?.phone} type={a.type} status={a.status} date={a.date} source={(a as any).source} paymentStatus={(a as any).payment_status} onConfirm={handleConfirmPayment} onCancel={handleCancelAppointment} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No hay citas programadas para hoy</p>
          </div>
        )}
      </div>

      {upcoming.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Próximas Citas</h2>
          <div className="space-y-3">
            {upcoming.slice(0, 5).map(a => (
              <AppointmentCard key={a.id} id={a.id} time={a.time} duration={a.duration} patientName={(a as any).patients?.name ?? "—"} patientPhone={(a as any).patients?.phone} type={a.type} status={a.status} date={a.date} source={(a as any).source} paymentStatus={(a as any).payment_status} onConfirm={handleConfirmPayment} onCancel={handleCancelAppointment} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
