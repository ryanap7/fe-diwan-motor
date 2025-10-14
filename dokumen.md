# Dokumentasi Sistem POS Motor - Diwan Motor

## 📋 Daftar Isi
1. [Gambaran Umum Sistem](#gambaran-umum-sistem)
2. [Arsitektur Sistem](#arsitektur-sistem)
3. [Teknologi yang Digunakan](#teknologi-yang-digunakan)
4. [Struktur Database](#struktur-database)
5. [Fitur Utama](#fitur-utama)
6. [Manajemen Pengguna dan Akses](#manajemen-pengguna-dan-akses)
7. [Modul-Modul Sistem](#modul-modul-sistem)
8. [API Endpoints](#api-endpoints)
9. [Panduan Instalasi](#panduan-instalasi)
10. [Panduan Penggunaan](#panduan-penggunaan)
11. [Keamanan Sistem](#keamanan-sistem)
12. [Maintenance dan Monitoring](#maintenance-dan-monitoring)

---

## 🏢 Gambaran Umum Sistem

### Tentang Sistem
**POS Motor - Diwan Motor** adalah sistem manajemen Point of Sale (POS) dan inventory yang dirancang khusus untuk toko suku cadang motor. Sistem ini menyediakan solusi lengkap untuk manajemen multi-cabang, inventory real-time, transaksi penjualan, dan reporting yang komprehensif.

### Tujuan Sistem
- Mengelola operasional toko suku cadang motor multi-cabang
- Menyediakan inventory management yang real-time dan akurat
- Mengotomatisasi proses transaksi penjualan dan purchase order
- Memberikan laporan dan analisis bisnis yang mendalam
- Memfasilitasi manajemen pengguna dengan role-based access control

### Target Pengguna
- **Admin**: Akses penuh untuk konfigurasi sistem dan manajemen seluruh cabang
- **Branch Manager**: Manajemen operasional cabang tertentu
- **Cashier**: Proses transaksi penjualan di cabang

---

## 🏗️ Arsitektur Sistem

### Arsitektur Aplikasi
```
Frontend (Next.js 14)
├── Client-side Rendering
├── Server Components
├── API Routes
└── Static Assets

Backend (Next.js API Routes)
├── RESTful API
├── Authentication Layer
├── Business Logic
└── Database Layer

Database (MongoDB)
├── Collections
├── Indexes
└── Aggregation Pipelines
```

### Pola Arsitektur
- **Frontend**: Single Page Application (SPA) dengan Next.js
- **Backend**: RESTful API dengan Next.js API Routes
- **Database**: Document-based dengan MongoDB
- **Authentication**: JWT-based dengan custom token management
- **State Management**: React Hooks dan Context API
- **UI Framework**: Tailwind CSS dengan shadcn/ui components

---

## 🛠️ Teknologi yang Digunakan

### Frontend Technologies
| Teknologi | Versi | Deskripsi |
|-----------|-------|-----------|
| **Next.js** | 14.2.3 | React framework dengan App Router |
| **React** | 18 | Library untuk membangun UI |
| **Tailwind CSS** | 3.4.1 | Utility-first CSS framework |
| **shadcn/ui** | Latest | Component library berbasis Radix UI |
| **Lucide React** | 0.516.0 | Icon library |
| **Recharts** | 2.15.3 | Library untuk charting dan visualisasi |

### Backend Technologies
| Teknologi | Versi | Deskripsi |
|-----------|-------|-----------|
| **Node.js** | Latest | JavaScript runtime |
| **MongoDB** | 6.6.0 | NoSQL database |
| **UUID** | 9.0.1 | Unique identifier generator |
| **Axios** | 1.10.0 | HTTP client untuk API calls |

### Development Tools
| Tool | Versi | Deskripsi |
|------|-------|-----------|
| **TypeScript** | - | Type safety (jsconfig.json) |
| **PostCSS** | Latest | CSS processing |
| **Autoprefixer** | 10.4.19 | CSS vendor prefixes |
| **Cross-env** | 7.0.3 | Cross-platform environment variables |

### UI/UX Libraries
- **@radix-ui/**: Komponen UI primitif yang accessible
- **@tanstack/react-table**: Table management yang powerful
- **React Hook Form**: Form management dan validasi
- **Sonner**: Toast notification system
- **Date-fns**: Date manipulation utility

---

## 🗄️ Struktur Database

### Collections Utama

#### 1. **company**
```javascript
{
  id: String,
  name: String,
  address: String,
  phone: String,
  email: String,
  tax_number: String,
  logo_url: String,
  created_at: ISO Date,
  updated_at: ISO Date
}
```

#### 2. **branches**
```javascript
{
  id: String,
  code: String,          // Kode unik cabang (e.g., JKT01)
  name: String,
  address: String,
  city: String,
  province: String,
  postal_code: String,
  phone: String,
  email: String,
  is_active: Boolean,
  opening_hours: String,
  created_at: ISO Date,
  updated_at: ISO Date
}
```

#### 3. **users**
```javascript
{
  id: String,
  username: String,
  password: String,      // Hashed
  full_name: String,
  role_id: String,
  branch_id: String,     // nullable
  email: String,
  phone: String,
  is_active: Boolean,
  created_at: ISO Date
}
```

#### 4. **roles**
```javascript
{
  id: String,
  name: String,          // Admin, Branch Manager, Cashier
  description: String,
  permissions: Array,    // ['all'] atau specific permissions
  is_system: Boolean,    // System roles tidak bisa dihapus
  created_at: ISO Date
}
```

#### 5. **products**
```javascript
{
  id: String,
  sku: String,           // Auto-generated atau manual
  name: String,
  category_id: String,
  brand_id: String,
  compatible_models: String,
  uom: String,           // Unit of Measure
  purchase_price: Number,
  price_levels: {        // Multiple pricing
    normal: Number,
    wholesale: Number
  },
  barcode: String,
  images: Array,         // URLs
  technical_specs: String,
  storage_location: String,
  tags: Array,
  labels: Array,
  is_bundle: Boolean,
  bundle_products: Array,
  promotional_pricing: Array,
  volume_discounts: Array,
  stock_per_branch: Object,  // {branch_id: quantity}
  promo: {               // Simple promo structure
    discount_percentage: Number,
    is_active: Boolean,
    updated_at: ISO Date
  },
  is_active: Boolean,
  created_at: ISO Date,
  updated_at: ISO Date
}
```

#### 6. **categories**
```javascript
{
  id: String,
  name: String,
  description: String,
  parent_id: String,     // For hierarchical categories
  is_active: Boolean,
  created_at: ISO Date,
  updated_at: ISO Date
}
```

#### 7. **brands**
```javascript
{
  id: String,
  name: String,
  description: String,
  is_active: Boolean,
  created_at: ISO Date,
  updated_at: ISO Date
}
```

#### 8. **suppliers**
```javascript
{
  id: String,
  name: String,
  contact_person: String,
  phone: String,
  email: String,
  address: String,
  payment_terms: String,
  delivery_terms: String,
  notes: String,
  is_active: Boolean,
  created_at: ISO Date,
  updated_at: ISO Date
}
```

#### 9. **customers**
```javascript
{
  id: String,
  name: String,
  phone: String,
  email: String,
  address: String,
  notes: String,
  is_active: Boolean,
  total_purchases: Number,
  total_spent: Number,
  last_purchase: ISO Date,
  created_at: ISO Date,
  updated_at: ISO Date
}
```

#### 10. **transactions**
```javascript
{
  id: String,
  transaction_number: String,
  customer_id: String,
  branch_id: String,
  user_id: String,       // Cashier
  transaction_date: ISO Date,
  items: [{
    product_id: String,
    product_name: String,
    sku: String,
    quantity: Number,
    price: Number,
    subtotal: Number
  }],
  subtotal: Number,
  tax: Number,
  discount: Number,
  total: Number,
  payment_method: String,
  status: String,        // pending, completed, cancelled
  notes: String,
  created_at: ISO Date,
  updated_at: ISO Date
}
```

#### 11. **purchase_orders**
```javascript
{
  id: String,
  po_number: String,     // Auto-generated
  supplier_id: String,
  supplier_name: String,
  branch_id: String,
  branch_name: String,
  order_date: ISO Date,
  expected_date: ISO Date,
  status: String,        // pending, approved, ordered, partial, completed, cancelled
  notes: String,
  items: [{
    product_id: String,
    product_name: String,
    sku: String,
    quantity_ordered: Number,
    quantity_received: Number,
    price: Number,
    subtotal: Number
  }],
  total_amount: Number,
  total_items: Number,
  created_by: String,
  created_by_name: String,
  created_at: ISO Date,
  updated_at: ISO Date
}
```

#### 12. **stock_movements**
```javascript
{
  id: String,
  type: String,          // TRANSFER, ADJUSTMENT, OPNAME, RECEIVE
  product_id: String,
  branch_id: String,
  from_branch_id: String, // For transfers
  to_branch_id: String,   // For transfers
  quantity: Number,
  previous_stock: Number,
  new_stock: Number,
  reason: String,
  notes: String,
  po_id: String,         // For receive operations
  po_number: String,
  user_id: String,
  username: String,
  timestamp: ISO Date
}
```

#### 13. **activity_logs**
```javascript
{
  id: String,
  user_id: String,
  username: String,
  action: String,        // CREATE, UPDATE, DELETE, LOGIN, etc.
  entity_type: String,   // PRODUCT, BRANCH, USER, etc.
  entity_id: String,
  entity_name: String,
  details: String,
  ip_address: String,
  timestamp: ISO Date
}
```

---

## ⭐ Fitur Utama

### 1. **Multi-Branch Management**
- Manajemen cabang dengan informasi lengkap
- Stock per cabang yang terpisah
- Transfer stock antar cabang
- Reporting per cabang

### 2. **Product Management**
- CRUD produk dengan informasi lengkap
- Auto-generate SKU dan barcode
- Multiple price levels (Normal, Wholesale)
- Sistem promo dengan discount percentage
- Volume discount rules
- Bundle products
- Tag dan label system
- Margin analysis

### 3. **Inventory Management**
- Real-time stock tracking per cabang
- Stock transfer antar cabang
- Stock adjustment (add/subtract/set)
- Stock opname (physical count)
- Low stock alerts
- Stock movement history

### 4. **Purchase Order Management**
- Create dan manage purchase orders
- Auto-generate PO numbers
- Multiple status tracking
- Goods receiving dengan partial receiving
- Integration dengan stock management

### 5. **Customer Management**
- Database customer dengan informasi lengkap
- Purchase history tracking
- Customer statistics

### 6. **Supplier Management**
- Database supplier dengan informasi kontak
- Product mapping per supplier
- Purchase order integration

### 7. **POS Transactions**
- Point of sale interface
- Multiple payment methods
- Transaction history
- Receipt generation
- Customer integration

### 8. **Reporting & Analytics**
- Sales reports per periode
- Inventory reports
- Margin analysis
- Top products analysis
- Branch performance comparison
- Real-time dashboard

### 9. **User Management**
- Role-based access control
- User authentication dan authorization
- Activity logging
- Multi-level permissions

### 10. **System Configuration**
- Company profile setup
- Branch configuration
- Role dan permission management
- System parameters

---

## 👥 Manajemen Pengguna dan Akses

### Role-Based Access Control (RBAC)

#### **Admin**
- **Permissions**: Full system access
- **Capabilities**:
  - Manage semua cabang
  - Create/update/delete users
  - System configuration
  - View all reports
  - Manage suppliers dan customers
  - Access activity logs

#### **Branch Manager**
- **Permissions**: Branch-specific management
- **Capabilities**:
  - Manage inventory untuk cabang mereka
  - View branch reports
  - Process transactions
  - Manage branch profile
  - Create purchase orders
  - Stock management

#### **Cashier**
- **Permissions**: Transaction processing
- **Capabilities**:
  - Process sales transactions
  - View product catalog
  - Basic customer management
  - View basic reports

### Authentication Flow
1. User login dengan username/password
2. System validasi credentials
3. Generate JWT token
4. Token disimpan di localStorage
5. Setiap API request menggunakan Bearer token
6. Token verification pada setiap request

---

## 📦 Modul-Modul Sistem

### 1. **Dashboard Module**
**File**: `components/features/Dashboard.jsx`

**Fitur**:
- Overview pendapatan (hari ini, minggu ini, bulan ini)
- Statistik inventory dan customer
- Top 5 produk terlaris
- Transaksi terbaru
- Item stock rendah
- Real-time metrics

**Key Components**:
```jsx
// Stats calculation
const fetchDashboardData = async () => {
  // Fetch data dari multiple endpoints
  // Calculate revenue, inventory, customer stats
  // Generate charts dan metrics
}

// Card components untuk menampilkan metrics
const StatCard = ({ title, value, description, icon, gradient })
```

### 2. **Product Management Module**
**File**: `components/features/ProductManagement.jsx`

**Fitur**:
- CRUD operations untuk produk
- Auto-generate SKU/barcode
- Multiple price levels
- Image management (max 5 images)
- Promo management
- Stock tracking per branch
- Search dan filtering

**Key Functions**:
```jsx
// Product CRUD
const handleCreateProduct = async (productData)
const handleUpdateProduct = async (productId, updates)
const handleDeleteProduct = async (productId)

// Promo management
const handlePromoUpdate = async (productId, promoData)

// Stock management
const updateProductStock = async (productId, branchId, quantity)
```

### 3. **Inventory Management Module**
**File**: `components/features/InventoryManagement.jsx`

**Fitur**:
- Real-time stock display per cabang
- Stock adjustment (add/subtract/set)
- Low stock alerts
- Stock value calculation
- Batch operations

**Key Operations**:
- Stock adjustment dengan reason tracking
- Low stock identification
- Stock value calculation
- Multi-branch stock overview

### 4. **Purchase Order Management**
**File**: `components/features/PurchaseOrderManagement.jsx`

**Fitur**:
- Create PO dengan supplier selection
- Auto-calculate suggested quantities
- Goods receiving process
- PO status tracking
- Integration dengan inventory

**PO Workflow**:
1. Create PO → pending status
2. Approve PO → approved status
3. Send to supplier → ordered status
4. Receive goods → partial/completed status

### 5. **Branch Management Module**
**File**: `components/features/BranchManagement.jsx`

**Fitur**:
- CRUD operations untuk cabang
- Staff assignment
- Branch profile management
- Operating hours configuration
- Contact information management

### 6. **User Management Module**
**File**: `components/features/UserManagement.jsx`

**Fitur**:
- User CRUD operations
- Role assignment
- Branch assignment
- Password management
- User status management

### 7. **Customer Management Module**
**File**: `components/features/CustomerManagement.jsx`

**Fitur**:
- Customer database management
- Purchase history tracking
- Customer statistics
- Contact management

### 8. **Supplier Management Module**
**File**: `components/features/SupplierManagement.jsx`

**Fitur**:
- Supplier database management
- Contact information
- Payment dan delivery terms
- Product mapping

### 9. **POS Transactions Module**
**File**: `components/features/POSTransactions.jsx`

**Fitur**:
- Transaction processing
- Payment method selection
- Receipt generation
- Transaction history
- Status tracking

### 10. **Reporting & Analytics Module**
**File**: `components/features/ReportingAnalytics.jsx`

**Fitur**:
- Sales reports dengan date range
- Inventory reports
- Product performance analysis
- Branch comparison
- Export functionality

### 11. **Activity Logs Module**
**File**: `components/features/ActivityLogs.jsx`

**Fitur**:
- System activity tracking
- User action logging
- Filtering dan searching
- Audit trail

### 12. **Company Profile Module**
**File**: `components/features/CompanyProfile.jsx`

**Fitur**:
- Company information management
- Logo upload
- Tax configuration
- Contact details

### 13. **Role Management Module**
**File**: `components/features/RoleManagement.jsx`

**Fitur**:
- Role definition
- Permission assignment
- System role protection
- Custom role creation

---

## 🔌 API Endpoints

### Authentication Endpoints
```
POST /api/auth/login
POST /api/auth/register
GET  /api/auth/me
```

### Company Management
```
GET  /api/company
POST /api/company/update
```

### Branch Management
```
GET  /api/branches
POST /api/branches/create
POST /api/branches/{id}/update
POST /api/branches/{id}/toggle
POST /api/branches/{id}/delete
POST /api/branches/assign-staff
```

### User Management
```
GET  /api/users
POST /api/users/create
POST /api/users/{id}/update
POST /api/users/{id}/delete
```

### Role Management
```
GET  /api/roles
POST /api/roles/create
POST /api/roles/{id}/update
POST /api/roles/{id}/delete
```

### Product Management
```
GET  /api/products
POST /api/products/create
POST /api/products/{id}/update
POST /api/products/{id}/toggle
POST /api/products/{id}/delete
POST /api/products/{id}/stock
POST /api/products/{id}/promo
POST /api/products/{id}/volume-discount
GET  /api/products/margin-report
```

### Category Management
```
GET  /api/categories
POST /api/categories/create
POST /api/categories/{id}/update
POST /api/categories/{id}/toggle
POST /api/categories/{id}/delete
```

### Brand Management
```
GET  /api/brands
POST /api/brands/create
POST /api/brands/{id}/update
POST /api/brands/{id}/toggle
POST /api/brands/{id}/delete
```

### Inventory Management
```
GET  /api/inventory
POST /api/inventory/transfer
POST /api/inventory/adjustment
POST /api/inventory/opname
```

### Purchase Order Management
```
GET  /api/purchase-orders
POST /api/purchase-orders/create
POST /api/purchase-orders/{id}/receive
POST /api/purchase-orders/{id}/update-status
```

### Supplier Management
```
GET  /api/suppliers
POST /api/suppliers/create
POST /api/suppliers/{id}/update
POST /api/suppliers/{id}/toggle
POST /api/suppliers/{id}/delete
POST /api/suppliers/{id}/map-products
```

### Customer Management
```
GET  /api/customers
POST /api/customers/create
POST /api/customers/{id}/update
POST /api/customers/{id}/toggle
POST /api/customers/{id}/delete
```

### Transaction Management
```
GET  /api/transactions
POST /api/transactions/create
GET  /api/transactions/{id}
POST /api/transactions/{id}/update-status
```

### Activity Logs
```
GET  /api/activity-logs
POST /api/activity-logs/create
```

### System Initialization
```
GET  /api/init
GET  /api/init/reset-data
```

---

## 🚀 Panduan Instalasi

### Prerequisites
- Node.js 18+ 
- MongoDB 6+
- Git

### Step-by-step Installation

#### 1. Clone Repository
```bash
git clone <repository-url>
cd fe-diwan-motor
```

#### 2. Install Dependencies
```bash
npm install
# atau
yarn install
```

#### 3. Environment Configuration
Buat file `.env.local`:
```env
MONGO_URL=mongodb://localhost:27017/motorbike_pos
DB_NAME=motorbike_pos
NODE_ENV=development
```

#### 4. Database Setup
- Install MongoDB
- Create database `motorbike_pos`
- System akan auto-initialize collections saat first run

#### 5. Run Development Server
```bash
npm run dev
```

#### 6. Access Application
- URL: `http://localhost:3000`
- Default admin login: `admin` / `admin123`

### Production Deployment

#### 1. Build Application
```bash
npm run build
```

#### 2. Start Production Server
```bash
npm start
```

#### 3. Environment Variables (Production)
```env
MONGO_URL=mongodb://production-server:27017/motorbike_pos
DB_NAME=motorbike_pos
NODE_ENV=production
CORS_ORIGINS=https://yourdomain.com
```

### Docker Deployment (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📖 Panduan Penggunaan

### First Time Setup

#### 1. Login sebagai Admin
- Username: `admin`
- Password: `admin123`

#### 2. Setup Company Profile
- Navigasi ke Pengaturan → Profil Perusahaan
- Isi informasi perusahaan lengkap
- Upload logo perusahaan

#### 3. Create Branches
- Navigasi ke Cabang
- Tambah cabang dengan informasi lengkap
- Set status aktif untuk cabang operasional

#### 4. Setup Users
- Navigasi ke Pengguna
- Create Branch Manager untuk setiap cabang
- Create Cashier sesuai kebutuhan
- Assign users ke cabang masing-masing

#### 5. Setup Master Data
- **Categories**: Buat kategori produk (Ban, Oli, Rem, dll.)
- **Brands**: Tambah brand suku cadang (Honda, Yamaha, dll.)
- **Suppliers**: Input data supplier
- **Customers**: Import atau input data customer

#### 6. Setup Products
- Navigasi ke Produk → Daftar Produk
- Input produk dengan informasi lengkap
- Set harga untuk multiple price levels
- Set stock awal untuk setiap cabang

### Daily Operations

#### Branch Manager Tasks
1. **Stock Management**
   - Monitor stock levels
   - Create purchase orders
   - Receive goods dari supplier
   - Stock transfer antar cabang
   - Stock opname berkala

2. **Sales Monitoring**
   - Monitor transaksi harian
   - Review sales reports
   - Manage customer relationships

3. **Inventory Control**
   - Stock adjustment bila diperlukan
   - Monitor low stock items
   - Coordinate dengan supplier

#### Cashier Tasks
1. **Transaction Processing**
   - Process sales transactions
   - Handle multiple payment methods
   - Generate receipts
   - Update customer information

2. **Basic Inventory**
   - Check product availability
   - Report stock issues
   - Update product information

#### Admin Tasks
1. **System Monitoring**
   - Monitor system performance
   - Review activity logs
   - User management

2. **Business Intelligence**
   - Generate comprehensive reports
   - Analyze business trends
   - Strategic planning support

3. **System Configuration**
   - Update system parameters
   - Manage integrations
   - Backup dan maintenance

### Best Practices

#### Stock Management
- Lakukan stock opname minimal sebulan sekali
- Set minimum stock levels untuk auto-reorder
- Monitor fast-moving vs slow-moving items
- Coordinate dengan supplier untuk lead times

#### Data Management
- Backup data secara berkala
- Maintain data accuracy
- Regular cleanup of old transactions
- Monitor system performance

#### Security
- Change default passwords
- Regular password updates
- Monitor user activity
- Implement proper access controls

---

## 🔒 Keamanan Sistem

### Authentication & Authorization

#### JWT Token Security
- Token expiration management
- Secure token storage
- Token refresh mechanism
- Role-based access validation

#### Password Security
- Password hashing dengan base64 encoding
- Minimum password requirements
- Password change policies
- Account lockout after failed attempts

#### Access Control
- Role-based permissions
- Function-level authorization
- Data-level security
- API endpoint protection

### Data Security

#### Database Security
- Connection string protection
- Query injection prevention
- Data validation dan sanitization
- Audit trail maintenance

#### Network Security
- HTTPS enforcement (production)
- CORS configuration
- Rate limiting (future enhancement)
- Input validation

#### File Upload Security
- File type validation
- File size limits
- Secure file storage
- Image optimization

### Activity Monitoring

#### Audit Trail
```javascript
// Setiap action penting di-log
await logActivity(db, {
  user_id: currentUser.id,
  username: currentUser.username,
  action: 'CREATE',
  entity_type: 'PRODUCT',
  entity_id: newProduct.id,
  entity_name: newProduct.name,
  details: `Created product with SKU: ${newProduct.sku}`,
  ip_address: request.headers.get('x-forwarded-for') || 'unknown'
});
```

#### Security Headers
```javascript
// next.config.js security headers
async headers() {
  return [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "ALLOWALL" },
        { key: "Content-Security-Policy", value: "frame-ancestors *;" },
        { key: "Access-Control-Allow-Origin", value: process.env.CORS_ORIGINS || "*" },
        { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
        { key: "Access-Control-Allow-Headers", value: "*" },
      ],
    },
  ];
}
```

### Security Recommendations

#### Development
- Use environment variables untuk sensitive data
- Regular dependency updates
- Code review procedures
- Security testing

#### Production
- Use HTTPS/SSL certificates
- Database connection encryption
- Regular security audits
- Backup encryption
- Monitor suspicious activities

---

## 🔧 Maintenance dan Monitoring

### Database Maintenance

#### Regular Tasks
1. **Data Cleanup**
   - Archive old transactions (> 2 years)
   - Clean up inactive products
   - Remove old activity logs
   - Optimize collections

2. **Index Optimization**
   ```javascript
   // Recommended indexes
   db.products.createIndex({ "name": "text", "sku": "text" })
   db.transactions.createIndex({ "transaction_date": -1 })
   db.activity_logs.createIndex({ "timestamp": -1 })
   db.users.createIndex({ "username": 1 }, { unique: true })
   ```

3. **Backup Strategy**
   - Daily automated backups
   - Weekly full backups
   - Monthly archive backups
   - Test restore procedures

#### Performance Monitoring
- Database query performance
- Collection size monitoring
- Index usage analysis
- Connection pool monitoring

### Application Monitoring

#### Performance Metrics
- Page load times
- API response times
- Memory usage
- Error rates

#### Health Checks
```javascript
// Health check endpoint
GET /api/health
{
  status: 'healthy',
  database: 'connected',
  uptime: '24h 30m',
  version: '1.0.0'
}
```

#### Error Monitoring
- Application error logging
- API error tracking
- User error reports
- System alert notifications

### System Updates

#### Update Procedures
1. **Dependency Updates**
   - Regular npm audit
   - Security patch updates
   - Major version planning
   - Testing procedures

2. **Database Schema Updates**
   - Migration scripts
   - Backward compatibility
   - Data validation
   - Rollback procedures

3. **Feature Deployments**
   - Staging environment testing
   - Blue-green deployment
   - Feature flags
   - User acceptance testing

### Troubleshooting

#### Common Issues
1. **Database Connection**
   - Connection string validation
   - Network connectivity
   - Database server status
   - Connection pool exhaustion

2. **Authentication Issues**
   - Token expiration
   - Invalid credentials
   - Role permissions
   - Session management

3. **Performance Issues**
   - Slow queries
   - Large data sets
   - Memory leaks
   - Network latency

#### Diagnostic Tools
- MongoDB Compass untuk database analysis
- Next.js built-in performance monitoring
- Browser developer tools
- Network monitoring tools

### Support Procedures

#### Issue Reporting
1. Error description
2. Steps to reproduce
3. User role dan permissions
4. Browser/system information
5. Screenshots/logs

#### Escalation Process
1. Level 1: Basic troubleshooting
2. Level 2: Technical investigation
3. Level 3: Developer intervention
4. Level 4: System administrator

---

## 📚 Appendix

### Kode Status dan Error Messages

#### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

#### Custom Error Messages
```javascript
// Authentication errors
"Invalid credentials"
"Token expired"
"Unauthorized access"

// Validation errors
"Required field missing"
"Invalid data format"
"Duplicate entry"

// Business logic errors
"Insufficient stock"
"Invalid transaction"
"Operation not allowed"
```

### Database Schema Conventions

#### Naming Conventions
- Collections: plural nouns (products, users, branches)
- Fields: snake_case (created_at, is_active, branch_id)
- IDs: UUID v4 format
- Dates: ISO 8601 format

#### Data Types
- IDs: String (UUID)
- Timestamps: ISO Date String
- Booleans: Boolean
- Numbers: Number (Float untuk harga, Integer untuk quantity)
- Arrays: Array of Objects atau primitives

### API Response Formats

#### Success Response
```javascript
// Single object
{
  id: "uuid",
  name: "Product Name",
  // ... other fields
}

// Array response
[
  { id: "uuid1", name: "Item 1" },
  { id: "uuid2", name: "Item 2" }
]

// Operation response
{
  message: "Operation completed successfully",
  id: "uuid",
  status: "success"
}
```

#### Error Response
```javascript
{
  error: "Error message",
  code: "ERROR_CODE",
  details: "Additional details if available"
}
```

### Environment Configuration

#### Development (.env.local)
```env
MONGO_URL=mongodb://localhost:27017/motorbike_pos
DB_NAME=motorbike_pos
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000
```

#### Production (.env.production)
```env
MONGO_URL=mongodb://production-cluster/motorbike_pos
DB_NAME=motorbike_pos
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-domain.com
CORS_ORIGINS=https://your-domain.com
```

### Testing Strategy

#### Unit Testing
- Component testing dengan React Testing Library
- API endpoint testing
- Business logic testing
- Database operation testing

#### Integration Testing
- End-to-end user workflows
- API integration testing
- Database integration
- Authentication flow testing

#### Performance Testing
- Load testing dengan realistic data
- Stress testing untuk peak usage
- Database performance testing
- API response time testing

---

## 📞 Kontak dan Dukungan

### Development Team
- **Lead Developer**: [Developer Name]
- **Backend Developer**: [Developer Name] 
- **Frontend Developer**: [Developer Name]
- **Database Administrator**: [DBA Name]

### Support Information
- **Documentation**: [Documentation URL]
- **Issue Tracking**: [GitHub Issues URL]
- **Support Email**: support@company.com
- **Emergency Contact**: [Emergency Phone]

### Version Information
- **Current Version**: 1.0.0
- **Last Updated**: [Current Date]
- **Next Version**: 1.1.0 (planned features)

---

## 📝 Change Log

### Version 1.0.0 (Current)
- Initial release
- Complete POS dan inventory system
- Multi-branch support
- Role-based access control
- Comprehensive reporting
- Mobile-responsive design

### Planned Features (v1.1.0)
- Barcode scanning integration
- WhatsApp notification integration
- Advanced reporting dengan export
- Mobile app companion
- Real-time notifications
- Backup dan restore UI
- Multi-language support
- Theme customization

---

*Dokumentasi ini akan terus diperbarui seiring dengan perkembangan sistem. Untuk informasi terbaru, silakan cek versi online atau hubungi tim development.*