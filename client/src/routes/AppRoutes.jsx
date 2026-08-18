import { Routes, Route } from 'react-router-dom';
import { LoginPage } from '../pages/auth/LoginPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { WarehousesPage } from '../pages/warehouses/WarehousesPage';
import { InventoryPage } from '../pages/inventory/InventoryPage';
import { ReceivingPage } from '../pages/receiving/ReceivingPage';
import { ReceivingDetailsPage } from '../pages/receiving/ReceivingDetailsPage';
import { TransfersPage } from '../pages/transfers/TransfersPage';
import { ReturnsPage } from '../pages/returns/ReturnsPage';
import { WastePage } from '../pages/waste/WastePage';
import { StockCountsPage } from '../pages/stockCounts/StockCountsPage';
import { BatchesPage } from '../pages/batches/BatchesPage';
import { ProductsPage } from '../pages/products/ProductsPage';
import { CategoriesPage } from '../pages/categories/CategoriesPage';
import { UnitsPage } from '../pages/units/UnitsPage';
import { UsersPage } from '../pages/users/UsersPage';
import { RolesPage } from '../pages/roles/RolesPage';
import { SuppliersPage } from '../pages/suppliers/SuppliersPage';
import { RecipesPage } from '../pages/recipes/RecipesPage';
import { MenusPage } from '../pages/menus/MenusPage';
import { MealRequestsPage } from '../pages/mealRequests/MealRequestsPage';
import { ReservationsPage } from '../pages/reservations/ReservationsPage';
import { MealAttendancePage } from '../pages/mealAttendance/MealAttendancePage';
import { ReportsPage } from '../pages/reports/ReportsPage';
import { SettingsPage } from '../pages/settings/SettingsPage';
import { AuditLogPage } from '../pages/auditLog/AuditLogPage';
import { NotificationsPage } from '../pages/notifications/NotificationsPage';
import { DailyClosingPage } from '../pages/dailyClosing/DailyClosingPage';
import { PurchaseRequestsPage } from '../pages/purchaseRequests/PurchaseRequestsPage';
import { PurchaseRequestDetailsPage } from '../pages/purchaseRequests/PurchaseRequestDetailsPage';
import { PurchaseOrdersPage } from '../pages/purchaseOrders/PurchaseOrdersPage';
import { PurchaseOrderDetailsPage } from '../pages/purchaseOrders/PurchaseOrderDetailsPage';
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
        } />
      
      <Route
        path="/notifications"
        element={
        <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        } />
      

      {/* ── Admin modules ── */}
      <Route
        path="/users"
        element={
        <ProtectedRoute requiredPermission="users:view">
            <UsersPage />
          </ProtectedRoute>
        } />
      
      <Route
        path="/roles"
        element={
        <ProtectedRoute requiredPermission="roles:view">
            <RolesPage />
          </ProtectedRoute>
        } />
      

      {/* ── Warehouse modules ── */}
      <Route
        path="/products"
        element={
        <ProtectedRoute requiredPermission="products:view">
            <ProductsPage />
          </ProtectedRoute>
        } />
      
      <Route
        path="/categories"
        element={
        <ProtectedRoute requiredPermission="categories:view">
            <CategoriesPage />
          </ProtectedRoute>
        } />
      
      <Route
        path="/units"
        element={
        <ProtectedRoute requiredPermission="units:view">
            <UnitsPage />
          </ProtectedRoute>
        } />
      
      <Route
        path="/suppliers"
        element={
        <ProtectedRoute requiredPermission="suppliers:view">
            <SuppliersPage />
          </ProtectedRoute>
        } />
      
      <Route
        path="/warehouses"
        element={
        <ProtectedRoute requiredPermission="warehouses:view">
            <WarehousesPage />
          </ProtectedRoute>
        } />
      

      {/* ── Inventory transactions ── */}
      <Route
        path="/purchase-requests"
        element={
        <ProtectedRoute requiredPermission="purchase-requests:view">
            <PurchaseRequestsPage />
          </ProtectedRoute>
        } />
      
      <Route
        path="/purchase-requests/:id"
        element={
        <ProtectedRoute requiredPermission="purchase-requests:view">
            <PurchaseRequestDetailsPage />
          </ProtectedRoute>
        } />
        
      <Route
        path="/purchase-orders"
        element={
        <ProtectedRoute requiredPermission="purchase-orders:view">
            <PurchaseOrdersPage />
          </ProtectedRoute>
        } />
      
      <Route
        path="/purchase-orders/:id"
        element={
        <ProtectedRoute requiredPermission="purchase-orders:view">
            <PurchaseOrderDetailsPage />
          </ProtectedRoute>
        } />
        
      <Route
        path="/receiving"
        element={
        <ProtectedRoute requiredPermission="receiving:view">
            <ReceivingPage />
          </ProtectedRoute>
        } />
        
      <Route
        path="/receiving/:id"
        element={
        <ProtectedRoute requiredPermission="receiving:view">
            <ReceivingDetailsPage />
          </ProtectedRoute>
        } />
      
      <Route
        path="/transfers"
        element={
        <ProtectedRoute requiredPermission="transfers:view">
            <TransfersPage />
          </ProtectedRoute>
        } />
      
      <Route
        path="/returns"
        element={
        <ProtectedRoute requiredPermission="returns:view">
            <ReturnsPage />
          </ProtectedRoute>
        } />
      
      <Route
        path="/waste"
        element={
        <ProtectedRoute requiredPermission="wastes:view">
            <WastePage />
          </ProtectedRoute>
        } />
      
      <Route
        path="/stock-counts"
        element={
        <ProtectedRoute requiredPermission="stock-counts:view">
            <StockCountsPage />
          </ProtectedRoute>
        } />
      
      <Route
        path="/batches"
        element={
        <ProtectedRoute requiredPermission="batches:view">
            <BatchesPage />
          </ProtectedRoute>
        } />
      
      <Route
        path="/inventory"
        element={
        <ProtectedRoute requiredPermission="inventory-transactions:view">
            <InventoryPage />
          </ProtectedRoute>
        } />
      
      <Route
        path="/daily-closing"
        element={
        <ProtectedRoute requiredPermission="inventory-transactions:view">
            <DailyClosingPage />
          </ProtectedRoute>
        } />
      

      {/* ── Meal modules ── */}
      <Route
        path="/menus"
        element={
        <ProtectedRoute requiredPermission="menus:view">
            <MenusPage />
          </ProtectedRoute>
        } />
      
      <Route
        path="/recipes"
        element={
        <ProtectedRoute requiredPermission="recipes:view">
            <RecipesPage />
          </ProtectedRoute>
        } />
      
      <Route
        path="/meal-attendance"
        element={
        <ProtectedRoute requiredPermission="meal-attendance:view">
            <MealAttendancePage />
          </ProtectedRoute>
        } />
      
      <Route
        path="/meal-requests"
        element={
        <ProtectedRoute requiredPermission="meal-requests:view">
            <MealRequestsPage />
          </ProtectedRoute>
        } />
      
      <Route
        path="/reservations"
        element={
        <ProtectedRoute requiredPermission="reservations:view">
            <ReservationsPage />
          </ProtectedRoute>
        } />
      

      {/* ── Reports ── */}
      <Route
        path="/reports"
        element={
        <ProtectedRoute requiredPermission="reports:view">
            <ReportsPage />
          </ProtectedRoute>
        } />
      

      {/* ── Settings (admin only) ── */}
      <Route
        path="/settings"
        element={
        <ProtectedRoute requiredPermission="settings:view">
            <SettingsPage />
          </ProtectedRoute>
        } />
      

      {/* ── Audit Log (admin only) ── */}
      <Route
        path="/audit-log"
        element={
        <ProtectedRoute requiredPermission="settings:view">
            <AuditLogPage />
          </ProtectedRoute>
        } />
      
    </Routes>);

}