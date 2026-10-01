import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/App';
import { PrintReport } from '@/components/PrintReport';
import '@/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <PrintReport />
  </StrictMode>,
);
