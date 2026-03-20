import { useState } from "react";
import { Search, User, Phone, Mail, Calendar, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePatients } from "@/hooks/use-data";
import { NewPatientDialog } from "@/components/NewPatientDialog";
import { PatientHistoryModal } from "@/components/PatientHistoryModal";
import type { Patient } from "@/hooks/use-data";

export default function Patients() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Patient | null>(null);
  const { data: patients = [], isLoading } = usePatients();

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.phone ?? "").includes(search)
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Pacientes</h1>
          <p className="text-sm text-muted-foreground mt-1">Toca un paciente para ver su historial</p>
        </div>
        <NewPatientDialog />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nombre, teléfono..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(patient => (
            <button
              key={patient.id}
              onClick={() => setSelected(patient)}
              className="bg-card border border-border rounded-xl p-4 hover:shadow-sm hover:border-primary/30 transition-all animate-fade-in text-left w-full"
            >
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
                      <span className="flex items-center gap-1 text-xs text-muted-foreground truncate max-w-[160px]">
                        <Mail className="w-3 h-3 shrink-0" />{patient.email}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <p className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(patient.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </p>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              <User className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No se encontraron pacientes</p>
            </div>
          )}
        </div>
      )}

      <PatientHistoryModal patient={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
