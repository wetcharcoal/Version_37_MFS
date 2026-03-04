import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerAdmin } from '../hooks/useQueries';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Menu, User, Home, FileText, Package, ArrowLeftRight, Calendar, LogOut, Shield, UserCircle } from 'lucide-react';
import DisplayNameDialog from './DisplayNameDialog';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: 'home' | 'profile' | 'need' | 'have' | 'exchange' | 'events' | 'admin') => void;
  profileName: string;
}

export default function Header({ currentView, onNavigate, profileName }: HeaderProps) {
  const { clear } = useInternetIdentity();
  const { data: isAdmin } = useIsCallerAdmin();
  const [showDisplayNameDialog, setShowDisplayNameDialog] = useState(false);

  return (
    <>
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-md">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-primary hidden sm:inline">
                Montreal Food System
              </span>
            </button>
          </div>

          <nav className="hidden md:flex items-center space-x-2">
            <Button
              variant={currentView === 'home' ? 'default' : 'ghost'}
              onClick={() => onNavigate('home')}
              className="space-x-2"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Button>
            <Button
              variant={currentView === 'profile' ? 'default' : 'ghost'}
              onClick={() => onNavigate('profile')}
              className="space-x-2"
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </Button>
            <Button
              variant={currentView === 'need' ? 'default' : 'ghost'}
              onClick={() => onNavigate('need')}
              className="space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>Post Need</span>
            </Button>
            <Button
              variant={currentView === 'have' ? 'default' : 'ghost'}
              onClick={() => onNavigate('have')}
              className="space-x-2"
            >
              <Package className="w-4 h-4" />
              <span>Post Resource</span>
            </Button>
            <Button
              variant={currentView === 'exchange' ? 'default' : 'ghost'}
              onClick={() => onNavigate('exchange')}
              className="space-x-2"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Exchange</span>
            </Button>
            <Button
              variant={currentView === 'events' ? 'default' : 'ghost'}
              onClick={() => onNavigate('events')}
              className="space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Events</span>
            </Button>
            {isAdmin && (
              <Button
                variant={currentView === 'admin' ? 'default' : 'ghost'}
                onClick={() => onNavigate('admin')}
                className="space-x-2"
              >
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </Button>
            )}
          </nav>

          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onNavigate('home')}>
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate('profile')}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate('need')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Post Need
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate('have')}>
                  <Package className="w-4 h-4 mr-2" />
                  Post Resource
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate('exchange')}>
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  Exchange
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate('events')}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Events
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onNavigate('admin')}>
                      <Shield className="w-4 h-4 mr-2" />
                      Admin
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowDisplayNameDialog(true)}>
                  <UserCircle className="w-4 h-4 mr-2" />
                  Display Name
                </DropdownMenuItem>
                <DropdownMenuItem onClick={clear}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="hidden md:flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                    {profileName.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-32 truncate">{profileName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isAdmin && (
                  <>
                    <DropdownMenuItem onClick={() => onNavigate('admin')}>
                      <Shield className="w-4 h-4 mr-2" />
                      Admin
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => setShowDisplayNameDialog(true)}>
                  <UserCircle className="w-4 h-4 mr-2" />
                  Display Name
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={clear}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <DisplayNameDialog
        open={showDisplayNameDialog}
        onClose={() => setShowDisplayNameDialog(false)}
      />
    </>
  );
}
