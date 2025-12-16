import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, BookOpen } from 'lucide-react';

const Playbook = () => {
  const [showPasswordAlert, setShowPasswordAlert] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Show the password alert for 5 seconds, then allow dismissal
    const timer = setTimeout(() => {
      setShowPasswordAlert(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Password Alert */}
      {showPasswordAlert && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
          <Alert className="bg-primary text-primary-foreground border-primary shadow-lg">
            <BookOpen className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Selbes Passwort wie immer</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPasswordAlert(false)}
                className="text-primary-foreground hover:bg-primary/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Playbook</h1>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="hidden md:flex"
            >
              Zurück zur Startseite
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Embedded iframe */}
      <div className="container mx-auto px-4 py-6">
        <div className="w-full h-[calc(100vh-120px)]">
          <iframe
            src="https://share.coachcanvas.app/5vazd-isn06"
            className="w-full h-full border-0 rounded-lg shadow-lg"
            title="Playbook"
            allowFullScreen
            loading="eager"
          />
        </div>
      </div>
    </div>
  );
};

export default Playbook;
