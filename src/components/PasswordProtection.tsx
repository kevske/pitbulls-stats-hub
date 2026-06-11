import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

interface PasswordProtectionProps {
  onSuccess: (password?: string) => void;
  correctPassword?: string; // Optional - if not provided, validation happens server-side
}

const PasswordProtection = ({ onSuccess, correctPassword }: PasswordProtectionProps) => {
  const [password, setPassword] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [waitTime, setWaitTime] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Innerhalb der Tab-Session nicht erneut fragen. Das Passwort selbst muss
  // mitgegeben werden, weil die Edge Functions es bei jeder Admin-Aktion
  // serverseitig prüfen — der frühere localStorage-Flag ohne Passwort führte
  // zu einer "eingeloggten" UI, deren Aktionen mit 401 fehlschlugen.
  // sessionStorage ist auf den Tab beschränkt und wird beim Schließen geleert.
  useEffect(() => {
    const storedPassword = sessionStorage.getItem('admin-password');
    if (storedPassword) {
      onSuccess(storedPassword);
    }
  }, [onSuccess]);

  useEffect(() => {
    if (waitTime > 0) {
      const timer = setTimeout(() => setWaitTime(waitTime - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [waitTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked) {
      toast.error("Zugriff gesperrt. Bitte kontaktieren Sie einen Administrator.");
      return;
    }

    if (waitTime > 0) {
      toast.error(`Bitte warten Sie ${waitTime} Sekunden.`);
      return;
    }

    // If correctPassword is provided, validate client-side (legacy behavior)
    // If not provided, pass password to callback for server-side validation
    if (correctPassword !== undefined) {
      if (password === correctPassword) {
        toast.success("Zugriff gewährt!");
        sessionStorage.setItem('admin-password', password);
        onSuccess(password);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= 4) {
          setIsLocked(true);
          toast.error("Zu viele Fehlversuche. Zugriff gesperrt.");
        } else {
          const waitTimes = [5, 10, 20];
          const wait = waitTimes[newAttempts - 1];
          setWaitTime(wait);
          toast.error(`Falsches Passwort. Bitte warten Sie ${wait} Sekunden.`);
        }
        setPassword("");
      }
    } else {
      // Server-side validation mode — die Edge Function prüft das Passwort
      // bei jeder Aktion; hier nur für die Tab-Session vorhalten.
      toast.success("Zugriff gewährt!");
      sessionStorage.setItem('admin-password', password);
      onSuccess(password);
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-card border border-primary/20 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-primary mb-2 text-center">
        Passwortgeschützter Bereich
      </h2>
      <p className="text-sm text-muted-foreground mb-6 text-center">
        Tipp: Spitzname unseres Abteilungsleiters
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Passwort eingeben"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={waitTime > 0 || isLocked}
            className="border-primary/30 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
            disabled={waitTime > 0 || isLocked}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        <Button
          type="submit"
          disabled={waitTime > 0 || isLocked}
          className="w-full"
        >
          {waitTime > 0
            ? `Warten (${waitTime}s)`
            : isLocked
              ? "Gesperrt"
              : "Zugriff"}
        </Button>
      </form>
      {attempts > 0 && !isLocked && (
        <p className="text-sm text-muted-foreground mt-4 text-center">
          Fehlversuche: {attempts} von 4
        </p>
      )}
    </div>
  );
};

export default PasswordProtection;
