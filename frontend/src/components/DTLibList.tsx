import { useState } from 'react';
import { Search, Plus, BookOpen, ChevronRight, Filter, AlertCircle } from 'lucide-react';
import type { DTLib } from '../App';

type Props = {
  dtlibs: DTLib[];
  onSelectDTLib: (id: string) => void;
  onCreateDTLib: (lib: Omit<DTLib, 'id'>) => void;
  onDeleteDTLib: (id: string) => void;
};

export function DTLibList({ dtlibs, onSelectDTLib, onCreateDTLib }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredDTLibs = dtlibs.filter(lib => {
    const matchesSearch = 
      lib.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lib.lawIdentifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lib.jurisdiction.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || lib.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: DTLib['status']) => {
    switch (status) {
      case 'draft': return 'bg-slate-100 text-slate-700';
      case 'in-progress': return 'bg-slate-100 text-slate-800';
      case 'review': return 'bg-slate-100 text-slate-700';
      case 'approved': return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusLabel = (status: DTLib['status']) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'in-progress': return 'In Progress';
      case 'review': return 'In Review';
      case 'approved': return 'Approved';
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-slate-900">Digital Twin Libraries</h1>
              <p className="text-slate-600 mt-1">Manage statutory Digital Twin Libraries (DTLIBs) and their Digital Twins of Legislation (DTLs)</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Plus className="size-5" />
              New DTLIB
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, identifier, or jurisdiction..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="size-5 text-slate-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="in-progress">In Progress</option>
                <option value="review">In Review</option>
                <option value="approved">Approved</option>
              </select>
            </div>
          </div>
        </div>

        {/* DTLIB Cards */}
        {filteredDTLibs.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <BookOpen className="size-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-slate-900 mb-2">No libraries found</h3>
            <p className="text-slate-600 mb-6">
              {searchQuery || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Get started by creating your first Digital Twin Library'}
            </p>
            {!searchQuery && filterStatus === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Plus className="size-5" />
                Create DTLIB
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredDTLibs.map((lib) => (
              <button
                key={lib.id}
                onClick={() => onSelectDTLib(lib.id)}
                className="bg-white rounded-lg border border-slate-200 p-6 hover:border-slate-300 hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <BookOpen className="size-5 text-slate-700 flex-shrink-0" />
                      <h3 className="text-slate-900 truncate">{lib.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(lib.status)}`}>
                        {getStatusLabel(lib.status)}
                      </span>
                    </div>
                    <p className="text-slate-600 mb-4 line-clamp-2">{lib.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Identifier</span>
                        <p className="text-slate-900">{lib.lawIdentifier}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Jurisdiction</span>
                        <p className="text-slate-900">{lib.jurisdiction}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Version</span>
                        <p className="text-slate-900">{lib.version}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Effective Date</span>
                        <p className="text-slate-900">{lib.effectiveDate}</p>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="size-5 text-slate-400 group-hover:text-slate-700 transition-colors flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Create DTLIB Modal */}
      {showCreateModal && (
        <CreateDTLibModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(lib) => {
            onCreateDTLib(lib);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

function CreateDTLibModal({ onClose, onCreate }: { 
  onClose: () => void; 
  onCreate: (lib: Omit<DTLib, 'id'>) => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    lawIdentifier: '',
    jurisdiction: '',
    version: '1.0',
    status: 'draft' as DTLib['status'],
    effectiveDate: '',
    description: '',
    lawText: '',
    authoritativeUrl: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4">
          <h2 className="text-slate-900">Create New DTLIB</h2>
          <p className="text-slate-600 mt-1">Define a new Digital Twin Library for a statute</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-slate-700 mb-2">
              Statute Name <span className="text-slate-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Family Benefits Act 2024"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-slate-700 mb-2">
                Law Identifier <span className="text-slate-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.lawIdentifier}
                onChange={(e) => setFormData({ ...formData, lawIdentifier: e.target.value })}
                placeholder="e.g., FBA-2024-01"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-2">
                Jurisdiction <span className="text-slate-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.jurisdiction}
                onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })}
                placeholder="e.g., Federal"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-2">
                Version <span className="text-slate-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-2">
                Effective Date <span className="text-slate-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this statute..."
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-2">Authoritative Source URL</label>
            <input
              type="url"
              value={formData.authoritativeUrl}
              onChange={(e) => setFormData({ ...formData, authoritativeUrl: e.target.value })}
              placeholder="https://legislation.gov/..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="size-5 text-slate-700 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-900">
              You can add the full statutory text after creating the DTLIB in the detail view.
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Create DTLIB
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
