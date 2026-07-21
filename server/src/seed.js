// One-time setup script: creates base permissions, 4 system roles with
// appropriate permissions, and default users for each role.
// Run with: node src/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const env = require('./config/env');
const Permission = require('./models/permission.model');
const Role = require('./models/role.model');
const User = require('./models/user.model');
const { hashPassword } = require('./utils/password');

const MODULES = [
  'users',
  'roles',
  'permissions',
  'products',
  'categories',
  'units',
  'suppliers',
  'warehouses',
  'batches',
  'inventory-transactions',
  'receiving',
  'transfers',
  'returns',
  'waste',
  'stock-counts',
  'current-stock',
  'menus',
  'recipes',
  'meal-attendance',
  'meal-requests',
  'reservations',
  'meal-distributions',
  'reports',
  'settings',
];
const ACTIONS = ['view', 'create', 'update', 'delete', 'approve'];

// ── Role definitions ──────────────────────────────────────────────────
const ROLE_DEFS = [
  {
    name: 'Super Administrator',
    key: 'super_admin',
    description: 'Full system access. Can manage users, roles, permissions, settings, and all modules.',
    isSystem: true,
    // All modules, all actions + custom permissions
    permissions: [
      ...MODULES.flatMap((mod) => ACTIONS.map((act) => `${mod}:${act}`)),
      'reservations:release',
      'reservations:consume',
      'meal-distributions:complete',
      'meal-distributions:cancel',
    ],
  },
  {
    name: 'Warehouse Manager',
    key: 'warehouse_manager',
    description: 'Manages warehouse operations. Can approve receiving, transfers, returns, waste, and stock adjustments.',
    isSystem: true,
    permissions: [
      // Products & suppliers
      'products:view', 'products:create', 'products:update',
      'categories:view', 'categories:create', 'categories:update',
      'units:view', 'units:create', 'units:update',
      'suppliers:view', 'suppliers:create', 'suppliers:update',
      // Warehouses
      'warehouses:view', 'warehouses:create', 'warehouses:update',
      // Operations (can approve)
      'receiving:view', 'receiving:create', 'receiving:approve',
      'transfers:view', 'transfers:create', 'transfers:approve',
      'returns:view', 'returns:create', 'returns:approve',
      'waste:view', 'waste:create', 'waste:approve',
      'stock-counts:view', 'stock-counts:create', 'stock-counts:approve',
      // Batches
      'batches:view', 'batches:update',
      // Inventory
      'inventory-transactions:view',
      // Current Stock (read-only aggregated view)
      'current-stock:view',
      // Reports
      'reports:view',
    ],
  },
  {
    name: 'Store Keeper',
    key: 'store_keeper',
    description: 'Handles daily warehouse operations: receiving, transfers, returns, waste, stock counts, and batch updates.',
    isSystem: true,
    permissions: [
      // Read-only access to products & warehouses
      'products:view',
      'categories:view',
      'units:view',
      'suppliers:view',
      'warehouses:view',
      // Operational records (can create & update before approval)
      'receiving:view', 'receiving:create', 'receiving:update',
      'transfers:view', 'transfers:create', 'transfers:update',
      'returns:view', 'returns:create', 'returns:update',
      'waste:view', 'waste:create', 'waste:update',
      'stock-counts:view', 'stock-counts:create', 'stock-counts:update',
      // Batch info
      'batches:view', 'batches:update',
      // Current Stock (read-only aggregated view)
      'current-stock:view',
      // Inventory view
      'inventory-transactions:view',
    ],
  },
  {
    name: 'Mess Officer',
    key: 'mess_officer',
    description: 'Manages meal planning: menus, recipes, attendance, meal requests, and reservations.',
    isSystem: true,
    permissions: [
      // Full meal module access
      'menus:view', 'menus:create', 'menus:update', 'menus:delete',
      'recipes:view', 'recipes:create', 'recipes:update', 'recipes:delete',
      'meal-attendance:view', 'meal-attendance:create', 'meal-attendance:update', 'meal-attendance:delete',
      'meal-requests:view', 'meal-requests:create', 'meal-requests:update', 'meal-requests:delete',
      'reservations:view', 'reservations:create', 'reservations:update', 'reservations:delete', 'reservations:release', 'reservations:consume',
      'meal-distributions:view', 'meal-distributions:create', 'meal-distributions:update', 'meal-distributions:complete', 'meal-distributions:cancel',
      // Read inventory
      'products:view',
      'categories:view',
      'units:view',
      'inventory-transactions:view',
      // Reports for meals
      'reports:view',
    ],
  },
];

