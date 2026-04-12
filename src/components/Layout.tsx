import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <>
      <div className="ambient-background"></div>
      <div className="min-h-screen bg-transparent relative z-0">
        <Sidebar />
      <main className="pt-24 pb-32 px-6 md:ml-[240px] max-w-5xl mx-auto min-h-screen">
        <Outlet />
      </main>
      </div>
    </>
  );
}
