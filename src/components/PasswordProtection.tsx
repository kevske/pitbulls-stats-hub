import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PasswordProtectionProps {
  onSuccess: (password?: string) => void;
  correctPassword?: string; // Optional - if not provided, validation happens server-side
}

const PasswordProtection = ({ onSuccess, correctPassword }: PasswordProtectionProps) => {
  const [password, setPassword] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [waitTime, setWaitTime] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

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
      // Server-side validation mode - pass password to callback
      toast.success("Zugriff gewährt!");
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
        <Input
          type="password"
          placeholder="Passwort eingeben"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={waitTime > 0 || isLocked}
          className="border-primary/30"
        />
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
