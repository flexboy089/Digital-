import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { PublicLayout } from './layouts/PublicLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { ServicesList } from './pages/Dashboard/ServicesList';
import { ServiceDetails } from './pages/Dashboard/ServiceDetails';
import { Orders } from './pages/Dashboard/Orders';
import OrderDetails from './pages/Dashboard/OrderDetails';
import { Wallet } from './pages/Dashboard/Wallet';
import { Deposit } from './pages/Dashboard/Deposit';
import { WholesaleApplication } from './pages/Dashboard/WholesaleApplication';

import WholesaleRoute from './components/WholesaleRoute';
import { WholesaleLayout } from './layouts/WholesaleLayout';
import { PaymentHistory } from './components/PaymentHistory';
import { WholesaleDashboard } from './pages/Wholesale';
import { WholesaleServices } from './pages/Wholesale/Services';
import { WholesaleServiceDetails } from './pages/Wholesale/ServiceDetails';
import { WholesaleOrders } from './pages/Wholesale/Orders';
import { WholesaleWallet } from './pages/Wholesale/Wallet';
import { WholesaleDeposit } from './pages/Wholesale/Deposit';
import { WholesaleSupport } from './pages/Wholesale/Support';

// Admin imports
import AdminRoute from './components/AdminRoute';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AnalyticsLayout from './pages/admin/Analytics/AnalyticsLayout';
import AdminAnalyticsDashboard from './pages/admin/Analytics/AdminAnalyticsDashboard';
import ServiceAnalytics from './pages/admin/Analytics/ServiceAnalytics';
import UserReports from './pages/admin/Analytics/UserReports';
import WholesaleAnalytics from './pages/admin/Analytics/WholesaleAnalytics';
import PaymentAnalytics from './pages/admin/Analytics/PaymentAnalytics';
import AdminUsers from './pages/admin/AdminUsers';
import AdminWholesale from './pages/admin/AdminWholesale';
import AdminServices from './pages/admin/AdminServices';
import AdminOrders from './pages/admin/AdminOrders';
import AdminOrderDetails from './pages/admin/AdminOrderDetails';
import AdminPayments from './pages/admin/AdminPayments';
import AdminWallets from './pages/admin/AdminWallets';
import AdminPaymentMethods from './pages/admin/AdminPaymentMethods';
import AdminReconciliation from './pages/admin/AdminReconciliation';
import AdminSupportTickets from './pages/support/AdminSupportTickets';
import AdminChat from './pages/admin/AdminChat';

import GoogleServicesLayout from './pages/admin/GoogleServices';
import GoogleGmail from './pages/admin/GoogleServices/Gmail';
import GoogleDrive from './pages/admin/GoogleServices/Drive';
import GoogleContacts from './pages/admin/GoogleServices/Contacts';

import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import { Chat } from './pages/Dashboard/Chat';
import AdminFooterSettings from './pages/admin/AdminFooterSettings';
import AdminStatsSettings from './pages/admin/AdminStatsSettings';

import NotificationsPage from './pages/notifications/NotificationsPage';
import SupportTickets from './pages/support/SupportTickets';
import SupportTicketDetails from './pages/support/SupportTicketDetails';
import CreateTicket from './pages/support/CreateTicket';

import { PublicServices } from './pages/PublicServices';
import { WholesaleProgram } from './pages/WholesaleProgram';
// Placeholder Pages
const Pricing = () => <div className="max-w-7xl mx-auto px-4 py-12"><h1 className="text-3xl font-bold text-gray-900 mb-6">Pricing</h1></div>;

