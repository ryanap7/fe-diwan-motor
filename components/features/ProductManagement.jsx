'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Package } from 'lucide-react';

const ProductManagement = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Kelola Produk</h3>
        <p className="text-sm text-muted-foreground">Halaman ini sedang dalam pengembangan</p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Modul Produk Segera Hadir</h3>
          <p className="text-muted-foreground">
            Silakan lengkapi Kategori dan Brand terlebih dahulu
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductManagement;
