import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, User, Phone, Mail, CreditCard } from "lucide-react";
import { useUpdatePatient, useDeletePatient } from "@/hooks/use-data";
import { toast } from "sonner";
import type { Patient } from "@/hooks/use-data";

interface EditPatientDialogProps {
  open: boolean;
  onClose: () => void;
  patient: Patient;
}

export function EditPatientDialog({ open, onClose, patient }: EditPatientDialogProps) {
  const [name, setName] = useState(patient.name);
  const [email, setEmail] = useState(patient.email ?? "");
  const [phone, setPhone] = useState(patient.phone ?? "");
  const [dni, setDni] = useState(patient.dni ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) {
      setName(patient.name);
      setEmail(patient.email ?? "");
      setPhone(patient.phone ?? "");
      setDni(patient.dni ?? "");
      setConfirmDelete(false);
    }
  }, [open, patient]);

  const update = useUpdatePatient();
  const remove = useDeletePatient();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) { toast.error("El nombre es obligatorio"); return; }
    
    try {
      await update.mutateAsync({ 
        id: patient.id, 
        name, 
        email: email || null, 
        phone: phone || null,
        dni: dni || null
      });
      toast.success("Paciente actualizado");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    try {
      await remove.mutateAsync(patient.id);
      toast.success("Paciente eliminado");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setConfirmDelete(false); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Paciente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Nombre completo
            </Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del paciente" required />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Teléfono
              </Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+51 999 999 999" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" /> DNI / Documento
              </Label>
              <Input value={dni} onChange={e => setDni(e.target.value)} placeholder="DNI del paciente" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Email
            </Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="paciente@email.com" />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={update.isPending}>
              {update.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={remove.isPending}
              className={confirmDelete
                ? "gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground shrink-0"
                : "gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive shrink-0"
              }
            >
              <Trash2 className="w-4 h-4" />
              {confirmDelete ? "¿Seguro?" : "Eliminar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
