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
        title: 'Error',
        description: 'Please enter your email address.',
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
          title: 'Magic Link Sent!',
          description: 'Check your email for the login link.',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to send magic link.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Magic Link Sent!</h2>
            <p className="text-gray-600 mb-4">
              Check your email for the login link. Click the link to access the admin panel.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              The link will expire in 24 hours.
            </p>
            <Button
              variant="outline"
              onClick={() => setEmailSent(false)}
              className="w-full"
            >
              Send Another Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Player Admin Login
          </CardTitle>
          <CardDescription>
            Enter your player email to receive a magic link for secure access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                disabled={loading}
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Only registered player emails can access the admin panel.
              </AlertDescription>
            </Alert>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send Magic Link'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
