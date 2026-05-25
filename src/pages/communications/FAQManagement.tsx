// pages/communications/FAQManagement.tsx
import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { Modal } from '../../components/UI/Modal';
import { Badge } from '../../components/UI/Badge';
import { Loader } from '../../components/UI/Loader';
import { commsService } from '../../services/comms.service';
import { type FAQ } from '../../types';
import toast from 'react-hot-toast';

export default function FAQManagement() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState({
    category: 'general',
    question: '',
    answer: '',
    sort_order: 0,
    is_active: true,
  });

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      const data = await commsService.getFAQs({ page_size: 100 });
      setFaqs(data.results);
    } catch (error) {
      toast.error('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingFaq) {
        await commsService.updateFAQ(editingFaq.id, formData);
        toast.success('FAQ updated successfully');
      } else {
        await commsService.createFAQ(formData);
        toast.success('FAQ created successfully');
      }
      setShowModal(false);
      resetForm();
      loadFAQs();
    } catch (error) {
      toast.error('Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setFormData({
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
      sort_order: faq.sort_order,
      is_active: faq.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return;
    try {
      await commsService.deleteFAQ(id);
      toast.success('FAQ deleted');
      loadFAQs();
    } catch (error) {
      toast.error('Failed to delete FAQ');
    }
  };

  const resetForm = () => {
    setEditingFaq(null);
    setFormData({
      category: 'general',
      question: '',
      answer: '',
      sort_order: 0,
      is_active: true,
    });
  };

  if (loading && faqs.length === 0) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-dark">FAQ Management</h1>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add FAQ
        </Button>
      </div>

      <Card>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.id} className="border-b pb-4 last:border-b-0">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge status="info">{faq.category}</Badge>
                    <Badge status={faq.is_active ? 'active' : 'inactive'}>
                      {faq.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900">{faq.question}</h3>
                  <p className="text-gray-600 mt-1">{faq.answer}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(faq)}
                    className="text-secondary hover:text-secondary-dark"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(faq.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingFaq ? 'Edit FAQ' : 'Add FAQ'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="general">General</option>
              <option value="account">Account</option>
              <option value="payment">Payment</option>
              <option value="technical">Technical</option>
            </select>
          </div>

          <Input
            label="Question"
            placeholder="Enter question"
            value={formData.question}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Answer</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={4}
              placeholder="Enter answer"
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              required
            />
          </div>

          <Input
            label="Sort Order"
            type="number"
            value={formData.sort_order.toString()}
            onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
          </div>

          <div className="flex gap-3">
            <Button type="submit" loading={loading}>
              {editingFaq ? 'Update' : 'Create'}
            </Button>
            <Button type="button" variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}