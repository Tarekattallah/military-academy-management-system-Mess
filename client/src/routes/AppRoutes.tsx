import { Routes, Route } from 'react-router-dom';
import { LoginPage } from '../pages/auth/LoginPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { PlaceholderPage } from '../pages/PlaceholderPage';
import { ProductsPage } from '../pages/products/ProductsPage';
import { CategoriesPage } from '../pages/categories/CategoriesPage';
import { UnitsPage } from '../pages/units/UnitsPage';
import { ProtectedRoute } from './ProtectedRoute';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* ── Admin modules ── */}
      <Route
        path="/users"
        element={
          <ProtectedRoute requiredPermission="users:view">
            <PlaceholderPage title="المستخدمين" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/roles"
        element={
          <ProtectedRoute requiredPermission="roles:view">
            <PlaceholderPage title="الصلاحيات" />
          </ProtectedRoute>
        }
      />

      {/* ── Warehouse modules ── */}
      <Route
        path="/products"
        element={
          <ProtectedRoute requiredPermission="products:view">
            <ProductsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <ProtectedRoute requiredPermission="categories:view">
            <CategoriesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/units"
        element={
          <ProtectedRoute requiredPermission="units:view">
            <UnitsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/suppliers"
        element={
          <ProtectedRoute requiredPermission="suppliers:view">
            <PlaceholderPage title="الموردين" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/warehouses"
        element={
          <ProtectedRoute requiredPermission="warehouses:view">
            <PlaceholderPage title="المستودعات" />
          </ProtectedRoute>
        }
      />

      {/* ── Inventory transactions ── */}
      <Route
        path="/receiving"
        element={
          <ProtectedRoute requiredPermission="receiving:view">
            <PlaceholderPage title="استلام البضائع" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transfers"
        element={
          <ProtectedRoute requiredPermission="transfers:view">
            <PlaceholderPage title="التحويلات" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/returns"
        element={
          <ProtectedRoute requiredPermission="returns:view">
            <PlaceholderPage title="المرتجعات" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/waste"
        element={
          <ProtectedRoute requiredPermission="waste:view">
            <PlaceholderPage title="الهالك" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stock-counts"
        element={
          <ProtectedRoute requiredPermission="stock-counts:view">
            <PlaceholderPage title="جرد المخزون" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/batches"
        element={
          <ProtectedRoute requiredPermission="batches:view">
            <PlaceholderPage title="الدفعات" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <ProtectedRoute requiredPermission="inventory-transactions:view">
            <PlaceholderPage title="المخزون" />
          </ProtectedRoute>
        }
      />

      {/* ── Meal modules ── */}
      <Route
        path="/menus"
        element={
          <ProtectedRoute requiredPermission="menus:view">
            <PlaceholderPage title="قوائم الطعام" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recipes"
        element={
          <ProtectedRoute requiredPermission="recipes:view">
            <PlaceholderPage title="الوصفات" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/meal-attendance"
        element={
          <ProtectedRoute requiredPermission="meal-attendance:view">
            <PlaceholderPage title="الحضور" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/meal-requests"
        element={
          <ProtectedRoute requiredPermission="meal-requests:view">
            <PlaceholderPage title="طلبات الوجبات" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reservations"
        element={
          <ProtectedRoute requiredPermission="reservations:view">
            <PlaceholderPage title="الحجوزات" />
          </ProtectedRoute>
        }
      />

      {/* ── Reports ── */}
      <Route
        path="/reports"
        element={
          <ProtectedRoute requiredPermission="reports:view">
            <PlaceholderPage title="التقارير" />
          </ProtectedRoute>
        }
      />

      {/* ── Settings (admin only) ── */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute requiredPermission="settings:view">
            <PlaceholderPage title="إعدادات النظام" />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