export default function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/services" element={<PublicLayout><PublicServices /></PublicLayout>} />
          <Route path="/pricing" element={<PublicLayout><Pricing /></PublicLayout>} />
          <Route path="/wholesale-program" element={<PublicLayout><WholesaleProgram /></PublicLayout>} />
          <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
          <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />

          {/* Admin Routes (Strictly Protected) */}
          <Route path="/admin" element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              
              <Route path="analytics" element={<AnalyticsLayout />}>
                <Route index element={<AdminAnalyticsDashboard />} />
                <Route path="services" element={<ServiceAnalytics />} />
                <Route path="wholesale" element={<WholesaleAnalytics />} />
                <Route path="payments" element={<PaymentAnalytics />} />
                <Route path="users" element={<UserReports />} />
              </Route>

              <Route path="users" element={<AdminUsers />} />
              <Route path="retail-users" element={<AdminUsers />} />
              <Route path="wholesale" element={<AdminWholesale />} />
              <Route path="services" element={<AdminServices />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="orders/:id" element={<AdminOrderDetails />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="payment-methods" element={<AdminPaymentMethods />} />
              <Route path="reconciliation" element={<AdminReconciliation />} />
              
              <Route path="google" element={<GoogleServicesLayout />}>
                 <Route index element={<Navigate to="gmail" replace />} />
                 <Route path="gmail" element={<GoogleGmail />} />
                 <Route path="drive" element={<GoogleDrive />} />
                 <Route path="contacts" element={<GoogleContacts />} />
              </Route>

              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="support" element={<AdminSupportTickets />} />
              <Route path="messages" element={<AdminChat />} />
              <Route path="support/new" element={<CreateTicket />} />
              <Route path="support/:id" element={<SupportTicketDetails />} />
              <Route path="wallets" element={<AdminWallets />} />
              <Route path="footer" element={<AdminFooterSettings />} />
              <Route path="stats" element={<AdminStatsSettings />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
          </Route>

          {/* Dashboard Routes (Protected) */}
          <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
          <Route path="/dashboard/services" element={<DashboardLayout><ServicesList /></DashboardLayout>} />
          <Route path="/dashboard/services/:slug" element={<DashboardLayout><ServiceDetails /></DashboardLayout>} />
          <Route path="/dashboard/payments" element={<DashboardLayout><PaymentHistory /></DashboardLayout>} />
          <Route path="/dashboard/orders" element={<DashboardLayout><Orders /></DashboardLayout>} />
          <Route path="/dashboard/orders/:id" element={<DashboardLayout><OrderDetails /></DashboardLayout>} />
          <Route path="/dashboard/wallet" element={<DashboardLayout><Wallet /></DashboardLayout>} />
          <Route path="/dashboard/deposit" element={<DashboardLayout><Deposit /></DashboardLayout>} />
          <Route path="/dashboard/notifications" element={<DashboardLayout><NotificationsPage /></DashboardLayout>} />
          <Route path="/dashboard/support" element={<DashboardLayout><SupportTickets /></DashboardLayout>} />
          <Route path="/dashboard/messages" element={<DashboardLayout><Chat /></DashboardLayout>} />
          <Route path="/dashboard/support/new" element={<DashboardLayout><CreateTicket /></DashboardLayout>} />
          <Route path="/dashboard/support/:id" element={<DashboardLayout><SupportTicketDetails /></DashboardLayout>} />
          <Route path="/dashboard/wholesale" element={<DashboardLayout><WholesaleApplication /></DashboardLayout>} />
          <Route path="/dashboard/*" element={<DashboardLayout><Dashboard /></DashboardLayout>} />

          {/* Wholesale Routes (Protected B2B) */}
          <Route path="/wholesale" element={<WholesaleRoute />}>
            <Route element={<WholesaleLayout />}>
              <Route index element={<WholesaleDashboard />} />
              <Route path="services" element={<WholesaleServices />} />
              <Route path="services/:slug" element={<WholesaleServiceDetails />} />
              <Route path="payments" element={<PaymentHistory />} />
              <Route path="orders" element={<WholesaleOrders />} />
              <Route path="wallet" element={<WholesaleWallet />} />
              <Route path="deposit" element={<WholesaleDeposit />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="support" element={<SupportTickets />} />
              <Route path="messages" element={<Chat />} />
              <Route path="support/new" element={<CreateTicket />} />
              <Route path="support/:id" element={<SupportTicketDetails />} />
              <Route path="*" element={<Navigate to="/wholesale" replace />} />
            </Route>
          </Route>
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}
