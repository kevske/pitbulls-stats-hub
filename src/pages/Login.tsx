import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { AuthService } from '@/services/authService';
import { useToast } from '../hooks/use-toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({
        title: 'Fehler',
        description: 'Bitte gib deine E-Mail-Adresse ein.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const result = await AuthService.sendMagicLink(email);

      if (result.success) {
        setEmailSent(true);
        toast({
          title: 'Link gesendet!',
          description: 'Prüfe deine E-Mails für den Anmelde-Link.',
        });
      } else {
        toast({
          title: 'Fehler',
          description: result.error || 'Link konnte nicht gesendet werden.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Etwas ist schiefgelaufen. Bitte versuche es erneut.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Link gesendet!</h2>
            <p className="text-muted-foreground mb-4">
              Prüfe deine E-Mails für den Anmelde-Link. Klicke auf den Link, um zum Admin-Bereich zu gelangen.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Der Link ist 24 Stunden gültig.
            </p>
            <Button
              variant="outline"
              onClick={() => setEmailSent(false)}
              className="w-full"
            >
              Neuen Link senden
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Spieler Admin Login
          </CardTitle>
          <CardDescription>
            Gib deine Spieler-E-Mail ein, um einen sicheren Anmelde-Link zu erhalten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="deine.email@beispiel.de"
                required
                disabled={loading}
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nur registrierte Spieler-E-Mails können auf den Admin-Bereich zugreifen.
              </AlertDescription>
            </Alert>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Wird gesendet...' : 'Anmelde-Link senden'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