// ── Default users ─────────────────────────────────────────────────────
const DEFAULT_USERS = [
  {
    username: 'admin',
    email: 'admin@mmwms.local',
    displayName: 'Super Administrator',
    password: 'Admin@12345',
    roleKey: 'super_admin',
    status: 'active',
  },
  {
    username: 'warehouse.mgr',
    email: 'warehouse.mgr@mmwms.local',
    displayName: 'Warehouse Manager',
    password: 'Warehouse@12345',
    roleKey: 'warehouse_manager',
    status: 'active',
  },
  {
    username: 'store.keeper',
    email: 'store.keeper@mmwms.local',
    displayName: 'Store Keeper',
    password: 'Store@12345',
    roleKey: 'store_keeper',
    status: 'active',
  },
  {
    username: 'mess.officer',
    email: 'mess.officer@mmwms.local',
    displayName: 'Mess Officer',
    password: 'Mess@12345',
    roleKey: 'mess_officer',
    status: 'active',
  },
];

async function seed() {
  await mongoose.connect(env.mongoUri);
  console.log('[seed] Connected to MongoDB');

  // ── 1. Create all permissions ──────────────────────────────────────
  const permissionDocs = [];
  for (const mod of MODULES) {
    for (const action of ACTIONS) {
      permissionDocs.push({
        code: `${mod}:${action}`,
        module: mod,
        action,
      });
    }
  }

  // ── Custom permissions (not covered by standard ACTIONS) ──────────────
  const CUSTOM_PERMISSIONS = [
    { code: 'reservations:release', module: 'reservations', action: 'release' },
    { code: 'reservations:consume', module: 'reservations', action: 'consume' },
    { code: 'meal-distributions:complete', module: 'meal-distributions', action: 'complete' },
    { code: 'meal-distributions:cancel', module: 'meal-distributions', action: 'cancel' },
  ];

  for (const doc of [...permissionDocs, ...CUSTOM_PERMISSIONS]) {
    await Permission.updateOne({ code: doc.code }, { $setOnInsert: doc }, { upsert: true });
  }
  console.log(`[seed] Ensured ${permissionDocs.length + CUSTOM_PERMISSIONS.length} permissions`);

  // ── 2. Get all permissions from DB ─────────────────────────────────
  const allPermissions = await Permission.find();
  const permMap = {};
  for (const p of allPermissions) {
    permMap[p.code] = p._id;
  }

  // ── 3. Create roles ────────────────────────────────────────────────
  const createdRoles = {};
  for (const def of ROLE_DEFS) {
    const rolePermIds = def.permissions
      .filter((code) => permMap[code])
      .map((code) => permMap[code]);

    const role = await Role.findOneAndUpdate(
      { name: def.name },
      {
        name: def.name,
        description: def.description,
        isSystem: def.isSystem,
        permissions: rolePermIds,
      },
      { upsert: true, new: true }
    );
    createdRoles[def.key] = role;
    console.log(`[seed] Role "${def.name}" ready (${rolePermIds.length} permissions)`);
  }

  // ── 4. Create default users ────────────────────────────────────────
  for (const u of DEFAULT_USERS) {
    const existing = await User.findOne({ username: u.username });
    if (!existing) {
      const passwordHash = await hashPassword(u.password);
      const role = createdRoles[u.roleKey];
      if (!role) {
        console.error(`[seed] Role "${u.roleKey}" not found, skipping user "${u.username}"`);
        continue;
      }
      await User.create({
        username: u.username,
        email: u.email,
        displayName: u.displayName,
        passwordHash,
        roles: [role._id],
        status: u.status,
      });
      console.log(`[seed] User "${u.username}" created (password: ${u.password})`);
    } else {
      console.log(`[seed] User "${u.username}" already exists, skipping`);
    }
  }

  await mongoose.disconnect();
  console.log('[seed] Done');
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
