import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <>
      <div className="ambient-background"></div>
      <div className="min-h-[100vh] bg-transparent relative z-0 flex flex-col">
        <Sidebar />
        <main className="flex-1 pt-20 pb-32 px-4 md:px-8 md:ml-[260px] md:pt-24 max-w-full overflow-x-hidden transition-all duration-300">
          <div className="max-w-5xl mx-auto w-full animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}
