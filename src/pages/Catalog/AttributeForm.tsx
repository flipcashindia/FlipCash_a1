import { useEffect, useState, type ChangeEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, X, HelpCircle } from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input, Select, Textarea } from '../../components/UI/Form';
import { Loader } from '../../components/UI/Loader';
import { catalogService } from '../../services/catalog.service';
import { type DeviceAttribute, type DeviceCategory } from '../../types';
import toast from 'react-hot-toast';
import { extractErrorMessage } from '../../lib/catalog.utils';
import { formatCurrency } from '../../lib/utils';
import { DEFAULTS, ATTRIBUTE_TYPES, ATTRIBUTE_BUCKETS } from '../../config/catalog.constants';

export default function AttributeForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [attribute, setAttribute] = useState<Partial<DeviceAttribute>>({
    name: '',
    attribute_type: 'cosmetic',
    device_category: '',
    question_text: '',
    is_required: DEFAULTS.IS_REQUIRED,
    is_boolean: DEFAULTS.IS_BOOLEAN,
    options: [],
    price_impact: {},
    bucket: 'none',
    display_order: DEFAULTS.DISPLAY_ORDER,
    help_text: '',
    placeholder: '',
    is_active: DEFAULTS.IS_ACTIVE,
  });
  
  const [categories, setCategories] = useState<DeviceCategory[]>([]);
  const [newOption, setNewOption] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (id) {
      loadAttribute();
    }
  }, [id]);

  const loadCategories = async () => {
    try {
      const data = await catalogService.getCategories({ page_size: 999, is_active: true });
      setCategories(data.results);
    } catch (error) {
      toast.error('Failed to load categories');
    }
  };

  const loadAttribute = async () => {
    setLoading(true);
    try {
      const data = await catalogService.getAttribute(id!);
      setAttribute({
        ...data,
        device_category: data.device_category || '',
      });
    } catch (error) {
      toast.error(extractErrorMessage(error));
      navigate('/catalog/attributes');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setAttribute(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setAttribute(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setAttribute(prev => ({ ...prev, [name]: value }));
    }
  };

  const addOption = () => {
    if (!newOption.trim()) return;
    
    const trimmed = newOption.trim();
    if (attribute.options?.includes(trimmed)) {
      toast.error('Option already exists');
      return;
    }
    
    setAttribute(prev => ({
      ...prev,
      options: [...(prev.options || []), trimmed],
      price_impact: {
        ...prev.price_impact,
        [trimmed]: { type: 'percentage', value: 0 }
      }
    }));
    setNewOption('');
  };

  const removeOption = (option: string) => {
    setAttribute(prev => {
      const newOptions = prev.options?.filter(opt => opt !== option) || [];
      const newPriceImpact = { ...prev.price_impact };
      delete newPriceImpact[option];
      
      return {
        ...prev,
        options: newOptions,
        price_impact: newPriceImpact
      };
    });
  };

  const updatePriceImpact = (option: string, type: 'percentage' | 'fixed', value: number) => {
    setAttribute(prev => ({
      ...prev,
      price_impact: {
        ...prev.price_impact,
        [option]: { type, value }
      }
    }));
  };

  const validateForm = (): boolean => {
    if (!attribute.name) {
      toast.error('Name is required');
      return false;
    }
    
    if (!attribute.device_category) {
      toast.error('Category is required');
      return false;
    }
    
    if (!attribute.question_text) {
      toast.error('Question text is required');
      return false;
    }
    
    if (!attribute.is_boolean && (!attribute.options || attribute.options.length === 0)) {
      toast.error('Non-boolean attributes must have at least one option');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSaving(true);

    const payload = {
      ...attribute,
      options: attribute.is_boolean ? [] : attribute.options,
      price_impact: attribute.is_boolean ? {} : attribute.price_impact,
    };

    try {
      if (id) {
        await catalogService.updateAttribute(id, payload);
        toast.success('Attribute updated successfully');
      } else {
        await catalogService.createAttribute(payload);
        toast.success('Attribute created successfully');
      }
      navigate('/catalog/attributes');
    } catch (error: any) {
      toast.error(extractErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-dark">
          {id ? 'Edit Attribute' : 'Create New Attribute'}
        </h1>
        <Link to="/catalog/attributes">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to List
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">Basic Information</h2>
                
                <Input 
                  label="Attribute Name" 
                  name="name" 
                  value={attribute.name || ''} 
                  onChange={handleChange} 
                  required 
                  placeholder="e.g., Screen Condition, Battery Health"
                />

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Category"
                    name="device_category"
                    value={attribute.device_category || ''}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </Select>

                  <Select
                    label="Attribute Type"
                    name="attribute_type"
                    value={attribute.attribute_type || ''}
                    onChange={handleChange}
                    required
                  >
                    <option value={ATTRIBUTE_TYPES.COSMETIC}>Cosmetic</option>
                    <option value={ATTRIBUTE_TYPES.FUNCTIONAL}>Functional</option>
                    <option value={ATTRIBUTE_TYPES.ACCESSORY}>Accessory</option>
                    <option value={ATTRIBUTE_TYPES.SPECIFICATION}>Specification</option>
                    <option value={ATTRIBUTE_TYPES.WARRANTY}>Warranty</option>
                    <option value={ATTRIBUTE_TYPES.LEGAL}>Legal/Age</option>
                  </Select>
                </div>

                <Textarea 
                  label="Question Text" 
                  name="question_text" 
                  value={attribute.question_text || ''} 
                  onChange={handleChange} 
                  required
                  rows={2}
                  placeholder="e.g., What is the screen condition?"
                />

                <div className="grid grid-cols-2 gap-4">
                  <Textarea 
                    label="Help Text" 
                    name="help_text" 
                    value={attribute.help_text || ''} 
                    onChange={handleChange} 
                    rows={2}
                    placeholder="Additional information for users"
                  />
                  
                  <Input 
                    label="Placeholder" 
                    name="placeholder" 
                    value={attribute.placeholder || ''} 
                    onChange={handleChange} 
                    placeholder="Select an option..."
                  />
                </div>

                <Input 
                  label="Display Order" 
                  name="display_order" 
                  type="number" 
                  value={attribute.display_order || 0} 
                  onChange={handleChange} 
                  min={0}
                  helpText="Lower numbers appear first in forms"
                />
              </div>
            </Card>

            {!attribute.is_boolean && (
              <Card>
                <div className="p-6 space-y-4">
                  <h2 className="text-xl font-semibold border-b pb-2">Options & Price Impact</h2>
                  
                  <div className="flex gap-2">
                    <Input 
                      value={newOption} 
                      onChange={(e) => setNewOption(e.target.value)} 
                      placeholder="Add an option (e.g., Excellent, Good, Fair)"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addOption();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={addOption}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {attribute.options && attribute.options.length > 0 && (
                    <div className="space-y-3">
                      {attribute.options.map((option) => (
                        <div key={option} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium text-gray-900">{option}</span>
                            <button
                              type="button"
                              onClick={() => removeOption(option)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3">
                            <Select
                              label="Impact Type"
                              value={attribute.price_impact?.[option]?.type || 'percentage'}
                              onChange={(e) => updatePriceImpact(
                                option, 
                                e.target.value as 'percentage' | 'fixed',
                                attribute.price_impact?.[option]?.value || 0
                              )}
                            >
                              <option value="percentage">Percentage (%)</option>
                              <option value="fixed">Fixed Amount (₹)</option>
                            </Select>
                            
                            <Input 
                              label="Impact Value"
                              type="number"
                              step="0.01"
                              value={attribute.price_impact?.[option]?.value || 0}
                              onChange={(e) => updatePriceImpact(
                                option,
                                attribute.price_impact?.[option]?.type || 'percentage',
                                parseFloat(e.target.value) || 0
                              )}
                              placeholder="0"
                            />
                            
                            <div className="flex items-end">
                              <div className="text-sm text-gray-600 bg-white px-3 py-2 rounded border h-10 flex items-center">
                                {attribute.price_impact?.[option]?.type === 'percentage' 
                                  ? `${attribute.price_impact?.[option]?.value || 0}%` 
                                  : formatCurrency(attribute.price_impact?.[option]?.value || 0)
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">Configuration</h2>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      name="is_boolean" 
                      checked={attribute.is_boolean || false} 
                      onChange={handleChange} 
                      className="rounded" 
                    />
                    <span className="text-sm font-medium">Yes/No Question</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      name="is_required" 
                      checked={attribute.is_required || false} 
                      onChange={handleChange} 
                      className="rounded" 
                    />
                    <span className="text-sm font-medium">Required Field</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      name="is_active" 
                      checked={attribute.is_active || false} 
                      onChange={handleChange} 
                      className="rounded" 
                    />
                    <span className="text-sm font-medium">Active</span>
                  </label>
                </div>

                <Select
                  label="Bucket"
                  name="bucket"
                  value={attribute.bucket || 'none'}
                  onChange={handleChange}
                >
                  <option value={ATTRIBUTE_BUCKETS.NONE}>No Bucket (Apply ALL)</option>
                  <option value={ATTRIBUTE_BUCKETS.SCREEN}>Screen Bucket (Apply MAX)</option>
                  <option value={ATTRIBUTE_BUCKETS.BODY}>Body Bucket (Apply MAX)</option>
                </Select>
              </div>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <div className="p-6">
                <div className="flex gap-2 mb-2">
                  <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <h3 className="font-semibold text-blue-900">How Price Impact Works</h3>
                </div>
                <ul className="text-sm text-blue-800 space-y-1 ml-7">
                  <li>• <strong>Percentage:</strong> Reduces price by % (e.g., -10%)</li>
                  <li>• <strong>Fixed:</strong> Reduces by amount (e.g., -₹500)</li>
                  <li>• <strong>Buckets:</strong> Group related attributes</li>
                  <li>• <strong>Screen/Body:</strong> Only MAX impact applies</li>
                  <li>• <strong>No Bucket:</strong> ALL impacts apply</li>
                </ul>
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <Link to="/catalog/attributes">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? 'Saving...' : (id ? 'Update Attribute' : 'Create Attribute')}
          </Button>
        </div>
      </form>
    </div>
  );
}