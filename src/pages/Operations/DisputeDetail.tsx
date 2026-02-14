// pages/operations/DisputeDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Badge } from '../../components/UI/Badge';
import { Button } from '../../components/UI/Button';
import { Loader } from '../../components/UI/Loader';
import { operationsService } from '../../services/operations.service';
import { type Dispute } from '../../types';
import { formatDateTime } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function DisputeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadDispute(id);
  }, [id]);

  const loadDispute = async (disputeId: string) => {
    try {
      const data = await operationsService.getDispute(disputeId);
      setDispute(data);
    } catch (error) {
      toast.error('Failed to load dispute details');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!id) return;
    const resolution = prompt('Enter resolution details:');
    if (!resolution) return;

    try {
      await operationsService.resolveDispute(id, resolution);
      toast.success('Dispute resolved successfully');
      navigate('/operations/disputes');
    } catch (error) {
      toast.error('Failed to resolve dispute');
    }
  };

  const handleEscalate = async () => {
    if (!id || !confirm('Escalate this dispute?')) return;

    try {
      await operationsService.escalateDispute(id);
      toast.success('Dispute escalated');
      loadDispute(id);
    } catch (error) {
      toast.error('Failed to escalate dispute');
    }
  };

  if (loading) return <Loader />;
  if (!dispute) return <div>Dispute not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/operations/disputes')} className="btn-outline p-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-dark">Dispute Details</h1>
            <p className="text-gray-600">Lead: {dispute.lead}</p>
          </div>
        </div>
        <Badge status={dispute.status}>{dispute.status.replace(/_/g, ' ')}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Dispute Information">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <Badge status="info">{dispute.dispute_type.replace(/_/g, ' ')}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-gray-900 mt-1">{dispute.description}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Raised By</p>
                <p className="font-semibold">{dispute.raised_by}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created At</p>
                <p className="font-semibold">{formatDateTime(dispute.created_at)}</p>
              </div>
            </div>
          </Card>

          {dispute.resolution && (
            <Card title="Resolution">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Resolution Details</p>
                  <p className="text-gray-900 mt-1">{dispute.resolution}</p>
                </div>
                {dispute.resolved_at && (
                  <div>
                    <p className="text-sm text-gray-500">Resolved At</p>
                    <p className="font-semibold">{formatDateTime(dispute.resolved_at)}</p>
                  </div>
                )}
                {dispute.resolved_by && (
                  <div>
                    <p className="text-sm text-gray-500">Resolved By</p>
                    <p className="font-semibold">{dispute.resolved_by}</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Quick Info">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Lead ID</span>
                <span className="font-semibold">{dispute.lead}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <Badge status={dispute.status}>{dispute.status}</Badge>
              </div>
            </div>
          </Card>

          {(dispute.status === 'pending' || dispute.status === 'under_review') && (
            <Card title="Actions">
              <div className="space-y-3">
                <Button variant="secondary" className="w-full" onClick={handleResolve}>
                  Resolve Dispute
                </Button>
                <Button variant="outline" className="w-full" onClick={handleEscalate}>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Escalate
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}