'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Store, Users, TrendingUp } from 'lucide-react';
import axios from 'axios';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalBranches: 0,
    activeBranches: 0,
    totalRoles: 0,
    companyName: 'Not Set'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [branchesRes, rolesRes, companyRes] = await Promise.all([
        axios.get('/api/branches', { headers }),
        axios.get('/api/roles', { headers }),
        axios.get('/api/company', { headers })
      ]);

      const branches = branchesRes.data || [];
      const activeBranches = branches.filter(b => b.is_active).length;

      setStats({
        totalBranches: branches.length,
        activeBranches,
        totalRoles: (rolesRes.data || []).length,
        companyName: companyRes.data?.name || 'Not Set'
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Branches',
      value: stats.totalBranches,
      description: `${stats.activeBranches} active`,
      icon: Store,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Active Branches',
      value: stats.activeBranches,
      description: 'Currently operating',
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      title: 'User Roles',
      value: stats.totalRoles,
      description: 'Defined roles',
      icon: Users,
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Company',
      value: stats.companyName.length > 15 ? stats.companyName.substring(0, 15) + '...' : stats.companyName,
      description: 'Business profile',
      icon: Building2,
      gradient: 'from-orange-500 to-red-500'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>
        <CardHeader className="relative z-10">
          <CardTitle className="text-3xl font-bold">Welcome to Configuration Module</CardTitle>
          <CardDescription className="text-white/90 text-base mt-2">
            Manage your motorbike store branches, company profile, and user roles from one place
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`}></div>
              <CardHeader className="pb-3 relative">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Quick Start Guide</CardTitle>
          <CardDescription>Follow these steps to set up your system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100 hover:border-blue-300 transition-colors duration-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Configure Company Profile</h4>
                <p className="text-sm text-muted-foreground">
                  Set up your business information including name, address, and contact details
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100 hover:border-green-300 transition-colors duration-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Add Your Branches</h4>
                <p className="text-sm text-muted-foreground">
                  Create and manage multiple branch locations with detailed information
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100 hover:border-purple-300 transition-colors duration-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Define User Roles</h4>
                <p className="text-sm text-muted-foreground">
                  Set up custom roles with specific permissions for your team members
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;