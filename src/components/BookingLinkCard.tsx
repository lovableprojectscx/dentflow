import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function BookingLinkCard() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const bookingUrl = `${window.location.origin}/reservar/${user.id}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    toast.success("Enlace copiado");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 animate-fade-in">
      <h3 className="font-semibold text-foreground mb-1">🔗 Enlace de Reservas</h3>
      <p className="text-xs text-muted-foreground mb-3">
        Comparte este enlace con tus pacientes o incrústalo en tu landing page
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-lg text-foreground truncate min-w-0">
          {bookingUrl}
        </code>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" onClick={handleCopy} className="flex-1 sm:flex-none gap-2 h-9">
            {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            <span className="text-xs sm:hidden">{copied ? "Copiado" : "Copiar enlace"}</span>
          </Button>
          <Button variant="outline" size="icon" asChild className="shrink-0 h-9 w-9">
            <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
