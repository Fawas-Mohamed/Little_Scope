import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { useRoute } from './admin/ui/util.js';
import './styles/tokens.css';
import './styles/global.css';
import './styles/sections.css';

const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));

function Root() {
  const path = useRoute();
  return path.startsWith('/admin') ? <Suspense fallback={null}><AdminApp /></Suspense> : <App />;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><CartProvider><Root /></CartProvider></React.StrictMode>);
