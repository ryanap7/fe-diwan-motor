'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const RoleBasedRedirect = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkUserRoleAndRedirect = () => {
      try {
        // Get user data from localStorage
        const userStr = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (!token) {
          router.push('/login');
          return;
        }

        if (userStr) {
          const user = JSON.parse(userStr);
          const role = user.role || user.user_role;
          const currentPath = window.location.pathname;

          // If user is cashier and not already on POS page, redirect to POS
          if ((role === 'CASHIER' || role === 'KASIR' || role === 'cashier') && 
              !currentPath.startsWith('/pos')) {
            setRedirecting(true);
            router.push('/pos');
            return;
          }

          // If user is admin/manager on POS page without explicit access, redirect to dashboard
          if ((role === 'ADMIN' || role === 'BRANCH_MANAGER') && 
              currentPath.startsWith('/pos') && 
              !localStorage.getItem('allowPosAccess')) {
            // Allow admins to access POS, just don't auto-redirect them there
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error checking user role:', error);
        setLoading(false);
      }
    };

    // Small delay to ensure localStorage is available
    setTimeout(checkUserRoleAndRedirect, 100);
  }, [router]);

  if (loading || redirecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 text-blue-600 animate-spin" />
          <p className="text-gray-600">
            {redirecting ? 'Mengarahkan ke halaman yang sesuai...' : 'Memeriksa akses pengguna...'}
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default RoleBasedRedirect;