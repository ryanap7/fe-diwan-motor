'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Building2, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const CompanyProfile = () => {
  const [company, setCompany] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    tax_number: '',
    logo_url: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/company', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data) {
        setCompany(response.data);
      }
    } catch (error) {
      toast.error('Gagal memuat profil perusahaan');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/company/update', company, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Profil perusahaan berhasil diperbarui!');
    } catch (error) {
      toast.error('Gagal memperbarui profil perusahaan');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setCompany(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Profil Perusahaan</CardTitle>
              <CardDescription>Kelola informasi bisnis Anda</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-semibold">
                Nama Perusahaan <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={company.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Masukkan nama perusahaan"
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-base font-semibold">
                Alamat
              </Label>
              <Textarea
                id="address"
                value={company.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Masukkan alamat perusahaan"
                rows={3}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-base font-semibold">
                  Telepon
                </Label>
                <Input
                  id="phone"
                  value={company.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="Masukkan nomor telepon"
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-semibold">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={company.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="Masukkan alamat email"
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_number" className="text-base font-semibold">
                Nomor Pajak / NPWP
              </Label>
              <Input
                id="tax_number"
                value={company.tax_number}
                onChange={(e) => handleChange('tax_number', e.target.value)}
                placeholder="Masukkan nomor pajak"
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo_url" className="text-base font-semibold">
                URL Logo
              </Label>
              <Input
                id="logo_url"
                value={company.logo_url}
                onChange={(e) => handleChange('logo_url', e.target.value)}
                placeholder="Masukkan URL logo (opsional)"
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={saving}
                className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan Perubahan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Simpan Profil Perusahaan
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyProfile;