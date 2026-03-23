import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlusCircle, ShieldAlert } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Clinic {
  clinic_id: string;
  user_id: string;
  clinic_name: string;
  phone: string | null;
  subscription_end_date: string | null;
  subscription_status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const { isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [extendingId, setExtendingId] = useState<string | null>(null);

  const { data: clinics = [], isLoading } = useQuery({
    queryKey: ["admin_clinics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_all_clinics");
      if (error) throw error;
      return (data as any) as Clinic[];
    },
    enabled: isAdmin,
  });

  const extendSubscription = useMutation({
    mutationFn: async ({ userId, months }: { userId: string; months: number }) => {
      const { error } = await supabase.rpc("admin_add_subscription_months", {
        p_target_user_id: userId,
        p_months: months,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Suscripción extendida", description: "La suscripción se actualizó correctamente." });
      queryClient.invalidateQueries({ queryKey: ["admin_clinics"] });
      setExtendingId(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setExtendingId(null);
    },
  });

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  const handleExtend = (userId: string, months: number) => {
    setExtendingId(`${userId}-${months}`);
    extendSubscription.mutate({ userId, months });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-full">
          <ShieldAlert className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel de Administrador</h1>
          <p className="text-muted-foreground">Gestiona las clínicas y sus suscripciones activas.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Empresas Suscritas</CardTitle>
          <CardDescription>Lista completa de las clínicas en DentFlow.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clínica</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Vence</TableHead>
                    <TableHead className="text-right">Extender Suscripción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clinics.map((clinic) => {
                    const isExpired = clinic.subscription_end_date && new Date(clinic.subscription_end_date) < new Date();
                    const badgeVariant = (clinic.subscription_status === 'active' && !isExpired ? 'default' : 'secondary') as "default" | "secondary" | "destructive" | "outline";
                    
                    return (
                      <TableRow key={clinic.clinic_id}>
                        <TableCell className="font-medium">{clinic.clinic_name || "Sin Nombre"}</TableCell>
                        <TableCell>{clinic.phone || "--"}</TableCell>
                        <TableCell>
                          <Badge variant={badgeVariant}>
                            {clinic.subscription_status === 'active' && !isExpired ? 'Activa' : 'Inactiva/Vencida'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {clinic.subscription_end_date 
                            ? new Date(clinic.subscription_end_date).toLocaleDateString()
                            : "Nunca activada"}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={extendingId === `${clinic.user_id}-1`}
                            onClick={() => handleExtend(clinic.user_id, 1)}
                          >
                            {extendingId === `${clinic.user_id}-1` ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <PlusCircle className="w-4 h-4 mr-1" />}
                            1 Mes
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={extendingId === `${clinic.user_id}-12`}
                            onClick={() => handleExtend(clinic.user_id, 12)}
                          >
                            {extendingId === `${clinic.user_id}-12` ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <PlusCircle className="w-4 h-4 mr-1" />}
                            1 Año
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {clinics.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No hay empresas registradas aún.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
