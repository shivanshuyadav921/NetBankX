import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NetworkSimProvider } from './context/NetworkSimContext';
import { AppRoutes } from './routes/AppRoutes';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NetworkSimProvider>
          <AppRoutes />
        </NetworkSimProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
