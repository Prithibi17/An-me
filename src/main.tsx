import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { InstallerWizard } from './components/installer/InstallerWizard';
import { UninstallWizard } from './components/installer/UninstallWizard';
import './index.css';

const isUninstallMode = window.location.search.includes('mode=uninstall') || (window as any).isUninstallMode;
const isInstallerMode = !isUninstallMode && (window.location.search.includes('mode=installer') || (window as any).isInstallerMode);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    {isUninstallMode ? (
      <UninstallWizard />
    ) : isInstallerMode ? (
      <InstallerWizard />
    ) : (
      <App />
    )}
  </React.StrictMode>
);
