import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, BookOpen } from 'lucide-react';

const Playbook = () => {
  const [showPasswordAlert, setShowPasswordAlert] = useState(true);

  useEffect(() => {
    // Show the password alert for 5 seconds, then allow dismissal
    const timer = setTimeout(() => {
      setShowPasswordAlert(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Layout>
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

      {/* Page Content */}
      <div className="w-full h-[calc(100vh-120px)]">
        <iframe
          src="https://share.coachcanvas.app/5vazd-isn06"
          className="w-full h-full border-0 rounded-lg shadow-lg"
          title="Playbook"
          allowFullScreen
          loading="eager"
        />
      </div>
    </Layout>
  );
};

export default Playbook;
