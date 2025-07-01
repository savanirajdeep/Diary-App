import React, { useState } from 'react';
import { X, FileText, Heart, Target, Plane, BookOpen, Coffee, Star } from 'lucide-react';

const templates = [
  {
    id: 'daily',
    name: 'Daily Reflection',
    icon: <Coffee className="w-6 h-6" />,
    description: 'Reflect on your day, feelings, and experiences',
    content: `<h2>Today's Reflection</h2>
<p><strong>How was my day overall?</strong></p>
<p></p>
<p><strong>What made me happy today?</strong></p>
<p></p>
<p><strong>What challenged me today?</strong></p>
<p></p>
<p><strong>What am I grateful for?</strong></p>
<p></p>
<p><strong>Tomorrow I want to...</strong></p>
<p></p>`,
    tags: 'daily, reflection, gratitude',
    mood: '😊'
  },
  {
    id: 'gratitude',
    name: 'Gratitude Journal',
    icon: <Heart className="w-6 h-6" />,
    description: 'Focus on things you are thankful for',
    content: `<h2>Gratitude Entry</h2>
<p><strong>Today I am grateful for:</strong></p>
<p>1. </p>
<p>2. </p>
<p>3. </p>
<p></p>
<p><strong>Why am I grateful for these things?</strong></p>
<p></p>
<p><strong>How did these things make me feel?</strong></p>
<p></p>`,
    tags: 'gratitude, thankful, positive',
    mood: '🙏'
  },
  {
    id: 'goals',
    name: 'Goal Setting',
    icon: <Target className="w-6 h-6" />,
    description: 'Set and track your personal goals',
    content: `<h2>Goal Setting</h2>
<p><strong>My main goal for this period:</strong></p>
<p></p>
<p><strong>Why is this goal important to me?</strong></p>
<p></p>
<p><strong>Steps to achieve this goal:</strong></p>
<p>1. </p>
<p>2. </p>
<p>3. </p>
<p></p>
<p><strong>Timeline:</strong></p>
<p></p>
<p><strong>How will I measure success?</strong></p>
<p></p>`,
    tags: 'goals, planning, achievement',
    mood: '🎯'
  },
  {
    id: 'travel',
    name: 'Travel Journal',
    icon: <Plane className="w-6 h-6" />,
    description: 'Document your travel experiences',
    content: `<h2>Travel Entry</h2>
<p><strong>Where am I?</strong></p>
<p></p>
<p><strong>What did I do today?</strong></p>
<p></p>
<p><strong>What was the highlight of the day?</strong></p>
<p></p>
<p><strong>What surprised me?</strong></p>
<p></p>
<p><strong>What would I do differently?</strong></p>
<p></p>
<p><strong>Memorable moments:</strong></p>
<p></p>`,
    tags: 'travel, adventure, memories',
    mood: '✈️'
  },
  {
    id: 'learning',
    name: 'Learning Notes',
    icon: <BookOpen className="w-6 h-6" />,
    description: 'Document what you learned today',
    content: `<h2>Learning Notes</h2>
<p><strong>What did I learn today?</strong></p>
<p></p>
<p><strong>How did I learn it?</strong></p>
<p></p>
<p><strong>Why is this important?</strong></p>
<p></p>
<p><strong>How can I apply this knowledge?</strong></p>
<p></p>
<p><strong>Questions I still have:</strong></p>
<p></p>
<p><strong>Resources to explore further:</strong></p>
<p></p>`,
    tags: 'learning, knowledge, growth',
    mood: '📚'
  },
  {
    id: 'dreams',
    name: 'Dream Journal',
    icon: <Star className="w-6 h-6" />,
    description: 'Record and analyze your dreams',
    content: `<h2>Dream Journal</h2>
<p><strong>Date of dream:</strong></p>
<p></p>
<p><strong>What happened in my dream?</strong></p>
<p></p>
<p><strong>How did I feel during the dream?</strong></p>
<p></p>
<p><strong>What emotions did I wake up with?</strong></p>
<p></p>
<p><strong>Possible meanings or symbols:</strong></p>
<p></p>
<p><strong>Connection to my waking life:</strong></p>
<p></p>`,
    tags: 'dreams, subconscious, symbols',
    mood: '💫'
  },
  {
    id: 'blank',
    name: 'Blank Entry',
    icon: <FileText className="w-6 h-6" />,
    description: 'Start with a clean slate',
    content: '',
    tags: '',
    mood: ''
  }
];

const TemplateSelector = ({ isOpen, onClose, onSelectTemplate }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
  };

  const handleConfirm = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
      onClose();
      setSelectedTemplate(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Choose a Template
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[70vh]">
          {/* Template List */}
          <div className="w-1/2 p-6 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="grid grid-cols-1 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate?.id === template.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-primary-600 dark:text-primary-400">
                      {template.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {template.description}
                      </p>
                      {template.mood && (
                        <div className="mt-2 text-2xl">{template.mood}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Template Preview */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Preview
            </h3>
            {selectedTemplate ? (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {selectedTemplate.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {selectedTemplate.description}
                  </p>
                  {selectedTemplate.tags && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedTemplate.tags.split(',').map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-xs rounded-full"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: selectedTemplate.content || '<p>Start writing your entry...</p>' }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a template to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedTemplate}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Use Template
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector; 