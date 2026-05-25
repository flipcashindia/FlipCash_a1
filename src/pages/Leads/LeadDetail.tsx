// pages/Leads/LeadDetail.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, Calendar, MapPin, Smartphone, User, 
  CreditCard, MessageSquare, Clock, ShieldAlert,
  CheckCircle, XCircle, AlertTriangle, FileText
} from 'lucide-react';

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Types (Updated with optional fields)
interface LeadDetail {
  id: string;
  lead_number: string;
  status: string;
  status_display: string;
  is_urgent: boolean;
  is_flagged: boolean;
  flag_reason?: string;
  
  // Customer
  user?: {
    id: string;
    name?: string;
    full_name?: string; // Fallback
    phone: string;
    email?: string;
  };
  
  // Device
  device_model?: {
    name: string;
    brand?: { name: string };
  };
  brand_name?: string; // Often provided at root by serializers
  storage?: string;
  ram?: string;
  imei_primary?: string;
  condition_responses?: Record<string, string>;
  device_photos?: string[];
  
  // Pricing
  estimated_price: string;
  final_price?: string;
  
  // Logistics
  pickup_address?: {
    address_line1: string;
    city: string;
    state: string;
    postal_code: string;
  };
  preferred_date?: string;
  preferred_time_slot?: string;
  
  // Partner
  assigned_partner?: {
    business_name: string;
    phone: string;
  };
  
  // Meta
  created_at: string;
  customer_notes?: string;
  internal_notes?: string;
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) fetchLeadDetail(id);
  }, [id]);

  const fetchLeadDetail = async (leadId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      // Using the ADMIN endpoint
      const response = await axios.get(`${API_BASE_URL}/admin/leads/${leadId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLead(response.data);
    } catch (err: any) {
      console.error("Error fetching lead:", err);
      setError(err.response?.status === 404 
        ? "Lead not found or access denied." 
        : "Failed to load lead details.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!confirm(`Change status to ${newStatus}?`)) return;
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${API_BASE_URL}/admin/leads/${id}/update_status/`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      fetchLeadDetail(id!); // Refresh
    } catch (err) {
      alert("Failed to update status");
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen text-gray-500">Loading details...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  if (!lead) return null;

  // Safe Access Helpers
  const brandName = lead.brand_name || lead.device_model?.brand?.name || 'Unknown Brand';
  const modelName = lead.device_model?.name || 'Unknown Model';
  const customerName = lead.user?.name || lead.user?.full_name || 'Guest User';
  const customerPhone = lead.user?.phone || 'N/A';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/leads')}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{lead.lead_number}</h1>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                  {lead.status_display}
                </span>
                {lead.is_urgent && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-bold flex items-center gap-1">
                    <AlertTriangle size={12} /> URGENT
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Created on {new Date(lead.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {lead.status === 'booked' && (
               <button 
                 onClick={() => handleStatusUpdate('cancelled')}
                 className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
               >
                 Cancel Lead
               </button>
            )}
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Device Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Smartphone size={20} className="text-gray-400" /> 
                Device Details
              </h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Model</p>
                  <p className="font-medium text-lg">{brandName} {modelName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Variant</p>
                  <p className="font-medium">
                    {lead.ram ? `${lead.ram} / ` : ''}{lead.storage || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">IMEI</p>
                  <p className="font-mono bg-gray-50 inline-block px-2 py-1 rounded text-sm">
                    {lead.imei_primary || 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estimated Value</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {lead.estimated_price ? `₹${lead.estimated_price}` : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Photos Grid */}
              {lead.device_photos && lead.device_photos.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm text-gray-500 mb-3">Device Photos</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {lead.device_photos.map((url, idx) => (
                      <img 
                        key={idx} 
                        src={url} 
                        alt={`Device ${idx}`} 
                        className="w-24 h-24 object-cover rounded border border-gray-200"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Logistics Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-gray-400" /> 
                Pickup & Schedule
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  {lead.pickup_address ? (
                    <p className="font-medium mt-1">
                      {lead.pickup_address.address_line1}<br/>
                      {lead.pickup_address.city}, {lead.pickup_address.state} - {lead.pickup_address.postal_code}
                    </p>
                  ) : (
                    <p className="font-medium mt-1 text-gray-400">No address provided</p>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Preferred Date</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar size={16} className="text-gray-400" />
                      <span className="font-medium">{lead.preferred_date || 'Not scheduled'}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time Slot</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={16} className="text-gray-400" />
                      <span className="font-medium">{lead.preferred_time_slot || 'Anytime'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {lead.customer_notes && (
                <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-sm rounded border border-yellow-100">
                  <strong>Customer Note:</strong> {lead.customer_notes}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            
            {/* Customer Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Customer</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                  <User size={20} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{customerName}</p>
                  {lead.user?.id && (
                    <p className="text-xs text-gray-500">ID: {lead.user.id.substring(0, 8)}...</p>
                  )}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Smartphone size={14} />
                  <a href={`tel:${customerPhone}`} className="hover:text-blue-600">{customerPhone}</a>
                </div>
                {lead.user?.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MessageSquare size={14} />
                    <a href={`mailto:${lead.user.email}`} className="hover:text-blue-600 truncate">{lead.user.email}</a>
                  </div>
                )}
              </div>
            </div>

            {/* Partner Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Assigned Partner</h3>
              {lead.assigned_partner ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold">
                      {lead.assigned_partner.business_name?.substring(0, 1) || 'P'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{lead.assigned_partner.business_name}</p>
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle size={10} /> Active
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <Smartphone size={14} /> {lead.assigned_partner.phone}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 bg-gray-50 rounded border border-dashed border-gray-300">
                  <p className="text-sm text-gray-500">No partner assigned</p>
                  <button className="mt-2 text-blue-600 text-sm font-medium hover:underline">
                    Assign Now
                  </button>
                </div>
              )}
            </div>

            {/* Internal Notes */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Admin Notes</h3>
              <div className="text-sm text-gray-600 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {lead.internal_notes || "No internal notes."}
              </div>
              <button className="mt-3 w-full py-1.5 text-sm border border-gray-300 rounded text-gray-600 hover:bg-gray-50">
                Add Note
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}








