'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthUser } from '@/types';
import { Button } from '@/components/ui/button';
import { Landmark, LogOut, Shield, User } from 'lucide-react';

interface NavbarProps {
  user: AuthUser | null;
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const getPortalLink = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'OFFICER') return '/officer';
    return '/citizen';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gov-900 text-white shadow-sm">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-gov-900 block leading-tight">
                JanSetu Portal
              </span>
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                Smart Grievance & AI Redressal
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/" className="hover:text-gov-900 transition-colors">
              Home
            </Link>
            <Link href="/about" className="hover:text-gov-900 transition-colors">
              About
            </Link>
            <Link href="/how-it-works" className="hover:text-gov-900 transition-colors">
              How It Works
            </Link>
            {user && (
              <Link
                href={getPortalLink()}
                className="text-gov-800 font-semibold hover:text-gov-900 transition-colors"
              >
                My Portal
              </Link>
            )}
          </nav>

          {/* User Profile / Auth Action */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href={getPortalLink()}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <User className="h-3.5 w-3.5 text-gov-700" />
                  <span>{user.name}</span>
                  <span className="text-[10px] bg-gov-900 text-white px-1.5 py-0.5 rounded font-mono uppercase">
                    {user.role}
                  </span>
                </Link>

                <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs">
                  <LogOut className="h-3.5 w-3.5 mr-1" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Officer / Admin Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">
                    Citizen Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
