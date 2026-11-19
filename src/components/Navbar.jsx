import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { RoleBadge } from './StatusBadge';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const isViewer = user?.role === 'Viewer';
  const isDashboardActive = location.pathname === '/dashboard' || location.pathname === '/';
  const isTicketsActive = location.pathname === '/tickets';
  const isKanbanActive = location.pathname === '/kanban';
  const isCreateActive = location.pathname === '/tickets/new';

  return (
    <header className="bg-slate-900 text-white shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Branding & Desktop Navigation */}
          <div className="flex items-center space-x-6">
            <Link
              to="/dashboard"
              className="flex items-center space-x-2 text-white font-bold text-lg tracking-tight hover:opacity-90 transition"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded bg-blue-600 text-white text-base font-black shadow-sm">
                IT
              </span>
              <span>Issue Tracker</span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden sm:flex items-center space-x-2">
              <Link
                to="/dashboard"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  isDashboardActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                Dashboard
              </Link>

              <Link
                to="/tickets"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  isTicketsActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                All Tickets
              </Link>

              <Link
                to="/kanban"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  isKanbanActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                Kanban
              </Link>

              {!isViewer && (
                <Link
                  to="/tickets/new"
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center space-x-1 ${
                    isCreateActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-600/90 text-white hover:bg-blue-600'
                  }`}
                >
                  <span className="text-base font-bold leading-none">+</span>
                  <span>Create</span>
                </Link>
              )}
            </nav>
          </div>

          {/* Right: Desktop Authenticated User Info & Logout */}
          <div className="hidden sm:flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-100">{user.username}</div>
                  <div className="text-xs text-slate-400">{user.email}</div>
                </div>
                <RoleBadge role={user.role} />
              </div>
            )}

            <button
              onClick={handleLogout}
              className="text-xs font-semibold px-3 py-1.5 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition cursor-pointer"
              title="Sign out of your account"
            >
              Sign out
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none transition cursor-pointer"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                /* Close Icon */
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                /* Hamburger Icon */
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Collapsible Navigation Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-800 bg-slate-900/95 px-4 pt-3 pb-4 space-y-3">
          {user && (
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="text-sm font-semibold text-white">{user.username}</div>
                <div className="text-xs text-slate-400">{user.email}</div>
              </div>
              <RoleBadge role={user.role} />
            </div>
          )}

          <div className="space-y-1">
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition ${
                isDashboardActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Dashboard
            </Link>

            <Link
              to="/tickets"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition ${
                isTicketsActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              All Tickets
            </Link>

            <Link
              to="/kanban"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition ${
                isKanbanActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Kanban
            </Link>

            {!isViewer && (
              <Link
                to="/tickets/new"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium transition ${
                  isCreateActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-600/90 text-white hover:bg-blue-600'
                }`}
              >
                + Create Ticket
              </Link>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
