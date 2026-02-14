// pages/pricing/PriceSimulator.tsx
import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { pricingService } from '../../services/pricing.service';
import { formatCurrency } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function PriceSimulator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    base_price: '',
    age_category: '0-6',
    condition_grade: 'excellent',
    functional_issues: [] as string[],
  });

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await pricingService.simulatePrice({
        device_model: 'test-model',
        base_price: parseFloat(formData.base_price),
        age_category: formData.age_category,
        device_condition: formData.condition_grade,
        functional_issues: formData.functional_issues,
      });
      setResult(data);
    } catch (error) {
      toast.error('Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-dark">Price Simulator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Input Parameters">
          <form onSubmit={handleSimulate} className="space-y-4">
            <Input
              label="Base Price"
              type="number"
              placeholder="Enter base price"
              value={formData.base_price}
              onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Age Category</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.age_category}
                onChange={(e) => setFormData({ ...formData, age_category: e.target.value })}
              >
                <option value="0-6">0-6 months</option>
                <option value="6-12">6-12 months</option>
                <option value="12-24">12-24 months</option>
                <option value="24+">24+ months</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Condition Grade</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.condition_grade}
                onChange={(e) => setFormData({ ...formData, condition_grade: e.target.value })}
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>

            <Button type="submit" loading={loading} className="w-full">
              <Calculator className="w-4 h-4 mr-2" />
              Calculate Price
            </Button>
          </form>
        </Card>

        <Card title="Simulation Result">
          {result ? (
            <div className="space-y-4">
              <div className="bg-primary bg-opacity-10 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Estimated Price</p>
                <p className="text-3xl font-bold text-primary">{formatCurrency(result.final_price)}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base Price</span>
                  <span className="font-semibold">{formatCurrency(formData.base_price)}</span>
                </div>
                {result.deductions && result.deductions.map((deduction: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{deduction.reason}</span>
                    <span className="font-semibold text-red-600">-{deduction.value_pct}%</span>
                  </div>
                ))}
              </div>

              {result.fees && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Fees Breakdown</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Fees</span>
                      <span className="font-semibold">{formatCurrency(result.fees.total_fee)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">GST</span>
                      <span className="font-semibold">{formatCurrency(result.fees.total_gst)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Enter parameters and click Calculate to see results
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}