import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import DashboardPage from "@/pages/dashboard-page";
import LoginPage from "@/pages/auth/login-page";
import StaffDashboard from "@/pages/staff/dashboard";
import CustomersPage from "@/pages/customers-page";
import AppointmentsPage from "@/pages/appointments-page";
import StaffPage from "@/pages/staff-page";
import MarketingPage from "@/pages/marketing-page";
import PromotionsPage from "@/pages/promotions-page";
import ProductsPage from "@/pages/products-page";
import BarcodesPage from "@/pages/barcodes-page";
import InvoicesPage from "@/pages/invoices-page";
import InstallmentsPage from "@/pages/installments-page";
import ReportsPage from "@/pages/reports-page";
import PurchasesPage from "@/pages/purchases-page";
import SuppliersPage from "@/pages/suppliers-page";
import ExpensesPage from "@/pages/expenses-page";
import ExpenseCategoriesPage from "@/pages/expense-categories-page";
import SettingsPage from "@/pages/settings-page";
import InventoryReportsPage from "@/pages/inventory-reports-page";
import { useEffect } from "react";
import { loadThemeSettings } from "@/lib/theme";
import { ProtectedRoute } from "@/lib/protected-route";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: Infinity,
    },
  },
});

function Router() {
  useEffect(() => {
    loadThemeSettings();
  }, []);

  return (
    <Switch>
      {/* صفحة تسجيل الدخول */}
      <Route path="/auth/login" component={LoginPage} />

      {/* المسارات المحمية للمدير فقط */}
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/purchases" component={PurchasesPage} />
      <ProtectedRoute path="/suppliers" component={SuppliersPage} />
      <ProtectedRoute path="/customers" component={CustomersPage} />
      <ProtectedRoute 
        path="/staff-management" 
        component={StaffPage} 
        requiredPermission="staff_page"
      />
      <ProtectedRoute path="/marketing" component={MarketingPage} />
      <ProtectedRoute path="/promotions" component={PromotionsPage} />
      <ProtectedRoute path="/products" component={ProductsPage} />
      <ProtectedRoute path="/invoices" component={InvoicesPage} />
      <ProtectedRoute path="/installments" component={InstallmentsPage} />
      <ProtectedRoute path="/expenses" component={ExpensesPage} />
      <ProtectedRoute path="/expense-categories" component={ExpenseCategoriesPage} />
      <ProtectedRoute path="/reports" component={ReportsPage} />
      <ProtectedRoute path="/inventory-reports" component={InventoryReportsPage} />
      <ProtectedRoute path="/barcodes" component={BarcodesPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />

      {/* المسارات المتاحة للموظفين */}
      <ProtectedRoute 
        path="/staff" 
        component={StaffDashboard} 
        requiredPermission="staff_page"
      />
      <ProtectedRoute path="/appointments" component={AppointmentsPage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;