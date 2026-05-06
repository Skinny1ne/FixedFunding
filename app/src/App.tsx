import { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { useAuth } from '@/hooks/useAuth'; 
import { LandingPage } from '@/pages/LandingPage';
import { GuestPortal } from '@/pages/GuestPortal';
import { FrontDeskDashboard } from '@/pages/FrontDeskDashboard';
import { KitchenDisplay } from '@/pages/KitchenDisplay';
import { ServiceDashboard } from '@/pages/ServiceDashboard';
import { MaintenancePortal } from '@/pages/MaintenancePortal';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { TourGuideDashboard } from '@/pages/TourGuideDashboard';
import { SpaDashboard } from '@/pages/SpaDashboard';
import { RegistrationPage } from '@/pages/RegistrationPage'; // Standardized Name
import { Button } from '@/components/ui/button';
import { LogOut, User, Loader2, Moon, Sun } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { AccessibilityWidget } from '@/components/ui/AccessibilityWidget';
import { CentralizedClockProvider, CentralizedClock } from '@/components/ui/CentralizedClock';
import { ThemeProvider, useTheme } from 'next-themes';
import './App.css';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="text-gray-600 dark:text-gray-300 rounded-full"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

function RoleBasedRoute() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1e3a5f] flex flex-col items-center justify-center text-white">
        <Loader2 className="h-12 w-12 animate-spin mb-4" />
        <p className="text-lg font-serif">Loading Azure Horizon...</p>
      </div>
    );
  }

  // Redirect to Landing Page or Registration Page if not logged in
  if (!isAuthenticated || !user) {
    return isRegistering ? (
      <RegistrationPage onBack={() => setIsRegistering(false)} />
    ) : (
      <LandingPage onRegisterClick={() => setIsRegistering(true)} />
    );
  }

  const handleLogout = () => setShowLogoutConfirm(true);
  const confirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
  };
  const cancelLogout = () => setShowLogoutConfirm(false);

  const renderDashboard = () => {
    if (isAuthenticated && user && !user.role) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-md mx-auto">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
            <h3 className="text-lg font-bold mb-2">⚠️ Profile Not Found</h3>
            <p className="text-sm">We found your account, but your resort profile (role) could not be loaded from Firestore.</p>
            <p className="mt-2 text-xs font-semibold">Possible Reasons:</p>
            <ul className="text-xs list-disc list-inside text-left mt-1 space-y-1">
              <li>Firestore Security Rules are blocking access</li>
              <li>You haven't clicked "Initialize System Database" yet</li>
              <li>Database sync is in progress</li>
            </ul>
          </div>
          <Button onClick={() => window.location.reload()} className="bg-[#1e3a5f]">Retry Connection</Button>
          <Button variant="ghost" onClick={() => logout()} className="text-gray-500">Back to Login</Button>
        </div>
      );
    }

    switch (user.role as string) {
      case 'guest': return <GuestPortal />;
      case 'front_desk': return <FrontDeskDashboard />;
      case 'chef': return <KitchenDisplay />;
      case 'waitstaff': 
      case 'delivery': return <ServiceDashboard />;
      case 'maintenance': return <MaintenancePortal />;
      case 'tour_guide': return <TourGuideDashboard />;
      case 'spa_staff': return <SpaDashboard />;
      case 'admin': return <AdminDashboard />;
      default: return <LandingPage onRegisterClick={() => setIsRegistering(true)} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
      <header className="bg-white dark:bg-slate-900 shadow-sm border-b border-gray-200 dark:border-slate-800 sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-serif font-semibold text-[#1e3a5f] dark:text-blue-400">Azure Horizon</span>
            </div>
            <div className="flex items-center space-x-4">
              <CentralizedClock />
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{user.name}</span>
                <span className="px-2 py-0.5 bg-[#1e3a5f] dark:bg-blue-600 text-white text-xs rounded-full capitalize">
                  {user.role?.replace('_', ' ')}
                </span>
              </div>
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-600 dark:text-gray-300">
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg w-11/12 max-w-sm">
            <p className="text-lg font-medium text-gray-800 dark:text-slate-100 mb-4 text-center">Are you sure you want to log out?</p>
            <div className="flex justify-center gap-2">
              <Button variant="secondary" size="sm" onClick={cancelLogout}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={confirmLogout}>Log out</Button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">{renderDashboard()}</main>

      <footer className="bg-[#1e3a5f] text-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>© 2026 Azure Horizon Resort.</p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <CentralizedClockProvider>
        <Router>
          <AuthProvider>
            <RoleBasedRoute />
            <AccessibilityWidget />
            <Toaster position="bottom-right" richColors />
          </AuthProvider>
        </Router>
      </CentralizedClockProvider>
    </ThemeProvider>
  );
}

export default App;