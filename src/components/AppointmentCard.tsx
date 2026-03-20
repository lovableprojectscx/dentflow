import { Clock, User, MessageCircle, CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const statusConfig = {
  confirmed: { label: "Confirmada", className: "bg-success/10 text-success border-success/20" },
  pending: { label: "Pendiente", className: "bg-warning/10 text-warning border-warning/20" },
  cancelled: { label: "Cancelada", className: "bg-destructive/10 text-destructive border-destructive/20" },
  completed: { label: "Completada", className: "bg-muted text-muted-foreground border-border" },
};

interface AppointmentCardProps {
  id?: string;
  time: string;
  duration: number;
  patientName: string;
  patientPhone?: string | null;
  type: string;
  status: string;
  date?: string;
  source?: string;
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export function AppointmentCard({
  id,
  time,
  duration,
  patientName,
  patientPhone,
  type,
  status,
  date,
  source,
  onConfirm,
  onCancel,
}: AppointmentCardProps) {
  const statusKey = status as keyof typeof statusConfig;
  const config = statusConfig[statusKey] || statusConfig.pending;
  const isSolicitud = source === "public" && status === "pending";

  const handleWhatsApp = () => {
    if (!patientPhone) return;
    const cleanPhone = patientPhone.replace(/[\s\-\(\)]/g, "");
    const dateText = date
      ? new Date(date + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })
      : "próximamente";
    const message = encodeURIComponent(
      `¡Hola ${patientName}! 👋\n\nLe escribimos de la clínica para confirmar su cita:\n📅 ${dateText}\n🕐 ${time}\n💊 ${type}\n\n¿Confirma su asistencia?`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
  };

  return (
    <div className={cn(
      "bg-card rounded-xl border transition-shadow animate-fade-in",
      isSolicitud ? "border-warning/40 hover:shadow-md" : "border-border hover:shadow-sm"
    )}>
      {/* Main row */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-12 text-center shrink-0">
          <p className="text-base font-bold text-foreground leading-tight">{time}</p>
          <p className="text-xs text-muted-foreground">{duration}m</p>
        </div>
        <div className="w-px h-9 bg-border shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <p className="text-sm font-semibold text-foreground truncate">{patientName}</p>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground truncate">{type}</p>
          </div>
          {isSolicitud && (
            <p className="text-xs text-warning font-medium mt-0.5">Solicitud online</p>
          )}
        </div>
        {/* On larger screens show badge inline */}
        <Badge variant="outline" className={cn("text-xs font-medium shrink-0 hidden sm:flex", config.className)}>
          {config.label}
        </Badge>
      </div>

      {/* Actions row — always visible on mobile, merged on larger screens */}
      <div className={cn(
        "flex items-center gap-2 px-4 pb-3 pt-0",
        !patientPhone && !isSolicitud && "hidden"
      )}>
        {/* Badge on mobile */}
        <Badge variant="outline" className={cn("text-xs font-medium sm:hidden mr-auto", config.className)}>
          {config.label}
        </Badge>
        <div className="flex items-center gap-2 ml-auto">
          {patientPhone && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleWhatsApp}
                  className="h-8 gap-1.5 text-success hover:text-success hover:bg-success/10 border-success/30"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className="text-xs">WhatsApp</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Contactar por WhatsApp</TooltipContent>
            </Tooltip>
          )}
          {isSolicitud && id && onConfirm && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onConfirm(id)}
                  className="h-8 gap-1.5 text-success hover:text-success hover:bg-success/10 border-success/30"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span className="text-xs hidden sm:inline">Confirmar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Confirmar cita</TooltipContent>
            </Tooltip>
          )}
          {isSolicitud && id && onCancel && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCancel(id)}
                  className="h-8 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                >
                  <X className="w-3.5 h-3.5" />
                  <span className="text-xs hidden sm:inline">Rechazar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rechazar solicitud</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
