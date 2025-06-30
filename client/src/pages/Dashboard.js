import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Calendar, 
  Tag, 
  Edit, 
  Trash2, 
  Eye,
  Filter,
  X,
  Download
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import debounce from 'lodash.debounce';

const Dashboard = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTags, setFilterTags] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedEntries, setSelectedEntries] = useState([]);
  const [bulkExporting, setBulkExporting] = useState(false);

  // Debounced values
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [debouncedTags, setDebouncedTags] = useState('');

  // Debounce handlers
  const debouncedSetSearch = useCallback(
    debounce((value) => setDebouncedSearch(value), 400),
    []
  );
  const debouncedSetTags = useCallback(
    debounce((value) => setDebouncedTags(value), 400),
    []
  );

  useEffect(() => {
    debouncedSetSearch(searchTerm);
  }, [searchTerm, debouncedSetSearch]);

  useEffect(() => {
    debouncedSetTags(filterTags);
  }, [filterTags, debouncedSetTags]);

  useEffect(() => {
    fetchEntries();
    fetchStats();
    // eslint-disable-next-line
  }, [currentPage, debouncedSearch, debouncedTags]);

  const fetchEntries = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(debouncedTags && { tags: debouncedTags })
      });

      const response = await axios.get(`/api/entries?${params}`);
      setEntries(response.data.entries);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching entries:', error);
      toast.error('Failed to load entries');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/entries/stats/summary');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    setDeletingId(id);
    try {
      await axios.delete(`/api/entries/${id}`);
      toast.success('Entry deleted successfully');
      fetchEntries();
      fetchStats();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkExport = async () => {
    if (selectedEntries.length === 0) {
      toast.error('Please select entries to export');
      return;
    }

    setBulkExporting(true);
    try {
      const response = await axios.post('/api/entries/export-bulk', {
        entryIds: selectedEntries
      }, {
        responseType: 'blob'
      });
      
      // Debug: Log response headers
      console.log('Response headers:', response.headers);
      console.log('Content-Type:', response.headers['content-type']);
      console.log('Response data type:', typeof response.data);
      console.log('Response data size:', response.data.size || response.data.length);
      
      // Check if the response is actually a PDF
      if (!response.headers['content-type'] || !response.headers['content-type'].includes('application/pdf')) {
        console.error('Expected PDF but got:', response.headers['content-type']);
        throw new Error('Server returned non-PDF content');
      }
      
      // Create download link with proper blob handling
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `diary_entries_${new Date().toISOString().split('T')[0]}.pdf`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast.success(`Exported ${selectedEntries.length} entries successfully!`);
      setSelectedEntries([]);
    } catch (error) {
      console.error('Bulk export failed:', error);
      console.error('Error response:', error.response);
      let errorMessage = 'Failed to export entries';
      
      if (error.response?.status === 400) {
        errorMessage = 'Invalid entry selection';
      } else if (error.response?.status === 404) {
        errorMessage = 'No entries found';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error while generating PDF';
      } else if (error.message === 'Server returned non-PDF content') {
        errorMessage = 'Invalid PDF format received';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Export timed out. Please try again.';
      }
      
      toast.error(errorMessage);
    } finally {
      setBulkExporting(false);
    }
  };

  const toggleEntrySelection = (entryId) => {
    setSelectedEntries(prev => 
      prev.includes(entryId) 
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  const selectAllEntries = () => {
    setSelectedEntries(entries.map(entry => entry.id));
  };

  const clearSelection = () => {
    setSelectedEntries([]);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterTags('');
    setCurrentPage(1);
  };

  const hasFilters = debouncedSearch || debouncedTags;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner + Stats Cards Row */}
      <div className="flex flex-col md:flex-row md:items-stretch md:space-x-8 space-y-6 md:space-y-0 mb-2">
        {/* Welcome Banner */}
        <div className="flex-1 flex flex-col justify-between bg-transparent">
          <div>
            <h1 className="text-3xl font-bold flex items-center mb-1">
              <span role="img" aria-label="diary" className="mr-2">📔</span>
              Welcome back, {user?.name || 'User'}!
            </h1>
            <p className="text-gray-500 text-lg">Ready to write your thoughts today?</p>
          </div>
          <div className="mt-6 md:mt-8">
            <Link
              to="/new"
              className="btn-primary text-lg px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 hover:scale-105 transition-transform"
            >
              <Plus className="w-5 h-5" />
              New Entry
            </Link>
          </div>
        </div>
        {/* Stats Cards */}
        <div className="flex-[2] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          <div className="card p-6 shadow-xl rounded-2xl flex items-center gap-4 h-full">
            <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-xl">
              <Calendar className="w-7 h-7 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-base font-medium text-gray-600 dark:text-gray-400">
                Total Entries
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalEntries || 0}
              </p>
            </div>
          </div>
          <div className="card p-6 shadow-xl rounded-2xl flex items-center gap-4 h-full">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-xl">
              <Calendar className="w-7 h-7 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-base font-medium text-gray-600 dark:text-gray-400">
                This Month
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {stats.thisMonthEntries || 0}
              </p>
            </div>
          </div>
          <div className="card p-6 shadow-xl rounded-2xl flex items-center gap-4 h-full">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
              <Calendar className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-base font-medium text-gray-600 dark:text-gray-400">
                Today
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {stats.todayEntries || 0}
              </p>
            </div>
          </div>
          <div className="card p-6 shadow-xl rounded-2xl flex items-center gap-4 h-full">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-xl">
              <Calendar className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-base font-medium text-gray-600 dark:text-gray-400">
                Last Entry
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {stats.lastEntryDate 
                  ? format(new Date(stats.lastEntryDate), 'MMM dd')
                  : 'Never'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-6 shadow-md rounded-xl">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
            />
          </div>
          <div className="flex-1 relative">
            <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by tags..."
              value={filterTags}
              onChange={(e) => setFilterTags(e.target.value)}
              className="pl-12 pr-4 py-3 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
            />
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="btn-secondary inline-flex items-center h-12"
            >
              <X className="w-5 h-5 mr-2" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Entries List */}
      <div className="card shadow-lg rounded-2xl">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <span role="img" aria-label="recent">📝</span>
              <span className="ml-2">Recent Entries</span>
            </h2>
            {entries.length > 0 && selectedEntries.length === 0 && (
              <button
                onClick={selectAllEntries}
                className="btn-secondary text-sm"
              >
                Select All
              </button>
            )}
            {selectedEntries.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedEntries.length} selected
                </span>
                <button
                  onClick={handleBulkExport}
                  disabled={bulkExporting}
                  className="btn-primary inline-flex items-center text-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {bulkExporting ? 'Exporting...' : `Export ${selectedEntries.length}`}
                </button>
                <button
                  onClick={clearSelection}
                  className="btn-secondary text-sm"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {entries.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="text-gray-400 dark:text-gray-500 mb-4 text-5xl">
                <span role="img" aria-label="empty">📭</span>
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                No entries found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {hasFilters 
                  ? 'Try adjusting your search or filters'
                  : 'Start writing your first diary entry'
                }
              </p>
              {/* Debug info for troubleshooting */}
              <pre className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 rounded p-2 mb-2">
                Filters: {JSON.stringify({search: debouncedSearch, tags: debouncedTags})}\nEntries: {JSON.stringify(entries)}
              </pre>
              {!hasFilters && (
                <Link to="/new" className="btn-primary text-lg px-6 py-3 rounded-xl flex items-center justify-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Write Your First Entry
                </Link>
              )}
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="p-6 group transition-all hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl flex items-start justify-between cursor-pointer">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={selectedEntries.includes(entry.id)}
                    onChange={() => toggleEntrySelection(entry.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {entry.title}
                      </h3>
                      {entry.mood && (
                        <span className="text-2xl">{entry.mood}</span>
                      )}
                    </div>
                    <p className="text-base text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {entry.content.replace(/<[^>]*>/g, '')}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {format(new Date(entry.createdAt), 'MMM dd, yyyy')}
                      </span>
                      {entry.tags && (
                        <span className="flex items-center">
                          <Tag className="w-4 h-4 mr-1" />
                          {entry.tags}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Link
                    to={`/entry/${entry.id}`}
                    className="p-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Eye className="w-5 h-5" />
                  </Link>
                  <Link
                    to={`/entry/${entry.id}/edit`}
                    className="p-3 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Edit className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    disabled={deletingId === entry.id}
                    className="p-3 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-base text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 