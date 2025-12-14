import { useState } from 'react';
import { ChevronLeft, FileText, Sparkles, Plus, Trash2, Edit2, CheckCircle2, Clock, AlertCircle, BookOpen, ExternalLink } from 'lucide-react';
import type { DTLib, DTL } from '../App';
import { dtlibAPI } from '../services/api';
import { copyToClipboard } from '../utils/clipboard';

type Tab = 'metadata' | 'lawtext' | 'dtls';

type Props = {
  dtlib: DTLib;
  dtls: DTL[];
  onBack: () => void;
  onUpdateDTLib: (id: string, updates: Partial<DTLib>) => void;
  onCreateDTL: (dtl: Omit<DTL, 'id' | 'dtlibId'>) => void;
  onSelectDTL: (dtlId: string) => void;
  onDeleteDTL: (dtlId: string) => void;
};

export function DTLibDetail({ dtlib, dtls, onBack, onUpdateDTLib, onCreateDTL, onSelectDTL, onDeleteDTL }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('dtls');
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [isEditingLawText, setIsEditingLawText] = useState(false);
  const [showSegmentationModal, setShowSegmentationModal] = useState(false);

  const [metadataForm, setMetadataForm] = useState({
    name: dtlib.name,
    lawIdentifier: dtlib.lawIdentifier,
    jurisdiction: dtlib.jurisdiction,
    version: dtlib.version,
    effectiveDate: dtlib.effectiveDate,
    description: dtlib.description,
    authoritativeUrl: dtlib.authoritativeUrl
  });

  const [lawTextForm, setLawTextForm] = useState(dtlib.lawText);

  const handleSaveMetadata = () => {
    onUpdateDTLib(dtlib.id, metadataForm);
    setIsEditingMetadata(false);
  };

  const handleSaveLawText = () => {
    onUpdateDTLib(dtlib.id, { lawText: lawTextForm });
    setIsEditingLawText(false);
  };

  const getStatusIcon = (status: DTL['reviewStatus']) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="size-4 text-emerald-600" />;
      case 'pending': return <Clock className="size-4 text-amber-600" />;
      case 'revision-requested': return <AlertCircle className="size-4 text-red-600" />;
    }
  };

  const getStatusLabel = (status: DTL['reviewStatus']) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'pending': return 'Pending';
      case 'revision-requested': return 'Revision Requested';
    }
  };

  const getStatusColor = (status: DTL['reviewStatus']) => {
    switch (status) {
      case 'approved': return 'bg-emerald-50 text-emerald-700';
      case 'pending': return 'bg-amber-50 text-amber-700';
      case 'revision-requested': return 'bg-red-50 text-red-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft className="size-5" />
              Back to Libraries
            </button>
          </div>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="size-6 text-blue-600" />
                <h1 className="text-slate-900">{dtlib.name}</h1>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  dtlib.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                  dtlib.status === 'review' ? 'bg-amber-100 text-amber-700' :
                  dtlib.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {dtlib.status === 'in-progress' ? 'In Progress' : 
                   dtlib.status === 'review' ? 'In Review' :
                   dtlib.status === 'approved' ? 'Approved' : 'Draft'}
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm text-slate-600">
                <span>{dtlib.lawIdentifier}</span>
                <span>•</span>
                <span>{dtlib.jurisdiction}</span>
                <span>•</span>
                <span>Version {dtlib.version}</span>
                <span>•</span>
                <span>Effective: {dtlib.effectiveDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-6 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('dtls')}
              className={`px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'dtls'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              DTL Segmentation
              <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-sm">
                {dtls.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('metadata')}
              className={`px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'metadata'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Metadata
            </button>
            <button
              onClick={() => setActiveTab('lawtext')}
              className={`px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'lawtext'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Law Text
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Metadata Tab */}
        {activeTab === 'metadata' && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-slate-900">DTLIB Metadata</h2>
              {!isEditingMetadata && (
                <button
                  onClick={() => setIsEditingMetadata(true)}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="size-4" />
                  Edit
                </button>
              )}
            </div>

            {isEditingMetadata ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-slate-700 mb-2">Statute Name</label>
                  <input
                    type="text"
                    value={metadataForm.name}
                    onChange={(e) => setMetadataForm({ ...metadataForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-slate-700 mb-2">Law Identifier</label>
                    <input
                      type="text"
                      value={metadataForm.lawIdentifier}
                      onChange={(e) => setMetadataForm({ ...metadataForm, lawIdentifier: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-2">Jurisdiction</label>
                    <input
                      type="text"
                      value={metadataForm.jurisdiction}
                      onChange={(e) => setMetadataForm({ ...metadataForm, jurisdiction: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-2">Version</label>
                    <input
                      type="text"
                      value={metadataForm.version}
                      onChange={(e) => setMetadataForm({ ...metadataForm, version: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-2">Effective Date</label>
                    <input
                      type="date"
                      value={metadataForm.effectiveDate}
                      onChange={(e) => setMetadataForm({ ...metadataForm, effectiveDate: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 mb-2">Description</label>
                  <textarea
                    value={metadataForm.description}
                    onChange={(e) => setMetadataForm({ ...metadataForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-2">Authoritative Source URL</label>
                  <input
                    type="url"
                    value={metadataForm.authoritativeUrl}
                    onChange={(e) => setMetadataForm({ ...metadataForm, authoritativeUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
                  <button
                    onClick={() => {
                      setIsEditingMetadata(false);
                      setMetadataForm({
                        name: dtlib.name,
                        lawIdentifier: dtlib.lawIdentifier,
                        jurisdiction: dtlib.jurisdiction,
                        version: dtlib.version,
                        effectiveDate: dtlib.effectiveDate,
                        description: dtlib.description,
                        authoritativeUrl: dtlib.authoritativeUrl
                      });
                    }}
                    className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveMetadata}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <span className="text-slate-500 text-sm">Law Identifier</span>
                    <p className="text-slate-900 mt-1">{dtlib.lawIdentifier}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-sm">Jurisdiction</span>
                    <p className="text-slate-900 mt-1">{dtlib.jurisdiction}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-sm">Version</span>
                    <p className="text-slate-900 mt-1">{dtlib.version}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-sm">Effective Date</span>
                    <p className="text-slate-900 mt-1">{dtlib.effectiveDate}</p>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-sm">Description</span>
                  <p className="text-slate-900 mt-1">{dtlib.description}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-sm">Authoritative Source</span>
                  <a
                    href={dtlib.authoritativeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 mt-1 flex items-center gap-2"
                  >
                    {dtlib.authoritativeUrl}
                    <ExternalLink className="size-4" />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Law Text Tab */}
        {activeTab === 'lawtext' && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-slate-900">Full Statutory Text</h2>
                <p className="text-slate-600 text-sm mt-1">The complete authoritative text of the statute</p>
              </div>
              {!isEditingLawText && (
                <button
                  onClick={() => setIsEditingLawText(true)}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="size-4" />
                  Edit
                </button>
              )}
            </div>

            {isEditingLawText ? (
              <div className="space-y-4">
                <textarea
                  value={lawTextForm}
                  onChange={(e) => setLawTextForm(e.target.value)}
                  rows={20}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="Paste the full statutory text here..."
                />
                <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
                  <button
                    onClick={() => {
                      setIsEditingLawText(false);
                      setLawTextForm(dtlib.lawText);
                    }}
                    className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveLawText}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                <pre className="whitespace-pre-wrap text-sm text-slate-800 leading-relaxed">
                  {dtlib.lawText || 'No statutory text has been added yet.'}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* DTL Segmentation Tab */}
        {activeTab === 'dtls' && (
          <div className="space-y-6">
            {/* Actions Bar */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-slate-900">Digital Twins of Legislation</h2>
                <p className="text-slate-600 text-sm mt-1">
                  Segmented legal functions derived from the statute
                </p>
              </div>
              <button
                onClick={() => setShowSegmentationModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Sparkles className="size-5" />
                AI-Assisted Segmentation
              </button>
            </div>

            {/* DTL List */}
            {dtls.length === 0 ? (
              <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
                <FileText className="size-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-slate-900 mb-2">No DTLs created yet</h3>
                <p className="text-slate-600 mb-6">
                  Use AI-assisted segmentation to automatically identify and create DTLs from the statutory text
                </p>
                <button
                  onClick={() => setShowSegmentationModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Sparkles className="size-5" />
                  Start Segmentation
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {dtls.map((dtl) => (
                  <div
                    key={dtl.id}
                    className="bg-white rounded-lg border border-slate-200 p-6 hover:border-blue-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-slate-900">{dtl.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1.5 ${getStatusColor(dtl.reviewStatus)}`}>
                            {getStatusIcon(dtl.reviewStatus)}
                            {getStatusLabel(dtl.reviewStatus)}
                          </span>
                        </div>
                        <p className="text-slate-600 text-sm mb-3">{dtl.description}</p>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span>Owner: {dtl.ownerUserId ? `User #${dtl.ownerUserId}` : 'Unassigned'}</span>
                          <span>•</span>
                          <span>Category: {dtl.category}</span>
                          <span>•</span>
                          <span>Reference: {dtl.legalReference}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSelectDTL(dtl.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Open Workflow
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${dtl.name}"?`)) {
                              onDeleteDTL(dtl.id);
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="size-5" />
                        </button>
                      </div>
                    </div>
                    
                    {dtl.reviewStatus === 'revision-requested' && dtl.reviewComments && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                        <AlertCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-red-900">
                            {dtl.reviewComments}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* AI Segmentation Modal */}
      {showSegmentationModal && (
        <AISegmentationModal
          dtlib={dtlib}
          onClose={() => setShowSegmentationModal(false)}
          onCreateDTL={onCreateDTL}
        />
      )}
    </div>
  );
}

function AISegmentationModal({ dtlib, onClose, onCreateDTL }: {
  dtlib: DTLib;
  onClose: () => void;
  onCreateDTL: (dtl: Omit<DTL, 'id' | 'dtlibId'>) => void;
}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{
    name: string;
    description: string;
    legalText: string;
    legalReference: string;
    category: string;
  }>>([]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const apiSuggestions = await dtlibAPI.segment(dtlib.id);
      setSuggestions(apiSuggestions.map(s => ({
        name: s.suggestion_title,
        description: s.suggestion_description || '',
        legalText: s.legal_text,
        legalReference: s.legal_reference,
        category: 'Process' // Default category, can be enhanced
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze statute');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAccept = (suggestion: typeof suggestions[0]) => {
    onCreateDTL({
      name: suggestion.name,
      description: suggestion.description,
      legalText: suggestion.legalText,
      legalReference: suggestion.legalReference,
      authoritativeUrl: dtlib.authoritativeUrl,
      category: suggestion.category,
      tags: [],
      ownerUserId: null,
      version: dtlib.version,
      reviewStatus: 'pending'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4">
          <h2 className="text-slate-900">AI-Assisted DTL Segmentation</h2>
          <p className="text-slate-600 mt-1">Automatically identify legal functions in the statute</p>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
              <AlertCircle className="size-5 text-red-600 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <p className="text-sm text-red-900">{error}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-red-900">Details:</span>
                  <code className="bg-white border border-red-200 rounded px-2 py-1 text-red-900 break-words">
                    {error}
                  </code>
                  <button
                    onClick={() => copyToClipboard(error)}
                    className="px-2 py-1 bg-white border border-red-200 rounded text-red-900 hover:bg-red-50"
                  >
                    Copy error
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {suggestions.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="size-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-slate-900 mb-2">Ready to analyze statute</h3>
              <p className="text-slate-600 mb-6">
                The AI will analyze the statutory text and propose DTL candidates
              </p>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-slate-600">
                The AI has identified {suggestions.length} potential DTL candidates. Review and accept them to create DTLs.
              </p>
              {suggestions.map((suggestion, idx) => (
                <div key={idx} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <h4 className="text-slate-900">{suggestion.name}</h4>
                      <p className="text-slate-600 text-sm mt-1">{suggestion.description}</p>
                    </div>
                    <button
                      onClick={() => {
                        handleAccept(suggestion);
                        setSuggestions(prev => prev.filter((_, i) => i !== idx));
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="size-4" />
                      Accept
                    </button>
                  </div>
                  <div className="bg-slate-50 rounded p-3 text-sm">
                    <p className="text-slate-500 mb-1">Legal Reference: {suggestion.legalReference}</p>
                    <p className="text-slate-800">{suggestion.legalText}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}