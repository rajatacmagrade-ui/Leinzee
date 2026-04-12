import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Tasks from './pages/Tasks';
import AddReel from './pages/AddReel';
import CalendarPage from './pages/Calendar';
import Notifications from './pages/Notifications';
import Tokens from './pages/Tokens';
import LienScore from './pages/LienScore';
import Shop from './pages/Shop';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/tasks" replace /> },
      { path: 'tasks', element: <Tasks /> },
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
  return <RouterProvider router={router} />;
}

export default App;
