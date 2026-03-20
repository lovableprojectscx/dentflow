import { useState } from "react";
import { Calendar, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppointmentCard } from "@/components/AppointmentCard";
import { NewAppointmentDialog } from "@/components/NewAppointmentDialog";
import { useAppointments } from "@/hooks/use-data";

export default function Appointments() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: appointments = [], isLoading } = useAppointments();

  const filtered = appointments.filter(a => {
    const name = (a as any).patients?.name ?? "";
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || a.type.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const grouped = filtered.reduce((acc, a) => {
    if (!acc[a.date]) acc[a.date] = [];
    acc[a.date].push(a);
    return acc;
  }, {} as Record<string, typeof filtered>);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Citas</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestiona todas las citas de tu clínica</p>
        </div>
        <NewAppointmentDialog />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por paciente o tratamiento..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="confirmed">Confirmadas</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="cancelled">Canceladas</SelectItem>
            <SelectItem value="completed">Completadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Cargando citas...</p>
      ) : Object.keys(grouped).length > 0 ? (
        Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([date, apts]) => (
          <div key={date}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 capitalize">{formatDate(date)}</h3>
            <div className="space-y-3">
              {apts.sort((a, b) => a.time.localeCompare(b.time)).map(a => (
                <AppointmentCard key={a.id} id={a.id} time={a.time} duration={a.duration} patientName={(a as any).patients?.name ?? "—"} patientPhone={(a as any).patients?.phone} type={a.type} status={a.status} date={a.date} source={(a as any).source} notes={(a as any).notes} />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No se encontraron citas</p>
        </div>
      )}
    </div>
  );
}
