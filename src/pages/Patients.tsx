import { useState } from "react";
import { Search, User, Phone, Mail, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePatients } from "@/hooks/use-data";
import { NewPatientDialog } from "@/components/NewPatientDialog";

export default function Patients() {
  const [search, setSearch] = useState("");
  const { data: patients = [], isLoading } = usePatients();

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Pacientes</h1>
          <p className="text-sm text-muted-foreground mt-1">Directorio de pacientes de la clínica</p>
        </div>
        <NewPatientDialog />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar paciente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Cargando...</p>
      ) : (
        <div className="grid gap-4">
          {filtered.map(patient => (
            <div key={patient.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-shadow animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-secondary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{patient.name}</h3>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                    {patient.phone && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" />{patient.phone}
                      </span>
                    )}
                    {patient.email && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground truncate max-w-[180px]">
                        <Mail className="w-3 h-3 shrink-0" />{patient.email}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                    <Calendar className="w-3 h-3" />
                    {new Date(patient.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              <User className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No se encontraron pacientes</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
