import React, { useState, useEffect } from 'react';
import { AuthService } from '@/services/authService';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { User, LogOut, Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const [playerInfo, setPlayerInfo] = useState<any>(null);

  useEffect(() => {
    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = AuthService.onAuthStateChange(async (session) => {
      if (session) {
        const userData = await AuthService.getCurrentUser();
        setUser(userData?.user);
        setPlayerInfo(userData?.playerInfo);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setPlayerInfo(null);
        setIsAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('AuthGuard: Checking authentication...');
      const userData = await AuthService.getCurrentUser();
      console.log('AuthGuard: User data received:', userData);
      if (userData) {
        setUser(userData.user);
        setPlayerInfo(userData.playerInfo);
        setIsAuthenticated(true);
        console.log('AuthGuard: User authenticated successfully');
      } else {
        setIsAuthenticated(false);
        console.log('AuthGuard: No user data found');
      }
    } catch (error) {
      console.error('AuthGuard: Error checking auth:', error);
      setIsAuthenticated(false);
    }
  };

  const handleSignOut = async () => {
    await AuthService.signOut();
    setIsAuthenticated(false);
    setUser(null);
    setPlayerInfo(null);
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Checking authentication...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Authentication Required
            </CardTitle>
            <CardDescription>
              You need to log in with your player email to access the admin panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => window.location.href = '/login'}
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* User info header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-600" />
              <span className="font-medium">
                {playerInfo ?
                  `${playerInfo.first_name} ${playerInfo.last_name}` :
                  user?.email
                }
              </span>
            </div>
            {playerInfo && (
              <span className="text-sm text-gray-500">
                ({playerInfo.position || 'Player'} #{playerInfo.jersey_number || 'N/A'})
              </span>
            )}
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main content */}
      {children}
    </div>
  );
};

export default AuthGuard;
