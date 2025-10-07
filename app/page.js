'use client';

import { useState, useEffect } from 'react';
import { Building2, Users, Settings, ShoppingBag, BarChart3, Package, Store, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';
import CompanyProfile from '@/components/features/CompanyProfile';
import BranchManagement from '@/components/features/BranchManagement';
import RoleManagement from '@/components/features/RoleManagement';
import Dashboard from '@/components/features/Dashboard';
import UserManagement from '@/components/features/UserManagement';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Login form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    initializeSystem();
    checkAuth();
  }, []);

  const initializeSystem = async () => {
    try {
      await axios.get('/api/init');
    } catch (error) {
      console.error('System initialization error:', error);
    }
  };

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchCurrentUser(token);
    } else {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async (token) => {
    try {
      const response = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password
      });

      localStorage.setItem('token', response.data.token);
      setCurrentUser(response.data.user);
      setIsAuthenticated(true);
      toast.success('Login successful!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveMenu('dashboard');
    toast.success('Logged out successfully');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Beranda', icon: BarChart3 },
    { id: 'branches', label: 'Cabang', icon: Store },
    { id: 'users', label: 'Pengguna', icon: Users },
    { id: 'settings', label: 'Pengaturan', icon: Settings, submenu: [
      { id: 'company', label: 'Profil Perusahaan', icon: Building2 },
      { id: 'roles', label: 'Peran Pengguna', icon: Users },
    ]},
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 animate-in fade-in-50 slide-in-from-bottom-10 duration-500">
          <CardHeader className="space-y-1 text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
                <Store className="w-10 h-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              POS Motor
            </CardTitle>
            <CardDescription className="text-base">
              Sistem Konfigurasi & Manajemen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nama Pengguna</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Masukkan nama pengguna"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Kata Sandi</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                disabled={loginLoading}
              >
                {loginLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Masuk...</span>
                  </div>
                ) : (
                  'Masuk'
                )}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Kredensial default: <span className="font-semibold">admin / admin123</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col shadow-lg`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md transform hover:scale-105 transition-transform duration-300">
              <Store className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
              <div className="animate-in fade-in-50 slide-in-from-left-5 duration-300">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Motorbike POS
                </h1>
                <p className="text-xs text-muted-foreground">Configuration</p>
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        {sidebarOpen && (
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50 animate-in fade-in-50 slide-in-from-left-5 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                {currentUser?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{currentUser?.username}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {currentUser?.role?.name}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isSettingsMenu = item.id === 'settings';
            const submenuOpen = isSettingsMenu ? settingsOpen : false;
            
            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (hasSubmenu) {
                      if (isSettingsMenu) {
                        setSettingsOpen(!settingsOpen);
                      }
                    } else {
                      setActiveMenu(item.id);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md transform scale-105'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'animate-in zoom-in-50 duration-300' : ''}`} />
                  {sidebarOpen && (
                    <span className="font-medium flex-1 text-left animate-in fade-in-50 slide-in-from-left-5 duration-300">
                      {item.label}
                    </span>
                  )}
                  {sidebarOpen && hasSubmenu && (
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${submenuOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
                
                {/* Submenu */}
                {hasSubmenu && submenuOpen && sidebarOpen && (
                  <div className="ml-4 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                    {item.submenu.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = activeMenu === subItem.id;
                      return (
                        <button
                          key={subItem.id}
                          onClick={() => setActiveMenu(subItem.id)}
                          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                            isSubActive
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <SubIcon className="w-4 h-4" />
                          <span className="text-sm font-medium">{subItem.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200 hover:scale-105"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hover:bg-gray-100 transition-colors duration-200"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {menuItems.find(item => item.id === activeMenu)?.label}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Manage your system configuration
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
            {activeMenu === 'dashboard' && <Dashboard />}
            {activeMenu === 'company' && <CompanyProfile />}
            {activeMenu === 'branches' && <BranchManagement />}
            {activeMenu === 'users' && <UserManagement />}
            {activeMenu === 'roles' && <RoleManagement />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;