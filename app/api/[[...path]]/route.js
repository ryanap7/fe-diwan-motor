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
  let currentPricing = { ...product.price_levels };
  
  // Apply percentage discount if promo is active
  if (product.promo && product.promo.is_active && product.promo.discount_percentage > 0) {
    const discountMultiplier = (100 - product.promo.discount_percentage) / 100;
    
    currentPricing = {
      normal: Math.round(product.price_levels.normal * discountMultiplier),
      wholesale: Math.round(product.price_levels.wholesale * discountMultiplier)
    };
  }
  
  return currentPricing;
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
    
    let body = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch (e) {
      // No JSON body or invalid JSON, use empty object
      body = {};
    }

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
        // Multiple price levels (FR-PRD-008) - Simplified to Normal and Wholesale
        price_levels: {
          normal: parseFloat(body.price_levels?.normal) || 0,
          wholesale: parseFloat(body.price_levels?.wholesale) || 0
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
          normal: parseFloat(body.price_levels?.normal) || 0,
          wholesale: parseFloat(body.price_levels?.wholesale) || 0
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
      
      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
      
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

    // Products - Set/Update Promo Percentage (FR-PRD-009)
    if (path.startsWith('products/') && path.includes('/promo')) {
      const productId = path.split('/')[1];
      const { discount_percentage, is_active } = body;
      
      const product = await db.collection('products').findOne({ id: productId });
      
      // Simple promo structure - just discount percentage that can be changed anytime
      const promoData = {
        discount_percentage: parseFloat(discount_percentage) || 0,
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString()
      };

      await db.collection('products').updateOne(
        { id: productId },
        { $set: { promo: promoData, updated_at: new Date().toISOString() } }
      );

      const updatedProduct = await db.collection('products').findOne({ id: productId });
      
      // Log activity
      await logActivity(db, {
        user_id: currentUser.id,
        username: currentUser.username,
        action: 'UPDATE_PROMO',
        entity_type: 'PRODUCT',
        entity_id: productId,
        entity_name: updatedProduct.name,
        details: `Updated promo: ${discount_percentage}% discount, active: ${is_active}`,
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
    // Inventory Management - Stock Transfer (FR-INV-003)
    if (path === 'inventory/transfer') {
      const { product_id, from_branch_id, to_branch_id, quantity, notes } = body;
      
      // Get current product to check stock levels
      const product = await db.collection('products').findOne({ id: product_id });
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      const currentFromStock = parseInt(product.stock_per_branch?.[from_branch_id]) || 0;
      const transferQty = parseInt(quantity);

      if (currentFromStock < transferQty) {
        return NextResponse.json({ error: 'Insufficient stock in source branch' }, { status: 400 });
      }

      // Update stock levels
      const updatedStockPerBranch = { ...product.stock_per_branch };
      updatedStockPerBranch[from_branch_id] = currentFromStock - transferQty;
      updatedStockPerBranch[to_branch_id] = (parseInt(updatedStockPerBranch[to_branch_id]) || 0) + transferQty;

      await db.collection('products').updateOne(
        { id: product_id },
        { $set: { stock_per_branch: updatedStockPerBranch, updated_at: new Date().toISOString() } }
      );

      // Log stock movement
      const transferLog = {
        id: uuidv4(),
        type: 'TRANSFER',
        product_id: product_id,
        from_branch_id: from_branch_id,
        to_branch_id: to_branch_id,
        quantity: transferQty,
        notes: notes || '',
        user_id: currentUser.id,
        username: currentUser.username,
        timestamp: new Date().toISOString()
      };
      
      await db.collection('stock_movements').insertOne(transferLog);

      // Log activity
      await logActivity(db, {
        user_id: currentUser.id,
        username: currentUser.username,
        action: 'STOCK_TRANSFER',
        entity_type: 'INVENTORY',
        entity_id: product_id,
        entity_name: product.name,
        details: `Transferred ${transferQty} units from branch ${from_branch_id} to ${to_branch_id}`,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      });

      return NextResponse.json({ message: 'Stock transfer completed successfully' });
    }

    // Inventory Management - Stock Adjustment (FR-INV-004)
    if (path === 'inventory/adjustment') {
      const { product_id, branch_id, adjustment_type, quantity, reason, notes } = body;
      
      const product = await db.collection('products').findOne({ id: product_id });
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      const currentStock = parseInt(product.stock_per_branch?.[branch_id]) || 0;
      const adjustmentQty = parseInt(quantity);
      let newStock;

      switch (adjustment_type) {
        case 'add':
          newStock = currentStock + adjustmentQty;
          break;
        case 'subtract':
          newStock = Math.max(0, currentStock - adjustmentQty);
          break;
        case 'set':
          newStock = adjustmentQty;
          break;
        default:
          return NextResponse.json({ error: 'Invalid adjustment type' }, { status: 400 });
      }

      // Update stock
      const updatedStockPerBranch = { ...product.stock_per_branch };
      updatedStockPerBranch[branch_id] = newStock;

      await db.collection('products').updateOne(
        { id: product_id },
        { $set: { stock_per_branch: updatedStockPerBranch, updated_at: new Date().toISOString() } }
      );

      // Log stock movement
      const adjustmentLog = {
        id: uuidv4(),
        type: 'ADJUSTMENT',
        product_id: product_id,
        branch_id: branch_id,
        adjustment_type: adjustment_type,
        previous_stock: currentStock,
        new_stock: newStock,
        quantity: adjustmentQty,
        reason: reason || '',
        notes: notes || '',
        user_id: currentUser.id,
        username: currentUser.username,
        timestamp: new Date().toISOString()
      };
      
      await db.collection('stock_movements').insertOne(adjustmentLog);

      // Log activity
      await logActivity(db, {
        user_id: currentUser.id,
        username: currentUser.username,
        action: 'STOCK_ADJUSTMENT',
        entity_type: 'INVENTORY',
        entity_id: product_id,
        entity_name: product.name,
        details: `Stock ${adjustment_type}: ${currentStock} → ${newStock} (${reason})`,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      });

      return NextResponse.json({ message: 'Stock adjustment completed successfully' });
    }

    // Inventory Management - Stock Opname/Physical Count (FR-INV-005)
    if (path === 'inventory/opname') {
      const { branch_id, counts, notes } = body; // counts: [{ product_id, physical_count }]
      
      const opnameId = uuidv4();
      const opnameRecord = {
        id: opnameId,
        branch_id: branch_id,
        status: 'completed',
        notes: notes || '',
        user_id: currentUser.id,
        username: currentUser.username,
        timestamp: new Date().toISOString(),
        items: []
      };

      // Process each count
      for (const count of counts) {
        const product = await db.collection('products').findOne({ id: count.product_id });
        if (product) {
          const currentStock = parseInt(product.stock_per_branch?.[branch_id]) || 0;
          const physicalCount = parseInt(count.physical_count);
          const difference = physicalCount - currentStock;

          // Update stock if there's a difference
          if (difference !== 0) {
            const updatedStockPerBranch = { ...product.stock_per_branch };
            updatedStockPerBranch[branch_id] = physicalCount;

            await db.collection('products').updateOne(
              { id: count.product_id },
              { $set: { stock_per_branch: updatedStockPerBranch, updated_at: new Date().toISOString() } }
            );

            // Log stock movement
            const opnameLog = {
              id: uuidv4(),
              type: 'OPNAME',
              product_id: count.product_id,
              branch_id: branch_id,
              previous_stock: currentStock,
              physical_count: physicalCount,
              difference: difference,
              opname_id: opnameId,
              user_id: currentUser.id,
              username: currentUser.username,
              timestamp: new Date().toISOString()
            };
            
            await db.collection('stock_movements').insertOne(opnameLog);
          }

          opnameRecord.items.push({
            product_id: count.product_id,
            product_name: product.name,
            system_stock: currentStock,
            physical_count: physicalCount,
            difference: difference
          });
        }
      }

      // Save opname record
      await db.collection('stock_opname').insertOne(opnameRecord);

      // Log activity
      await logActivity(db, {
        user_id: currentUser.id,
        username: currentUser.username,
        action: 'STOCK_OPNAME',
        entity_type: 'INVENTORY',
        entity_id: opnameId,
        entity_name: `Stock Opname Branch ${branch_id}`,
        details: `Completed stock opname for ${counts.length} products`,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      });

      return NextResponse.json({ 
        message: 'Stock opname completed successfully',
        opname_id: opnameId,
        items_processed: counts.length
      });
    }

    // Suppliers - Create (FR-SUP-001)
    if (path === 'suppliers/create') {
      const newSupplier = {
        id: uuidv4(),
        name: body.name,
        contact_person: body.contact_person || '',
        phone: body.phone || '',
        email: body.email || '',
        address: body.address || '',
        payment_terms: body.payment_terms || '',
        delivery_terms: body.delivery_terms || '',
        notes: body.notes || '',
        is_active: body.is_active !== undefined ? body.is_active : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await db.collection('suppliers').insertOne(newSupplier);
      
      // Log activity
      await logActivity(db, {
        user_id: currentUser.id,
        username: currentUser.username,
        action: 'CREATE',
        entity_type: 'SUPPLIER',
        entity_id: newSupplier.id,
        entity_name: newSupplier.name,
        details: `Created supplier: ${newSupplier.name}`,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      });

      return NextResponse.json(newSupplier);
    }

    // Suppliers - Update (FR-SUP-001)
    if (path.startsWith('suppliers/') && path.includes('/update')) {
      const supplierId = path.split('/')[1];
      const updates = {
        name: body.name,
        contact_person: body.contact_person || '',
        phone: body.phone || '',
        email: body.email || '',
        address: body.address || '',
        payment_terms: body.payment_terms || '',
        delivery_terms: body.delivery_terms || '',
        notes: body.notes || '',
        is_active: body.is_active,
        updated_at: new Date().toISOString()
      };

      await db.collection('suppliers').updateOne({ id: supplierId }, { $set: updates });
      const supplier = await db.collection('suppliers').findOne({ id: supplierId });
      
      // Log activity
      await logActivity(db, {
        user_id: currentUser.id,
        username: currentUser.username,
        action: 'UPDATE',
        entity_type: 'SUPPLIER',
        entity_id: supplierId,
        entity_name: supplier.name,
        details: `Updated supplier: ${supplier.name}`,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      });

      return NextResponse.json(supplier);
    }

    // Suppliers - Toggle Active
    if (path.startsWith('suppliers/') && path.includes('/toggle')) {
      const supplierId = path.split('/')[1];
      const supplier = await db.collection('suppliers').findOne({ id: supplierId });
      
      await db.collection('suppliers').updateOne(
        { id: supplierId },
        { $set: { is_active: !supplier.is_active, updated_at: new Date().toISOString() } }
      );

      const updatedSupplier = await db.collection('suppliers').findOne({ id: supplierId });
      
      // Log activity
      await logActivity(db, {
        user_id: currentUser.id,
        username: currentUser.username,
        action: updatedSupplier.is_active ? 'ACTIVATE' : 'DEACTIVATE',
        entity_type: 'SUPPLIER',
        entity_id: supplierId,
        entity_name: updatedSupplier.name,
        details: `${updatedSupplier.is_active ? 'Activated' : 'Deactivated'} supplier: ${updatedSupplier.name}`,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      });

      return NextResponse.json(updatedSupplier);
    }

    // Suppliers - Delete
    if (path.startsWith('suppliers/') && path.includes('/delete')) {
      const supplierId = path.split('/')[1];
      const supplier = await db.collection('suppliers').findOne({ id: supplierId });
      
      await db.collection('suppliers').deleteOne({ id: supplierId });
      
      // Log activity
      await logActivity(db, {
        user_id: currentUser.id,
        username: currentUser.username,
        action: 'DELETE',
        entity_type: 'SUPPLIER',
        entity_id: supplierId,
        entity_name: supplier?.name || 'Unknown',
        details: `Deleted supplier: ${supplier?.name || 'Unknown'}`,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      });

      return NextResponse.json({ message: 'Supplier deleted successfully' });
    }

    // Suppliers - Product Mapping (FR-SUP-003)
    if (path.startsWith('suppliers/') && path.includes('/map-products')) {
      const supplierId = path.split('/')[1];
      const { product_ids, lead_time_days, unit_price, minimum_order, notes } = body;
      
      const supplier = await db.collection('suppliers').findOne({ id: supplierId });
      if (!supplier) {
        return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
      }

      // Create product mappings
      const mappings = product_ids.map(productId => ({
        id: uuidv4(),
        supplier_id: supplierId,
        product_id: productId,
        lead_time_days: parseInt(lead_time_days) || 7,
        unit_price: parseFloat(unit_price) || 0,
        minimum_order: parseInt(minimum_order) || 1,
        notes: notes || '',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // Remove existing mappings for these products from this supplier
      await db.collection('supplier_products').deleteMany({ 
        supplier_id: supplierId,
        product_id: { $in: product_ids }
      });

      // Insert new mappings
      if (mappings.length > 0) {
        await db.collection('supplier_products').insertMany(mappings);
      }

      // Log activity
      await logActivity(db, {
        user_id: currentUser.id,
        username: currentUser.username,
        action: 'MAP_PRODUCTS',
        entity_type: 'SUPPLIER',
        entity_id: supplierId,
        entity_name: supplier.name,
        details: `Mapped ${product_ids.length} products to supplier: ${supplier.name}`,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      });

      return NextResponse.json({ message: 'Product mapping saved successfully', mappings_count: mappings.length });
    }

    // Purchase Orders - Create (FR-INV-010)
    if (path === 'purchase-orders/create') {
      const { supplier_id, branch_id, expected_date, notes, items } = body;
      
      // Generate PO number
      const poCount = await db.collection('purchase_orders').countDocuments();
      const poNumber = `PO${new Date().getFullYear()}${String(poCount + 1).padStart(6, '0')}`;

      const newPO = {
        id: uuidv4(),
        po_number: poNumber,
        supplier_id: supplier_id,
        branch_id: branch_id,
        expected_date: expected_date || null,
        status: 'pending', // pending, approved, ordered, partial, completed, cancelled
        notes: notes || '',
        items: items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          ordered_qty: parseInt(item.suggested_qty) || 0,
          received_qty: 0,
          unit_price: 0 // Can be updated later
        })),
        total_items: items.length,
        created_by: currentUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await db.collection('purchase_orders').insertOne(newPO);
      
      // Log activity
      await logActivity(db, {
        user_id: currentUser.id,
        username: currentUser.username,
        action: 'CREATE',
        entity_type: 'PURCHASE_ORDER',
        entity_id: newPO.id,
        entity_name: newPO.po_number,
        details: `Created PO ${newPO.po_number} with ${items.length} items`,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      });

      return NextResponse.json(newPO);
    }

    // Purchase Orders - Receive Goods (FR-INV-011)
    if (path.startsWith('purchase-orders/') && path.includes('/receive')) {
      const poId = path.split('/')[1];
      const { items } = body; // items with receive_now quantities
      
      const purchaseOrder = await db.collection('purchase_orders').findOne({ id: poId });
      if (!purchaseOrder) {
        return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 });
      }

      // Update received quantities and product stock
      const updatedItems = [...purchaseOrder.items];
      let allItemsComplete = true;
      
      for (const receiveItem of items) {
        if (receiveItem.receive_now > 0) {
          // Find the item in PO
          const itemIndex = updatedItems.findIndex(item => item.product_id === receiveItem.product_id);
          if (itemIndex >= 0) {
            updatedItems[itemIndex].received_qty = (updatedItems[itemIndex].received_qty || 0) + receiveItem.receive_now;
            
            // Update product stock in branch
            const product = await db.collection('products').findOne({ id: receiveItem.product_id });
            if (product) {
              const updatedStockPerBranch = { ...product.stock_per_branch };
              updatedStockPerBranch[purchaseOrder.branch_id] = (parseInt(updatedStockPerBranch[purchaseOrder.branch_id]) || 0) + receiveItem.receive_now;

              await db.collection('products').updateOne(
                { id: receiveItem.product_id },
                { $set: { stock_per_branch: updatedStockPerBranch, updated_at: new Date().toISOString() } }
              );

              // Log stock movement
              const receiveLog = {
                id: uuidv4(),
                type: 'RECEIVE',
                product_id: receiveItem.product_id,
                branch_id: purchaseOrder.branch_id,
                quantity: receiveItem.receive_now,
                po_id: poId,
                po_number: purchaseOrder.po_number,
                user_id: currentUser.id,
                username: currentUser.username,
                timestamp: new Date().toISOString()
              };
              
              await db.collection('stock_movements').insertOne(receiveLog);
            }
          }
        }
      }

      // Check if all items are fully received
      for (const item of updatedItems) {
        if ((item.received_qty || 0) < item.ordered_qty) {
          allItemsComplete = false;
          break;
        }
      }

      // Update PO status
      const hasPartialReceived = updatedItems.some(item => (item.received_qty || 0) > 0);
      let newStatus = 'ordered';
      
      if (allItemsComplete) {
        newStatus = 'completed';
      } else if (hasPartialReceived) {
        newStatus = 'partial';
      }

      await db.collection('purchase_orders').updateOne(
        { id: poId },
        { 
          $set: { 
            items: updatedItems, 
            status: newStatus,
            updated_at: new Date().toISOString()
          }
        }
      );

      // Log activity
      await logActivity(db, {
        user_id: currentUser.id,
        username: currentUser.username,
        action: 'RECEIVE_GOODS',
        entity_type: 'PURCHASE_ORDER',
        entity_id: poId,
        entity_name: purchaseOrder.po_number,
        details: `Received goods for PO ${purchaseOrder.po_number} - Status: ${newStatus}`,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      });

      return NextResponse.json({ message: 'Goods received successfully', status: newStatus });
    }

    // Purchase Orders - Update Status
    if (path.startsWith('purchase-orders/') && path.includes('/update-status')) {
      const poId = path.split('/')[1];
      const { status } = body;
      
      const validStatuses = ['pending', 'approved', 'ordered', 'partial', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }

      const purchaseOrder = await db.collection('purchase_orders').findOne({ id: poId });
      if (!purchaseOrder) {
        return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 });
      }

      await db.collection('purchase_orders').updateOne(
        { id: poId },
        { 
          $set: { 
            status: status,
            updated_at: new Date().toISOString()
          }
        }
      );

      // Log activity
      await logActivity(db, {
        user_id: currentUser.id,
        username: currentUser.username,
        action: 'UPDATE_STATUS',
        entity_type: 'PURCHASE_ORDER',
        entity_id: poId,
        entity_name: purchaseOrder.po_number,
        details: `Updated PO status from ${purchaseOrder.status} to ${status}`,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      });

      return NextResponse.json({ message: 'Status updated successfully', status: status });
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

      // Initialize default suppliers if none exist
      const supplierCount = await db.collection('suppliers').countDocuments();
      if (supplierCount === 0) {
        const defaultSuppliers = [
          {
            id: uuidv4(),
            name: 'PT Yamaha Motor Indonesia',
            contact_person: 'Budi Santoso',
            phone: '021-12345678',
            email: 'budi@yamaha.co.id',
            address: 'Jl. Raya Jakarta No. 123, Jakarta Selatan',
            notes: 'Supplier resmi suku cadang Yamaha',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: uuidv4(),
            name: 'CV Honda Parts Supplier',
            contact_person: 'Siti Rahayu',
            phone: '021-87654321',
            email: 'siti@hondaparts.co.id',
            address: 'Jl. Sudirman No. 456, Jakarta Pusat',
            notes: 'Distributor suku cadang Honda terpercaya',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: uuidv4(),
            name: 'Toko Sparepart Suzuki Jaya',
            contact_person: 'Ahmad Wijaya',
            phone: '021-11223344',
            email: 'ahmad@suzukijaya.com',
            address: 'Jl. Gatot Subroto No. 789, Jakarta Barat',
            notes: 'Spesialis suku cadang Suzuki dan aksesoris motor',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: uuidv4(),
            name: 'UD Kawasaki Motor Parts',
            contact_person: 'Rina Kusuma',
            phone: '021-55667788',
            email: 'rina@kawasakiparts.net',
            address: 'Jl. Thamrin No. 321, Jakarta Timur',
            notes: 'Supplier suku cadang Kawasaki original dan KW',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: uuidv4(),
            name: 'PT Universal Motor Parts',
            contact_person: 'Dedi Kurniawan',
            phone: '021-99887766',
            email: 'dedi@universalparts.co.id',
            address: 'Jl. Rasuna Said No. 654, Jakarta Selatan',
            notes: 'Supplier multi-brand untuk berbagai merk motor',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];

        await db.collection('suppliers').insertMany(defaultSuppliers);
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

    // Products - List all with enhanced data
    if (path === 'products') {
      const url = new URL(request.url);
      const searchParams = url.searchParams;
      
      // Build query filters
      const query = {};
      
      // Filter by category
      if (searchParams.get('category_id')) {
        query.category_id = searchParams.get('category_id');
      }
      
      // Filter by brand
      if (searchParams.get('brand_id')) {
        query.brand_id = searchParams.get('brand_id');
      }
      
      // Filter by active status
      if (searchParams.get('is_active') !== null) {
        query.is_active = searchParams.get('is_active') === 'true';
      }
      
      // Filter by tags
      if (searchParams.get('tags')) {
        const tags = searchParams.get('tags').split(',');
        query.tags = { $in: tags };
      }
      
      // Search by name or SKU
      if (searchParams.get('search')) {
        const searchTerm = searchParams.get('search');
        query.$or = [
          { name: { $regex: searchTerm, $options: 'i' } },
          { sku: { $regex: searchTerm, $options: 'i' } }
        ];
      }
      
      const products = await db.collection('products').find(query).sort({ created_at: -1 }).toArray();
      
      // Enhance products with margin analysis and current pricing
      const enhancedProducts = products.map(product => ({
        ...product,
        current_pricing: getCurrentPricing(product),
        margin_analysis: calculateMargin(product),
        total_stock: Object.values(product.stock_per_branch || {}).reduce((sum, stock) => sum + (parseInt(stock) || 0), 0)
      }));
      
      return NextResponse.json(enhancedProducts);
    }

    // Products - Margin Analysis Report (FR-PRD-011)
    if (path === 'products/margin-report') {
      const products = await db.collection('products').find({ is_active: true }).toArray();
      
      const marginReport = products.map(product => {
        const margins = calculateMargin(product);
        const totalStock = Object.values(product.stock_per_branch || {}).reduce((sum, stock) => sum + (parseInt(stock) || 0), 0);
        
        return {
          id: product.id,
          sku: product.sku,
          name: product.name,
          purchase_price: product.purchase_price,
          margins: margins,
          total_stock: totalStock,
          stock_value: (product.purchase_price || 0) * totalStock
        };
      });
      
      // Calculate summary statistics
      const totalProducts = marginReport.length;
      const totalStockValue = marginReport.reduce((sum, item) => sum + item.stock_value, 0);
      const averageMargins = {};
      
      ['normal', 'wholesale'].forEach(level => {
        const marginsForLevel = marginReport
          .map(item => item.margins[level]?.margin_percentage)
          .filter(margin => margin !== undefined);
        
        if (marginsForLevel.length > 0) {
          averageMargins[level] = marginsForLevel.reduce((sum, margin) => sum + margin, 0) / marginsForLevel.length;
        }
      });
      
      return NextResponse.json({
        products: marginReport,
        summary: {
          total_products: totalProducts,
          total_stock_value: totalStockValue,
          average_margins: averageMargins
        }
      });
    }

    // Suppliers - List all
    if (path === 'suppliers') {
      const suppliers = await db.collection('suppliers').find({}).sort({ created_at: -1 }).toArray();
      return NextResponse.json(suppliers);
    }

    // Purchase Orders - List all (FR-INV-012)
    if (path === 'purchase-orders') {
      const url = new URL(request.url);
      const searchParams = url.searchParams;
      
      const query = {};
      
      // Filter by status
      if (searchParams.get('status')) {
        query.status = searchParams.get('status');
      }
      
      // Filter by branch
      if (searchParams.get('branch_id')) {
        query.branch_id = searchParams.get('branch_id');
      }
      
      // Filter by supplier
      if (searchParams.get('supplier_id')) {
        query.supplier_id = searchParams.get('supplier_id');
      }
      
      const purchaseOrders = await db.collection('purchase_orders')
        .find(query)
        .sort({ created_at: -1 })
        .toArray();
      
      return NextResponse.json(purchaseOrders);
    }

    // Purchase Orders - Get single PO with details
    if (path.startsWith('purchase-orders/') && path.split('/').length === 2 && !path.includes('/receive') && !path.includes('/update') && !path.includes('/delete')) {
      const poId = path.split('/')[1];
      const purchaseOrder = await db.collection('purchase_orders').findOne({ id: poId });
      
      if (!purchaseOrder) {
        return NextResponse.json(
          { error: 'Purchase Order not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(purchaseOrder);
    }

    // Products - Get single product with full details
    if (path.startsWith('products/') && path.split('/').length === 2 && !path.includes('/update') && !path.includes('/toggle') && !path.includes('/delete') && !path.includes('/stock') && !path.includes('/promo') && !path.includes('/volume-discount') && !path.includes('margin-report')) {
      const productId = path.split('/')[1];
      const product = await db.collection('products').findOne({ id: productId });
      
      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
      
      // Get category and brand details
      const category = product.category_id 
        ? await db.collection('categories').findOne({ id: product.category_id })
        : null;
      const brand = product.brand_id 
        ? await db.collection('brands').findOne({ id: product.brand_id })
        : null;
      
      const enhancedProduct = {
        ...product,
        category: category,
        brand: brand,
        current_pricing: getCurrentPricing(product),
        margin_analysis: calculateMargin(product),
        total_stock: Object.values(product.stock_per_branch || {}).reduce((sum, stock) => sum + (parseInt(stock) || 0), 0)
      };
      
      return NextResponse.json(enhancedProduct);
    }
    // Inventory Management - Get Stock Movements History
    if (path === 'inventory/movements') {
      const url = new URL(request.url);
      const searchParams = url.searchParams;
      
      const query = {};
      
      // Filter by product
      if (searchParams.get('product_id')) {
        query.product_id = searchParams.get('product_id');
      }
      
      // Filter by branch
      if (searchParams.get('branch_id')) {
        query.branch_id = searchParams.get('branch_id');
      }
      
      // Filter by movement type
      if (searchParams.get('type')) {
        query.type = searchParams.get('type');
      }
      
      // Date range filter
      if (searchParams.get('start_date') && searchParams.get('end_date')) {
        query.timestamp = {
          $gte: searchParams.get('start_date'),
          $lte: searchParams.get('end_date')
        };
      }
      
      const movements = await db.collection('stock_movements')
        .find(query)
        .sort({ timestamp: -1 })
        .limit(100)
        .toArray();
      
      return NextResponse.json(movements);
    }

    // Inventory Management - Get Stock Opname History
    if (path === 'inventory/opname-history') {
      const url = new URL(request.url);
      const searchParams = url.searchParams;
      
      const query = {};
      
      // Filter by branch
      if (searchParams.get('branch_id')) {
        query.branch_id = searchParams.get('branch_id');
      }
      
      const opnameHistory = await db.collection('stock_opname')
        .find(query)
        .sort({ timestamp: -1 })
        .limit(50)
        .toArray();
      
      return NextResponse.json(opnameHistory);
    }

    // Inventory Management - Get Stock Report by Branch
    if (path === 'inventory/stock-report') {
      const url = new URL(request.url);
      const searchParams = url.searchParams;
      const branchId = searchParams.get('branch_id');
      
      if (!branchId) {
        return NextResponse.json({ error: 'branch_id is required' }, { status: 400 });
      }
      
      const products = await db.collection('products').find({ is_active: true }).toArray();
      
      const stockReport = products.map(product => {
        const stock = parseInt(product.stock_per_branch?.[branchId]) || 0;
        const purchasePrice = parseFloat(product.purchase_price) || 0;
        
        return {
          id: product.id,
          sku: product.sku,
          name: product.name,
          category_id: product.category_id,
          brand_id: product.brand_id,
          current_stock: stock,
          purchase_price: purchasePrice,
          stock_value: stock * purchasePrice,
          price_levels: product.price_levels,
          storage_location: product.storage_location
        };
      });
      
      // Calculate totals
      const totalItems = stockReport.length;
      const totalStockValue = stockReport.reduce((sum, item) => sum + item.stock_value, 0);
      const totalUnits = stockReport.reduce((sum, item) => sum + item.current_stock, 0);
      
      return NextResponse.json({
        branch_id: branchId,
        products: stockReport,
        summary: {
          total_items: totalItems,
          total_units: totalUnits,
          total_stock_value: totalStockValue
        }
      });
    }

    // Inventory Management - Stock Mutation Report (FR-INV-014)
    if (path === 'inventory/mutation-report') {
      const url = new URL(request.url);
      const searchParams = url.searchParams;
      
      const startDate = searchParams.get('start_date');
      const endDate = searchParams.get('end_date');
      const branchId = searchParams.get('branch_id');
      
      if (!startDate || !endDate) {
        return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 });
      }
      
      // Get all products
      const products = await db.collection('products').find({}).toArray();
      
      // Build query for movements in date range
      const movementQuery = {
        timestamp: {
          $gte: startDate,
          $lte: endDate + 'T23:59:59.999Z'
        }
      };
      
      if (branchId) {
        movementQuery.$or = [
          { branch_id: branchId },
          { from_branch_id: branchId },
          { to_branch_id: branchId }
        ];
      }
      
      const movements = await db.collection('stock_movements').find(movementQuery).toArray();
      
      // Calculate mutation for each product
      const mutationReport = products.map(product => {
        const productMovements = movements.filter(m => m.product_id === product.id);
        
        // Calculate opening stock (current stock - movements in period)
        let currentStock = 0;
        if (branchId) {
          currentStock = parseInt(product.stock_per_branch?.[branchId]) || 0;
        } else {
          currentStock = Object.values(product.stock_per_branch || {})
            .reduce((sum, stock) => sum + (parseInt(stock) || 0), 0);
        }
        
        // Calculate movements
        let stockIn = 0;
        let stockOut = 0;
        let adjustments = 0;
        
        productMovements.forEach(movement => {
          const qty = parseInt(movement.quantity) || 0;
          
          switch (movement.type) {
            case 'RECEIVE':
            case 'TRANSFER':
              if (branchId) {
                if (movement.to_branch_id === branchId) stockIn += qty;
                if (movement.from_branch_id === branchId) stockOut += qty;
              } else {
                stockIn += qty;
              }
              break;
            case 'ADJUSTMENT':
              if (movement.adjustment_type === 'add') {
                stockIn += qty;
              } else if (movement.adjustment_type === 'subtract') {
                stockOut += qty;
              } else {
                adjustments += qty;
              }
              break;
            case 'OPNAME':
              adjustments += movement.difference || 0;
              break;
          }
        });
        
        const openingStock = currentStock - stockIn + stockOut - adjustments;
        const closingStock = currentStock;
        
        return {
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku,
          opening_stock: Math.max(0, openingStock),
          stock_in: stockIn,
          stock_out: stockOut,
          adjustments: adjustments,
          closing_stock: closingStock
        };
      });
      
      return NextResponse.json(mutationReport);
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