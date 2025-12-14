import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PasswordProtectionProps {
  onSuccess: () => void;
  correctPassword: string;
}

const PasswordProtection = ({ onSuccess, correctPassword }: PasswordProtectionProps) => {
  const [password, setPassword] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [waitTime, setWaitTime] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  // Check for existing authentication on mount
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('videos-authenticated');
    const authTime = localStorage.getItem('videos-auth-time');
    
    if (isAuthenticated === 'true' && authTime) {
      const authTimestamp = parseInt(authTime);
      const now = Date.now();
      
      // Check if authentication is still valid (24 hours)
      if (now - authTimestamp < 24 * 60 * 60 * 1000) {
        console.log('Videos page: Found valid authentication in localStorage');
        onSuccess();
        return;
      } else {
        // Clear expired authentication
        localStorage.removeItem('videos-authenticated');
        localStorage.removeItem('videos-auth-time');
        console.log('Videos page: Authentication expired, cleared from localStorage');
      }
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

    if (password === correctPassword) {
      toast.success("Zugriff gewährt!");
      
      // Store authentication in localStorage
      localStorage.setItem('videos-authenticated', 'true');
      localStorage.setItem('videos-auth-time', Date.now().toString());
      console.log('Videos page: Authentication stored in localStorage');
      
      onSuccess();
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
