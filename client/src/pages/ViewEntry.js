import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar, 
  Tag, 
  Clock,
  Share2,
  Download,
  Lock
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import PasscodeModal from '../components/PasscodeModal';

const ViewEntry = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [requiresPasscode, setRequiresPasscode] = useState(false);

  useEffect(() => {
    fetchEntry();
  }, [id]);

  const fetchEntry = async (passcode = null) => {
    setLoading(true);
    try {
      const url = passcode 
        ? `/api/entries/${id}?passcode=${encodeURIComponent(passcode)}`
        : `/api/entries/${id}`;
      
      const response = await axios.get(url);
      setEntry(response.data.entry);
      setRequiresPasscode(false);
      setShowPasscodeModal(false);
    } catch (error) {
      console.error('Error fetching entry:', error);
      if (error.response?.status === 403 && error.response?.data?.requiresPasscode) {
        setRequiresPasscode(true);
        setShowPasscodeModal(true);
      } else if (error.response?.status === 404) {
        setEntry(null); // Show 'Entry not found'
      } else {
        toast.error('Failed to load entry');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await axios.delete(`/api/entries/${id}`);
      toast.success('Entry deleted successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
    } finally {
      setDeleting(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Failed to copy link');
    }
  };

  const handlePasscodeVerify = async (passcode) => {
    await fetchEntry(passcode);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await axios.get(`/api/entries/${id}/export`, {
        responseType: 'blob'
      });
      
      // Check if the response is actually a PDF
      if (!response.headers['content-type'] || !response.headers['content-type'].includes('application/pdf')) {
        throw new Error('Server returned non-PDF content');
      }
      
      // Create download link with proper blob handling
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${entry.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      let errorMessage = 'Failed to export PDF';
      
      if (error.response?.status === 404) {
        errorMessage = 'Entry not found';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error while generating PDF';
      } else if (error.message === 'Server returned non-PDF content') {
        errorMessage = 'Invalid PDF format received';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Export timed out. Please try again.';
      }
      
      toast.error(errorMessage);
    } finally {
      setExporting(false);
    }
  };

  if (loading && !requiresPasscode) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!entry && !requiresPasscode) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Entry not found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          The entry you're looking for doesn't exist or has been deleted.
        </p>
        <Link to="/dashboard" className="btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // Only render the entry view if entry is not null
  if (entry) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {entry.title}
              </h1>
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {format(new Date(entry.createdAt), 'MMMM dd, yyyy')}
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {format(new Date(entry.createdAt), 'h:mm a')}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50"
              title="Export as PDF"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={handleShare}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Share entry"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <Link
              to={`/entry/${id}/edit`}
              className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
              title="Edit entry"
            >
              <Edit className="w-5 h-5" />
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50"
              title="Delete entry"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Entry Content */}
        <div className="card">
          <div className="p-6">
            {/* Mood and Tags */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-4">
                {entry.mood && (
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{entry.mood}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Mood
                    </span>
                  </div>
                )}
                {entry.tags && (
                  <div className="flex items-center space-x-2">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {entry.tags}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Last updated: {format(new Date(entry.updatedAt), 'MMM dd, yyyy h:mm a')}
              </div>
            </div>

            {/* Content */}
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <div 
                className="text-gray-900 dark:text-gray-100 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: entry.content }}
              />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div />
          <div className="flex items-center space-x-4">
            <Link
              to="/new"
              className="btn-primary"
            >
              Write New Entry
            </Link>
            <Link
              to="/dashboard"
              className="btn-secondary"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Passcode Modal */}
        <PasscodeModal
          isOpen={showPasscodeModal}
          onClose={() => {
            setShowPasscodeModal(false);
            navigate('/dashboard');
          }}
          onVerify={handlePasscodeVerify}
          title={entry?.title || 'Protected Entry'}
        />
      </div>
    );
  }

  // If waiting for passcode, just render the modal
  return (
    <PasscodeModal
      isOpen={showPasscodeModal}
      onClose={() => {
        setShowPasscodeModal(false);
        navigate('/dashboard');
      }}
      onVerify={handlePasscodeVerify}
      title={entry?.title || 'Protected Entry'}
    />
  );
};

export default ViewEntry; 