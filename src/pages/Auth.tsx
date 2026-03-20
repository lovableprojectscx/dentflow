import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Mode = "login" | "register" | "forgot";

const translateError = (msg: string) => {
  if (msg.includes("Invalid login credentials")) return "Email o contraseña incorrectos";
  if (msg.includes("Email not confirmed")) return "Confirma tu email antes de ingresar";
  if (msg.includes("User already registered")) return "Este email ya está registrado";
  if (msg.includes("Password should be at least")) return "La contraseña debe tener al menos 6 caracteres";
  if (msg.includes("Unable to validate email")) return "Email inválido";
  if (msg.includes("rate limit")) return "Demasiados intentos. Espera unos minutos";
  return msg;
};

export default function Auth() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("¡Bienvenido de vuelta!");
      } else if (mode === "register") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Cuenta creada. Revisa tu email para confirmar.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        toast.success("Te enviamos un email para restablecer tu contraseña");
        setMode("login");
      }
    } catch (error: any) {
      toast.error(translateError(error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6 animate-fade-in">
        <div className="text-center">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-2xl">D</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">DentFlow</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login" && "Inicia sesión en tu clínica"}
            {mode === "register" && "Crea tu cuenta gratuita"}
            {mode === "forgot" && "Restablecer contraseña"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="doctor@clinica.com"
              required
              autoComplete="email"
            />
          </div>

          {mode !== "forgot" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Contraseña</Label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-xs text-primary hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Cargando..." : mode === "login" ? "Iniciar Sesión" : mode === "register" ? "Crear Cuenta" : "Enviar email de recuperación"}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground space-y-2">
          {mode === "login" && (
            <p>
              ¿No tienes cuenta?{" "}
              <button onClick={() => setMode("register")} className="text-primary font-medium hover:underline">
                Regístrate gratis
              </button>
            </p>
          )}
          {mode === "register" && (
            <p>
              ¿Ya tienes cuenta?{" "}
              <button onClick={() => setMode("login")} className="text-primary font-medium hover:underline">
                Inicia sesión
              </button>
            </p>
          )}
          {mode === "forgot" && (
            <p>
              <button onClick={() => setMode("login")} className="text-primary font-medium hover:underline">
                ← Volver al inicio de sesión
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
