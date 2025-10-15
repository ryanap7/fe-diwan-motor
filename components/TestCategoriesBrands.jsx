// Test component untuk memverifikasi API categories dan brands
import { useState, useEffect } from 'react';
import { categoriesAPI, brandsAPI } from '../lib/api';
// Token will be handled automatically by API interceptor from localStorage

const TestCategoriesBrands = () => {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const testAPI = async () => {
      try {
        // Verify token exists in localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found. Please login first.');
        }
        
        // Test API calls
        console.log('Testing categories and brands API...');
        
        const [categoriesRes, brandsRes] = await Promise.all([
          categoriesAPI.getAll(),
          brandsAPI.getAll()
        ]);
        
        console.log('Categories response:', categoriesRes);
        console.log('Brands response:', brandsRes);
        
        // Handle response structure
        const categoriesData = categoriesRes?.success ? (categoriesRes.data?.categories || categoriesRes.data || []) : [];
        const brandsData = brandsRes?.success ? (brandsRes.data?.brands || brandsRes.data || []) : [];
        
        setCategories(categoriesData);
        setBrands(brandsData);
        
        console.log('✅ Categories loaded:', categoriesData.length);
        console.log('✅ Brands loaded:', brandsData.length);
        
      } catch (err) {
        console.error('❌ Error loading data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    testAPI();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Categories & Brands Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Categories ({categories.length})</h3>
        <select style={{ width: '200px', padding: '5px' }}>
          <option value="">Pilih kategori</option>
          {Array.isArray(categories) && categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        
        <ul>
          {categories.map((cat) => (
            <li key={cat.id}>{cat.name} (ID: {cat.id})</li>
          ))}
        </ul>
      </div>
      
      <div>
        <h3>Brands ({brands.length})</h3>
        <select style={{ width: '200px', padding: '5px' }}>
          <option value="">Pilih brand</option>
          {Array.isArray(brands) && brands.map((brand) => (
            <option key={brand.id} value={brand.id}>{brand.name}</option>
          ))}
        </select>
        
        <ul>
          {brands.map((brand) => (
            <li key={brand.id}>{brand.name} (ID: {brand.id})</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TestCategoriesBrands;