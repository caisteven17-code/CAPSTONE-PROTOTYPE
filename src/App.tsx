'use client';

import React, { useState, useEffect } from 'react';
import { TopNav } from './components/layout/TopNav';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { BishopDashboard } from './views/BishopDashboard';
import { PriestDashboard } from './views/PriestDashboard';
import { Settings } from './views/Settings';
import { Login } from './views/Login';
import { Home } from './views/Home';
import { Projects } from './views/Projects';
import { AITwin } from './views/AITwin';
import { Announcements } from './views/Announcements';
import { HealthTracker } from './views/HealthTracker';
import { ConsolidatedFinancial } from './views/ConsolidatedFinancial';
import { AuditLog } from './views/AuditLog';
import { BottomNav } from './components/ui/BottomNav';
import { StewardChatbot } from './components/ui/StewardChatbot';
import { auth, AuthUser } from './firebase';

export type Role = 'bishop' | 'admin' | 'priest' | 'school' | 'seminary';
export type Timeframe = '6m' | '1y' | 'all';

const toPriestTimeframe = (tf: Timeframe): '3m' | '6m' | '12m' | undefined => {
  if (tf === '6m') return '6m';
  if (tf === '1y') return '12m';
  return undefined;
};

const appRoleToRole = (appRole: string): Role => {
  const map: Record<string, Role> = {
    bishop:           'bishop',
    admin:            'admin',
    parish_priest:    'priest',
    parish_secretary: 'priest',
    school:           'school',
    school_registrar: 'school',
    seminary:         'seminary',
    seminary_rector:  'seminary',
    diocese_admin:    'admin',
  };
  return map[appRole] ?? 'priest';
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [role, setRole] = useState<Role>('bishop');
  const [activeTab, setActiveTab] = useState('home');
  const [timeframe, setTimeframe] = useState<Timeframe>('6m');
  const [year, setYear] = useState<number>(2026);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user: AuthUser | null) => {
      if (user?.role) {
        const internalRole = appRoleToRole(user.role);
        setRole(internalRole);
        setIsAuthenticated(true);

        if (activeTab === 'home') {
          const roleDefaultTab: Record<Role, string> = {
            bishop:   'home',
            admin:    'home',
            priest:   'parish-dashboard',
            school:   'school',
            seminary: 'seminaries',
          };
          setActiveTab(roleDefaultTab[internalRole]);
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
    
    // Set default tab based on role
    if (loggedInRole === 'priest') {
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
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: reset state even if signOut fails
      setIsAuthenticated(false);
      setRole('bishop');
      setActiveTab('home');
    }
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
    // Administration sub-routes — each deep-links to a specific Settings tab
    const adminTabMap: Record<string, string> = {
      'admin-user-management': 'user-management',
      'admin-user-role':       'role-control',
      'admin-entity':          'entity-management',
      'admin-data':            'data-management',
      'admin-security':        'security',
      'settings':              'user-management',
      'profile':               'profile',
    };
    if (adminTabMap[activeTab] !== undefined) {
      return <Settings onBack={() => setActiveTab('home')} onLogout={handleLogout} role={role} onNavigate={(page) => setActiveTab(page)} initialTab={adminTabMap[activeTab]} />;
    }

    if (activeTab === 'home') {
      if (role === 'bishop' || role === 'admin') {
        return <Home onNavigate={(page) => setActiveTab(page)} />;
      } else {
        // Redirect non-bishop roles to their respective dashboards if they somehow land on 'home'
        if (role === 'priest') return <BishopDashboard initialEntityType="Parishes" initialEntityFilter="San Isidro Labrador Parish" lockEntityFilter timeframe={timeframe} year={year} onYearChange={setYear} />;
        if (role === 'school') return <PriestDashboard role="school" timeframe={toPriestTimeframe(timeframe)} year={year} onYearChange={setYear} onNavigate={setActiveTab} onLogout={handleLogout} />;
        if (role === 'seminary') return <PriestDashboard role="seminary" timeframe={toPriestTimeframe(timeframe)} year={year} onYearChange={setYear} onNavigate={setActiveTab} onLogout={handleLogout} />;
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
          return <PriestDashboard role="priest" dashboardContext="priest" timeframe={toPriestTimeframe(timeframe)} year={year} onYearChange={setYear} onNavigate={setActiveTab} onLogout={handleLogout} />;
        case 'priest-health':
          return <HealthTracker />;
        case 'priest-aitwin':
          return <AITwin mode="priest" />;
        case 'seminaries':
          return <BishopDashboard initialEntityType="Seminaries" timeframe={timeframe} year={year} onYearChange={setYear} />;
        case 'seminary-aitwin':
          return <AITwin mode="seminary" />;
        case 'school':
          return <BishopDashboard initialEntityType="Diocesan Schools" timeframe={timeframe} year={year} onYearChange={setYear} />;
        case 'school-aitwin':
          return <AITwin mode="school" />;
        case 'projects':
          return <Projects role={role} />;
        case 'announcements':
          return <Announcements />;
        case 'audit-log':
          return role === 'admin' ? <AuditLog /> : null;
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
          if (role === 'priest') {
            return <BishopDashboard initialEntityType="Parishes" initialEntityFilter="San Isidro Labrador Parish" lockEntityFilter timeframe={timeframe} year={year} onYearChange={setYear} />;
          }
          return <PriestDashboard role={role} timeframe={toPriestTimeframe(timeframe)} year={year} onYearChange={setYear} onNavigate={setActiveTab} onLogout={handleLogout} />;
        case 'parish-health':
          if (role === 'priest') {
            return <BishopDashboard initialEntityType="Parishes" initialEntityFilter="San Isidro Labrador Parish" lockEntityFilter timeframe={timeframe} year={year} onYearChange={setYear} />;
          }
          return <PriestDashboard role={role} timeframe={toPriestTimeframe(timeframe)} year={year} onYearChange={setYear} onNavigate={setActiveTab} onLogout={handleLogout} />;
        case 'parish-aitwin':
          return <AITwin mode="parish" />;
        case 'priest-dashboard':
          return <PriestDashboard role={role} dashboardContext={role === 'priest' ? 'priest' : undefined} timeframe={toPriestTimeframe(timeframe)} year={year} onYearChange={setYear} onNavigate={setActiveTab} onLogout={handleLogout} />;
        case 'priest-health':
          return <HealthTracker />;
        case 'priest-aitwin':
          return <AITwin mode="priest" />;
        case 'seminaries':
          return <PriestDashboard role="seminary" timeframe={toPriestTimeframe(timeframe)} year={year} onYearChange={setYear} onNavigate={setActiveTab} onLogout={handleLogout} />;
        case 'seminary-aitwin':
          return <AITwin mode="seminary" />;
        case 'school':
          return <PriestDashboard role="school" timeframe={toPriestTimeframe(timeframe)} year={year} onYearChange={setYear} onNavigate={setActiveTab} onLogout={handleLogout} />;
        case 'school-aitwin':
          return <AITwin mode="school" />;
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

  return (
    <ErrorBoundary>
      <div className="flex flex-row min-h-screen bg-church-light font-sans">
        <Sidebar
          activeTab={activeTab}
          onNavigate={setActiveTab}
          onLogout={handleLogout}
          role={role}
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
        />
        
        <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
          <TopNav 
            onNavigate={(page) => setActiveTab(page)} 
            role={role} 
            currentPage={activeTab} 
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            year={year}
            onYearChange={setYear}
            onLogout={handleLogout}
          />
          <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
            {renderContent()}
            <Footer />
          </main>
        </div>
        
        <BottomNav activeTab={activeTab} onNavigate={setActiveTab} />
        <StewardChatbot />
      </div>
    </ErrorBoundary>
  );
}
