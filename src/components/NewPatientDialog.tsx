import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useCreatePatient } from "@/hooks/use-data";
import { toast } from "sonner";

export function NewPatientDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const createPatient = useCreatePatient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) { toast.error("El nombre es obligatorio"); return; }

    try {
      await createPatient.mutateAsync({ name, email: email || null, phone: phone || null });
      toast.success("Paciente agregado");
      setOpen(false);
      setName(""); setEmail(""); setPhone("");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Paciente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Paciente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Nombre completo</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del paciente" required />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="paciente@email.com" />
          </div>
          <div className="space-y-2">
            <Label>Teléfono</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+52 55 1234 5678" />
          </div>
          <Button type="submit" className="w-full" disabled={createPatient.isPending}>
            {createPatient.isPending ? "Guardando..." : "Agregar Paciente"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
