import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check token on mount and when menu opens
  useEffect(() => {
    if (isOpen) {
      setToken(localStorage.getItem("token"));
    }
  }, [isOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role"); // Optional cleanup
    setToken(null);
    setIsOpen(false);
    navigate("/signup");
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
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Backdrop overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMenu}
            className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar sliding from Right */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 bottom-0 w-[240px] z-50 bg-[#0d1117] border-l border-white/10 shadow-2xl flex flex-col pt-20 px-6 font-['Inter']"
          >
            {/* Close button (inside sidebar, top right) */}
            <button
              onClick={closeMenu}
              className="absolute top-5 right-5 p-2 text-white/60 hover:text-white transition-colors"
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <nav className="flex flex-col gap-6 text-white text-lg font-medium">
              <Link to="/" className="hover:text-primary transition-colors flex items-center gap-3">
                <span className="text-xl">📰</span> News
              </Link>
              <div className="h-[1px] w-full bg-white/10" />
              
              <Link to="/timelines" className="hover:text-primary transition-colors flex items-center gap-3">
                <span className="text-xl">⏱</span> Timelines
              </Link>
              <div className="h-[1px] w-full bg-white/10" />

              {!token ? (
                <Link to="/signup" className="hover:text-primary transition-colors flex items-center gap-3">
                  <span className="text-xl">👋</span> Signup
                </Link>
              ) : (
                <button 
                  onClick={handleLogout} 
                  className="text-left hover:text-red-400 transition-colors flex items-center gap-3 text-red-500"
                >
                  <span className="text-xl">🚪</span> Logout
                </button>
              )}
            </nav>

            <div className="mt-auto mb-10 text-center text-xs text-white/30">
              Newsie v1.0
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
