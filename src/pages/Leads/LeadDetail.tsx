// pages/Leads/LeadDetail.tsx

import React, { useEffect, useState } from 'react';

import { useParams, useNavigate } from 'react-router-dom';

import axios from 'axios';

import { 

  ArrowLeft, Calendar, MapPin, Smartphone, User, 

  MessageSquare, AlertTriangle,

  CheckCircle, ShieldAlert, Navigation, IndianRupee, History, Scale,

  ChevronDown, ChevronUp, Image as ImageIcon, FileText, BadgeCheck

} from 'lucide-react';

import toast from 'react-hot-toast';



const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';



// --- Modular Interfaces ---

interface BasicData {

  lead: {

    id: string;

    lead_number: string;

    status: string;

    status_display: string;

    is_urgent: boolean;

    is_flagged: boolean;

    created_at: string;

    customer_notes: string;

  };

  customer: {

    id: string;

    name: string;

    phone: string;

    email: string;

    pickup_address: any;

    kyc_data?: {

      document_type: string;

      document_number: string;

      front_image: string | null;

      back_image: string | null;

      selfie_image: string | null;

      status: string;

    } | null;

  };

}



interface DevicePricingData {

  device: {

    full_name: string;

    variant: string;

    imei_primary: string;

    condition_responses: Record<string, string>;

  };

  pricing: {

    estimated_price: string;

    quoted_price: string;

    final_price: string;

    pricing_history: any[];

  };

}



interface PartnerActivityData {

  partner_info: {

    is_assigned: boolean;

    business_name?: string;

    phone?: string;

    average_rating?: number;

  };

  offers: any[];

  agent_assignments?: any[];

}



interface VisitsData {

  visits: any[];

}



interface FinanceData {

  financial: {

    summary: any;

    transactions: any[];

  };

}



interface DisputesData {

  disputes: any[];

}



interface TimelineData {

  status_timeline: any[];

}



