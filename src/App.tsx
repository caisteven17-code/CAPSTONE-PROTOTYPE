'use client';

import React, { useState, useEffect } from 'react';
import { TopNav } from './components/layout/TopNav';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { BishopDashboard } from './views/BishopDashboard';
import { PriestDashboard } from './views/PriestDashboard';
import { ParishContainer } from './views/ParishContainer';
import { Settings } from './views/Settings';
import { Login } from './views/Login';
import { Home } from './views/Home';
import { Projects } from './views/Projects';
import { AITwin } from './views/AITwin';
import { Announcements } from './views/Announcements';
import { HealthTracker } from './views/HealthTracker';
import { ConsolidatedFinancial } from './views/ConsolidatedFinancial';
import { BottomNav } from './components/ui/BottomNav';
import { StewardChatbot } from './components/ui/StewardChatbot';
import { auth, AuthUser } from './firebase';
import { getAppRole, type AppRole } from './lib/access';

export type Role = AppRole;
export type Timeframe = '6m' | '1y' | 'all';

/**
 * Helper function to check if role has diocese-wide access
 * @param role - User role
 * @returns True if role is bishop or admin
 */
const isDioceseRole = (role: Role): boolean => role === 'bishop' || role === 'admin';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [role, setRole] = useState<Role>('bishop');
  const [activeTab, setActiveTab] = useState('home');
  const [settingsInitialTab, setSettingsInitialTab] = useState<string | undefined>(undefined);
  const [settingsReturnTab, setSettingsReturnTab] = useState<string | undefined>(undefined);
  const [timeframe, setTimeframe] = useState<Timeframe>('6m');
  const [year, setYear] = useState<number>(2026);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user: AuthUser | null) => {
      if (user?.role) {
        setRole(getAppRole(user.roleId || user.accessRole || user.role));
        setIsAuthenticated(true);
        
        // Set default tab based on role if it's the first load
        if (activeTab === 'home') {
          const roleDefaultTab: Record<Role, string> = {
            bishop: 'home',
            admin: 'home',
            parish_priest: 'parish-dashboard',
            parish_secretary: 'parish-dashboard',
            school: 'school',
            seminary: 'seminaries',
          };
          setActiveTab(roleDefaultTab[getAppRole(user.roleId || user.accessRole || user.role)]);
        }
      } else {
        setIsAuthenticated(false);
        setRole('bishop');
        setActiveTab('home');
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, [activeTab]);

  const handleLogin = (loggedInRole: Role) => {
    setRole(loggedInRole);
    setIsAuthenticated(true);
    setSettingsInitialTab(undefined);
    setSettingsReturnTab(undefined);
    
    // Set default tab based on role
    if (loggedInRole === 'parish_priest' || loggedInRole === 'parish_secretary') {
      setActiveTab('parish-dashboard');
    } else if (loggedInRole === 'school') {
      setActiveTab('school');
    } else if (loggedInRole === 'seminary') {
      setActiveTab('seminaries');
    } else {
      setActiveTab('home');
    }
  };

  /**
   * Handles user logout and state reset
   */
  const handleLogout = async () => {
    try {
      await auth.signOut();
      setIsAuthenticated(false);
      setRole('bishop');
      setActiveTab('home');
      setSettingsInitialTab(undefined);
      setSettingsReturnTab(undefined);
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: reset state even if signOut fails
      setIsAuthenticated(false);
      setRole('bishop');
      setActiveTab('home');
      setSettingsInitialTab(undefined);
      setSettingsReturnTab(undefined);
    }
  };

  const handleNavigate = (page: string) => {
    if (role === 'parish_priest' || role === 'parish_secretary') {
      const allowedParishPages = role === 'parish_priest'
        ? ['parish-dashboard', 'priest-dashboard', 'announcements', 'settings']
        : ['parish-dashboard', 'announcements', 'settings'];

      if (!allowedParishPages.includes(page)) {
        setActiveTab('parish-dashboard');
        return;
      }
    }

    setSettingsInitialTab(undefined);
    setSettingsReturnTab(page === 'settings' && activeTab !== 'settings' ? activeTab : undefined);
    setActiveTab(page);
  };

  const openAccountSettings = () => {
    setSettingsInitialTab('security');
    setSettingsReturnTab(activeTab);
    setActiveTab('settings');
  };

  const getDefaultTabForRole = (userRole: Role) => {
    if (userRole === 'parish_priest' || userRole === 'parish_secretary') return 'parish-dashboard';
    if (userRole === 'school') return 'school';
    if (userRole === 'seminary') return 'seminaries';
    return 'home';
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-church-light">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-church-green"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  /**
   * Renders the appropriate page component based on activeTab and user role.
   * Routes between Home, Dashboard, Projects, AITwin, and Settings pages.
   */
  const renderContent = () => {
    if (activeTab === 'settings') {
      return (
        <Settings
          onBack={() => handleNavigate(settingsReturnTab || getDefaultTabForRole(role))}
          onLogout={handleLogout}
          role={role}
          onNavigate={handleNavigate}
          initialTab={settingsInitialTab}
        />
      );
    }

    if (activeTab === 'home') {
      if (role === 'bishop' || role === 'admin') {
        return <Home onNavigate={handleNavigate} />;
      } else {
        // Redirect non-bishop roles to their respective dashboards if they somehow land on 'home'
        if (role === 'parish_priest' || role === 'parish_secretary') return <PriestDashboard role="priest" timeframe={timeframe} year={year} onYearChange={setYear} onNavigate={handleNavigate} onLogout={handleLogout} />;
        if (role === 'school') return <PriestDashboard role="school" timeframe={timeframe} year={year} onYearChange={setYear} onNavigate={handleNavigate} onLogout={handleLogout} />;
        if (role === 'seminary') return <PriestDashboard role="seminary" timeframe={timeframe} year={year} onYearChange={setYear} onNavigate={handleNavigate} onLogout={handleLogout} />;
      }
    }

    if (role === 'bishop' || role === 'admin') {
      switch (activeTab) {
        case 'dashboard':
          return <BishopDashboard initialEntityType="Parishes" timeframe={timeframe} year={year} onYearChange={setYear} />;
        case 'parish-dashboard':
          return <BishopDashboard initialEntityType="Parishes" timeframe={timeframe} year={year} onYearChange={setYear} />;
        case 'parish-health':
          return <BishopDashboard initialEntityType="Parishes" timeframe={timeframe} year={year} onYearChange={setYear} />;
        case 'parish-aitwin':
          return <AITwin mode="parish" />;
        case 'priest-dashboard':
          return <PriestDashboard role="priest" timeframe={timeframe} year={year} onYearChange={setYear} onNavigate={handleNavigate} onLogout={handleLogout} />;
        case 'priest-health':
          return <HealthTracker />;
        case 'priest-aitwin':
          return <AITwin mode="priest" />;
        case 'seminary-aitwin':
          return <AITwin mode="seminary" />;
        case 'school-aitwin':
          return <AITwin mode="school" />;
        case 'aitwin':
          return <AITwin mode="parish" />;
        case 'seminaries':
          return <BishopDashboard initialEntityType="Seminaries" timeframe={timeframe} year={year} onYearChange={setYear} />;
        case 'school':
          return <BishopDashboard initialEntityType="Diocesan Schools" timeframe={timeframe} year={year} onYearChange={setYear} />;
        case 'projects':
          return <Projects role={role} />;
        case 'announcements':
          return <Announcements />;
        default:
          return (
            <div className="flex items-center justify-center h-[calc(100vh-80px)]">
              <p className="text-church-grey">Content for {activeTab} is under construction.</p>
            </div>
          );
      }
    } else {
      switch (activeTab) {
        case 'dashboard':
        case 'parish-dashboard':
          if (role === 'parish_priest' || role === 'parish_secretary') {
            return <ParishContainer role={role} timeframe={timeframe} year={year} onYearChange={setYear} onNavigate={handleNavigate} onLogout={handleLogout} />;
          } else {
            return <PriestDashboard role="priest" timeframe={timeframe} year={year} onYearChange={setYear} onNavigate={handleNavigate} onLogout={handleLogout} />;
          }
        case 'parish-health':
          return <PriestDashboard role="priest" timeframe={timeframe} year={year} onYearChange={setYear} onNavigate={handleNavigate} onLogout={handleLogout} />;
        case 'priest-dashboard':
          if (role === 'parish_secretary') {
            return <ParishContainer role={role} timeframe={timeframe} year={year} onYearChange={setYear} onNavigate={handleNavigate} onLogout={handleLogout} />;
          }
          if (role === 'parish_priest') {
            return <ParishContainer role={role} timeframe={timeframe} year={year} onYearChange={setYear} onNavigate={handleNavigate} onLogout={handleLogout} />;
          }
          return <PriestDashboard role="priest" timeframe={timeframe} year={year} onYearChange={setYear} onNavigate={handleNavigate} onLogout={handleLogout} />;
        case 'priest-health':
          return <HealthTracker />;
        case 'priest-aitwin':
          return <AITwin mode="priest" />;
        case 'seminary-aitwin':
          return <AITwin mode="seminary" />;
        case 'school-aitwin':
          return <AITwin mode="school" />;
        case 'aitwin':
          return <AITwin mode={role === 'seminary' ? 'seminary' : role === 'school' ? 'school' : 'parish'} />;
        case 'seminaries':
          return <PriestDashboard role="seminary" timeframe={timeframe} year={year} onYearChange={setYear} onNavigate={handleNavigate} onLogout={handleLogout} />;
        case 'school':
          return <PriestDashboard role="school" timeframe={timeframe} year={year} onYearChange={setYear} onNavigate={handleNavigate} onLogout={handleLogout} />;
        case 'projects':
          return <Projects role={role} />;
        case 'announcements':
          return <Announcements />;
        case 'consolidated':
          return <ConsolidatedFinancial />;
        default:
          return (
            <div className="flex items-center justify-center h-[calc(100vh-80px)]">
              <p className="text-church-grey">Content for {activeTab} is under construction.</p>
            </div>
          );
      }
    }
  };

  const showSidebar = role === 'bishop' || role === 'admin' || role === 'parish_priest' || role === 'parish_secretary';
  const isDioceseAccess = isDioceseRole(role);

  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen bg-church-light font-sans">
        <TopNav 
          onNavigate={handleNavigate}
          onAccountSettings={openAccountSettings}
          role={role} 
          currentPage={activeTab} 
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
          year={year}
          onYearChange={setYear}
        />

        <div className="flex flex-row flex-1 min-h-0">
          {showSidebar && (
            <Sidebar 
              activeTab={activeTab} 
              onNavigate={handleNavigate} 
              role={role}
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
            />
          )}

          <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
            <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
              {renderContent()}
              <Footer />
            </main>
          </div>
        </div>

        <BottomNav activeTab={activeTab} onNavigate={handleNavigate} role={role} />
        <StewardChatbot />
      </div>
    </ErrorBoundary>
  );
}
