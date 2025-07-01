import React, { useState } from 'react';
import { Lock, X, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const PasscodeModal = ({ isOpen, onClose, onVerify, title }) => {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!passcode.trim()) {
      toast.error('Please enter a passcode');
      return;
    }

    setIsVerifying(true);
    try {
      await onVerify(passcode);
      setPasscode('');
    } catch (error) {
      console.error('Passcode verification failed:', error);
      toast.error('Invalid passcode. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setPasscode('');
    setShowPasscode(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
              <Lock className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Protected Entry
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This entry is password protected
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please enter the passcode to view this entry.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="passcode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Passcode
              </label>
              <div className="relative">
                <input
                  id="passcode"
                  type={showPasscode ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="input pr-10"
                  placeholder="Enter passcode"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="btn-secondary flex-1"
                disabled={isVerifying}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1 inline-flex items-center justify-center"
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  'Unlock Entry'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasscodeModal; 