import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Tag, Trash2 } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const EditEntry = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    mood: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  useEffect(() => {
    fetchEntry();
  }, [id]);

  const fetchEntry = async () => {
    try {
      const response = await axios.get(`/api/entries/${id}`);
      const entry = response.data.entry;
      setFormData({
        title: entry.title,
        content: entry.content,
        tags: entry.tags || '',
        mood: entry.mood || ''
      });
    } catch (error) {
      console.error('Error fetching entry:', error);
      toast.error('Failed to load entry');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleContentChange = (content) => {
    setFormData({
      ...formData,
      content
    });
  };

  const handleMoodSelect = (mood) => {
    setFormData({
      ...formData,
      mood
    });
  };

  const handleSave = async () => {
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
      await axios.put(`/api/entries/${id}`, {
        title: formData.title,
        content: formData.content,
        tags: formData.tags,
        mood: formData.mood
      });

      toast.success('Entry updated successfully!');
      navigate(`/entry/${id}`);
    } catch (error) {
      console.error('Error updating entry:', error);
      toast.error('Failed to update entry');
    } finally {
      setSaving(false);
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
            onClick={() => navigate(`/entry/${id}`)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Edit Entry
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Update your thoughts and memories
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn-danger inline-flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary inline-flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
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

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Content
          </label>
          <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <ReactQuill
              value={formData.content}
              onChange={handleContentChange}
              placeholder="Start writing your thoughts..."
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  [{ 'color': [] }, { 'background': [] }],
                  ['link', 'blockquote'],
                  ['clean']
                ]
              }}
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
      </div>
    </div>
  );
};

export default EditEntry; 