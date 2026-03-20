import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Patient = Tables<"patients">;
export type Appointment = Tables<"appointments">;
export type ClinicSettings = Tables<"clinic_settings">;

export function usePatients() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["patients", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("*").order("name");
      if (error) throw error;
      return data as Patient[];
    },
    enabled: !!user,
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (patient: Omit<TablesInsert<"patients">, "user_id">) => {
      const { data, error } = await supabase.from("patients").insert({ ...patient, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patients"] }),
  });
}

export function useAppointments(date?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["appointments", user?.id, date],
    queryFn: async () => {
      let query = supabase.from("appointments").select("*, patients(name, phone)").order("date").order("time");
      if (date) query = query.eq("date", date);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (apt: Omit<TablesInsert<"appointments">, "user_id">) => {
      const { data, error } = await supabase.from("appointments").insert({ ...apt, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<TablesInsert<"appointments">>) => {
      const { data, error } = await supabase.from("appointments").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

export function useClinicSettings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["clinic_settings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("clinic_settings").select("*").maybeSingle();
      if (error) throw error;
      return data as ClinicSettings | null;
    },
    enabled: !!user,
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

export function usePatientAppointments(patientId: string | null) {
  return useQuery({
    queryKey: ["appointments", "patient", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", patientId!)
        .order("date", { ascending: false });
      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!patientId,
  });
}

export function useUpsertClinicSettings() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (settings: Omit<TablesInsert<"clinic_settings">, "user_id">) => {
      const { data, error } = await supabase.from("clinic_settings").upsert({ ...settings, user_id: user!.id }, { onConflict: "user_id" }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clinic_settings"] }),
  });
}