export default function LeadDetail() {

  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();



  // Modular State

  const [basic, setBasic] = useState<BasicData | null>(null);

  const [basicLoading, setBasicLoading] = useState(true);

  const [basicError, setBasicError] = useState('');



  const [devicePricing, setDevicePricing] = useState<DevicePricingData | null>(null);

  const [partnerActivity, setPartnerActivity] = useState<PartnerActivityData | null>(null);

  const [visitsData, setVisitsData] = useState<VisitsData | null>(null);

  const [financeData, setFinanceData] = useState<FinanceData | null>(null);

  const [disputesData, setDisputesData] = useState<DisputesData | null>(null);

  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);



  // UI State

  const [isConditionExpanded, setIsConditionExpanded] = useState(false);

  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);



  useEffect(() => {

    if (id) {

      fetchBasicInfo(id);

    }

  }, [id]);



  const fetchBasicInfo = async (leadId: string) => {

    setBasicLoading(true);

    try {

      const token = localStorage.getItem('access_token');

      const response = await axios.get(`${API_BASE_URL}/admin/leads/${leadId}/basic/`, {

        headers: { Authorization: `Bearer ${token}` }

      });

      if (response.data.error) throw new Error(response.data.error);

      setBasic(response.data);

      

      fetchModularData(leadId, token);

    } catch (err: any) {

      console.error("Error fetching basic lead:", err);

      

      if (err.response?.status === 401) {

        toast.error("Session expired. Please log in again.");

        localStorage.removeItem('access_token');

        navigate('/login');

        return;

      }



      const errorMsg = err.response?.data?.error || err.message || 'Unknown network error';

      const status = err.response?.status ? `(HTTP ${err.response.status})` : '';

      setBasicError(`Failed to load lead ${status}. Details: ${errorMsg}`);

    } finally {

      setBasicLoading(false);

    }

  };



  const [partnerActivityError, setPartnerActivityError] = useState<string | null>(null);

  const [timelineError, setTimelineError] = useState<string | null>(null);



  const fetchModularData = (leadId: string, token: string | null) => {

    const headers = { Authorization: `Bearer ${token}` };

    

    axios.get(`${API_BASE_URL}/admin/leads/${leadId}/device_pricing/`, { headers })

      .then(res => setDevicePricing(res.data)).catch(console.error);



    axios.get(`${API_BASE_URL}/admin/leads/${leadId}/partner_activity/`, { headers })

      .then(res => setPartnerActivity(res.data))

      .catch(err => {

        console.error("Partner activity error:", err);

        setPartnerActivityError(err.response?.data?.error || err.message);

      });



    axios.get(`${API_BASE_URL}/admin/leads/${leadId}/visits/`, { headers })

      .then(res => setVisitsData(res.data)).catch(console.error);



    axios.get(`${API_BASE_URL}/admin/leads/${leadId}/finance/`, { headers })

      .then(res => setFinanceData(res.data)).catch(console.error);



    axios.get(`${API_BASE_URL}/admin/leads/${leadId}/disputes/`, { headers })

      .then(res => setDisputesData(res.data)).catch(console.error);



    axios.get(`${API_BASE_URL}/admin/leads/${leadId}/timeline/`, { headers })

      .then(res => setTimelineData(res.data))

      .catch(err => {

        console.error("Timeline error:", err);

        setTimelineError(err.response?.data?.error || err.message);

      });

  };



  const handleStatusUpdate = async (newStatus: string) => {

    if (!confirm(`Change status to ${newStatus}?`)) return;

    try {

      const token = localStorage.getItem('access_token');

      await axios.post(`${API_BASE_URL}/admin/leads/${id}/update_status/`, 

        { status: newStatus },

        { headers: { Authorization: `Bearer ${token}` }}

      );

      toast.success("Status updated");

      fetchBasicInfo(id!); 

    } catch (err) {

      toast.error("Failed to update status");

    }

  };



  const getConditionComparison = () => {

    const customerCond = devicePricing?.device?.condition_responses || {};

    const partnerCond = partnerActivity?.offers?.[0]?.inspection_findings || {};

    

    const allKeys = Array.from(new Set([...Object.keys(customerCond), ...Object.keys(partnerCond)]));

    

    return allKeys.map(key => {

      const customerVal = customerCond[key];

      const partnerVal = partnerCond[key];

      

      let matchStatus = 'match';

      if (!customerVal || !partnerVal) {

        matchStatus = 'missing';

      } else if (String(customerVal).toLowerCase() !== String(partnerVal).toLowerCase()) {

        matchStatus = 'mismatch';

      }



      return {

        key: key.replace(/_/g, ' '),

        customer: customerVal || 'Not Reported',

        partner: partnerVal || 'Not Checked',

        matchStatus

      };

    });

  };



  if (basicLoading) return <div className="flex justify-center items-center h-screen text-gray-500">Loading Lead Basics...</div>;

  if (basicError) return <div className="flex justify-center items-center h-screen text-red-500">{basicError}</div>;

  if (!basic) return null;



  return (

    <div className="min-h-screen bg-gray-50 p-6">

      <div className="max-w-7xl mx-auto space-y-6">

        

        {/* Header */}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">

          <div className="flex items-center gap-4">

            <button 

              onClick={() => navigate(-1)}

              className="p-2 hover:bg-gray-100 rounded-full transition-colors"

            >

              <ArrowLeft size={20} />

            </button>

            <div>

              <div className="flex items-center gap-3">

                <h1 className="text-2xl font-bold text-gray-900">{basic.lead.lead_number}</h1>

                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">

                  {basic.lead.status_display}

                </span>

                {basic.lead.is_urgent && (

                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-bold flex items-center gap-1">

                    <AlertTriangle size={12} /> URGENT

                  </span>

                )}

              </div>

              <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">

                <Calendar size={14} /> Created on {new Date(basic.lead.created_at).toLocaleDateString()}

              </p>

            </div>

          </div>

          <div className="flex gap-2">

            {basic.lead.status === 'booked' && (

               <button 

                 onClick={() => handleStatusUpdate('cancelled')}

                 className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors"

               >

                 Cancel Lead

               </button>

            )}

          </div>

        </div>



        {/* Multi-Grid Layout */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          

          {/* Main Content Column (Span 2) */}

          <div className="lg:col-span-2 space-y-6">

            

            {/* 1. Device & Condition Matrix Comparison */}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <Scale className="text-gray-500" size={20} />

                  <h3 className="font-semibold text-gray-900">Condition Inspection & Pricing</h3>

                </div>

              </div>

              <div className="p-6">

                {!devicePricing ? (

                   <p className="text-sm text-gray-400 animate-pulse">Loading device details...</p>

                ) : devicePricing.device ? (

                  <div className="space-y-8">

                    {/* Basic Info & Price */}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                      <div>

                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Model</p>

                        <p className="font-medium text-lg text-gray-900 flex items-center gap-2">

                          <Smartphone size={18} className="text-gray-400" />

                          {devicePricing.device.full_name}

                        </p>

                        <p className="text-sm text-gray-600 mt-1">{devicePricing.device.variant} • IMEI: {devicePricing.device.imei_primary || 'N/A'}</p>

                      </div>

                      <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100 flex justify-between items-center">

                        <div>

                          <p className="text-xs text-emerald-600 uppercase tracking-wider font-bold mb-1">Estimated Value</p>

                          <p className="text-2xl font-bold text-emerald-700">₹{devicePricing.pricing.estimated_price}</p>

                        </div>

                        {devicePricing.pricing.final_price && (

                          <div className="text-right border-l border-emerald-200 pl-4">

                            <p className="text-xs text-emerald-600 uppercase tracking-wider font-bold mb-1">Final Price</p>

                            <p className="text-xl font-bold text-emerald-800">₹{devicePricing.pricing.final_price}</p>

                          </div>

                        )}

                      </div>

                    </div>

                    

                    {/* Collapsible Side by Side Comparison Table */}

                    <div>

                      <button 

                        onClick={() => setIsConditionExpanded(!isConditionExpanded)}

                        className="w-full flex items-center justify-between py-2 mb-2 text-gray-700 hover:text-primary transition-colors focus:outline-none"

                      >

                        <p className="text-sm font-bold uppercase tracking-wider">Customer Claim vs Partner Inspection</p>

                        {isConditionExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}

                      </button>



                      {isConditionExpanded && (

                        <div className="border border-gray-200 rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">

                          <table className="w-full text-sm text-left">

                            <thead className="bg-gray-50 border-b border-gray-200">

                              <tr>

                                <th className="px-4 py-3 font-semibold text-gray-700">Condition Check</th>

                                <th className="px-4 py-3 font-semibold text-gray-700 bg-blue-50/50">Customer Claim</th>

                                <th className="px-4 py-3 font-semibold text-gray-700 bg-orange-50/50">Partner Found</th>

                                <th className="px-4 py-3 font-semibold text-gray-700 text-center">Status</th>

                              </tr>

                            </thead>

                            <tbody className="divide-y divide-gray-200">

                              {getConditionComparison().map((item, idx) => (

                                <tr key={idx} className="hover:bg-gray-50">

                                  <td className="px-4 py-3 font-medium text-gray-900 capitalize">{item.key}</td>

                                  <td className="px-4 py-3 text-gray-600 bg-blue-50/20">{String(item.customer)}</td>

                                  <td className="px-4 py-3 font-medium text-gray-800 bg-orange-50/20">{String(item.partner)}</td>

                                  <td className="px-4 py-3 text-center">

                                    {item.matchStatus === 'match' && <span className="inline-flex px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium border border-green-200">Match</span>}

                                    {item.matchStatus === 'mismatch' && <span className="inline-flex px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold border border-red-200 flex items-center gap-1"><AlertTriangle size={12}/> Mismatch</span>}

                                    {item.matchStatus === 'missing' && <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">Missing Data</span>}

                                  </td>

                                </tr>

                              ))}

                              {getConditionComparison().length === 0 && (

                                <tr>

                                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400 italic">No condition data recorded.</td>

                                </tr>

                              )}

                            </tbody>

                          </table>

                        </div>

                      )}

                    </div>



                    {/* Inspection Photos */}

                    {partnerActivity?.offers?.[0]?.inspection_photos?.length > 0 && (

                      <div className="mt-6 border-t border-gray-100 pt-6">

                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">

                          <ImageIcon size={16} /> Partner Inspection Photos

                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                          {partnerActivity.offers[0].inspection_photos.map((photo: string, idx: number) => (

                            <a href={photo} target="_blank" rel="noreferrer" key={idx} className="block group rounded-lg overflow-hidden border border-gray-200 hover:border-primary transition-colors">

                              <img src={photo} alt={`Inspection ${idx+1}`} className="w-full h-24 object-cover group-hover:scale-105 transition-transform" />

                            </a>

                          ))}

                        </div>

                      </div>

                    )}



                  </div>

                ) : (

                  <p className="text-sm text-red-500">Failed to load device details.</p>

                )}

              </div>

            </div>



            {/* 2. Visits & Inspections */}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">

                <Navigation className="text-gray-500" size={20} />

                <h3 className="font-semibold text-gray-900">Visits & Field Activity</h3>

              </div>

              <div className="p-6">

                {!visitsData ? (

                  <p className="text-sm text-gray-400 animate-pulse">Loading visits...</p>

                ) : visitsData.visits && visitsData.visits.length > 0 ? (

                  <div className="space-y-4">

                    {visitsData.visits.map((v, i) => (

                      <div key={i} className="border border-gray-200 rounded-lg p-4">

                        <div className="flex justify-between items-center mb-3">

                          <span className="font-semibold text-gray-900 flex items-center gap-2">

                            <Navigation size={16} className="text-primary"/> 

                            Visit #{v.visit_number}

                          </span>

                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">{v.status_display}</span>

                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">

                          <div>

                            <p className="text-gray-500">Scheduled</p>

                            <p className="font-medium">{new Date(v.scheduled_at).toLocaleString()}</p>

                          </div>

                          <div>

                            <p className="text-gray-500">Checked In</p>

                            <p className="font-medium">{v.checked_in_at ? new Date(v.checked_in_at).toLocaleTimeString() : 'Pending'}</p>

                          </div>

                          <div>

                            <p className="text-gray-500">Duration</p>

                            <p className="font-medium">{v.total_duration_minutes || 0} mins</p>

                          </div>

                          <div>

                            <p className="text-gray-500">Partner Rec. Price</p>

                            <p className="font-medium text-emerald-600">{v.partner_recommended_price ? `₹${v.partner_recommended_price}` : 'N/A'}</p>

                          </div>

                        </div>

                      </div>

                    ))}

                  </div>

                ) : (

                  <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-200">

                    <Navigation className="mx-auto text-gray-300 mb-3" size={32} />

                    <p className="text-gray-500 font-medium">No visits recorded</p>

                    <p className="text-xs text-gray-400 mt-1">Field agents haven't checked in yet.</p>

                  </div>

                )}

              </div>

            </div>



            {/* 3. Enhanced Finance Transactions */}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">

                <IndianRupee className="text-gray-500" size={20} />

                <h3 className="font-semibold text-gray-900">Financial Ledger</h3>

              </div>

              <div className="p-6">

                {!financeData ? (

                  <p className="text-sm text-gray-400 animate-pulse">Loading financial data...</p>

                ) : financeData.financial ? (

                  <>

                    <div className="flex gap-4 mb-6">

                      <div className="bg-gray-50 rounded-lg p-3 px-4 border border-gray-200">

                        <p className="text-xs text-gray-500 font-medium">Claim Fee Deducted</p>

                        <p className="font-semibold text-gray-900">₹{financeData.financial.summary?.claim_fee}</p>

                      </div>

                      <div className="bg-emerald-50 rounded-lg p-3 px-4 border border-emerald-200">

                        <p className="text-xs text-emerald-600 font-bold uppercase tracking-wide">Customer Received</p>

                        <p className="font-bold text-emerald-700 text-lg">₹{financeData.financial.summary?.customer_received}</p>

                      </div>

                    </div>



                    <div className="border border-gray-200 rounded-lg overflow-hidden">

                      <table className="w-full text-sm text-left">

                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">

                          <tr>

                            <th className="py-3 px-4 font-semibold">Date</th>

                            <th className="py-3 px-4 font-semibold">Type</th>

                            <th className="py-3 px-4 font-semibold">Description</th>

                            <th className="py-3 px-4 font-semibold">Wallet</th>

                            <th className="py-3 px-4 font-semibold text-right">Amount</th>

                            <th className="py-3 px-4 font-semibold text-center">Status</th>

                          </tr>

                        </thead>

                        <tbody className="divide-y divide-gray-100">

                          {financeData.financial.transactions?.map((t, idx) => (

                            <tr key={idx} className="hover:bg-gray-50 transition-colors">

                              <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{new Date(t.created_at).toLocaleDateString()}</td>

                              <td className="py-3 px-4 capitalize font-medium text-gray-800">{t.transaction_type.replace(/_/g, ' ')}</td>

                              <td className="py-3 px-4 text-xs text-gray-500 max-w-[200px] truncate" title={t.description}>{t.description || '-'}</td>

                              <td className="py-3 px-4">

                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs capitalize">{t.wallet_type}</span>

                              </td>

                              <td className={`py-3 px-4 font-bold text-right ${t.transaction_type.includes('credit') || t.transaction_type.includes('payout') ? 'text-green-600' : 'text-gray-900'}`}>

                                ₹{t.amount}

                              </td>

                              <td className="py-3 px-4 text-center">

                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${t.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>

                                  {t.status}

                                </span>

                              </td>

                            </tr>

                          ))}

                          {(!financeData.financial.transactions || financeData.financial.transactions.length === 0) && (

                            <tr><td colSpan={6} className="text-center py-8 text-gray-400 italic">No financial transactions found.</td></tr>

                          )}

                        </tbody>

                      </table>

                    </div>

                  </>

                ) : (

                  <p className="text-sm text-red-500">Failed to load financial data.</p>

                )}

              </div>

            </div>



            {/* 4. Disputes */}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

              <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center gap-2">

                <ShieldAlert className="text-red-500" size={20} />

                <h3 className="font-semibold text-red-900">Disputes & Operations</h3>

              </div>

              <div className="p-6">

                {!disputesData ? (

                  <p className="text-sm text-gray-400 animate-pulse">Loading disputes...</p>

                ) : disputesData.disputes && disputesData.disputes.length > 0 ? (

                  <div className="space-y-4">

                    {disputesData.disputes.map((d, i) => (

                      <div key={i} className="border-l-4 border-red-500 bg-gray-50 rounded-r-lg p-4">

                        <div className="flex justify-between mb-2">

                          <span className="font-semibold text-gray-900">{d.dispute_number} - {d.dispute_type.replace(/_/g, ' ').toUpperCase()}</span>

                          <span className="px-2 py-1 bg-white border border-red-200 text-red-700 rounded text-xs font-medium">{d.status_display}</span>

                        </div>

                        <p className="text-sm text-gray-600">{d.description}</p>

                        <div className="mt-2 text-xs text-gray-500">

                          Raised by: {d.raised_by_name} on {new Date(d.created_at).toLocaleDateString()}

                        </div>

                      </div>

                    ))}

                  </div>

                ) : (

                  <p className="text-sm text-gray-500 text-center py-4">No disputes raised for this lead.</p>

                )}

              </div>

            </div>



          </div>



          {/* Sidebar Column (Span 1) */}

          <div className="space-y-6">

            

            {/* Customer Details & KYC */}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

              <div className="bg-gray-50 p-6 border-b border-gray-200">

                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">

                  <User size={16} /> Customer Profile

                </h3>

                <div>

                  <p className="font-semibold text-lg text-gray-900 flex items-center justify-between">

                    {basic.customer.name}

                    {basic.customer.kyc_status === 'verified' && (

                      <BadgeCheck className="text-blue-500" size={20} title="KYC Verified" />

                    )}

                  </p>

                  <div className="space-y-3 mt-4 text-sm text-gray-600">

                    <div className="flex items-center gap-2">

                      <Smartphone size={14} className="text-gray-400" />

                      <a href={`tel:${basic.customer.phone}`} className="hover:text-primary">{basic.customer.phone}</a>

                    </div>

                    {basic.customer.email && (

                      <div className="flex items-center gap-2">

                        <MessageSquare size={14} className="text-gray-400" />

                        <a href={`mailto:${basic.customer.email}`} className="hover:text-primary truncate">{basic.customer.email}</a>

                      </div>

                    )}

                    {basic.customer.pickup_address && (

                      <div className="flex items-start gap-2 mt-2 pt-3 border-t border-gray-100">

                        <MapPin size={14} className="text-gray-400 mt-1 flex-shrink-0" />

                        <p>

                          {basic.customer.pickup_address.line1}<br/>

                          {basic.customer.pickup_address.city}, {basic.customer.pickup_address.state} - {basic.customer.pickup_address.postal_code}

                        </p>

                      </div>

                    )}

                  </div>

                </div>

              </div>

              

              {/* KYC DATA SECTION */}

              <div className="p-6 bg-white">

                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">

                  <FileText size={14} /> KYC Information

                </h4>

                {basic.customer.kyc_data ? (

                  <div className="space-y-4">

                    <div className="bg-gray-50 rounded p-3 text-sm border border-gray-100">

                      <div className="flex justify-between mb-1">

                        <span className="text-gray-500">Document</span>

                        <span className="font-medium text-gray-900 uppercase">{basic.customer.kyc_data.document_type}</span>

                      </div>

                      <div className="flex justify-between mb-1">

                        <span className="text-gray-500">Doc Number</span>

                        <span className="font-medium text-gray-900">{basic.customer.kyc_data.document_number || 'N/A'}</span>

                      </div>

                      <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">

                        <span className="text-gray-500">Status</span>

                        <span className={`font-semibold capitalize ${basic.customer.kyc_data.status === 'verified' ? 'text-green-600' : 'text-yellow-600'}`}>

                          {basic.customer.kyc_data.status}

                        </span>

                      </div>

                    </div>



                    {/* KYC Images */}

                    <div className="grid grid-cols-2 gap-2">

                      {basic.customer.kyc_data.front_image && (

                        <a href={basic.customer.kyc_data.front_image} target="_blank" rel="noreferrer" className="block relative group border border-gray-200 rounded overflow-hidden">

                          <img src={basic.customer.kyc_data.front_image} alt="KYC Front" className="w-full h-16 object-cover" />

                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">Front</div>

                        </a>

                      )}

                      {basic.customer.kyc_data.back_image && (

                        <a href={basic.customer.kyc_data.back_image} target="_blank" rel="noreferrer" className="block relative group border border-gray-200 rounded overflow-hidden">

                          <img src={basic.customer.kyc_data.back_image} alt="KYC Back" className="w-full h-16 object-cover" />

                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">Back</div>

                        </a>

                      )}

                      {basic.customer.kyc_data.selfie_image && (

                        <a href={basic.customer.kyc_data.selfie_image} target="_blank" rel="noreferrer" className="block col-span-2 relative group border border-gray-200 rounded overflow-hidden mt-1">

                          <img src={basic.customer.kyc_data.selfie_image} alt="KYC Selfie" className="w-full h-24 object-cover object-top" />

                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">Selfie</div>

                        </a>

                      )}

                    </div>

                  </div>

                ) : (

                  <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded border border-gray-100 text-center">

                    KYC details have not been submitted yet.

                  </div>

                )}

              </div>

            </div>



            {/* Partner Assignment */}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">

              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">

                <CheckCircle size={16} /> Partner Info

              </h3>

              {partnerActivityError ? (

                <div className="p-3 bg-red-50 text-red-600 rounded text-sm border border-red-200">

                  <p className="font-bold">Error loading partner info:</p>

                  <p>{partnerActivityError}</p>

                </div>

              ) : !partnerActivity ? (

                <p className="text-sm text-gray-400 animate-pulse">Loading partner info...</p>

              ) : partnerActivity.partner_info?.is_assigned ? (

                <div>

                  <div className="flex items-center gap-3 mb-3">

                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold">

                      {partnerActivity.partner_info.business_name?.substring(0, 1) || 'P'}

                    </div>

                    <div>

                      <p className="font-semibold text-gray-900">{partnerActivity.partner_info.business_name}</p>

                      <p className="text-xs text-green-600 flex items-center gap-1">

                        <CheckCircle size={10} /> Active Partner

                      </p>

                    </div>

                  </div>

                  <div className="text-sm text-gray-600 mt-2 space-y-1">

                    <p>Contact: {partnerActivity.partner_info.phone}</p>

                    <p>Avg Rating: {partnerActivity.partner_info.average_rating || 'N/A'} ★</p>

                  </div>

                </div>

              ) : (

                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">

                  <p className="text-sm text-gray-500 mb-2">No partner assigned yet</p>

                  <button className="text-primary text-sm font-medium hover:underline">Assign Manually</button>

                </div>

              )}



              {/* Agent Assignments */}

              {partnerActivity && partnerActivity.agent_assignments && partnerActivity.agent_assignments.length > 0 && (

                <div className="mt-4 pt-4 border-t border-gray-100">

                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">

                    Assigned Field Agents

                  </h4>

                  <div className="space-y-3">

                    {partnerActivity.agent_assignments.map((assignment: any, idx: number) => (

                      <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">

                        <div className="flex justify-between items-start mb-2">

                          <div>

                            <p className="font-semibold text-gray-900 text-sm">{assignment.agent.name}</p>

                            <p className="text-xs text-gray-500">{assignment.agent.phone} • {assignment.agent.employee_code}</p>

                          </div>

                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${assignment.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>

                            {assignment.status_display}

                          </span>

                        </div>

                        {assignment.notes && (

                          <p className="text-xs text-gray-600 italic bg-white p-2 rounded border border-gray-100 mt-2">

                            "{assignment.notes}"

                          </p>

                        )}

                      </div>

                    ))}

                  </div>

                </div>

              )}

            </div>



            {/* Status Timeline */}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

              <div className="p-6 border-b border-gray-200 flex justify-between items-center">

                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">

                  <History size={16} /> Activity Timeline

                </h3>

                <button 

                  onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}

                  className="text-gray-400 hover:text-primary transition-colors"

                >

                  {isTimelineExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}

                </button>

              </div>

              

              <div className={`p-6 transition-all duration-300 ${isTimelineExpanded ? 'block' : 'hidden'}`}>

                {timelineError ? (

                  <div className="p-3 bg-red-50 text-red-600 rounded text-sm border border-red-200">

                    <p className="font-bold">Error loading timeline:</p>

                    <p>{timelineError}</p>

                  </div>

                ) : !timelineData ? (

                  <p className="text-sm text-gray-400 animate-pulse">Loading timeline...</p>

                ) : (

                  <div className="relative pl-4 space-y-6 before:absolute before:inset-y-0 before:left-[7px] before:w-0.5 before:bg-gray-200">

                    {timelineData.status_timeline && timelineData.status_timeline.map((log, idx) => (

                      <div key={idx} className="relative text-sm">

                        <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-primary ring-4 ring-white" />

                        <p className="font-medium text-gray-900">{log.new_status.replace(/_/g, ' ').toUpperCase()}</p>

                        <p className="text-xs text-gray-500 mt-0.5">{new Date(log.timestamp).toLocaleString()}</p>

                        {log.reason && <p className="text-gray-600 mt-1 italic">"{log.reason}"</p>}

                        <p className="text-xs text-gray-400 mt-1">by {log.changed_by}</p>

                      </div>

                    ))}

                    {(!timelineData.status_timeline || timelineData.status_timeline.length === 0) && (

                      <p className="text-sm text-gray-500">No activity logged.</p>

                    )}

                  </div>

                )}

              </div>

            </div>



            {/* Notes */}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">

              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Customer Notes</h3>

              <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-100">

                {basic.lead.customer_notes || "No specific instructions provided."}

              </p>

            </div>



          </div>



        </div>

      </div>

    </div>

  );

}
