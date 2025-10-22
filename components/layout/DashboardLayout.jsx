"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Building2,
  Users,
  Settings,
  ShoppingBag,
  BarChart3,
  Package,
  Store,
  LogOut,
  Menu,
  X,
  FileText,
  Warehouse,
  ShoppingCart,
  PieChart,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";
import Link from "next/link";
import { getAuthToken, removeAuthToken } from "@/lib/auth";

const DashboardLayout = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default false for mobile-first
  const [loading, setLoading] = useState(true);
  const [ngrokError, setNgrokError] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, []);

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // Desktop - keep sidebar open
        setSidebarOpen(true);
      } else {
        // Mobile - close sidebar
        setSidebarOpen(false);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const checkAuth = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        router.push("/login");
        return;
      }

      // Check if user data is already in localStorage from login
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setCurrentUser(userData);
        
        // Auto-redirect CASHIER to POS page
        if (userData.role === "CASHIER" && pathname !== "/pos") {
          router.push("/pos");
          return;
        }
        
        setLoading(false);
        return;
      }

      // If not, fetch from API
      const response = await axios.get("/api/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
          "User-Agent": "NextJS-Dashboard/1.0",
        },
      });

      // Handle response structure {success, data}
      if (response.data.success && response.data.data) {
        setCurrentUser(response.data.data);
        localStorage.setItem("user", JSON.stringify(response.data.data));
        
        // Auto-redirect CASHIER to POS page
        if (response.data.data.role === "CASHIER" && pathname !== "/pos") {
          router.push("/pos");
          return;
        }
      } else {
        throw new Error("Invalid response format");
      }

      setLoading(false);
    } catch (error) {
      console.error("Auth check failed:", error);

      // Handle ngrok specific errors
      if (error.code === "ERR_NGROK_6024" || error.message.includes("ngrok")) {
        console.error("Ngrok connection error detected");
        setNgrokError(true);
        setLoading(false);
        return;
      }

      removeAuthToken();
      localStorage.removeItem("user");
      router.push("/login");
    }
  };

  const handleRetryConnection = async () => {
    setNgrokError(false);
    setLoading(true);
    await checkAuth();
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await axios.post(
          "/api/auth/logout",
          { refreshToken },
          {
            headers: {
              Authorization: `Bearer ${getAuthToken()}`,
              "ngrok-skip-browser-warning": "true",
              "User-Agent": "NextJS-Dashboard/1.0",
            },
          }
        );
      }
    } catch (error) {
      console.warn("Logout API call failed:", error);
    } finally {
      removeAuthToken();
      localStorage.removeItem("user");
      toast.success("Logged out successfully");
      router.push("/login");
    }
  };

  // Define all menu items with role-based access control
  const allMenuItems = [
    {
      id: "dashboard",
      label: "Beranda",
      icon: BarChart3,
      roles: ["ADMIN", "BRANCH_MANAGER"],
      href: "/dashboard",
    },
    {
      id: "branches",
      label: "Cabang",
      icon: Store,
      roles: ["ADMIN"],
      href: "/branches",
    },
    {
      id: "users",
      label: "Pengguna",
      icon: Users,
      roles: ["ADMIN"],
      href: "/users",
    },
    {
      id: "products",
      label: "Produk",
      icon: Package,
      roles: ["ADMIN", "BRANCH_MANAGER"],
      href: "#", // Add href for parent menu
      submenu: [
        {
          id: "categories",
          label: "Kategori",
          icon: ShoppingBag,
          roles: ["ADMIN", "BRANCH_MANAGER"],
          href: "/categories",
        },
        {
          id: 'brands',
          label: 'Brand/Merk',
          icon: Package,
          roles: ['ADMIN',"BRANCH_MANAGER"],
          href: '/brands'
        },
        {
          id: "products-list",
          label: "Daftar Produk",
          icon: Package,
          roles: ["ADMIN", "BRANCH_MANAGER"],
          href: "/products",
        },
      ],
    },
    {
      id: "inventory",
      label: "Gudang",
      icon: Warehouse,
      roles: ["ADMIN", "BRANCH_MANAGER"],
      href: "#", // Add href for parent menu
      submenu: [
        {
          id: "stock-management",
          label: "Manajemen Stok",
          icon: Package,
          roles: ["ADMIN", "BRANCH_MANAGER"],
          href: "/inventory",
        },
        {
          id: "purchase-orders",
          label: "Purchase Orders",
          icon: ShoppingBag,
          roles: ["ADMIN"],
          href: "/purchase-orders",
        },
        {
          id: "stock-movements",
          label: "Pergerakan Stok",
          icon: BarChart3,
          roles: ["ADMIN"],
          // roles: [],
          href: "/stock-movements",
        },
      ],
    },
    {
      id: "suppliers",
      label: "Supplier",
      icon: Building2,
      roles: ["ADMIN"],
      href: "/suppliers",
    },
    {
      id: "customers",
      label: "Customer",
      icon: Users,
      roles: ["ADMIN", "BRANCH_MANAGER", "CASHIER"],
      href: "/customers",
    },
    {
      id: "pos",
      label: "POS Kasir",
      icon: CreditCard,
      roles: ["CASHIER"],
      href: "/pos",
    },
    {
      id: "pos-transactions",
      label: "Transaksi",
      icon: ShoppingCart,
      roles: ["ADMIN", "BRANCH_MANAGER","CASHIER"],
      href: "/transactions",
    },
    {
      id: "reporting-analytics",
      label: "Laporan & Analisis",
      icon: PieChart,
      roles: ["ADMIN", "BRANCH_MANAGER"],
      href: "/reports",
    },
    {
      id: "activity-logs",
      label: "Log Aktivitas",
      icon: FileText,
      roles: ["ADMIN"],
      href: "/activity-logs",
    },
    {
      id: "settings",
      label: "Pengaturan",
      icon: Settings,
      roles: ["ADMIN", "BRANCH_MANAGER"],
      href: "#", // Add href for parent menu
      submenu: [
        {
          id: "company",
          label: "Profil Perusahaan",
          icon: Building2,
          roles: ["ADMIN"],
          href: "/company",
        },
        {
          id: "roles",
          label: "Peran Pengguna",
          icon: Users,
          roles: ["ADMIN"],
          href: "/roles",
        },
      ],
    },
  ];

  // Filter menu items based on user role
  const filterMenuByRole = (items, userRole) => {
    return items
      .filter((item) => item.roles.length === 0 || item.roles.includes(userRole))
      .map((item) => {
        if (item.submenu) {
          const filteredSubmenu = item.submenu.filter((subItem) =>
            subItem.roles.length === 0 || subItem.roles.includes(userRole)
          );
          return { ...item, submenu: filteredSubmenu };
        }
        return item;
      });
  };

  const menuItems = currentUser
    ? filterMenuByRole(allMenuItems, currentUser.role)
    : [];

  // Route protection for CASHIER role
  useEffect(() => {
    if (currentUser && currentUser.role === "CASHIER") {
      const allowedPaths = ["/pos", "/transactions", "/customers"];
      if (!allowedPaths.includes(pathname)) {
        router.push("/pos");
      }
    }
  }, [currentUser, pathname, router]);

  // Get current page title based on pathname
  const getCurrentPageTitle = () => {
    const allItems = [];
    allMenuItems.forEach((item) => {
      allItems.push(item);
      if (item.submenu) {
        allItems.push(...item.submenu);
      }
    });

    const currentItem = allItems.find((item) => item.href === pathname);
    return currentItem?.label || "Dashboard";
  };

  // Check if current path matches item or its submenu
  const isActiveItem = (item) => {
    if (item.href && pathname === item.href) return true;
    if (item.submenu) {
      return item.submenu.some((subItem) => pathname === subItem.href);
    }
    return false;
  };

  const isActiveSubItem = (subItem) => {
    return pathname === subItem.href;
  };

  // Close sidebar when clicking menu item on mobile
  const handleMenuClick = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="animate-pulse">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600"></div>
        </div>
      </div>
    );
  }

  if (ngrokError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="max-w-md p-6 mx-auto text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-red-600 to-orange-600">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            Ngrok Connection Error
          </h2>
          <p className="mb-4 text-gray-600">
            Unable to connect to the API server. This might be due to:
          </p>
          <ul className="mb-6 space-y-1 text-sm text-left text-gray-500">
            <li>• Ngrok tunnel has expired or been terminated</li>
            <li>• Ngrok browser warning (click "Visit Site" to bypass)</li>
            <li>• API server is not running on the backend</li>
            <li>• NEXT_PUBLIC_API_URL environment variable needs updating</li>
            <li>• Network connection issues</li>
          </ul>
          <div className="mb-4 text-xs text-gray-400">
            Current API URL:{" "}
            {process.env.NEXT_PUBLIC_API_URL || "Not configured"}
          </div>
          <Button
            onClick={handleRetryConnection}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-red-600 to-pink-600"></div>
          <p>User data not found. Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${
          sidebarOpen ? "w-64" : "lg:w-20"
        } fixed lg:relative z-50 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col shadow-lg h-full`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 sm:p-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 transition-transform duration-300 transform shadow-md bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:scale-105">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div className="duration-300 animate-in fade-in-50 slide-in-from-left-5 lg:block">
              <h1 className="text-lg font-bold text-transparent sm:text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
                HD MOTOPART
              </h1>
              <p className="text-xs text-muted-foreground">Konfigurasi</p>
            </div>
          </Link>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveItem(item);
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isSettingsMenu = item.id === "settings";
            const isProductsMenu = item.id === "products";
            const isInventoryMenu = item.id === "inventory";
            const submenuOpen = isSettingsMenu
              ? settingsOpen
              : isProductsMenu
              ? productsOpen
              : isInventoryMenu
              ? inventoryOpen
              : false;

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
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md transform scale-105"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isActive ? "animate-in zoom-in-50 duration-300" : ""
                      }`}
                    />
                    <span className="flex-1 font-medium text-left duration-300 animate-in fade-in-50 slide-in-from-left-5 lg:block">
                      {item.label}
                    </span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 lg:block ${
                        submenuOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={handleMenuClick}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md transform scale-105"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isActive ? "animate-in zoom-in-50 duration-300" : ""
                      }`}
                    />
                    <span className="flex-1 font-medium text-left duration-300 animate-in fade-in-50 slide-in-from-left-5">
                      {item.label}
                    </span>
                  </Link>
                )}

                {/* Submenu */}
                {hasSubmenu && submenuOpen && (
                  <div className="mt-1 ml-4 space-y-1 duration-200 animate-in slide-in-from-top-2">
                    {item.submenu.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = isActiveSubItem(subItem);
                      return (
                        <Link
                          key={subItem.id}
                          href={subItem.href}
                          onClick={handleMenuClick}
                          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                            isSubActive
                              ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <SubIcon className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {subItem.label}
                          </span>
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
            className="flex items-center w-full gap-3 px-4 py-3 text-red-600 transition-all duration-200 rounded-lg hover:bg-red-50 hover:scale-105"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Keluar</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="px-4 py-3 bg-white border-b border-gray-200 shadow-sm sm:px-6 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="transition-colors duration-200 lg:hover:bg-gray-100"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h2 className="text-lg font-bold text-gray-900 sm:text-xl lg:text-2xl">
                  {getCurrentPageTitle()}
                </h2>
                <p className="hidden text-sm sm:block text-muted-foreground">
                  Kelola konfigurasi sistem Anda
                </p>
              </div>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Mobile - Show only avatar */}
              <div className="flex items-center gap-2 sm:hidden">
                <div className="flex items-center justify-center w-8 h-8 font-semibold text-white rounded-full shadow-md bg-gradient-to-r from-blue-500 to-purple-500">
                  {currentUser?.username?.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Desktop - Show full user info */}
              <div className="hidden gap-3 px-3 py-2 border border-gray-200 rounded-lg sm:flex bg-gradient-to-r from-blue-50 to-purple-50 lg:px-4">
                <div className="flex items-center justify-center w-8 h-8 font-semibold text-white rounded-full shadow-md lg:w-10 lg:h-10 bg-gradient-to-r from-blue-500 to-purple-500">
                  {currentUser?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-semibold text-gray-900">
                    {currentUser?.username}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currentUser?.role?.name}
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="w-8 h-8 transition-colors duration-200 sm:w-10 sm:h-10 hover:bg-red-50 hover:text-red-600"
                title="Logout"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-3 overflow-y-auto sm:p-4 lg:p-6">
          <div className="duration-500 animate-in fade-in-50 slide-in-from-bottom-5">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
