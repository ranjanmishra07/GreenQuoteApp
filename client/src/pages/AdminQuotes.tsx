import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api';
import type { QuoteListParams } from '@/types';
import { QuoteTable } from '@/components/QuoteTable';
import { Search, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminQuotes: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-quotes', currentPage, pageSize, searchName, searchEmail],
    queryFn: () => {
      const params: QuoteListParams = {
        page: currentPage,
        limit: pageSize,
        view: 'ADMIN',
      };
      
      if (searchName) params.searchName = searchName;
      if (searchEmail) params.searchEmail = searchEmail;
      
      return apiService.getQuotes(params);
    },
    enabled: !!user && user.roleName === 'ADMIN',
  });

  const handleLogout = () => {
    logout();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page when searching
    refetch();
  };

  const handleClearSearch = () => {
    setSearchName('');
    setSearchEmail('');
    setCurrentPage(1);
  };

  // Redirect if not admin
  if (user?.roleName !== 'ADMIN') {
    navigate('/');
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to My Quotes</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin - All Quotes</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {user?.fullName}! <span className="text-blue-600">(Admin View)</span>
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-outline"
        >
          Logout
        </button>
      </div>

      {/* Search Section */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Search Quotes</h3>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
          >
            <Search className="h-4 w-4" />
            <span>{showSearch ? 'Hide Search' : 'Show Search'}</span>
          </button>
        </div>
        
        {showSearch && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="searchName" className="block text-sm font-medium text-gray-700 mb-1">
                  Search by Name
                </label>
                <input
                  id="searchName"
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Enter customer name..."
                  className="input w-full"
                />
              </div>
              <div>
                <label htmlFor="searchEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Search by Email
                </label>
                <input
                  id="searchEmail"
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="Enter customer email..."
                  className="input w-full"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSearch}
                className="btn btn-primary"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </button>
              <button
                onClick={handleClearSearch}
                className="btn btn-outline"
              >
                Clear
              </button>
            </div>
            
            {(searchName || searchEmail) && (
              <div className="text-sm text-gray-600">
                <p>Searching for:</p>
                {searchName && <p>• Name: "{searchName}"</p>}
                {searchEmail && <p>• Email: "{searchEmail}"</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quotes Table */}
      <QuoteTable
        data={data}
        isLoading={isLoading}
        error={error}
        onRefetch={refetch}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        pageSize={pageSize}
        showCustomerColumn={true}
      />
    </div>
  );
};
