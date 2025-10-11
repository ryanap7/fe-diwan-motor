'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Building2, Users, Settings, ShoppingBag, BarChart3, Package, Store, LogOut, Menu, X, FileText, Warehouse, ShoppingCart, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import Link from 'next/link';
import { getAuthToken, removeAuthToken } from '@/lib/auth';

const DashboardLayout = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCurrentUser(response.data.user);
      setLoading(false);
    } catch (error) {
      removeAuthToken();
      router.push('/login');
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  // Define all menu items with role-based access control
  const allMenuItems = [
    { 
      id: 'dashboard', 
      label: 'Beranda', 
      icon: BarChart3, 
      roles: ['Admin', 'Branch Manager'], 
      href: '/dashboard' 
    },
    { 
      id: 'branches', 
      label: 'Cabang', 
      icon: Store, 
      roles: ['Admin'], 
      href: '/branches' 
    },
    { 
      id: 'users', 
      label: 'Pengguna', 
      icon: Users, 
      roles: ['Admin'], 
      href: '/users' 
    },
    { 
      id: 'products', 
      label: 'Produk', 
      icon: Package, 
      roles: ['Admin', 'Branch Manager'], 
      submenu: [
        { 
          id: 'categories', 
          label: 'Kategori', 
          icon: ShoppingBag, 
          roles: ['Admin', 'Branch Manager'], 
          href: '/categories' 
        },
        { 
          id: 'brands', 
          label: 'Brand/Merk', 
          icon: Package, 
          roles: ['Admin', 'Branch Manager'], 
          href: '/brands' 
        },
        { 
          id: 'products-list', 
          label: 'Daftar Produk', 
          icon: Package, 
          roles: ['Admin', 'Branch Manager'], 
          href: '/products' 
        },
      ]
    },
    { 
      id: 'inventory', 
      label: 'Inventory', 
      icon: Warehouse, 
      roles: ['Admin', 'Branch Manager'], 
      submenu: [
        { 
          id: 'stock-management', 
          label: 'Stock Management', 
          icon: Package, 
          roles: ['Admin', 'Branch Manager'], 
          href: '/inventory' 
        },
        { 
          id: 'purchase-orders', 
          label: 'Purchase Orders', 
          icon: ShoppingBag, 
          roles: ['Admin', 'Branch Manager'], 
          href: '/purchase-orders' 
        },
        { 
          id: 'stock-movements', 
          label: 'Stock Movements', 
          icon: BarChart3, 
          roles: ['Admin', 'Branch Manager'], 
          href: '/stock-movements' 
        },
      ]
    },
    { 
      id: 'suppliers', 
      label: 'Supplier', 
      icon: Building2, 
      roles: ['Admin'], 
      href: '/suppliers' 
    },
    { 
      id: 'customers', 
      label: 'Customer', 
      icon: Users, 
      roles: ['Admin'], 
      href: '/customers' 
    },
    { 
      id: 'pos-transactions', 
      label: 'Transaksi', 
      icon: ShoppingCart, 
      roles: ['Admin', 'Branch Manager'], 
      href: '/transactions' 
    },
    { 
      id: 'reporting-analytics', 
      label: 'Laporan & Analisis', 
      icon: PieChart, 
      roles: ['Admin', 'Branch Manager'], 
      href: '/reports' 
    },
    { 
      id: 'activity-logs', 
      label: 'Log Aktivitas', 
      icon: FileText, 
      roles: ['Admin'], 
      href: '/activity-logs' 
    },
    { 
      id: 'settings', 
      label: 'Pengaturan', 
      icon: Settings, 
      roles: ['Admin', 'Branch Manager'], 
      submenu: [
        { 
          id: 'company', 
          label: 'Profil Perusahaan', 
          icon: Building2, 
          roles: ['Admin'], 
          href: '/company' 
        },
        { 
          id: 'roles', 
          label: 'Peran Pengguna', 
          icon: Users, 
          roles: ['Admin'], 
          href: '/roles' 
        },
      ]
    },
  ];

  // Filter menu items based on user role
  const filterMenuByRole = (items, userRole) => {
    return items
      .filter(item => item.roles.includes(userRole))
      .map(item => {
        if (item.submenu) {
          const filteredSubmenu = item.submenu.filter(subItem => 
            subItem.roles.includes(userRole)
          );
          return { ...item, submenu: filteredSubmenu };
        }
        return item;
      });
  };

  const menuItems = currentUser ? filterMenuByRole(allMenuItems, currentUser.role?.name) : [];

  // Get current page title based on pathname
  const getCurrentPageTitle = () => {
    const allItems = [];
    allMenuItems.forEach(item => {
      allItems.push(item);
      if (item.submenu) {
        allItems.push(...item.submenu);
      }
    });
    
    const currentItem = allItems.find(item => item.href === pathname);
    return currentItem?.label || 'Dashboard';
  };

  // Check if current path matches item or its submenu
  const isActiveItem = (item) => {
    if (item.href && pathname === item.href) return true;
    if (item.submenu) {
      return item.submenu.some(subItem => pathname === subItem.href);
    }
    return false;
  };

  const isActiveSubItem = (subItem) => {
    return pathname === subItem.href;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
        </div>
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
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md transform hover:scale-105 transition-transform duration-300">
              <Store className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
              <div className="animate-in fade-in-50 slide-in-from-left-5 duration-300">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  POS Motor
                </h1>
                <p className="text-xs text-muted-foreground">Konfigurasi</p>
              </div>
            )}
          </Link>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveItem(item);
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isSettingsMenu = item.id === 'settings';
            const isProductsMenu = item.id === 'products';
            const isInventoryMenu = item.id === 'inventory';
            const submenuOpen = isSettingsMenu ? settingsOpen : (isProductsMenu ? productsOpen : (isInventoryMenu ? inventoryOpen : false));
            
            return (
              <div key={item.id}>
                {hasSubmenu ? (
                  <button
                    onClick={() => {
                      if (isSettingsMenu) {
                        setSettingsOpen(!settingsOpen);
                      } else if (isProductsMenu) {
                        setProductsOpen(!productsOpen);
                      } else if (isInventoryMenu) {
                        setInventoryOpen(!inventoryOpen);
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
                    {sidebarOpen && (
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
                ) : (
                  <Link
                    href={item.href}
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
                  </Link>
                )}
                
                {/* Submenu */}
                {hasSubmenu && submenuOpen && sidebarOpen && (
                  <div className="ml-4 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                    {item.submenu.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = isActiveSubItem(subItem);
                      return (
                        <Link
                          key={subItem.id}
                          href={subItem.href}
                          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                            isSubActive
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <SubIcon className="w-4 h-4" />
                          <span className="text-sm font-medium">{subItem.label}</span>
                        </Link>
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
            {sidebarOpen && <span className="font-medium">Keluar</span>}
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
                  {getCurrentPageTitle()}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Kelola konfigurasi sistem Anda
                </p>
              </div>
            </div>
            
            {/* User Info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-gray-200">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                  {currentUser?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-semibold text-gray-900">{currentUser?.username}</p>
                  <p className="text-xs text-muted-foreground">
                    {currentUser?.role?.name}
                  </p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;