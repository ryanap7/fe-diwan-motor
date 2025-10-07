import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

const mongoUrl = process.env.MONGO_URL;
const dbName = process.env.DB_NAME || 'motorbike_pos';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await MongoClient.connect(mongoUrl);
  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

// Simple password hashing (in production, use bcrypt)
function hashPassword(password) {
  return Buffer.from(password).toString('base64');
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

// Simple JWT simulation (in production, use jsonwebtoken)
function createToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    role_id: user.role_id,
    branch_id: user.branch_id
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function verifyToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    return payload;
  } catch (error) {
    return null;
  }
}

// Helper function to log activity
async function logActivity(db, data) {
  try {
    const newLog = {
      id: uuidv4(),
      user_id: data.user_id,
      username: data.username,
      action: data.action,
      entity_type: data.entity_type,
      entity_id: data.entity_id || null,
      entity_name: data.entity_name || null,
      details: data.details || null,
      ip_address: data.ip_address || 'unknown',
      timestamp: new Date().toISOString()
    };
    await db.collection('activity_logs').insertOne(newLog);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

// Helper function for margin analysis (FR-PRD-011)
function calculateMargin(product) {
  const purchasePrice = parseFloat(product.purchase_price) || 0;
  const margins = {};
  
  if (product.price_levels) {
    Object.keys(product.price_levels).forEach(level => {
      const sellingPrice = parseFloat(product.price_levels[level]) || 0;
      if (sellingPrice > 0 && purchasePrice > 0) {
        const margin = sellingPrice - purchasePrice;
        const marginPercentage = (margin / sellingPrice) * 100;
        margins[level] = {
          selling_price: sellingPrice,
          purchase_price: purchasePrice,
          margin_amount: margin,
          margin_percentage: marginPercentage
        };
      }
    });
  }
  
  return margins;
}

// Helper function to get current pricing including promotions (FR-PRD-009)
function getCurrentPricing(product) {
  const now = new Date();
  let activePricing = product.price_levels;
  
  // Check for active promotional pricing
  if (product.promotional_pricing && product.promotional_pricing.length > 0) {
    const activePromo = product.promotional_pricing.find(promo => {
      if (!promo.is_active) return false;
      const startDate = new Date(promo.start_date);
      const endDate = new Date(promo.end_date);
      return now >= startDate && now <= endDate;
    });
    
    if (activePromo) {
      activePricing = activePromo.price_levels;
    }
  }
  
  return activePricing;
}

// Helper function to calculate volume discount (FR-PRD-010)
function calculateVolumeDiscount(product, quantity) {
  if (!product.volume_discounts || product.volume_discounts.length === 0) {
    return null;
  }
  
  // Find the highest applicable discount
  const applicableDiscounts = product.volume_discounts
    .filter(discount => discount.is_active && quantity >= discount.min_quantity)
    .sort((a, b) => b.min_quantity - a.min_quantity);
  
  if (applicableDiscounts.length === 0) {
    return null;
  }
  
  return applicableDiscounts[0];
}

export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/', '');
    const body = await request.json();

    // Auth - Login
    if (path === 'auth/login') {
      const { username, password } = body;
      
      const user = await db.collection('users').findOne({ username });
      if (!user || !verifyPassword(password, user.password)) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      const token = createToken(user);
      const role = await db.collection('roles').findOne({ id: user.role_id });
      const branch = user.branch_id 
        ? await db.collection('branches').findOne({ id: user.branch_id })
        : null;

      // Log login activity
      await logActivity(db, {
        user_id: user.id,
        username: user.username,
        action: 'login',
        entity_type: 'auth',
        details: `User ${user.username} berhasil login`,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      });

      return NextResponse.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: role ? { id: role.id, name: role.name } : null,
          branch: branch ? { id: branch.id, name: branch.name } : null
        }
      });
    }

    // Auth - Register
    if (path === 'auth/register') {
      const { username, password, role_id, branch_id } = body;
      
      const existingUser = await db.collection('users').findOne({ username });
      if (existingUser) {
        return NextResponse.json(
          { error: 'Username already exists' },
          { status: 400 }
        );
      }

      const newUser = {
        id: uuidv4(),
        username,
        password: hashPassword(password),
        role_id: role_id || null,
        branch_id: branch_id || null,
        created_at: new Date().toISOString()
      };

      await db.collection('users').insertOne(newUser);

      return NextResponse.json({
        message: 'User created successfully',
        user: { id: newUser.id, username: newUser.username }
      });
    }

    // Get auth header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const currentUser = verifyToken(token);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Auth - Get current user
    if (path === 'auth/me' && request.method === 'GET') {
      const user = await db.collection('users').findOne({ id: currentUser.id });
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const role = await db.collection('roles').findOne({ id: user.role_id });
      const branch = user.branch_id 
        ? await db.collection('branches').findOne({ id: user.branch_id })
        : null;

      return NextResponse.json({
        user: {
          id: user.id,
          username: user.username,
          role: role ? { id: role.id, name: role.name } : null,
          branch: branch ? { id: branch.id, name: branch.name } : null
        }
      });
    }

    // Company Profile
    if (path === 'company') {
      const company = await db.collection('company').findOne({});
      
      if (!company) {
        const newCompany = {
          id: uuidv4(),
          name: '',
          address: '',
          phone: '',
          email: '',
          tax_number: '',
          logo_url: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        await db.collection('company').insertOne(newCompany);
        return NextResponse.json(newCompany);
      }
      
      return NextResponse.json(company);
    }

    if (path === 'company/update') {
      const updates = {
        ...body,
        updated_at: new Date().toISOString()
      };
      delete updates.id;
      delete updates._id;
      delete updates.created_at;

      await db.collection('company').updateOne({}, { $set: updates }, { upsert: true });
      const company = await db.collection('company').findOne({});
      
      return NextResponse.json(company);
    }

    // Branches - Create
    if (path === 'branches/create') {
      const newBranch = {
        id: uuidv4(),
        ...body,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await db.collection('branches').insertOne(newBranch);
      return NextResponse.json(newBranch);
    }

    // Branches - Update
    if (path.startsWith('branches/') && path.includes('/update')) {
      const branchId = path.split('/')[1];
      const updates = {
        ...body,
        updated_at: new Date().toISOString()
      };
      delete updates.id;
      delete updates._id;
      delete updates.created_at;

      await db.collection('branches').updateOne(
        { id: branchId },
        { $set: updates }
      );

      const branch = await db.collection('branches').findOne({ id: branchId });
      return NextResponse.json(branch);
    }

    // Branches - Toggle Active
    if (path.startsWith('branches/') && path.includes('/toggle')) {
      const branchId = path.split('/')[1];
      const branch = await db.collection('branches').findOne({ id: branchId });
      
      if (!branch) {
        return NextResponse.json(
          { error: 'Branch not found' },
          { status: 404 }
        );
      }

      await db.collection('branches').updateOne(
        { id: branchId },
        { $set: { is_active: !branch.is_active, updated_at: new Date().toISOString() } }
      );

      const updatedBranch = await db.collection('branches').findOne({ id: branchId });
      return NextResponse.json(updatedBranch);
    }

    // Branches - Delete
    if (path.startsWith('branches/') && path.includes('/delete')) {
      const branchId = path.split('/')[1];
      await db.collection('branches').deleteOne({ id: branchId });
      return NextResponse.json({ message: 'Branch deleted successfully' });
    }

    // Branches - Assign Staff
    if (path === 'branches/assign-staff') {
      const { branch_id, manager_id, cashier_id } = body;

      // First, unassign any existing staff from this branch
      await db.collection('users').updateMany(
        { branch_id: branch_id },
        { $set: { branch_id: null } }
      );

      // Then assign new staff
      if (manager_id) {
        // Unassign manager from any other branch first
        await db.collection('users').updateMany(
          { id: manager_id },
          { $set: { branch_id: null } }
        );
        // Assign to this branch
        await db.collection('users').updateOne(
          { id: manager_id },
          { $set: { branch_id: branch_id } }
        );
      }

      if (cashier_id) {
        // Unassign cashier from any other branch first
        await db.collection('users').updateMany(
          { id: cashier_id },
          { $set: { branch_id: null } }
        );
        // Assign to this branch
        await db.collection('users').updateOne(
          { id: cashier_id },
          { $set: { branch_id: branch_id } }
        );
      }

      return NextResponse.json({ 
        message: 'Staff assigned successfully',
        branch_id,
        manager_id,
        cashier_id
      });
    }

    // Roles - Create
    if (path === 'roles/create') {
      const newRole = {
        id: uuidv4(),
        ...body,
        is_system: false,
        created_at: new Date().toISOString()
      };

      await db.collection('roles').insertOne(newRole);
      return NextResponse.json(newRole);
    }

    // Roles - Update
    if (path.startsWith('roles/') && path.includes('/update')) {
      const roleId = path.split('/')[1];
      const updates = { ...body };
      delete updates.id;
      delete updates._id;
      delete updates.created_at;
      delete updates.is_system;

      await db.collection('roles').updateOne(
        { id: roleId, is_system: { $ne: true } },
        { $set: updates }
      );

      const role = await db.collection('roles').findOne({ id: roleId });
      return NextResponse.json(role);
    }

    // Roles - Delete
    if (path.startsWith('roles/') && path.includes('/delete')) {
      const roleId = path.split('/')[1];
      
      const role = await db.collection('roles').findOne({ id: roleId });
      if (role?.is_system) {
        return NextResponse.json(
          { error: 'Cannot delete system role' },
          { status: 400 }
        );
      }

      await db.collection('roles').deleteOne({ id: roleId });
      return NextResponse.json({ message: 'Role deleted successfully' });
    }

    // Users - Create
    if (path === 'users/create') {
      const { username } = body;
      
      const existingUser = await db.collection('users').findOne({ username });
      if (existingUser) {
        return NextResponse.json(
          { error: 'Username already exists' },
          { status: 400 }
        );
      }

      const newUser = {
        id: uuidv4(),
        username: body.username,
        password: hashPassword(body.password),
        role_id: body.role_id || null,
        branch_id: body.branch_id || null,
        created_at: new Date().toISOString()
      };

      await db.collection('users').insertOne(newUser);
      return NextResponse.json({
        id: newUser.id,
        username: newUser.username,
        role_id: newUser.role_id,
        branch_id: newUser.branch_id
      });
    }

    // Users - Update
    if (path.startsWith('users/') && path.includes('/update')) {
      const userId = path.split('/')[1];
      const updates = { ...body };
      delete updates.id;
      delete updates._id;
      delete updates.created_at;
      delete updates.username; // Don't allow username change

      if (updates.password) {
        updates.password = hashPassword(updates.password);
      } else {
        delete updates.password;
      }

      await db.collection('users').updateOne(
        { id: userId },
        { $set: updates }
      );

      const user = await db.collection('users').findOne({ id: userId });
      return NextResponse.json({
        id: user.id,
        username: user.username,
        role_id: user.role_id,
        branch_id: user.branch_id
      });
    }

    // Users - Delete
    if (path.startsWith('users/') && path.includes('/delete')) {
      const userId = path.split('/')[1];
      
      const user = await db.collection('users').findOne({ id: userId });
      if (user?.username === 'admin') {
        return NextResponse.json(
          { error: 'Cannot delete admin user' },
          { status: 400 }
        );
      }

      await db.collection('users').deleteOne({ id: userId });
      return NextResponse.json({ message: 'User deleted successfully' });
    }

    // Activity Logs - Create
    if (path === 'activity-logs/create') {
      const newLog = {
        id: uuidv4(),
        user_id: currentUser.id,
        username: body.username || currentUser.username,
        action: body.action,
        entity_type: body.entity_type,
        entity_id: body.entity_id || null,
        entity_name: body.entity_name || null,
        details: body.details || null,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        timestamp: new Date().toISOString()
      };

      await db.collection('activity_logs').insertOne(newLog);
      return NextResponse.json(newLog);
    }

    // Categories - Create
    if (path === 'categories/create') {
      const newCategory = {
        id: uuidv4(),
        name: body.name,
        description: body.description || '',
        parent_id: body.parent_id || null,
        is_active: body.is_active !== undefined ? body.is_active : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await db.collection('categories').insertOne(newCategory);
      return NextResponse.json(newCategory);
    }

    // Categories - Update
    if (path.startsWith('categories/') && path.includes('/update')) {
      const categoryId = path.split('/')[1];
      const updates = {
        name: body.name,
        description: body.description || '',
        parent_id: body.parent_id || null,
        is_active: body.is_active,
        updated_at: new Date().toISOString()
      };

      await db.collection('categories').updateOne({ id: categoryId }, { $set: updates });
      const category = await db.collection('categories').findOne({ id: categoryId });
      return NextResponse.json(category);
    }

    // Categories - Toggle Active
    if (path.startsWith('categories/') && path.includes('/toggle')) {
      const categoryId = path.split('/')[1];
      const category = await db.collection('categories').findOne({ id: categoryId });
      
      await db.collection('categories').updateOne(
        { id: categoryId },
        { $set: { is_active: !category.is_active, updated_at: new Date().toISOString() } }
      );

      const updatedCategory = await db.collection('categories').findOne({ id: categoryId });
      return NextResponse.json(updatedCategory);
    }

    // Categories - Delete
    if (path.startsWith('categories/') && path.includes('/delete')) {
      const categoryId = path.split('/')[1];
      await db.collection('categories').deleteOne({ id: categoryId });
      return NextResponse.json({ message: 'Category deleted successfully' });
    }

    // Brands - Create
    if (path === 'brands/create') {
      const newBrand = {
        id: uuidv4(),
        name: body.name,
        description: body.description || '',
        is_active: body.is_active !== undefined ? body.is_active : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await db.collection('brands').insertOne(newBrand);
      return NextResponse.json(newBrand);
    }

    // Brands - Update
    if (path.startsWith('brands/') && path.includes('/update')) {
      const brandId = path.split('/')[1];
      const updates = {
        name: body.name,
        description: body.description || '',
        is_active: body.is_active,
        updated_at: new Date().toISOString()
      };

      await db.collection('brands').updateOne({ id: brandId }, { $set: updates });
      const brand = await db.collection('brands').findOne({ id: brandId });
      return NextResponse.json(brand);
    }

    // Brands - Toggle Active
    if (path.startsWith('brands/') && path.includes('/toggle')) {
      const brandId = path.split('/')[1];
      const brand = await db.collection('brands').findOne({ id: brandId });
      
      await db.collection('brands').updateOne(
        { id: brandId },
        { $set: { is_active: !brand.is_active, updated_at: new Date().toISOString() } }
      );

      const updatedBrand = await db.collection('brands').findOne({ id: brandId });
      return NextResponse.json(updatedBrand);
    }

    // Brands - Delete
    if (path.startsWith('brands/') && path.includes('/delete')) {
      const brandId = path.split('/')[1];
      await db.collection('brands').deleteOne({ id: brandId });
      return NextResponse.json({ message: 'Brand deleted successfully' });
    }

    // Products - Create (FR-PRD-001)
    if (path === 'products/create') {
      // Generate automatic SKU if not provided (FR-PRD-002)
      let sku = body.sku;
      if (!sku) {
        const count = await db.collection('products').countDocuments();
        sku = `PRD${String(count + 1).padStart(6, '0')}`;
      }

      // Generate automatic barcode if not provided (FR-PRD-002)
      let barcode = body.barcode;
      if (!barcode) {
        barcode = `8901234${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
      }

      const newProduct = {
        id: uuidv4(),
        sku: sku,
        name: body.name,
        category_id: body.category_id,
        brand_id: body.brand_id,
        compatible_models: body.compatible_models || '',
        uom: body.uom,
        purchase_price: parseFloat(body.purchase_price) || 0,
        // Multiple price levels (FR-PRD-008)
        price_levels: {
          retail: parseFloat(body.price_levels?.retail) || 0,
          wholesale: parseFloat(body.price_levels?.wholesale) || 0,
          member: parseFloat(body.price_levels?.member) || 0
        },
        barcode: barcode,
        images: body.images || [], // Array of image URLs (max 5)
        technical_specs: body.technical_specs || '',
        storage_location: body.storage_location || '',
        // Tag/label system (FR-PRD-006)
        tags: body.tags || [],
        labels: body.labels || [],
        // Product bundling (FR-PRD-007)
        is_bundle: body.is_bundle || false,
        bundle_products: body.bundle_products || [], // Array of {product_id, quantity}
        // Time-based pricing (FR-PRD-009)
        promotional_pricing: body.promotional_pricing || [],
        // Volume discount rules (FR-PRD-010)
        volume_discounts: body.volume_discounts || [],
        // Stock per branch
        stock_per_branch: body.stock_per_branch || {},
        is_active: body.is_active !== undefined ? body.is_active : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await db.collection('products').insertOne(newProduct);
      
      // Log activity
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

      return NextResponse.json(newProduct);
    }

    // Products - Update (FR-PRD-001)
    if (path.startsWith('products/') && path.includes('/update')) {
      const productId = path.split('/')[1];
      const updates = {
        name: body.name,
        category_id: body.category_id,
        brand_id: body.brand_id,
        compatible_models: body.compatible_models || '',
        uom: body.uom,
        purchase_price: parseFloat(body.purchase_price) || 0,
        price_levels: {
          retail: parseFloat(body.price_levels?.retail) || 0,
          wholesale: parseFloat(body.price_levels?.wholesale) || 0,
          member: parseFloat(body.price_levels?.member) || 0
        },
        barcode: body.barcode,
        images: body.images || [],
        technical_specs: body.technical_specs || '',
        storage_location: body.storage_location || '',
        tags: body.tags || [],
        labels: body.labels || [],
        is_bundle: body.is_bundle || false,
        bundle_products: body.bundle_products || [],
        promotional_pricing: body.promotional_pricing || [],
        volume_discounts: body.volume_discounts || [],
        stock_per_branch: body.stock_per_branch || {},
        is_active: body.is_active,
        updated_at: new Date().toISOString()
      };

      await db.collection('products').updateOne({ id: productId }, { $set: updates });
      const product = await db.collection('products').findOne({ id: productId });
      
      // Log activity
      await logActivity(db, {
        user_id: currentUser.id,
        username: currentUser.username,
        action: 'UPDATE',
        entity_type: 'PRODUCT',
        entity_id: productId,
        entity_name: product.name,
        details: `Updated product with SKU: ${product.sku}`,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      });

      return NextResponse.json(product);
    }

    // Products - Toggle Active
    if (path.startsWith('products/') && path.includes('/toggle')) {
      const productId = path.split('/')[1];
      const product = await db.collection('products').findOne({ id: productId });
      
      await db.collection('products').updateOne(
        { id: productId },
        { $set: { is_active: !product.is_active, updated_at: new Date().toISOString() } }
      );

      const updatedProduct = await db.collection('products').findOne({ id: productId });
      
      // Log activity
      await logActivity(db, {
        user_id: currentUser.id,
        username: currentUser.username,
        action: updatedProduct.is_active ? 'ACTIVATE' : 'DEACTIVATE',
        entity_type: 'PRODUCT',
        entity_id: productId,
        entity_name: updatedProduct.name,
        details: `${updatedProduct.is_active ? 'Activated' : 'Deactivated'} product with SKU: ${updatedProduct.sku}`,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      });

      return NextResponse.json(updatedProduct);
    }

    // Products - Delete
    if (path.startsWith('products/') && path.includes('/delete')) {
      const productId = path.split('/')[1];
      const product = await db.collection('products').findOne({ id: productId });
      
      await db.collection('products').deleteOne({ id: productId });
      
      // Log activity
      await logActivity(db, {
        user_id: currentUser.id,
        username: currentUser.username,
        action: 'DELETE',
        entity_type: 'PRODUCT',
        entity_id: productId,
        entity_name: product?.name || 'Unknown',
        details: `Deleted product with SKU: ${product?.sku || 'Unknown'}`,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      });

      return NextResponse.json({ message: 'Product deleted successfully' });
    }

    // Products - Update Stock per Branch
    if (path.startsWith('products/') && path.includes('/stock')) {
      const productId = path.split('/')[1];
      const { branch_id, stock_quantity } = body;
      
      const product = await db.collection('products').findOne({ id: productId });
      const updatedStockPerBranch = { ...product.stock_per_branch };
      updatedStockPerBranch[branch_id] = parseInt(stock_quantity);

      await db.collection('products').updateOne(
        { id: productId },
        { $set: { stock_per_branch: updatedStockPerBranch, updated_at: new Date().toISOString() } }
      );

      const updatedProduct = await db.collection('products').findOne({ id: productId });
      
      // Log activity
      await logActivity(db, {
        user_id: currentUser.id,
        username: currentUser.username,
        action: 'UPDATE_STOCK',
        entity_type: 'PRODUCT',
        entity_id: productId,
        entity_name: updatedProduct.name,
        details: `Updated stock for branch ${branch_id}: ${stock_quantity}`,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      });

      return NextResponse.json(updatedProduct);
    }

    // Products - Add/Update Promotional Pricing (FR-PRD-009)
    if (path.startsWith('products/') && path.includes('/promo')) {
      const productId = path.split('/')[1];
      const { name, price_levels, start_date, end_date, is_active } = body;
      
      const product = await db.collection('products').findOne({ id: productId });
      const promotionalPricing = [...(product.promotional_pricing || [])];
      
      const newPromo = {
        id: uuidv4(),
        name,
        price_levels,
        start_date,
        end_date,
        is_active: is_active !== undefined ? is_active : true,
        created_at: new Date().toISOString()
      };
      
      promotionalPricing.push(newPromo);

      await db.collection('products').updateOne(
        { id: productId },
        { $set: { promotional_pricing: promotionalPricing, updated_at: new Date().toISOString() } }
      );

      const updatedProduct = await db.collection('products').findOne({ id: productId });
      
      // Log activity
      await logActivity(db, {
        user_id: currentUser.id,
        username: currentUser.username,
        action: 'ADD_PROMO',
        entity_type: 'PRODUCT',
        entity_id: productId,
        entity_name: updatedProduct.name,
        details: `Added promotional pricing: ${name}`,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      });

      return NextResponse.json(updatedProduct);
    }

    // Products - Add/Update Volume Discount Rules (FR-PRD-010)
    if (path.startsWith('products/') && path.includes('/volume-discount')) {
      const productId = path.split('/')[1];
      const { min_quantity, discount_type, discount_value, is_active } = body;
      
      const product = await db.collection('products').findOne({ id: productId });
      const volumeDiscounts = [...(product.volume_discounts || [])];
      
      const newDiscount = {
        id: uuidv4(),
        min_quantity: parseInt(min_quantity),
        discount_type, // 'percentage' or 'fixed'
        discount_value: parseFloat(discount_value),
        is_active: is_active !== undefined ? is_active : true,
        created_at: new Date().toISOString()
      };
      
      volumeDiscounts.push(newDiscount);

      await db.collection('products').updateOne(
        { id: productId },
        { $set: { volume_discounts: volumeDiscounts, updated_at: new Date().toISOString() } }
      );

      const updatedProduct = await db.collection('products').findOne({ id: productId });
      
      // Log activity
      await logActivity(db, {
        user_id: currentUser.id,
        username: currentUser.username,
        action: 'ADD_VOLUME_DISCOUNT',
        entity_type: 'PRODUCT',
        entity_id: productId,
        entity_name: updatedProduct.name,
        details: `Added volume discount for min quantity: ${min_quantity}`,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      });

      return NextResponse.json(updatedProduct);
    }

    return NextResponse.json(
      { error: 'Endpoint not found' },
      { status: 404 }
    );

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/', '');

    // Get auth header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    // Auth - Get current user
    if (path === 'auth/me') {
      if (!token) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const currentUser = verifyToken(token);
      if (!currentUser) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }

      const user = await db.collection('users').findOne({ id: currentUser.id });
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const role = await db.collection('roles').findOne({ id: user.role_id });
      const branch = user.branch_id 
        ? await db.collection('branches').findOne({ id: user.branch_id })
        : null;

      return NextResponse.json({
        user: {
          id: user.id,
          username: user.username,
          role: role ? { id: role.id, name: role.name, permissions: role.permissions } : null,
          branch: branch ? { id: branch.id, name: branch.name, code: branch.code } : null
        }
      });
    }

    // Initialize system roles and admin user if not exists
    if (path === 'init') {
      const rolesCount = await db.collection('roles').countDocuments();
      
      if (rolesCount === 0) {
        const systemRoles = [
          {
            id: uuidv4(),
            name: 'Admin',
            description: 'Full system access',
            permissions: ['all'],
            is_system: true,
            created_at: new Date().toISOString()
          },
          {
            id: uuidv4(),
            name: 'Branch Manager',
            description: 'Manage branch operations',
            permissions: ['manage_branch', 'view_reports', 'manage_inventory'],
            is_system: true,
            created_at: new Date().toISOString()
          },
          {
            id: uuidv4(),
            name: 'Cashier',
            description: 'Process sales transactions',
            permissions: ['process_sales', 'view_products'],
            is_system: true,
            created_at: new Date().toISOString()
          }
        ];

        await db.collection('roles').insertMany(systemRoles);

        // Create default admin user
        const adminRole = systemRoles[0];
        const adminUser = {
          id: uuidv4(),
          username: 'admin',
          password: hashPassword('admin123'),
          role_id: adminRole.id,
          branch_id: null,
          created_at: new Date().toISOString()
        };

        await db.collection('users').insertOne(adminUser);
      }

      return NextResponse.json({ message: 'System initialized' });
    }

    // Authorization check for protected endpoints
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const currentUser = verifyToken(token);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Company Profile
    if (path === 'company') {
      const company = await db.collection('company').findOne({});
      
      if (!company) {
        const newCompany = {
          id: uuidv4(),
          name: '',
          address: '',
          phone: '',
          email: '',
          tax_number: '',
          logo_url: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        await db.collection('company').insertOne(newCompany);
        return NextResponse.json(newCompany);
      }
      
      return NextResponse.json(company);
    }

    // Branches - List all
    if (path === 'branches') {
      const branches = await db.collection('branches').find({}).sort({ created_at: -1 }).toArray();
      return NextResponse.json(branches);
    }

    // Branches - Get one
    if (path.startsWith('branches/') && !path.includes('/')) {
      const branchId = path.split('/')[1];
      const branch = await db.collection('branches').findOne({ id: branchId });
      
      if (!branch) {
        return NextResponse.json(
          { error: 'Branch not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(branch);
    }

    // Roles - List all
    if (path === 'roles') {
      const roles = await db.collection('roles').find({}).sort({ created_at: -1 }).toArray();
      return NextResponse.json(roles);
    }

    // Users - List all
    if (path === 'users') {
      const users = await db.collection('users').find({}).sort({ created_at: -1 }).toArray();
      // Remove password from response
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      return NextResponse.json(sanitizedUsers);
    }

    // Activity Logs - List all
    if (path === 'activity-logs') {
      const logs = await db.collection('activity_logs').find({}).sort({ timestamp: -1 }).limit(500).toArray();
      return NextResponse.json(logs);
    }

    // Categories - List all
    if (path === 'categories') {
      const categories = await db.collection('categories').find({}).sort({ created_at: -1 }).toArray();
      return NextResponse.json(categories);
    }

    // Brands - List all
    if (path === 'brands') {
      const brands = await db.collection('brands').find({}).sort({ created_at: -1 }).toArray();
      return NextResponse.json(brands);
    }

    // Products - List all
    if (path === 'products') {
      const products = await db.collection('products').find({}).sort({ created_at: -1 }).toArray();
      return NextResponse.json(products);
    }

    return NextResponse.json(
      { error: 'Endpoint not found' },
      { status: 404 }
    );

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  return POST(request);
}

export async function DELETE(request) {
  return POST(request);
}

export async function PATCH(request) {
  return POST(request);
}