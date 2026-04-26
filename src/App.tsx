import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import Tasks from './pages/Tasks';
import Dashboard from './pages/Dashboard';
import AddReel from './pages/AddReel';
import CalendarPage from './pages/Calendar';
import Notifications from './pages/Notifications';
import Tokens from './pages/Tokens';
import LienScore from './pages/LienScore';
import Shop from './pages/Shop';
import Login from './pages/Login';
import NotificationManager from './components/NotificationManager';

// Simple guard component
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'tasks', element: <Tasks /> },
      { path: 'login', element: <Login /> },
      { path: 'add-reel', element: <AddReel /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'notifications', element: <Notifications /> },
      { path: 'tokens', element: <Tokens /> },
      { path: 'lien-score', element: <LienScore /> },
      { path: 'shop', element: <Shop /> },
    ],
  },
]);

function App() {
  return (
    <>
      <NotificationManager />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
