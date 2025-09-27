import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api';
import { QuoteTable } from '@/components/QuoteTable';
import { useNavigate } from 'react-router-dom';
import { Plus, Settings } from 'lucide-react';

export const QuoteList: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['quotes', currentPage, pageSize],
    queryFn: () => apiService.getQuotes({ page: currentPage, limit: pageSize }),
    enabled: !!user,
  });

  const handleLogout = () => {
    logout();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCreateQuote = () => {
    navigate('/quotes/create');
  };

  const handleAdminClick = () => {
    navigate('/quotes/admin');
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Quotes</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.fullName}!
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleCreateQuote}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Quote
          </button>
          {user?.roleName === 'ADMIN' && (
            <button
              onClick={handleAdminClick}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <Settings className="h-5 w-5 mr-2" />
              Admin View
            </button>
          )}
          <button
            onClick={handleLogout}
            className="btn btn-outline"
          >
            Logout
          </button>
        </div>
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
        showCustomerColumn={false}
      />
    </div>
  );
};

