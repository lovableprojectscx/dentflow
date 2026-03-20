import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { usePatients, useCreateAppointment } from "@/hooks/use-data";
import { toast } from "sonner";
import { APPOINTMENT_TYPES } from "@/lib/constants";

export function NewAppointmentDialog() {
  const [open, setOpen] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState("");
  const [duration, setDuration] = useState("30");

  const { data: patients } = usePatients();
  const createAppointment = useCreateAppointment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !date || !time || !type) {
      toast.error("Por favor complete todos los campos");
      return;
    }

    try {
      await createAppointment.mutateAsync({
        patient_id: patientId,
        date,
        time,
        type,
        duration: parseInt(duration),
        status: "pending",
      });
      toast.success("Cita creada exitosamente");
      setOpen(false);
      setPatientId(""); setDate(""); setTime(""); setType("");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva Cita
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar Nueva Cita</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Paciente</Label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar paciente" /></SelectTrigger>
              <SelectContent>
                {patients?.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
                <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  {APPOINTMENT_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duración (min)</Label>
              <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} min="15" step="15" />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={createAppointment.isPending}>
            {createAppointment.isPending ? "Creando..." : "Confirmar Cita"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
