// pages/operations/TicketDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Badge } from '../../components/UI/Badge';
import { Button } from '../../components/UI/Button';
import { Loader } from '../../components/UI/Loader';
import { operationsService } from '../../services/operations.service';
import { type SupportTicket } from '../../types';
import { formatDateTime } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (id) loadTicket(id);
  }, [id]);

  const loadTicket = async (ticketId: string) => {
    try {
      const data = await operationsService.getTicket(ticketId);
      setTicket(data);
    } catch (error) {
      toast.error('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!id || !message.trim()) return;

    setSending(true);
    try {
      await operationsService.addTicketMessage(id, message);
      toast.success('Message sent');
      setMessage('');
      loadTicket(id);
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleClose = async () => {
    if (!id) return;
    const resolution = prompt('Enter resolution details:');
    if (!resolution) return;

    try {
      await operationsService.closeTicket(id, resolution);
      toast.success('Ticket closed successfully');
      navigate('/operations/tickets');
    } catch (error) {
      toast.error('Failed to close ticket');
    }
  };

  if (loading) return <Loader />;
  if (!ticket) return <div>Ticket not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/operations/tickets')} className="btn-outline p-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-dark">{ticket.ticket_number}</h1>
            <p className="text-gray-600">{ticket.subject}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge status={ticket.priority === 'urgent' || ticket.priority === 'high' ? 'danger' : 'warning'}>
            {ticket.priority}
          </Badge>
          <Badge status={ticket.status}>{ticket.status.replace(/_/g, ' ')}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Ticket Details">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <Badge status="info">{ticket.category}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-gray-900 mt-1 whitespace-pre-wrap">{ticket.description}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created By</p>
                <p className="font-semibold">{ticket.user_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created At</p>
                <p className="font-semibold">{formatDateTime(ticket.created_at)}</p>
              </div>
              {ticket.assigned_to && (
                <div>
                  <p className="text-sm text-gray-500">Assigned To</p>
                  <p className="font-semibold">{ticket.assigned_to}</p>
                </div>
              )}
            </div>
          </Card>

          <Card title="Add Message">
            <div className="space-y-4">
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={4}
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button onClick={handleSendMessage} loading={sending}>
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Ticket Info">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Ticket ID</span>
                <span className="font-semibold">{ticket.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Priority</span>
                <Badge status={ticket.priority === 'urgent' || ticket.priority === 'high' ? 'danger' : 'warning'}>
                  {ticket.priority}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <Badge status={ticket.status}>{ticket.status}</Badge>
              </div>
            </div>
          </Card>

          {ticket.status !== 'closed' && (
            <Card title="Actions">
              <div className="space-y-3">
                <Button variant="secondary" className="w-full" onClick={handleClose}>
                  Close Ticket
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}