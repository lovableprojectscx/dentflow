import { Clock, Users, MessageCircle, CheckCircle, X, Calendar, Phone } from "lucide-react";
import { useAppointments, useUpdateAppointment, useClinicSettings } from "@/hooks/use-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function WaitingList() {
  const { data: allAppointments = [], isLoading } = useAppointments();
  const { data: settings } = useClinicSettings();
  const updateAppointment = useUpdateAppointment();

  const waitingList = allAppointments
    .filter(a => (a as any).source === "public" && a.status === "pending")
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const handleConfirm = async (id: string) => {
    try {
      await updateAppointment.mutateAsync({ id, status: "confirmed" });
      toast.success("Paciente confirmado — horario ahora ocupado");
    } catch {
      toast.error("Error al confirmar");
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await updateAppointment.mutateAsync({ id, status: "cancelled" });
      toast.success("Solicitud rechazada");
    } catch {
      toast.error("Error al rechazar");
    }
  };

  const handleWhatsApp = (patientName: string, patientPhone: string, date: string, time: string, type: string) => {
    const cleanPhone = patientPhone.replace(/[\s\-\(\)]/g, "");
    const dateText = new Date(date + "T12:00:00").toLocaleDateString("es-ES", {
      weekday: "long", day: "numeric", month: "long",
    });
    
    let paymentLines: string[] = [];
    if (settings && ((settings as any).payment_bcp || (settings as any).payment_yape || (settings as any).payment_plin)) {
      paymentLines.push("");
      paymentLines.push("*Datos de pago para confirmar:*");
      if ((settings as any).payment_bcp) paymentLines.push(`🏦 BCP: ${(settings as any).payment_bcp}`);
      if ((settings as any).payment_yape) paymentLines.push(`📲 Yape: ${(settings as any).payment_yape}`);
      if ((settings as any).payment_plin) paymentLines.push(`📲 Plin: ${(settings as any).payment_plin}`);
    }

    const lines = [
      `¡Hola ${patientName}! \u{1F44B}`,
      "",
      "Le escribimos de la clínica para coordinar su cita:",
      `\u{1F4C5} Fecha: ${dateText}`,
      `\u{1F550} Hora: ${time}`,
      `\u{1F48A} Tratamiento: ${type}`,
      ...paymentLines,
      "",
      "Para confirmar su cita, por favor envíenos el comprobante de pago. ¡Gracias!"
    ];

    const message = encodeURIComponent(lines.join('\r\n'));
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    if (dateStr === today) return "Hoy";
    if (dateStr === tomorrow) return "Mañana";
    return date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Lista de Espera</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pacientes que reservaron online y esperan confirmación
          </p>
        </div>
        {waitingList.length > 0 && (
          <Badge className="bg-warning/10 text-warning border border-warning/30 text-sm px-3 py-1">
            {waitingList.length} pendiente{waitingList.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Instrucciones */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-foreground space-y-1">
        <p className="font-semibold">¿Cómo funciona?</p>
        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
          <li>Toca <span className="font-medium text-foreground">WhatsApp</span> para contactar al paciente y coordinar el pago</li>
          <li>Una vez que el paciente pague y confirme, toca <span className="font-medium text-foreground">Confirmar</span></li>
          <li>El horario quedará bloqueado automáticamente como ocupado</li>
        </ol>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : waitingList.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Users className="w-14 h-14 mx-auto mb-4 opacity-30" />
          <p className="font-medium text-foreground">Sin solicitudes pendientes</p>
          <p className="text-sm mt-1">Cuando alguien reserve online aparecerá aquí</p>
        </div>
      ) : (
        <div className="space-y-3">
          {waitingList.map((a) => {
            const patient = (a as any).patients;
            const name = patient?.name ?? "—";
            const phone = patient?.phone ?? "";

            return (
              <div
                key={a.id}
                className="bg-card border border-warning/30 rounded-xl overflow-hidden hover:shadow-md transition-shadow animate-fade-in"
              >
                {/* Info principal */}
                <div className="flex items-center gap-3 p-4">
                  {/* Fecha/hora */}
                  <div className="shrink-0 text-center w-14">
                    <p className="text-base font-bold text-foreground leading-tight">{a.time.slice(0, 5)}</p>
                    <p className="text-xs text-muted-foreground">{a.duration}m</p>
                  </div>

                  <div className="w-px h-10 bg-border shrink-0" />

                  {/* Datos del paciente */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{name}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span className="capitalize">{formatDate(a.date)}</span>
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {a.type}
                      </span>
                      {phone && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className={cn(
                  "flex gap-2 px-4 pb-4 pt-0",
                  !phone && "justify-end"
                )}>
                  {phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleWhatsApp(name, phone, a.date, a.time.slice(0, 5), a.type)}
                      className="flex-1 sm:flex-none gap-2 text-success border-success/30 hover:bg-success/10 hover:text-success"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleConfirm(a.id)}
                    disabled={updateAppointment.isPending}
                    className="flex-1 sm:flex-none gap-2 text-primary border-primary/30 hover:bg-primary/10 hover:text-primary"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Confirmar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancel(a.id)}
                    disabled={updateAppointment.isPending}
                    className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                    <span className="hidden sm:inline">Rechazar</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
