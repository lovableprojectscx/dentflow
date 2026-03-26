import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useUpsertClinicSettings } from "@/hooks/use-data";
import { toast } from "sonner";

interface OnboardingDialogProps {
  open: boolean;
  onComplete: () => void;
}

export default function OnboardingDialog({ open, onComplete }: OnboardingDialogProps) {
  const [clinicName, setClinicName] = useState("");
  const [phone, setPhone] = useState("");
  const upsert = useUpsertClinicSettings();

  const handleSubmit = async () => {
    if (!clinicName.trim()) {
      toast.error("El nombre de la clínica es obligatorio");
      return;
    }
    try {
      await upsert.mutateAsync({
        clinic_name: clinicName.trim(),
        phone: phone.trim() || null,
      });
      toast.success("¡Bienvenido! Tu clínica está lista");
      onComplete();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl">¡Bienvenido a DentisFlow! 🦷</DialogTitle>
          <DialogDescription>
            Configura tu clínica para comenzar a gestionar tus citas.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Nombre de tu clínica <span className="text-destructive">*</span></Label>
            <Input
              placeholder="Ej: Clínica Dental Sonrisa"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Teléfono <span className="text-muted-foreground text-xs">(opcional)</span></Label>
            <Input
              placeholder="Ej: +51 999 999 999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={upsert.isPending}>
            {upsert.isPending ? "Guardando..." : "Comenzar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
