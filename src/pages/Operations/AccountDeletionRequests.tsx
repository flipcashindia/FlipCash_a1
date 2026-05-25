// pages/Operations/AccountDeletionRequests.tsx
import { useEffect, useState, useCallback } from 'react';
import {
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  Phone,
  Mail,
  Shield,
  ChevronDown,
  Search,
  RefreshCw,
  UserX,
  Filter,
} from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Badge } from '../../components/UI/Badge';
import { Loader } from '../../components/UI/Loader';
import { Pagination } from '../../components/Shared/Pagination';
import { accountsService, type DeletionRequest } from '../../services/accounts.service';
import { formatDateTime } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function AccountDeletionRequests() {
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [rejectModal, setRejectModal] = useState<{ open: boolean; request: DeletionRequest | null }>({
    open: false,
    request: null,
  });
  const [approveModal, setApproveModal] = useState<{ open: boolean; request: DeletionRequest | null }>({
    open: false,
    request: null,
  });
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [detailModal, setDetailModal] = useState<{ open: boolean; request: DeletionRequest | null }>({
    open: false,
    request: null,
  });

  const pageSize = 20;

  const loadRequests = useCallback(async () => {
    try {
      const params: Record<string, any> = {
        page,
        page_size: pageSize,
      };
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;

      const data = await accountsService.getDeletionRequests(params);
      setRequests(data.results);
      setTotal(data.count);
    } catch {
      toast.error('Failed to load deletion requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, statusFilter, searchQuery]);

  useEffect(() => {
    setLoading(true);
    loadRequests();
  }, [loadRequests]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const handleApprove = async () => {
    if (!approveModal.request) return;
    setActionLoading(true);
    try {
      await accountsService.approveDeletionRequest(approveModal.request.id);
      toast.success('Account deletion approved & data anonymized successfully');
      setApproveModal({ open: false, request: null });
      loadRequests();
    } catch {
      toast.error('Failed to approve deletion request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.request || !rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    setActionLoading(true);
    try {
      await accountsService.rejectDeletionRequest(rejectModal.request.id, rejectReason.trim());
      toast.success('Deletion request rejected successfully');
      setRejectModal({ open: false, request: null });
      setRejectReason('');
      loadRequests();
    } catch {
      toast.error('Failed to reject deletion request');
    } finally {
      setActionLoading(false);
    }
  };

  const getDaysRemaining = (requestedAt: string) => {
    const requested = new Date(requestedAt);
    const autoDeleteDate = new Date(requested.getTime() + 15 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const daysLeft = Math.ceil((autoDeleteDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge status="warning">⏳ Pending Review</Badge>;
      case 'approved':
        return <Badge status="success">✅ Approved</Badge>;
      case 'rejected':
        return <Badge status="danger">❌ Rejected</Badge>;
      default:
        return <Badge status="default">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'consumer':
        return <Badge status="info">Customer</Badge>;
      case 'partner':
        return <Badge status="active">Partner</Badge>;
      case 'agent':
        return <Badge status="processing">Agent</Badge>;
      default:
        return <Badge status="default">{role}</Badge>;
    }
  };

  // Stats
  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const urgentCount = requests.filter(
    (r) => r.status === 'pending' && getDaysRemaining(r.requested_at) <= 3
  ).length;

  if (loading && !refreshing) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-dark flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <UserX className="w-6 h-6 text-red-600" />
            </div>
            Account Deletion Requests
          </h1>
          <p className="text-gray-500 mt-1">
            Review and manage account deletion requests from customers, partners & agents
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
              <p className="text-xs text-gray-500">Total Requests</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-yellow-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
              <p className="text-xs text-gray-500">Pending Review</p>
            </div>
          </div>
        </div>

        <div className={`bg-white rounded-xl border p-5 shadow-sm ${urgentCount > 0 ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${urgentCount > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
              <AlertTriangle className={`w-5 h-5 ${urgentCount > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${urgentCount > 0 ? 'text-red-700' : 'text-gray-400'}`}>{urgentCount}</p>
              <p className="text-xs text-gray-500">Urgent (≤3 days left)</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-green-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">
                {requests.filter((r) => r.status === 'approved').length}
              </p>
              <p className="text-xs text-gray-500">Approved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3 p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, phone, or email..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none bg-white min-w-[180px]"
            >
              <option value="">All Statuses</option>
              <option value="pending">⏳ Pending</option>
              <option value="approved">✅ Approved</option>
              <option value="rejected">❌ Rejected</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </Card>

      {/* Requests Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auto-Delete In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-green-400" />
                      </div>
                      <p className="text-gray-500 font-medium">No deletion requests found</p>
                      <p className="text-gray-400 text-sm">All clear! No pending requests to review.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const daysLeft = getDaysRemaining(req.requested_at);
                  const isUrgent = req.status === 'pending' && daysLeft <= 3;

                  return (
                    <tr
                      key={req.id}
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${isUrgent ? 'bg-red-50/40' : ''}`}
                      onClick={() => setDetailModal({ open: true, request: req })}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {req.user_details?.full_name || 'Unknown User'}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {req.user_details?.mobile_number || '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(req.user_details?.role || 'unknown')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md font-medium">
                          App / Web
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(req.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(req.requested_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {req.status === 'pending' ? (
                          <div className={`flex items-center gap-1.5 text-sm font-semibold ${isUrgent ? 'text-red-600' : daysLeft <= 7 ? 'text-yellow-600' : 'text-gray-600'}`}>
                            <Clock className="w-3.5 h-3.5" />
                            {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                            {isUrgent && (
                              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {req.status === 'pending' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setApproveModal({ open: true, request: req })}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setRejectModal({ open: true, request: req });
                                setRejectReason('');
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        ) : req.status === 'approved' ? (
                          <span className="text-xs text-green-600 font-medium">
                            Processed {req.processed_at ? formatDateTime(req.processed_at) : ''}
                          </span>
                        ) : (
                          <span className="text-xs text-red-600 font-medium">
                            Rejected {req.processed_at ? formatDateTime(req.processed_at) : ''}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {total > pageSize && (
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(total / pageSize)}
            totalItems={total}
            itemsPerPage={pageSize}
            onPageChange={setPage}
          />
        )}
      </Card>

      {/* ========== APPROVE CONFIRMATION MODAL ========== */}
      {approveModal.open && approveModal.request && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !actionLoading && setApproveModal({ open: false, request: null })}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Confirm Account Deletion</h3>
                  <p className="text-sm text-gray-500">This action is irreversible</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-red-800 font-medium mb-2">⚠️ This will permanently:</p>
                <ul className="text-sm text-red-700 space-y-1 ml-4">
                  <li>• Anonymize all personal data (name, phone, email)</li>
                  <li>• Deactivate the user account</li>
                  <li>• Financial records will be preserved for compliance</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-600">
                  <strong>User:</strong> {approveModal.request.user_details?.full_name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Phone:</strong> {approveModal.request.user_details?.mobile_number}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Role:</strong> {approveModal.request.user_details?.role}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setApproveModal({ open: false, request: null })}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Approve & Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== REJECT MODAL ========== */}
      {rejectModal.open && rejectModal.request && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !actionLoading && setRejectModal({ open: false, request: null })}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Reject Deletion Request</h3>
                  <p className="text-sm text-gray-500">
                    {rejectModal.request.user_details?.full_name}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g., Active orders are pending completion, Outstanding payout balance..."
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none h-28"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setRejectModal({ open: false, request: null });
                    setRejectReason('');
                  }}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading || !rejectReason.trim()}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                    rejectReason.trim()
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {actionLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Reject Request
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== DETAIL MODAL ========== */}
      {detailModal.open && detailModal.request && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetailModal({ open: false, request: null })}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-gray-400" />
                  Request Details
                </h3>
                <button
                  onClick={() => setDetailModal({ open: false, request: null })}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* User Info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2.5">
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">User Information</h4>
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-800 font-medium">
                    {detailModal.request.user_details?.full_name || 'N/A'}
                  </span>
                  {getRoleBadge(detailModal.request.user_details?.role || 'unknown')}
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">
                    {detailModal.request.user_details?.mobile_number || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">
                    {detailModal.request.user_details?.email || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Request Info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2.5">
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Request Information</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  {getStatusBadge(detailModal.request.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Requested At</span>
                  <span className="text-sm text-gray-800 font-medium">
                    {formatDateTime(detailModal.request.requested_at)}
                  </span>
                </div>
                {detailModal.request.status === 'pending' && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Auto-Delete In</span>
                    <span className={`text-sm font-bold ${getDaysRemaining(detailModal.request.requested_at) <= 3 ? 'text-red-600' : 'text-yellow-600'}`}>
                      {getDaysRemaining(detailModal.request.requested_at)} days
                    </span>
                  </div>
                )}
                {detailModal.request.processed_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Processed At</span>
                    <span className="text-sm text-gray-800 font-medium">
                      {formatDateTime(detailModal.request.processed_at)}
                    </span>
                  </div>
                )}
                {detailModal.request.processed_by_details && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Processed By</span>
                    <span className="text-sm text-gray-800 font-medium">
                      {detailModal.request.processed_by_details.full_name}
                    </span>
                  </div>
                )}
                {detailModal.request.rejection_reason && (
                  <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-red-700 mb-1">Rejection Reason:</p>
                    <p className="text-sm text-red-600">{detailModal.request.rejection_reason}</p>
                  </div>
                )}
              </div>

              {/* Action Info */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <p className="text-xs font-semibold text-yellow-800 mb-1">⚡ Auto-Delete Policy</p>
                <p className="text-xs text-yellow-700">
                  If no admin action is taken within 15 days, the system will automatically approve the request and anonymize the account data.
                </p>
              </div>

              {/* Actions */}
              {detailModal.request.status === 'pending' && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setDetailModal({ open: false, request: null });
                      setRejectModal({ open: true, request: detailModal.request });
                      setRejectReason('');
                    }}
                    className="flex-1 px-4 py-2.5 border border-red-300 text-red-700 rounded-xl font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      setDetailModal({ open: false, request: null });
                      setApproveModal({ open: true, request: detailModal.request });
                    }}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve & Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
