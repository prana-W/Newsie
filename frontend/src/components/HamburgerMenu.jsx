import {useState, useEffect} from 'react';
import {Link, useNavigate, useLocation} from 'react-router-dom';
import {motion, AnimatePresence} from 'framer-motion';
import {fetchHotTimelines} from '@/lib/newsApi';

export default function HamburgerMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [token, setToken] = useState(null);
    const [hotTimelines, setHotTimelines] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();

    // Check token on mount and when menu opens
    useEffect(() => {
        if (isOpen) {
            setToken(localStorage.getItem('token'));
            fetchHotTimelines()
                .then((data) => setHotTimelines(data?.hot || []))
                .catch(() => setHotTimelines([]));
        }
    }, [isOpen]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role'); // Optional cleanup
        setToken(null);
        setIsOpen(false);
        navigate('/signup');
    };

    const closeMenu = () => setIsOpen(false);

    // Close menu on route change
    useEffect(() => {
        closeMenu();
    }, [location.pathname]);

    return (
        <>
            {/* Hamburger Button (Top Left) */}
            <button
                onClick={() => setIsOpen(true)}
                className="absolute top-5 right-5 z-40 p-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white cursor-pointer hover:bg-white/10 transition-colors"
                aria-label="Open Menu"
            >
                <svg
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="w-5 h-5"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                    />
                </svg>
            </button>

            {/* Backdrop overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        onClick={closeMenu}
                        className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar sliding from Right */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{x: '100%'}}
                        animate={{x: 0}}
                        exit={{x: '100%'}}
                        transition={{
                            type: 'spring',
                            damping: 28,
                            stiffness: 220,
                        }}
                        className="absolute top-0 right-0 bottom-0 w-[260px] z-50 bg-[#0a0a0f] border-l border-white/5 shadow-2xl flex flex-col sm:rounded-r-none md:rounded-r-[2.5rem]"
                    >
                        {/* Header / Logo */}
                        <div className="flex items-center justify-between px-6 pt-12 pb-6 border-b border-white/5 bg-[#0d1117]/50">
                            <span
                                className="text-white font-black text-xl tracking-tight"
                                style={{fontFamily: "'Georgia', serif"}}
                            >
                                newsie
                            </span>
                            <button
                                onClick={closeMenu}
                                className="p-2 -mr-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-all"
                            >
                                <svg
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    className="w-5 h-5"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* Nav Links */}
                        <nav className="flex flex-col px-4 pt-6 gap-2 text-white text-[15px] font-medium tracking-wide">
                            <Link
                                to="/"
                                className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 transition-all group"
                            >
                                <svg
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    className="w-5 h-5 text-white/50 group-hover:text-white transition-colors"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                                    />
                                </svg>
                                <span>News Feed</span>
                            </Link>

                            <Link
                                to="/timelines"
                                className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 transition-all group"
                            >
                                <svg
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    className="w-5 h-5 text-white/50 group-hover:text-[#a78bfa] transition-colors"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <span>Timelines</span>
                            </Link>

                            <div className="my-2 h-px w-full bg-white/5" />

                            {!token ? (
                                <Link
                                    to="/login"
                                    className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 transition-all group"
                                >
                                    <svg
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        className="w-5 h-5 text-white/50 group-hover:text-[#06d6a0] transition-colors"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        />
                                    </svg>
                                    <span>Sign Up / Log In</span>
                                </Link>
                            ) : (
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-all group text-left w-full"
                                >
                                    <svg
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        className="w-5 h-5 text-white/50 group-hover:text-red-400 transition-colors"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                        />
                                    </svg>
                                    <span className="text-white/80 group-hover:text-red-400 font-medium">
                                        Log Out
                                    </span>
                                </button>
                            )}
                        </nav>

                        <div className="px-4 pb-4">
                            <p className="text-[10px] uppercase tracking-widest text-white/35 mb-2 px-2">
                                Hot Timelines
                            </p>
                            <div className="space-y-2">
                                {hotTimelines.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setIsOpen(false);
                                            navigate(`/timelines/${item.id}`);
                                        }}
                                        className="w-full text-left rounded-xl border border-white/10 bg-white/5 hover:bg-white/[0.08] transition-colors px-3 py-2"
                                    >
                                        <p className="text-xs text-white/90 font-medium line-clamp-2">
                                            {item.title}
                                        </p>
                                        <p className="text-[10px] text-[#a78bfa] mt-1">
                                            {item.events} events
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-auto p-6 text-xs text-white/30 tracking-widest uppercase flex flex-col gap-1 items-center">
                            <span>Newsie © 2026</span>
                            <span className="text-[9px] opacity-70">
                                Finance in real-time
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
