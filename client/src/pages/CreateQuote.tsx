import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api';
import type { CreateQuoteRequest, Quote } from '@/types';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, User, Mail, MapPin, Zap, DollarSign, Calculator, CheckCircle, Eye } from 'lucide-react';

export const CreateQuote: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [createdQuote, setCreatedQuote] = useState<Quote | null>(null);
  const [showQuoteDetails, setShowQuoteDetails] = useState(false);
  
  const [formData, setFormData] = useState<CreateQuoteRequest>({
    systemSizeKw: 0,
    monthlyConsumptionKwh: 0,
    currency: 'USD'
  });

  // Pre-fill user data when component mounts
  useEffect(() => {
    if (user) {
      // User data is already available from useAuth
      // We don't need to pre-fill form fields since they're not part of CreateQuoteRequest
      // The server will use the authenticated user's data
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'currency') {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      // For number inputs, handle empty values properly
      if (value === '' || value === null || value === undefined) {
        setFormData(prev => ({
          ...prev,
          [name]: name === 'downPayment' ? undefined : 0
        }));
      } else {
        const numericValue = parseFloat(value);
        if (!isNaN(numericValue)) {
          setFormData(prev => ({
            ...prev,
            [name]: numericValue
          }));
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    
    // Validation
    if (!formData.systemSizeKw || formData.systemSizeKw <= 0) {
      toast.error('System size must be greater than 0');
      return;
    }
    
    if (!formData.monthlyConsumptionKwh || formData.monthlyConsumptionKwh <= 0) {
      toast.error('Monthly consumption must be greater than 0');
      return;
    }
    
    // Down payment is optional, but if provided, must be non-negative
    if (formData.downPayment !== undefined && formData.downPayment !== null && formData.downPayment < 0) {
      toast.error('Down payment cannot be negative');
      return;
    }

    setIsLoading(true);
    
    try {
      const newQuote = await apiService.createQuote(formData);
      setCreatedQuote(newQuote);
      setShowQuoteDetails(true);
      toast.success('Quote created successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create quote');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  const handleCreateAnother = () => {
    setCreatedQuote(null);
    setShowQuoteDetails(false);
    setFormData({
      systemSizeKw: 0,
      monthlyConsumptionKwh: 0,
      currency: 'USD'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-600">Please log in to create quotes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={handleCancel}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Quotes</span>
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {showQuoteDetails ? 'Quote Created Successfully!' : 'Create New Quote'}
          </h1>
          <p className="text-gray-600 mt-1">
            {showQuoteDetails 
              ? 'Your solar quote has been generated with all the details below' 
              : 'Fill in the details to generate a solar quote'
            }
          </p>
        </div>
      </div>

      {/* User Info Card - Only show when creating quote */}
      {!showQuoteDetails && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">Customer Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                <strong>Name:</strong> {user.fullName}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                <strong>Email:</strong> {user.email}
              </span>
            </div>
            {user.address && (
              <div className="flex items-center space-x-2 md:col-span-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  <strong>Address:</strong> {user.address}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quote Form - Only show if quote hasn't been created yet */}
      {!showQuoteDetails && (
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Specifications</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* System Size */}
              <div>
                <label htmlFor="systemSizeKw" className="block text-sm font-medium text-gray-700 mb-2">
                  <Zap className="h-4 w-4 inline mr-1" />
                  System Size (kW)
                </label>
                <input
                  type="number"
                  id="systemSizeKw"
                  name="systemSizeKw"
                  value={formData.systemSizeKw || ''}
                  onChange={handleInputChange}
                  min="0"
                  step="0.1"
                  required
                  className="input w-full"
                  placeholder="e.g., 5.5"
                />
                <p className="text-xs text-gray-500 mt-1">Size of the solar panel system in kilowatts</p>
              </div>

              {/* Monthly Consumption */}
              <div>
                <label htmlFor="monthlyConsumptionKwh" className="block text-sm font-medium text-gray-700 mb-2">
                  <Calculator className="h-4 w-4 inline mr-1" />
                  Monthly Consumption (kWh)
                </label>
                <input
                  type="number"
                  id="monthlyConsumptionKwh"
                  name="monthlyConsumptionKwh"
                  value={formData.monthlyConsumptionKwh || ''}
                  onChange={handleInputChange}
                  min="0"
                  step="1"
                  required
                  className="input w-full"
                  placeholder="e.g., 650"
                />
                <p className="text-xs text-gray-500 mt-1">Average monthly electricity consumption</p>
              </div>

              {/* Down Payment */}
              <div>
                <label htmlFor="downPayment" className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Down Payment (USD)
                </label>
                <input
                  type="number"
                  id="downPayment"
                  name="downPayment"
                  value={formData.downPayment || ''}
                  onChange={handleInputChange}
                  min="0"
                  step="100"
                  className="input w-full"
                  placeholder="e.g., 5000 (optional)"
                />
                <p className="text-xs text-gray-500 mt-1">Initial payment amount (optional)</p>
              </div>

              {/* Currency */}
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="input w-full"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Currency for pricing calculations</p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-outline"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Quote...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Quote
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Quote Details Display */}
      {showQuoteDetails && createdQuote && (
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-medium text-green-900">Quote Created Successfully!</h3>
          </div>
          
          <div className="bg-white rounded-lg border border-green-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* System Information */}
              <div className="space-y-3">
                <h4 className="text-md font-semibold text-gray-900 border-b pb-2">System Information</h4>
                <div>
                  <label className="text-sm font-medium text-gray-500">System Size</label>
                  <p className="text-sm text-gray-900">{createdQuote.systemSizeKw} kW</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Monthly Consumption</label>
                  <p className="text-sm text-gray-900">{createdQuote.monthlyConsumptionKwh} kWh</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Quote ID</label>
                  <p className="text-sm text-gray-900 font-mono">{createdQuote.id}</p>
                </div>
              </div>

              {/* Pricing Information */}
              <div className="space-y-3">
                <h4 className="text-md font-semibold text-gray-900 border-b pb-2">Pricing Information</h4>
                <div>
                  <label className="text-sm font-medium text-gray-500">System Price</label>
                  <p className="text-sm text-gray-900 font-semibold">{formatCurrency(createdQuote.systemPrice)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Down Payment</label>
                  <p className="text-sm text-gray-900">{formatCurrency(createdQuote.downPayment)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Principal Amount</label>
                  <p className="text-sm text-gray-900">{formatCurrency(createdQuote.principalAmount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Currency</label>
                  <p className="text-sm text-gray-900">{createdQuote.currency}</p>
                </div>
              </div>

              {/* Risk & Financing */}
              <div className="space-y-3">
                <h4 className="text-md font-semibold text-gray-900 border-b pb-2">Risk & Financing</h4>
                <div>
                  <label className="text-sm font-medium text-gray-500">Risk Band</label>
                  <div className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      createdQuote.riskBand === 'A' 
                        ? 'bg-green-100 text-green-800' 
                        : createdQuote.riskBand === 'B'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      Risk {createdQuote.riskBand}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Base APR</label>
                  <p className="text-sm text-gray-900">{createdQuote.baseApr}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-sm text-gray-900">{formatDate(createdQuote.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Financing Options */}
            <div className="mt-6">
              <h4 className="text-md font-semibold text-gray-900 border-b pb-2 mb-3">Financing Options</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {createdQuote.offers.map((offer, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {offer.termYears} years
                      </div>
                      <div className="text-sm text-gray-500 mb-2">
                        {offer.apr}% APR
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(offer.monthlyPayment)}/month
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Quote created on {formatDate(createdQuote.createdAt)}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleCreateAnother}
                  className="btn btn-outline"
                >
                  Create Another Quote
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="btn btn-primary"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View All Quotes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
