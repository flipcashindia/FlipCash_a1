import { useState } from 'react';
import { Upload, Download, CheckCircle, XCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { catalogService } from '../../services/catalog.service';
import toast from 'react-hot-toast';
import { extractErrorMessage, formatFileSize, downloadBlob } from '../../lib/catalog.utils';

interface BulkImportResult {
  created: number;
  updated: number;
  errors: string[];
}

export default function BulkImport() {
  const [file, setFile] = useState<File | null>(null);
  const [modelType, setModelType] = useState<'categories' | 'brands' | 'models'>('categories');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ];
      
      if (!validTypes.includes(selectedFile.type)) {
        toast.error('Please upload an Excel (.xlsx, .xls) or CSV file');
        return;
      }
      
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await catalogService.downloadTemplate(modelType);
      const filename = `${modelType}_import_template.xlsx`;
      downloadBlob(blob, filename);
      toast.success('Template downloaded');
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_type', modelType);

    try {
      const data = await catalogService.bulkImport(formData);
      setResult(data);
      
      if (data.errors.length === 0) {
        toast.success(`Successfully imported! ${data.created} created, ${data.updated} updated`);
      } else {
        toast.error(`Import completed with ${data.errors.length} error(s)`);
      }
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-dark">Bulk Import</h1>
        <p className="text-gray-600 mt-1">Import categories, brands, or models from Excel/CSV files</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-semibold border-b pb-2">Upload File</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Import Type</label>
                <select 
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value as any)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                >
                  <option value="categories">Categories</option>
                  <option value="brands">Brands</option>
                  <option value="models">Models</option>
                </select>
              </div>

              {!file ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <input 
                    type="file" 
                    id="bulk-upload" 
                    className="hidden" 
                    onChange={handleFileChange}
                    accept=".xlsx,.xls,.csv"
                  />
                  <label htmlFor="bulk-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <span className="text-sm text-gray-600 block mb-1">
                      Click to upload or drag and drop
                    </span>
                    <span className="text-xs text-gray-500">
                      Excel (.xlsx, .xls) or CSV files up to 10MB
                    </span>
                  </label>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-8 h-8 text-green-600" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{file.name}</div>
                        <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                      </div>
                    </div>
                    <button
                      onClick={clearFile}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  onClick={handleUpload} 
                  disabled={!file || uploading}
                  className="flex-1"
                >
                  {uploading ? 'Uploading...' : 'Upload & Import'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleDownloadTemplate}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </div>
          </Card>

          {result && (
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold border-b pb-2 mb-4">Import Results</h2>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-900">Created</span>
                    </div>
                    <div className="text-3xl font-bold text-green-600">{result.created}</div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Updated</span>
                    </div>
                    <div className="text-3xl font-bold text-blue-600">{result.updated}</div>
                  </div>
                </div>

                {result.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="text-sm font-medium text-red-900">
                        {result.errors.length} Error(s) Found
                      </span>
                    </div>
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {result.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-800 bg-white rounded px-3 py-2">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold border-b pb-2 mb-4">Instructions</h2>
              
              <ol className="space-y-3 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs">
                    1
                  </span>
                  <span>Select the type of data you want to import (Categories, Brands, or Models)</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs">
                    2
                  </span>
                  <span>Download the corresponding template file</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs">
                    3
                  </span>
                  <span>Fill in the template with your data (follow the column headers exactly)</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs">
                    4
                  </span>
                  <span>Upload the completed file and click "Upload & Import"</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs">
                    5
                  </span>
                  <span>Review the import results and fix any errors if needed</span>
                </li>
              </ol>
            </div>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <div className="p-6">
              <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Important Notes
              </h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• File size must be under 10MB</li>
                <li>• Accepted formats: .xlsx, .xls, .csv</li>
                <li>• Column headers must match template exactly</li>
                <li>• Existing records will be updated if found</li>
                <li>• Invalid rows will be skipped with errors listed</li>
                <li>• Images must be uploaded separately after import</li>
              </ul>
            </div>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <div className="p-6">
              <h3 className="font-semibold text-blue-900 mb-2">💡 Tips for Success</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Start with a small batch to test</li>
                <li>• Use the template - don't create your own</li>
                <li>• Check for duplicate names/slugs</li>
                <li>• Ensure category/brand IDs exist for models</li>
                <li>• Review errors and fix data before re-importing</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}