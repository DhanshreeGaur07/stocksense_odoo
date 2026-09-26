import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { DbStatus } from '@/components/DbStatus';
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  History,
  Settings,
  LogOut,
  ChevronDown,
  Boxes,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/operations', label: 'Operations', icon: ArrowLeftRight },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/move-history', label: 'Move History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Layout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const initials = (profile?.name || 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="group flex items-center gap-2.5 transition-transform duration-200 hover:scale-[1.02]">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-glow-sm transition-shadow group-hover:shadow-glow">
                <Boxes size={20} className="transition-transform group-hover:rotate-6" />
              </div>
              <span className="text-lg font-bold tracking-tight text-zinc-50">StockSense</span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-500/15 text-blue-400 shadow-sm'
                        : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100'
                    }`}
                  >
                    <Icon size={17} className={isActive ? 'animate-float' : ''} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <DbStatus />
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2.5 rounded-lg p-1.5 pr-2 transition-colors hover:bg-zinc-800/80"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-semibold text-white ring-2 ring-zinc-800">
                  {initials}
                </div>
                <span className="hidden text-sm font-medium text-zinc-300 sm:block">
                  {profile?.name || 'User'}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-zinc-500 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-12 w-48 animate-slide-down overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 py-1 shadow-xl shadow-black/40">
                  <div className="border-b border-zinc-800 px-4 py-2.5">
                    <p className="text-sm font-medium text-zinc-100">{profile?.name || 'User'}</p>
                    <p className="text-xs capitalize text-zinc-500">{profile?.role || 'staff'}</p>
                  </div>
                  <button
                    onClick={() => {
                      signOut();
                      navigate('/login');
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                  >
                    <LogOut size={16} />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main key={location.pathname} className="page-enter mx-auto max-w-7xl px-6 py-8">
        {children}
      </main>
    </div>
  );
}
