
import React, { useState, useCallback } from 'react';
import { ViewType, User } from './types';
import Layout from './components/Layout';
import FinanceCharts from './components/FinanceCharts';
import VoterPortal from './components/VoterPortal';
import AIFinanceExpert from './components/AIFinanceExpert';
import FundExplorer from './components/FundExplorer';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = useCallback((user: User) => {
    setCurrentUser(user);
    setActiveView('voter-portal');
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setActiveView('dashboard');
  }, []);

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <FinanceCharts />;
      case 'funds':
        return <FundExplorer />;
      case 'voter-login':
      case 'voter-portal':
        return <VoterPortal onLogin={handleLogin} currentUser={currentUser} />;
      case 'ai-analysis':
        return <AIFinanceExpert />;
      default:
        return <FinanceCharts />;
    }
  };

  return (
    <Layout 
      activeView={activeView} 
      setView={setActiveView} 
      user={currentUser}
      onLogout={handleLogout}
    >
      <div className="animate-in fade-in zoom-in duration-500">
        {renderContent()}
      </div>
    </Layout>
  );
};

export default App;
