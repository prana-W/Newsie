import { Outlet, useLocation, matchPath } from 'react-router-dom';
import { Header, Footer } from './components';
import ChatBot from '@/components/ChatBot';
import VoiceChat from '@/components/VoiceChat';
import { NewsProvider, useNewsContext } from '@/context/NewsContext';
import HamburgerMenu from '@/components/HamburgerMenu';

/** Inner layout — has access to the NewsContext */
function LayoutInner() {
  const { currentCard } = useNewsContext();
  const location = useLocation();

  // Show VoiceChat only on Home (/) and Timeline Details (/timelines/:id)
  const showMic = location.pathname === '/' || matchPath({ path: "/timelines/:id" }, location.pathname);

  return (
    <div className="relative w-full h-full sm:w-full sm:max-w-md sm:h-screen sm:mx-auto sm:my-0 md:w-[400px] md:h-[860px] md:max-h-[95vh] md:rounded-[2.5rem] md:overflow-hidden md:shadow-[0_32px_80px_rgba(0,0,0,0.8)] md:border md:border-white/5 overflow-hidden">
      <HamburgerMenu />
      <ChatBot />
      {showMic && <VoiceChat getCurrentCard={() => currentCard} />}
      <Outlet />
    </div>
  );
}

export default function Layout() {
  return (
    <NewsProvider>
      <LayoutInner />
    </NewsProvider>
  );
}
