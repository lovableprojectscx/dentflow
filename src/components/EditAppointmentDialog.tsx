import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { useUpdateAppointment, useDeleteAppointment } from "@/hooks/use-data";
import { toast } from "sonner";
import { APPOINTMENT_TYPES } from "@/lib/constants";
import { FollowUpAlert } from "./FollowUpAlert";

interface EditAppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  appointment: {
    id: string;
    date: string;
    time: string;
    type: string;
    duration: number;
    status: string;
    notes?: string | null;
    patientId: string;
    patientName: string;
    patientPhone?: string | null;
  };
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pendiente" },
  { value: "confirmed", label: "Confirmada" },
  { value: "completed", label: "Completada" },
  { value: "cancelled", label: "Cancelada" },
];

export function EditAppointmentDialog({ open, onClose, appointment }: EditAppointmentDialogProps) {
  const [date, setDate] = useState(appointment.date);
  const [time, setTime] = useState(appointment.time.slice(0, 5));
  const [type, setType] = useState(appointment.type);
  const [duration, setDuration] = useState(String(appointment.duration));
  const [status, setStatus] = useState(appointment.status);
  const [notes, setNotes] = useState(appointment.notes ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);

  // Reset state when a different appointment is opened
  useEffect(() => {
    if (open) {
      setDate(appointment.date);
      setTime(appointment.time.slice(0, 5));
      setType(appointment.type);
      setDuration(String(appointment.duration));
      setStatus(appointment.status);
      setNotes(appointment.notes ?? "");
      setConfirmDelete(false);
    }
  }, [open, appointment.id]);

  const update = useUpdateAppointment();
  const remove = useDeleteAppointment();

  const handleSave = async () => {
    const selectedDateTime = new Date(`${date}T${time}:00`);
    if ((date !== appointment.date || time !== appointment.time.slice(0, 5)) && selectedDateTime < new Date()) {
      toast.error("No se puede reprogramar la cita para una fecha u hora en el pasado");
      return;
    }

    try {
      await update.mutateAsync({ id: appointment.id, date, time, type, duration: parseInt(duration), status, notes: notes || null });
      toast.success("Cita actualizada");
      if (status === "completed" && appointment.status !== "completed") {
        setShowFollowUp(true);
      } else {
        onClose();
      }
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    try {
      await remove.mutateAsync(appointment.id);
      toast.success("Cita eliminada");
      onClose();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setConfirmDelete(false); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Cita</DialogTitle>
        </DialogHeader>

        <FollowUpAlert
          open={showFollowUp}
          onClose={onClose}
          patientId={appointment.patientId}
          patientName={appointment.patientName}
          patientPhone={appointment.patientPhone}
        />
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {APPOINTMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duración (min)</Label>
              <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} min="15" step="15" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observaciones de la cita..." />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} className="flex-1" disabled={update.isPending}>
              {update.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={remove.isPending}
              className={confirmDelete
                ? "gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                : "gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
              }
            >
              <Trash2 className="w-4 h-4" />
              {confirmDelete ? "¿Seguro?" : "Eliminar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
