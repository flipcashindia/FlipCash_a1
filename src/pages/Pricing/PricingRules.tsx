// pages/pricing/PricingRules.tsx
import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Badge } from '../../components/UI/Badge';
import { Loader } from '../../components/UI/Loader';
import { Input } from '../../components/UI/Input';
import { Select } from '../../components/UI/Select';
import { Modal } from '../../components/UI/Modal';
import { Alert } from '../../components/UI/Alert';
import { pricingService } from '../../services/pricing.service';
import { type PricingRule } from '../../types';
import { formatDate, formatCurrency } from '../../lib/utils';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RuleForm {
  age_category: string;
  condition_grade: string;
  base_price_percentage: string;
  deduction_percentage: string;
  effective_from: string;
  is_active: boolean;
}

const EMPTY_FORM: RuleForm = {
  age_category: '0-6',
  condition_grade: 'excellent',
  base_price_percentage: '',
  deduction_percentage: '',
  effective_from: new Date().toISOString().split('T')[0],
  is_active: true,
};

const AGE_OPTIONS = [
  { value: '0-6', label: '0 – 6 months' },
  { value: '6-12', label: '6 – 12 months' },
  { value: '12-24', label: '12 – 24 months' },
  { value: '24+', label: '24+ months' },
];

const CONDITION_OPTIONS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

// ─── Toggle switch (local, no import needed) ──────────────────────────────────

