import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Phone, Mail, User } from "lucide-react";
import { usePatientAppointments } from "@/hooks/use-data";
import { cn } from "@/lib/utils";
import type { Patient } from "@/hooks/use-data";

const statusConfig = {
  confirmed: { label: "Confirmada", className: "bg-success/10 text-success border-success/20" },
  pending: { label: "Pendiente", className: "bg-warning/10 text-warning border-warning/20" },
  cancelled: { label: "Cancelada", className: "bg-destructive/10 text-destructive border-destructive/20" },
  completed: { label: "Completada", className: "bg-muted text-muted-foreground border-border" },
};

interface PatientHistoryModalProps {
  patient: Patient | null;
  onClose: () => void;
}

export function PatientHistoryModal({ patient, onClose }: PatientHistoryModalProps) {
  const { data: appointments = [], isLoading } = usePatientAppointments(patient?.id ?? null);

  const formatDate = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  return (
    <Dialog open={!!patient} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Historial del Paciente</DialogTitle>
        </DialogHeader>

        {patient && (
          <div className="flex flex-col gap-4 overflow-hidden">
            {/* Info del paciente */}
            <div className="flex items-center gap-3 p-4 bg-muted/40 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{patient.name}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                  {patient.phone && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3" />{patient.phone}
                    </span>
                  )}
                  {patient.email && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3" />{patient.email}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">Total citas</p>
                <p className="text-xl font-bold text-foreground">{appointments.length}</p>
              </div>
            </div>

            {/* Historial */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />)}
                </div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sin citas registradas</p>
                </div>
              ) : (
                appointments.map(apt => {
                  const statusKey = apt.status as keyof typeof statusConfig;
                  const config = statusConfig[statusKey] || statusConfig.pending;
                  return (
                    <div key={apt.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
                      <div className="shrink-0 text-center w-12">
                        <p className="text-sm font-bold text-foreground tabular-nums">{apt.time.slice(0, 5)}</p>
                        <p className="text-xs text-muted-foreground">{apt.duration}m</p>
                      </div>
                      <div className="w-px h-8 bg-border shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{apt.type}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {formatDate(apt.date)}
                        </p>
                      </div>
                      <Badge variant="outline" className={cn("text-xs shrink-0", config.className)}>
                        {config.label}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
