# Sistem Cache Implementation - ProductManagement.jsx 

## Overview
Sistem cache telah diimplementasikan untuk mengurangi query ke server dan meningkatkan performa aplikasi. Cache hanya akan direfresh ketika ada update, insert, atau delete data.

## Fitur Cache yang Diimplementasi

### 1. Cache State Management
```javascript
const [cache, setCache] = useState({
  products: { data: [], timestamp: null, filters: {} },
  categories: { data: [], timestamp: null },
  brands: { data: [], timestamp: null },
  branches: { data: [], timestamp: null }
});
const [cacheExpiry] = useState(5 * 60 * 1000); // 5 minutes
```

### 2. Cache Utility Functions

#### `isCacheValid(type, cacheKey = null)`
- Mengecek apakah cache masih valid berdasarkan timestamp
- Cache valid jika belum melewati batas waktu 5 menit
- Support untuk cache dengan key khusus (untuk filter products)

#### `getCacheKey(filters, type)`
- Generate unique key berdasarkan filter parameters
- Untuk products dengan server pagination, key dibuat dari: page, limit, search, categoryId, brandId, stockFilter

#### `updateCache(type, cacheKey, data)`
- Menyimpan data ke cache dengan timestamp saat ini
- Support untuk cache dengan key khusus dan cache sederhana

#### `getCachedData(type, cacheKey = null)`
- Mengambil data dari cache jika masih valid
- Return null jika cache expired atau tidak ada

#### `invalidateCache(type)`
- Menghapus cache untuk type tertentu
- Digunakan setelah operasi CRUD

### 3. Server-Side Pagination dengan Cache

#### Implementasi di `fetchServerData()`
```javascript
// Check cache first
const cacheKey = getCacheKey(serverParams, 'products');
const cachedData = getCachedData('products', cacheKey);

if (cachedData) {
  console.log('📦 Using cached server-side products data');
  setProducts(cachedData.products);
  setTotalServerProducts(cachedData.total);
  setServerLoading(false);
  return;
}

// ... API call ...

// Cache the response data
updateCache('products', cacheKey, {
  products: productsData,
  total: totalCount
});
```

### 4. Master Data Caching di `fetchData()`

#### Optimized API Calls
- Categories, brands, branches menggunakan cache selama 5 menit
- Hanya fetch data yang tidak ada di cache atau sudah expired
- Products selalu di-fetch untuk client-side (karena dataset besar)

```javascript
// Check cache for each data type
const cachedCategories = getCachedData('categories');
const cachedBrands = getCachedData('brands');
const cachedBranches = getCachedData('branches');

// Prepare API calls only for non-cached data
const apiCalls = [];
const apiTypes = [];

// Always fetch products for client-side (no cache for large product lists)
apiCalls.push(productsAPI.getAll({ limit: 1000 }));
apiTypes.push('products');

if (!cachedCategories) {
  apiCalls.push(categoriesAPI.getAll());
  apiTypes.push('categories');
} else {
  console.log('📦 Using cached categories data');
}
```

### 5. Cache Invalidation pada CRUD Operations

#### Create/Update Product (`handleSubmit`)
```javascript
// Invalidate product cache after create/update
invalidateCache('products');
fetchData();
```

#### Delete Product (`handleDelete`)
```javascript
// Invalidate product cache after delete
invalidateCache('products');
fetchData();
```

#### Toggle Active Status (`handleToggleActive`)
```javascript
// Invalidate product cache after status update
invalidateCache('products');
fetchData();
```

### 6. Cache Status Indicators di UI

#### Visual Indicators
- **📦 Cat**: Categories data from cache (blue badge)
- **📦 Brand**: Brands data from cache (purple badge)  
- **📦 Branch**: Branches data from cache (orange badge)
- **Server Pagination**: Server-side pagination active (green badge)

```jsx
{/* Cache indicators */}
{cache.categories.timestamp && isCacheValid('categories') && (
  <span className="px-2 py-1 text-xs text-blue-700 bg-blue-100 rounded-md" title="Kategori dari cache">📦 Cat</span>
)}
{cache.brands.timestamp && isCacheValid('brands') && (
  <span className="px-2 py-1 text-xs text-purple-700 bg-purple-100 rounded-md" title="Brand dari cache">📦 Brand</span>
)}
{cache.branches.timestamp && isCacheValid('branches') && (
  <span className="px-2 py-1 text-xs text-orange-700 bg-orange-100 rounded-md" title="Cabang dari cache">📦 Branch</span>
)}
```

## Cache Strategy

### Products Cache
- **Server Pagination**: Cache berdasarkan filter parameters (5 menit)
- **Client Pagination**: Tidak di-cache (dataset terlalu besar)
- **Invalidation**: Setelah create, update, delete, toggle status

### Master Data Cache
- **Categories, Brands, Branches**: Cache selama 5 menit
- **Auto-refresh**: Hanya fetch jika cache expired
- **Invalidation**: Manual jika diperlukan (bisa ditambah di form master data)

## Performance Benefits

### 1. Reduced Server Queries
- Master data (categories, brands, branches) hanya di-fetch setiap 5 menit
- Server pagination results di-cache berdasarkan filter
- Console logs menunjukkan "📦 Using cached data" ketika cache digunakan

### 2. Improved User Experience
- Loading time lebih cepat untuk data yang sudah di-cache
- Visual indicators menunjukkan status cache
- Automatic fallback jika cache expired

### 3. Smart Cache Management
- Cache otomatis di-invalidate setelah CRUD operations
- Unique cache keys untuk different filter combinations
- Expired cache otomatis di-ignore

## Console Logging

Cache system menyediakan detailed logging:
- `📦 Using cached server-side products data`
- `📦 Using cached categories data`
- `📦 Using cached brands data`
- `📦 Using cached branches data`
- `🔄 Fetching server-side paginated products...`
- `🔄 Fetching products with limit: 1000 (client-side)`

## Future Enhancements

1. **Cache Size Limit**: Implement maximum cache entries
2. **Background Refresh**: Auto-refresh cache before expiry
3. **Selective Invalidation**: Invalidate only affected cache entries
4. **Master Data CRUD**: Add cache invalidation to category/brand forms
5. **Cache Statistics**: Show cache hit/miss rates
6. **Persistent Cache**: Store cache in localStorage for page refreshes

## Technical Notes

- Cache menggunakan React state, tidak persistent setelah page refresh
- Cache expiry: 5 menit (300,000 milliseconds)
- Cache key generation menggunakan JSON.stringify untuk filter objects
- All cache operations dilakukan secara synchronous di client-side