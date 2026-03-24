import {Outlet} from 'react-router-dom';
import {Header, Footer} from './components';
import {Toaster} from '@/components/ui/sonner';

function Layout() {
    return (
        <>
            <div className="relative w-full h-full md:w-[400px] md:h-[860px] md:max-h-[95vh] md:rounded-[2.5rem] md:overflow-hidden md:shadow-[0_32px_80px_rgba(0,0,0,0.8)] md:border md:border-white/5">
        <Outlet />
      </div>
        </>
    );
}

export default Layout;