function Switch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        value ? 'bg-secondary' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: string | number;
  colorClass: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
      <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PricingRules() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [filterAge, setFilterAge] = useState('');
  const [filterCond, setFilterCond] = useState('');
  const [filterActive, setFilterActive] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PricingRule | null>(null);
  const [form, setForm] = useState<RuleForm>(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  // Confirm delete
  const [deleteTarget, setDeleteTarget] = useState<PricingRule | null>(null);

  // ─── Load ───────────────────────────────────────────────────────────────────

  const loadRules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await pricingService.getRules({ page_size: 200 });
      setRules(data.results ?? data);
    } catch {
      toast.error('Failed to load pricing rules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRules(); }, [loadRules]);

  // ─── Derived ─────────────────────────────────────────────────────────────────

  const filtered = rules.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.age_category?.toLowerCase().includes(q) ||
      r.condition_grade?.toLowerCase().includes(q);
    const matchAge = !filterAge || r.age_category === filterAge;
    const matchCond = !filterCond || r.condition_grade === filterCond;
    const matchActive =
      !filterActive ||
      (filterActive === 'active' ? r.is_active : !r.is_active);
    return matchSearch && matchAge && matchCond && matchActive;
  });

  const activeCount = rules.filter((r) => r.is_active).length;
  const inactiveCount = rules.length - activeCount;

  // ─── Open modal ──────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (rule: PricingRule) => {
    setEditTarget(rule);
    setForm({
      age_category: rule.age_category,
      condition_grade: rule.condition_grade,
      base_price_percentage: String(rule.base_price_percentage),
      deduction_percentage: String(rule.deduction_percentage),
      effective_from: rule.effective_from?.split('T')[0] ?? '',
      is_active: rule.is_active,
    });
    setFormError('');
    setModalOpen(true);
  };

  // ─── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.base_price_percentage || !form.deduction_percentage) {
      setFormError('Base price % and deduction % are required.');
      return;
    }
    setFormError('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        base_price_percentage: parseFloat(form.base_price_percentage),
        deduction_percentage: parseFloat(form.deduction_percentage),
      };
      if (editTarget) {
        await pricingService.updateRule(editTarget.id, payload);
        toast.success('Pricing rule updated');
      } else {
        await pricingService.createRule(payload);
        toast.success('Pricing rule created');
      }
      setModalOpen(false);
      loadRules();
    } catch (e: any) {
      toast.error(e?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete ──────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await pricingService.deleteRule(deleteTarget.id);
      toast.success('Pricing rule deleted');
      setDeleteTarget(null);
      loadRules();
    } catch {
      toast.error('Failed to delete rule');
    }
  };

  // ─── Condition grade colour ───────────────────────────────────────────────

  const condBadge = (g: string) => {
    const m: Record<string, string> = {
      excellent: 'active',
      good: 'info',
      fair: 'warning',
      poor: 'danger',
    };
    return m[g] ?? 'default';
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark">Pricing Rules</h1>
          <p className="text-sm text-gray-500 mt-1">
            Age × condition matrix that drives price deductions
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Rule
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Rules" value={rules.length} colorClass="text-secondary" />
        <StatCard label="Active" value={activeCount} colorClass="text-green-600" />
        <StatCard label="Inactive" value={inactiveCount} colorClass="text-gray-500" />
        <StatCard label="Age Groups" value={[...new Set(rules.map((r) => r.age_category))].length} colorClass="text-purple-600" />
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <Input
              label="Search"
              placeholder="Search age category or condition…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
          </div>
          <div className="w-48">
            <Select
              label="Age Category"
              value={filterAge}
              onChange={(e) => setFilterAge(e.target.value)}
              options={[{ value: '', label: 'All Ages' }, ...AGE_OPTIONS]}
            />
          </div>
          <div className="w-48">
            <Select
              label="Condition"
              value={filterCond}
              onChange={(e) => setFilterCond(e.target.value)}
              options={[{ value: '', label: 'All Conditions' }, ...CONDITION_OPTIONS]}
            />
          </div>
          <div className="w-40">
            <Select
              label="Status"
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              options={[
                { value: '', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </div>
          {(search || filterAge || filterCond || filterActive) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setSearch(''); setFilterAge(''); setFilterCond(''); setFilterActive(''); }}
            >
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Age Category', 'Condition Grade', 'Base Price %', 'Deduction %', 'Effective From', 'Status', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-14 text-sm text-gray-400">
                    No pricing rules match your filters
                  </td>
                </tr>
              ) : (
                filtered.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">
                      {rule.age_category} months
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge status={condBadge(rule.condition_grade)}>
                        {rule.condition_grade.charAt(0).toUpperCase() + rule.condition_grade.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-bold text-green-600">
                        {rule.base_price_percentage}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-bold text-red-500">
                        -{rule.deduction_percentage}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">
                      {formatDate(rule.effective_from)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge status={rule.is_active ? 'active' : 'inactive'}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(rule)}
                          className="p-1.5 rounded-lg text-secondary hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(rule)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-50 text-xs text-gray-400">
            Showing {filtered.length} of {rules.length} rules
          </div>
        )}
      </Card>

      {/* ── Create / Edit Modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Pricing Rule' : 'Add Pricing Rule'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={handleSave}>
              {editTarget ? 'Save Changes' : 'Create Rule'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && <Alert type="error">{formError}</Alert>}

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Age Category"
              value={form.age_category}
              onChange={(e) => setForm({ ...form, age_category: e.target.value })}
              options={AGE_OPTIONS}
            />
            <Select
              label="Condition Grade"
              value={form.condition_grade}
              onChange={(e) => setForm({ ...form, condition_grade: e.target.value })}
              options={CONDITION_OPTIONS}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Base Price %"
              type="number"
              placeholder="e.g. 80"
              value={form.base_price_percentage}
              onChange={(e) => setForm({ ...form, base_price_percentage: e.target.value })}
              helpText="% of MRP used as base"
            />
            <Input
              label="Deduction %"
              type="number"
              placeholder="e.g. 15"
              value={form.deduction_percentage}
              onChange={(e) => setForm({ ...form, deduction_percentage: e.target.value })}
              helpText="% deducted from base"
            />
          </div>

          <Input
            label="Effective From"
            type="date"
            value={form.effective_from}
            onChange={(e) => setForm({ ...form, effective_from: e.target.value })}
          />

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-700">Active</p>
              <p className="text-xs text-gray-400">Inactive rules are excluded from pricing calculations</p>
            </div>
            <Switch value={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} />
          </div>

          {/* Live preview */}
          {form.base_price_percentage && form.deduction_percentage && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
                Preview (on ₹10,000 device)
              </p>
              <div className="grid grid-cols-3 gap-3 text-center">
                {(() => {
                  const base = 10000 * (parseFloat(form.base_price_percentage) / 100);
                  const deduction = base * (parseFloat(form.deduction_percentage) / 100);
                  const final = base - deduction;
                  return [
                    ['Base', formatCurrency(base), 'text-gray-700'],
                    ['Deduction', `-${formatCurrency(deduction)}`, 'text-red-600'],
                    ['Final', formatCurrency(final), 'text-green-700 font-bold'],
                  ].map(([l, v, cls]) => (
                    <div key={l} className="bg-white rounded-lg p-2 border border-blue-100">
                      <p className="text-xs text-gray-400">{l}</p>
                      <p className={`text-sm font-semibold ${cls}`}>{v}</p>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ── Delete Confirm Modal ────────────────────────────────────────────── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Pricing Rule"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        <Alert type="error">
          Are you sure you want to delete the rule for{' '}
          <strong>{deleteTarget?.age_category} months</strong> /{' '}
          <strong>{deleteTarget?.condition_grade}</strong>? This cannot be undone.
        </Alert>
      </Modal>
    </div>
  );
}