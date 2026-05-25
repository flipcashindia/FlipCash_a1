// pages/leads/AssignPartner.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { Badge } from '../../components/UI/Badge';
import { Loader } from '../../components/UI/Loader';
import { partnersService } from '../../services/partners.service';
import { leadsService } from '../../services/leads.service';
import { type Partner } from '../../types';
import { formatCurrency } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function AssignPartner() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      const data = await partnersService.getPartners({
        status: 'approved',
        is_available: true,
        page_size: 100,
      });
      setPartners(data.results);
    } catch (error) {
      toast.error('Failed to load partners');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (partnerId: string) => {
    if (!id || !confirm('Assign this partner to the lead?')) return;

    setAssigning(true);
    try {
      await leadsService.assignPartner(id, partnerId);
      toast.success('Partner assigned successfully');
      navigate(`/leads/${id}`);
    } catch (error) {
      toast.error('Failed to assign partner');
    } finally {
      setAssigning(false);
    }
  };

  const filteredPartners = partners.filter(partner =>
    partner.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    partner.phone.includes(searchQuery)
  );

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(`/leads/${id}`)} className="btn-outline p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-bold text-dark">Assign Partner</h1>
      </div>

      <Card>
        <div className="mb-6">
          <Input
            placeholder="Search partners by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={Search}
          />
        </div>

        <div className="space-y-4">
          {filteredPartners.map((partner) => (
            <div
              key={partner.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{partner.business_name}</h3>
                <p className="text-sm text-gray-600">{partner.phone}</p>
                <div className="flex gap-2 mt-2">
                  <Badge status="info">{partner.city}</Badge>
                  <Badge status="active">
                    {formatCurrency(partner.min_price_range)} - {formatCurrency(partner.max_price_range)}
                  </Badge>
                  <span className="text-sm text-gray-600">⭐ {partner.average_rating}</span>
                </div>
              </div>
              <Button
                onClick={() => handleAssign(partner.id)}
                loading={assigning}
              >
                Assign
              </Button>
            </div>
          ))}

          {filteredPartners.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No partners found
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}