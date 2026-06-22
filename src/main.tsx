import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import ProblemView from './components/ProblemView';
import AdminPage from './components/AdminPage';
import Dashboard from './components/Dashboard';
import './index.css';

const router = createBrowserRouter([
  {
    element: <ThemeProvider><Layout /></ThemeProvider>,
    children: [
      { path: '/', element: <ProblemView /> },
      { path: '/problem/:id', element: <ProblemView /> },
      { path: '/admin', element: <AdminPage /> },
      { path: '/dashboard', element: <Dashboard /> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
