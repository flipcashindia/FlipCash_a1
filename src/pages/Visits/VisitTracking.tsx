// pages/visits/VisitTracking.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Clock, User, Phone, CheckCircle, 
  XCircle, AlertTriangle, FileText, Camera, ShieldCheck,
  Calendar // <--- Added missing import
} from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Badge } from '../../components/UI/Badge';
import { Button } from '../../components/UI/Button2';
import { Loader } from '../../components/UI/Loader';
import { visitsService } from '../../services/visits.service';
import { type Visit, type VisitStatusLog, type VerificationChecklist } from '../../types';
import { formatDateTime, formatCurrency } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function VisitTracking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [timeline, setTimeline] = useState<VisitStatusLog[]>([]);
  const [checklist, setChecklist] = useState<VerificationChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'inspection' | 'timeline'>('overview');

  useEffect(() => {
    if (id) fetchVisitDetails(id);
  }, [id]);

  const fetchVisitDetails = async (visitId: string) => {
    try {
      // Parallel data fetching for performance
      const [visitData, timelineData, checklistData] = await Promise.all([
        visitsService.getVisit(visitId),
        visitsService.getVisitTimeline(visitId),
        visitsService.getVisitChecklist(visitId)
      ]);
      
      setVisit(visitData);
      setTimeline(timelineData);
      setChecklist(checklistData);
    } catch (error) {
      toast.error('Failed to load visit details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminCancel = async () => {
    if (!id || !confirm('ADMIN ACTION: This will forcefully cancel the visit. Continue?')) return;
    const reason = prompt('Enter admin cancellation reason:');
    if (!reason) return;

    try {
      await visitsService.cancelVisit(id, reason);
      toast.success('Visit cancelled by admin');
      fetchVisitDetails(id); // Refresh
    } catch (error) {
      toast.error('Failed to cancel visit');
    }
  };

  // Helper to render status timeline with icons
  const TimelineItem = ({ log, isLast }: { log: VisitStatusLog; isLast: boolean }) => (
    <div className="relative pl-8 pb-8">
      {!isLast && <div className="absolute left-3.5 top-8 bottom-0 w-0.5 bg-gray-200" />}
      <div className={`absolute left-0 top-1 w-7 h-7 rounded-full flex items-center justify-center border-2 
        ${log.new_status === 'completed' ? 'bg-green-100 border-green-500 text-green-600' : 
          log.new_status === 'cancelled' ? 'bg-red-100 border-red-500 text-red-600' :
          'bg-blue-50 border-blue-400 text-blue-500'}`}>
        {log.new_status === 'completed' ? <CheckCircle size={14} /> : 
         log.new_status === 'cancelled' ? <XCircle size={14} /> : 
         <Clock size={14} />}
      </div>
      <div>
        <p className="font-semibold text-gray-900">{log.new_status.replace('_', ' ').toUpperCase()}</p>
        <p className="text-xs text-gray-500">{formatDateTime(log.timestamp)}</p>
        {log.reason && (
          <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded border border-gray-100">
            "{log.reason}"
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1">Updated by: {log.changed_by?.first_name || 'System'}</p>
      </div>
    </div>
  );

  if (loading) return <Loader />;
  if (!visit) return <div className="text-center py-10">Visit not found</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/visits')} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-dark">{visit.visit_number}</h1>
                <Badge status={visit.status} className="text-sm">{visit.status.replace(/_/g, ' ')}</Badge>
            </div>
            <p className="text-gray-500 text-sm mt-1">
                Lead: <span className="font-medium text-gray-700">{visit.lead.lead_number}</span> • 
                Created: {formatDateTime(visit.created_at)}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
            {visit.status !== 'completed' && visit.status !== 'cancelled' && (
                 <Button variant="danger" size="sm" onClick={handleAdminCancel}>
                    Force Cancel
                </Button>
            )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
            {['overview', 'inspection', 'timeline'].map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`${
                        activeTab === tab
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
                >
                    {tab}
                </button>
            ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Main Content based on Tab */}
        <div className="lg:col-span-2 space-y-6">
            
            {activeTab === 'overview' && (
                <>
                <Card title="Visit Essentials">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Schedule & Time</h3>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Calendar size={18} /></div>
                                <div>
                                    <p className="text-xs text-gray-500">Scheduled Date</p>
                                    <p className="font-medium">{visit.scheduled_date}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Clock size={18} /></div>
                                <div>
                                    <p className="text-xs text-gray-500">Time Slot</p>
                                    <p className="font-medium">{visit.scheduled_time_slot}</p>
                                </div>
                            </div>
                            {visit.arrived_at && (
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-50 rounded-lg text-green-600"><MapPin size={18} /></div>
                                    <div>
                                        <p className="text-xs text-gray-500">Actual Arrival</p>
                                        <p className="font-medium">{formatDateTime(visit.arrived_at)}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                             <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Verification</h3>
                             <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">Secure Code (For Partner)</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-mono font-bold tracking-widest text-dark">
                                        {visit.verification_code}
                                    </span>
                                    {visit.is_code_verified ? (
                                        <Badge status="verified" className="ml-2">Verified</Badge>
                                    ) : (
                                        <Badge status="pending" className="ml-2">Pending</Badge>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                    Expires: {visit.verification_code_expires_at ? formatDateTime(visit.verification_code_expires_at) : 'N/A'}
                                </p>
                             </div>
                             
                             <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Attempt Count:</span>
                                <span className="font-medium">{visit.verification_attempts} / {visit.max_verification_attempts}</span>
                             </div>
                        </div>
                    </div>
                </Card>

                {visit.cancellation_reason && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="text-red-600 shrink-0" />
                            <div>
                                <h4 className="font-bold text-red-800">Visit Cancelled</h4>
                                <p className="text-red-700 mt-1">{visit.cancellation_reason}</p>
                                <p className="text-xs text-red-500 mt-2">Cancelled by {visit.cancelled_by?.email || 'Unknown'} at {formatDateTime(visit.cancelled_at || '')}</p>
                            </div>
                        </div>
                    </div>
                )}
                </>
            )}

            {activeTab === 'inspection' && (
                <div className="space-y-6">
                    <Card title="Device Verification Results">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3 bg-gray-50 rounded border">
                                <p className="text-xs text-gray-500">Verified IMEI</p>
                                <p className="font-mono font-medium">{visit.verified_imei || 'Not recorded'}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded border">
                                <p className="text-xs text-gray-500">Partner Recommended Price</p>
                                <p className="font-bold text-green-600 text-lg">
                                    {visit.partner_recommended_price ? formatCurrency(visit.partner_recommended_price) : '-'}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card title="Inspection Checklist">
                        {checklist.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">No checklist items recorded yet.</div>
                        ) : (
                            <div className="space-y-3">
                                {checklist.map((item) => (
                                    <div key={item.id} className="flex items-start justify-between p-3 border rounded-lg bg-white hover:bg-gray-50">
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-1 p-1 rounded-full ${
                                                item.status === 'pass' ? 'bg-green-100 text-green-600' : 
                                                item.status === 'fail' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                {item.status === 'pass' ? <CheckCircle size={14}/> : <AlertTriangle size={14}/>}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-gray-900">{item.item_name}</p>
                                                <p className="text-xs text-gray-500">{item.category}</p>
                                                {item.notes && <p className="text-sm text-gray-600 mt-1 italic">"{item.notes}"</p>}
                                            </div>
                                        </div>
                                        {item.photo_url && (
                                            <a href={item.photo_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1">
                                                <Camera size={12} /> View Photo
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {activeTab === 'timeline' && (
                 <Card title="Activity Log">
                    <div className="mt-4">
                        {timeline.map((log, index) => (
                            <TimelineItem key={log.id} log={log} isLast={index === timeline.length - 1} />
                        ))}
                    </div>
                 </Card>
            )}
        </div>

        {/* Right Column: Sidebar Info */}
        <div className="space-y-6">
            <Card title="Participants">
                <div className="space-y-6">
                    {/* Partner Info */}
                    <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Partner</h4>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                {visit.partner.business_name.substring(0,1)}
                            </div>
                            <div>
                                <p className="text-sm font-semibold">{visit.partner.business_name}</p>
                                <a href={`tel:${visit.partner.phone}`} className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                                    <Phone size={10} /> {visit.partner.phone}
                                </a>
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Customer Info */}
                    <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Customer</h4>
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                                <User size={18} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">{visit.lead.user?.first_name || 'Customer'}</p>
                                <p className="text-xs text-gray-500">Lead Owner</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <Card title="Visit Stats">
                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Travel Time</span>
                        <span className="font-medium">{visit.travel_time_minutes ? `${visit.travel_time_minutes} mins` : '-'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Inspection Time</span>
                        <span className="font-medium">{visit.inspection_duration_minutes ? `${visit.inspection_duration_minutes} mins` : '-'}</span>
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between text-sm font-bold">
                        <span className="text-gray-900">Total Duration</span>
                        <span className="text-gray-900">{visit.total_visit_duration_minutes ? `${visit.total_visit_duration_minutes} mins` : '-'}</span>
                    </div>
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
}