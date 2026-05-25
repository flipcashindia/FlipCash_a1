// pages/pricing/PriceSimulator.tsx
import { useState, useRef } from 'react';
import { Calculator, RotateCcw, ChevronDown, ChevronUp, History, Trash2 } from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Badge } from '../../components/UI/Badge';
import { Input } from '../../components/UI/Input';
import { Select } from '../../components/UI/Select';
import { Alert } from '../../components/UI/Alert';
import { pricingService } from '../../services/pricing.service';
import { formatCurrency, formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SimulationResult {
  final_price: number;
  base_price: number;
  deductions?: Array<{ reason: string; value_pct?: number; amount?: number }>;
  fees?: { total_fee: number; total_gst: number; net: number };
  tier?: string;
  condition_grade?: string;
  age_category?: string;
}

interface HistoryEntry {
  id: string;
  params: SimulationForm;
  result: SimulationResult;
  timestamp: Date;
}

interface SimulationForm {
  base_price: string;
  age_category: string;
  condition_grade: string;
  functional_issues: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

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

const FUNCTIONAL_ISSUES = [
  { key: 'screen_cracked', label: 'Cracked Screen' },
  { key: 'battery_issue', label: 'Battery Issue' },
  { key: 'speaker_issue', label: 'Speaker Problem' },
  { key: 'camera_issue', label: 'Camera Damaged' },
  { key: 'charging_issue', label: 'Charging Port Issue' },
  { key: 'touch_issue', label: 'Touch Unresponsive' },
  { key: 'face_id_issue', label: 'Face ID / Fingerprint Broken' },
  { key: 'water_damaged', label: 'Water Damage' },
];

const QUICK_PRICES = [5000, 10000, 20000, 40000, 80000];

const EMPTY_FORM: SimulationForm = {
  base_price: '',
  age_category: '0-6',
  condition_grade: 'excellent',
  functional_issues: [],
};

// ─── Subcomponents ────────────────────────────────────────────────────────────

function BreakdownRow({
  label,
  value,
  highlight,
  separator,
}: {
  label: string;
  value: string;
  highlight?: 'red' | 'green';
  separator?: boolean;
}) {
  return (
    <div className={`flex justify-between items-center text-sm ${separator ? 'pt-3 border-t border-gray-100 mt-1' : ''}`}>
      <span className="text-gray-600">{label}</span>
      <span
        className={
          highlight === 'red'
            ? 'font-semibold text-red-500'
            : highlight === 'green'
            ? 'font-bold text-green-700'
            : 'font-medium text-gray-800'
        }
      >
        {value}
      </span>
    </div>
  );
}

function ConditionPill({ grade }: { grade: string }) {
  const map: Record<string, string> = {
    excellent: 'active',
    good: 'info',
    fair: 'warning',
    poor: 'danger',
  };
  return <Badge status={map[grade] ?? 'default'}>{grade}</Badge>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PriceSimulator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState<SimulationForm>(EMPTY_FORM);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // ─── Toggle functional issue ──────────────────────────────────────────────

  const toggleIssue = (key: string) => {
    setForm((f) => ({
      ...f,
      functional_issues: f.functional_issues.includes(key)
        ? f.functional_issues.filter((k) => k !== key)
        : [...f.functional_issues, key],
    }));
  };

  // ─── Reset ───────────────────────────────────────────────────────────────

  const handleReset = () => {
    setForm(EMPTY_FORM);
    setResult(null);
    setError('');
  };

  // ─── Simulate ────────────────────────────────────────────────────────────

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.base_price || isNaN(Number(form.base_price))) {
      setError('Please enter a valid base price.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const data = await pricingService.simulatePrice({
        device_model: 'test-model',
        base_price: parseFloat(form.base_price),
        age_category: form.age_category,
        device_condition: form.condition_grade,
        functional_issues: form.functional_issues,
      });
      setResult(data);
      setHistory((prev) => [
        {
          id: Date.now().toString(),
          params: { ...form },
          result: data,
          timestamp: new Date(),
        },
        ...prev.slice(0, 9), // keep last 10
      ]);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {
      toast.error('Simulation failed. Check API connection.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Load history entry ───────────────────────────────────────────────────

  const loadHistoryEntry = (entry: HistoryEntry) => {
    setForm(entry.params);
    setResult(entry.result);
    setShowHistory(false);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  // ─── Derive effective price ───────────────────────────────────────────────

  const priceDrop = result
    ? result.base_price - result.final_price
    : 0;
  const pricePct = result && result.base_price
    ? ((priceDrop / result.base_price) * 100).toFixed(1)
    : '0';

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark">Price Simulator</h1>
          <p className="text-sm text-gray-500 mt-1">
            Simulate device pricing based on condition, age and functional issues
          </p>
        </div>
        <div className="flex gap-2">
          {history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory((v) => !v)}
            >
              <History className="w-4 h-4 mr-1.5" />
              History ({history.length})
              {showHistory ? (
                <ChevronUp className="w-3.5 h-3.5 ml-1" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 ml-1" />
              )}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Reset
          </Button>
        </div>
      </div>

      {/* History panel */}
      {showHistory && history.length > 0 && (
        <Card title="Recent Simulations">
          <div className="space-y-2">
            {history.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-secondary transition-colors cursor-pointer"
                onClick={() => loadHistoryEntry(h)}
              >
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-medium text-gray-800">
                    {formatCurrency(Number(h.params.base_price))}
                  </span>
                  <ConditionPill grade={h.params.condition_grade} />
                  <span className="text-gray-500">{h.params.age_category}m</span>
                  {h.params.functional_issues.length > 0 && (
                    <span className="text-xs text-red-500">
                      {h.params.functional_issues.length} issue(s)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-green-700 text-sm">
                    → {formatCurrency(h.result.final_price)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {h.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setHistory((prev) => prev.filter((x) => x.id !== h.id));
                    }}
                    className="text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Input panel ───────────────────────────────────────────────── */}
        <Card title="Device Parameters">
          <form onSubmit={handleSimulate} className="space-y-5">
            {error && <Alert type="error">{error}</Alert>}

            {/* Price input */}
            <div>
              <Input
                label="Device Base Price (₹)"
                type="number"
                placeholder="Enter device market price"
                value={form.base_price}
                onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                required
              />
              {/* Quick prices */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {QUICK_PRICES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm({ ...form, base_price: String(p) })}
                    className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                      form.base_price === String(p)
                        ? 'border-secondary bg-secondary text-white'
                        : 'border-gray-200 text-gray-600 hover:border-secondary hover:text-secondary'
                    }`}
                  >
                    {formatCurrency(p)}
                  </button>
                ))}
              </div>
            </div>

            {/* Age & Condition */}
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Device Age"
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

            {/* Condition visual hint */}
            <div className="grid grid-cols-4 gap-2">
              {CONDITION_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setForm({ ...form, condition_grade: c.value })}
                  className={`p-2 rounded-lg border text-xs font-semibold transition-all ${
                    form.condition_grade === c.value
                      ? 'border-secondary bg-secondary text-white shadow-sm'
                      : 'border-gray-200 text-gray-500 hover:border-secondary'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Functional Issues */}
            <div>
              <p className="block text-sm font-medium text-gray-700 mb-2">
                Functional Issues
              </p>
              <div className="grid grid-cols-2 gap-2">
                {FUNCTIONAL_ISSUES.map((issue) => {
                  const checked = form.functional_issues.includes(issue.key);
                  return (
                    <label
                      key={issue.key}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-sm transition-all ${
                        checked
                          ? 'border-red-300 bg-red-50 text-red-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleIssue(issue.key)}
                        className="rounded border-gray-300 text-red-500 focus:ring-red-400"
                      />
                      {issue.label}
                    </label>
                  );
                })}
              </div>
              {form.functional_issues.length > 0 && (
                <p className="text-xs text-red-500 mt-1.5">
                  {form.functional_issues.length} issue(s) selected — additional deductions will apply
                </p>
              )}
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              <Calculator className="w-5 h-5 mr-2" />
              Calculate Price
            </Button>
          </form>
        </Card>

        {/* ── Result panel ──────────────────────────────────────────────── */}
        <div ref={resultRef} className="space-y-4">
          {result ? (
            <>
              {/* Final price hero */}
              <Card>
                <div className="text-center py-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                    Estimated Offer Price
                  </p>
                  <p className="text-5xl font-bold text-green-600 mb-1">
                    {formatCurrency(result.final_price)}
                  </p>
                  <p className="text-sm text-gray-500">
                    You save{' '}
                    <span className="font-semibold text-red-500">
                      {formatCurrency(priceDrop)} ({pricePct}%)
                    </span>{' '}
                    from base price
                  </p>

                  {/* Parameters used */}
                  <div className="flex flex-wrap justify-center gap-2 mt-3">
                    <ConditionPill grade={form.condition_grade} />
                    <Badge status="info">{form.age_category} months</Badge>
                    {form.functional_issues.length > 0 && (
                      <Badge status="danger">
                        {form.functional_issues.length} issue(s)
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>

              {/* Breakdown */}
              <Card title="Price Breakdown">
                <div className="space-y-2">
                  <BreakdownRow
                    label="Device Base Price"
                    value={formatCurrency(result.base_price ?? Number(form.base_price))}
                  />

                  {result.deductions && result.deductions.length > 0 && (
                    <>
                      <div className="pt-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                          Deductions
                        </p>
                        {result.deductions.map((d, i) => (
                          <BreakdownRow
                            key={i}
                            label={d.reason}
                            value={
                              d.amount
                                ? `−${formatCurrency(d.amount)}`
                                : d.value_pct
                                ? `−${d.value_pct}%`
                                : '—'
                            }
                            highlight="red"
                          />
                        ))}
                      </div>
                    </>
                  )}

                  <BreakdownRow
                    label="Adjusted Price"
                    value={formatCurrency(result.final_price)}
                    highlight="green"
                    separator
                  />

                  {result.fees && (
                    <>
                      <div className="pt-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                          Platform Fees
                        </p>
                        <BreakdownRow
                          label="Total Fees"
                          value={`−${formatCurrency(result.fees.total_fee)}`}
                          highlight="red"
                        />
                        <BreakdownRow
                          label="GST on Fees"
                          value={`−${formatCurrency(result.fees.total_gst)}`}
                          highlight="red"
                        />
                        <BreakdownRow
                          label="Net Payout"
                          value={formatCurrency(result.fees.net ?? result.final_price - result.fees.total_fee - result.fees.total_gst)}
                          highlight="green"
                          separator
                        />
                      </div>
                    </>
                  )}
                </div>
              </Card>

              {/* Comparison for other conditions */}
              <Card title="Compare Across Conditions">
                <div className="grid grid-cols-2 gap-2">
                  {CONDITION_OPTIONS.map((c) => {
                    const isCurrent = c.value === form.condition_grade;
                    // Rough multipliers for visual comparison
                    const mults: Record<string, number> = {
                      excellent: 1,
                      good: 0.88,
                      fair: 0.72,
                      poor: 0.55,
                    };
                    const estimate = result.final_price * (mults[c.value] / mults[form.condition_grade]);
                    return (
                      <div
                        key={c.value}
                        className={`p-3 rounded-xl border text-sm ${
                          isCurrent
                            ? 'border-secondary bg-blue-50'
                            : 'border-gray-100 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <ConditionPill grade={c.value} />
                          {isCurrent && (
                            <span className="text-xs text-secondary font-semibold">Current</span>
                          )}
                        </div>
                        <p className={`text-base font-bold ${isCurrent ? 'text-green-700' : 'text-gray-600'}`}>
                          {formatCurrency(Math.round(estimate))}
                        </p>
                        <p className="text-xs text-gray-400">estimate</p>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </>
          ) : (
            <Card>
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Calculator className="w-12 h-12 text-gray-200 mb-4" />
                <p className="text-gray-400 font-medium">No result yet</p>
                <p className="text-gray-300 text-sm mt-1">
                  Fill in the parameters and click Calculate
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}