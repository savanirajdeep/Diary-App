import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Tag, Smile, FileText, Lock } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import TemplateSelector from '../components/TemplateSelector';

const NewEntry = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    mood: '',
    passcode: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const quillRef = useRef();

  const moodOptions = [
    { emoji: '😊', label: 'Happy' },
    { emoji: '😢', label: 'Sad' },
    { emoji: '😡', label: 'Angry' },
    { emoji: '😌', label: 'Calm' },
    { emoji: '😤', label: 'Frustrated' },
    { emoji: '😍', label: 'Excited' },
    { emoji: '😴', label: 'Tired' },
    { emoji: '🤔', label: 'Thoughtful' },
    { emoji: '😎', label: 'Confident' },
    { emoji: '😰', label: 'Anxious' }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleContentChange = (content) => {
    console.log('handleContentChange called with content:', content);
    console.log('Content length:', content?.length);
    
    // Don't update if we're applying a template
    if (isApplyingTemplate) {
      console.log('Skipping content change during template application');
      return;
    }
    
    setFormData(prevData => ({
      ...prevData,
      content
    }));
  };

  const handleMoodSelect = (mood) => {
    setFormData({
      ...formData,
      mood
    });
  };

  const handleTemplateSelect = (template) => {
    console.log('Template selected:', template);
    console.log('Template tags:', template.tags);
    
    setIsApplyingTemplate(true);
    
    const newFormData = {
      title: template.name === 'Blank Entry' ? '' : template.name,
      content: template.content,
      tags: template.tags || '',
      mood: template.mood || '',
      passcode: formData.passcode // Preserve existing passcode
    };
    
    console.log('New form data:', newFormData);
    
    // Use a callback to ensure state is updated
    setFormData(prevData => {
      console.log('Previous form data:', prevData);
      console.log('Setting new form data:', newFormData);
      return newFormData;
    });
    
    // Set the content in the Quill editor
    if (quillRef.current) {
      quillRef.current.getEditor().root.innerHTML = template.content;
    }
    
    // Reset the flag after a short delay
    setTimeout(() => {
      setIsApplyingTemplate(false);
      const tagsInput = document.getElementById('tags');
      if (tagsInput) {
        console.log('Tags input value after timeout:', tagsInput.value);
        tagsInput.focus();
        tagsInput.blur();
      }
    }, 200);
    
    toast.success(`Template "${template.name}" applied!`);
  };

  const handleSave = async (draft = false) => {
    console.log('handleSave called with draft:', draft);
    console.log('Current formData:', formData);
    console.log('Content length:', formData.content?.length);
    console.log('Content trimmed length:', formData.content?.trim()?.length);
    
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!formData.content.trim()) {
      toast.error('Please enter some content');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formData.title,
        content: formData.content,
        tags: formData.tags,
        mood: formData.mood,
        passcode: formData.passcode
      };
      
      console.log('Sending payload:', payload);
      
      const response = await axios.post('/api/entries', payload);

      console.log('Response received:', response.data);
      toast.success(draft ? 'Draft saved!' : 'Entry saved successfully!');
      navigate(`/entry/${response.data.entry.id}`);
    } catch (error) {
      console.error('Error saving entry:', error);
      console.error('Error response:', error.response?.data);
      
      // Show specific validation errors if available
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map(err => err.msg).join(', ');
        toast.error(`Validation error: ${errorMessages}`);
      } else {
        toast.error('Failed to save entry');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAutoSave = async () => {
    if (formData.title.trim() && formData.content.trim()) {
      try {
        await axios.post('/api/entries', {
          title: formData.title,
          content: formData.content,
          tags: formData.tags,
          mood: formData.mood,
          passcode: formData.passcode
        });
        toast.success('Auto-saved!');
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  };

  // Auto-save every 30 seconds
  React.useEffect(() => {
    const interval = setInterval(handleAutoSave, 30000);
    return () => clearInterval(interval);
  }, [formData]);

  // Auto-open template selector if template parameter is present
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('template') === 'true') {
      setShowTemplateSelector(true);
    }
  }, [location.search]);

  // Debug: Log form data changes
  React.useEffect(() => {
    console.log('Form data updated:', formData);
  }, [formData]);

  const quillModules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'color': [] }, { 'background': [] }],
        ['link', 'blockquote'],
        ['clean']
      ]
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
              New Entry
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Write your thoughts and memories
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowTemplateSelector(true)}
            className="btn-secondary inline-flex items-center"
          >
            <FileText className="w-4 h-4 mr-2" />
            Templates
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="btn-secondary inline-flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="btn-primary inline-flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            className="input text-lg font-medium"
            placeholder="What's on your mind today?"
          />
        </div>

        {/* Mood Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            How are you feeling?
          </label>
          <div className="grid grid-cols-5 gap-2">
            {moodOptions.map((option) => (
              <button
                key={option.emoji}
                type="button"
                onClick={() => handleMoodSelect(option.emoji)}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  formData.mood === option.emoji
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
                title={option.label}
              >
                <span className="text-2xl">{option.emoji}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tags
          </label>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="tags"
              name="tags"
              type="text"
              value={formData.tags}
              onChange={handleChange}
              className="input pl-10"
              placeholder="work, personal, travel, etc. (comma separated)"
            />
          </div>
        </div>

        {/* Passcode */}
        <div>
          <label htmlFor="passcode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Passcode (Optional)
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="passcode"
              name="passcode"
              type="password"
              value={formData.passcode}
              onChange={handleChange}
              className="input pl-10"
              placeholder="Enter a 4-20 character passcode to protect this entry"
              minLength="4"
              maxLength="20"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            🔒 This entry will be password-protected. You'll need this passcode to view it later.
          </p>
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Content
          </label>
          <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <ReactQuill
              ref={quillRef}
              value={formData.content}
              onChange={handleContentChange}
              placeholder="Start writing your thoughts..."
              modules={quillModules}
              formats={[
                'header',
                'bold', 'italic', 'underline', 'strike',
                'list', 'bullet',
                'color', 'background',
                'link', 'blockquote'
              ]}
            />
          </div>
        </div>

        {/* Auto-save indicator */}
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          💾 Auto-saving every 30 seconds
        </div>
      </div>

      {/* Template Selector Modal */}
      <TemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelectTemplate={handleTemplateSelect}
      />
    </div>
  );
};

export default NewEntry; 