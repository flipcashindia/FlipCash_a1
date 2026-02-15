// routes/index.tsx - UPDATED WITH ALL CATALOG ROUTES
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import MainLayout from '../components/Layout/MainLayout';
import AuthLayout from '../components/Layout/AuthLayout';

// Auth Pages
import Login from '../pages/Auth/Login';
import VerifyOTP from '../pages/Auth/VerifyOTP';
import PasswordLogin from '../pages/Auth/PasswordLogin';

// Dashboard
import Dashboard from '../pages/dashboard/Dashboard';

// Catalog Pages - COMPLETE SET
import CatalogBoard from '../pages/Catalog/CatalogBoard';
import Categories from '../pages/Catalog/Categories';
import CategoryForm from '../pages/Catalog/CategoryForm';
import Brands from '../pages/Catalog/Brands';
import BrandForm from '../pages/Catalog/BrandForm';
import Models from '../pages/Catalog/Models';
import ModelForm from '../pages/Catalog/ModelForm';
import ModelDetail from '../pages/Catalog/ModelDetails';
import VariantManager from '../pages/Catalog/VariantManager';
import AttributeList from '../pages/Catalog/AttributeList';
import AttributeForm from '../pages/Catalog/AttributeForm';
import BulkImport from '../pages/Catalog/BulkImport';
import SearchAnalytics from '../pages/Catalog/SearchAnalytics';

// Leads Pages
import LeadsList from '../pages/Leads/LeadsList';
import LeadDetail from '../pages/Leads/LeadDetail';
import AssignPartner from '../pages/Leads/AssignPartner';

// Partners Pages
import PartnersList from '../pages/Partners/PartnersList';
import PartnerDetail from '../pages/Partners/PartnerDetail';
import PendingApprovals from '../pages/Partners/PendingApprovals';
import PartnerPerformance from '../pages/Partners/PartnerPerformance';

// Visits Pages
import VisitsList from '../pages/Visits/VisitsList';
import VisitTracking from '../pages/Visits/VisitTracking';

// Users Pages
import CustomersList from '../pages/Users/CustomersList';
import CustomerDetail from '../pages/Users/CustomerDetail';

// Finance Pages - COMPLETE SET
import FinanceDashboard from '../pages/Finance/FinanceDashboard';
import PayoutRequests from '../pages/Finance/PayoutRequests';
import PayoutsList from '../pages/Finance/PayoutsList';
import TransactionsList from '../pages/Finance/Transactions';
import WalletManagement from '../pages/Finance/WalletManagement';
import Reconciliation from '../pages/Finance/Reconciliation';
import PartnerPayments from '../pages/Finance/PartnerPayments';


// Operations Pages
import DisputesList from '../pages/Operations/DisputesList';
import DisputeDetail from '../pages/Operations/DisputeDetail';
import TicketsList from '../pages/Operations/TicketsList';
import TicketDetail from '../pages/Operations/TicketDetail';

// Communications Pages
import NotificationsList from '../pages/communications/NotificationsList';
import CreateNotification from '../pages/communications/CreateNotification';
import FAQManagement from '../pages/communications/FAQManagement';
import BannerManagement from '../pages/communications/BannerManagement';

// Pricing Pages
import PricingRules from '../pages/Pricing/PricingRules';
import PriceSimulator from '../pages/Pricing/PriceSimulator';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/verify-otp" element={<VerifyOTP />} />
        <Route path="/auth/password-login" element={<PasswordLogin />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute><MainLayout children={undefined} /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Catalog Routes - COMPLETE */}
        <Route path="/catalog" element={<CatalogBoard />} />
        
        {/* Categories */}
        <Route path="/catalog/categories" element={<Categories />} />
        <Route path="/catalog/categories/new" element={<CategoryForm />} />
        <Route path="/catalog/categories/:id/edit" element={<CategoryForm />} />
        
        {/* Brands */}
        <Route path="/catalog/brands" element={<Brands />} />
        <Route path="/catalog/brands/new" element={<BrandForm />} />
        <Route path="/catalog/brands/:id/edit" element={<BrandForm />} />
        
        {/* Models - COMPLETE WITH ALL ROUTES */}
        <Route path="/catalog/models" element={<Models />} />
        <Route path="/catalog/models/new" element={<ModelForm />} />
        <Route path="/catalog/models/:id" element={<ModelDetail />} />
        <Route path="/catalog/models/:id/edit" element={<ModelForm />} />
        <Route path="/catalog/models/:id/variants" element={<VariantManager />} />
        
        {/* Attributes */}
        <Route path="/catalog/attributes" element={<AttributeList />} />
        <Route path="/catalog/attributes/new" element={<AttributeForm />} />
        <Route path="/catalog/attributes/:id/edit" element={<AttributeForm />} />
        
        {/* Tools */}
        <Route path="/catalog/bulk-import" element={<BulkImport />} />
        <Route path="/catalog/search-analytics" element={<SearchAnalytics />} />

        {/* Leads Routes */}
        <Route path="/leads" element={<LeadsList />} />
        <Route path="/leads/:id" element={<LeadDetail />} />
        <Route path="/leads/:id/assign" element={<AssignPartner />} />

        {/* Partners Routes */}
        <Route path="/partners" element={<PartnersList />} />
        <Route path="/partners/pending-approvals" element={<PendingApprovals />} />
        <Route path="/partners/performance" element={<PartnerPerformance />} />
        <Route path="/partners/:id" element={<PartnerDetail />} />

        {/* Visits Routes */}
        <Route path="/visits" element={<VisitsList />} />
        <Route path="/visits/:id" element={<VisitTracking />} />

        {/* Users Routes */}
        <Route path="/users" element={<CustomersList />} />
        <Route path="/users/:id" element={<CustomerDetail />} />

        {/* Finance Routes - COMPLETE */}
        <Route path="/finance" element={<FinanceDashboard />} />
        <Route path="/finance/payout-requests" element={<PayoutRequests />} />
        <Route path="/finance/payouts" element={<PayoutsList />} />
        <Route path="/finance/transactions" element={<TransactionsList />} />
        <Route path="/finance/wallet" element={<WalletManagement />} />
        <Route path="/finance/reconciliation" element={<Reconciliation />} />
        <Route path="/finance/partner-payments" element={<PartnerPayments />} />

        {/* Operations Routes */}
        <Route path="/operations/disputes" element={<DisputesList />} />
        <Route path="/operations/disputes/:id" element={<DisputeDetail />} />
        <Route path="/operations/tickets" element={<TicketsList />} />
        <Route path="/operations/tickets/:id" element={<TicketDetail />} />

        {/* Communications Routes */}
        <Route path="/communications/notifications" element={<NotificationsList />} />
        <Route path="/communications/notifications/create" element={<CreateNotification />} />
        <Route path="/communications/faqs" element={<FAQManagement />} />
        <Route path="/communications/banners" element={<BannerManagement />} />

        {/* Pricing Routes */}
        <Route path="/pricing/rules" element={<PricingRules />} />
        <Route path="/pricing/simulator" element={<PriceSimulator />} />
      </Route>

      {/* Default Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}