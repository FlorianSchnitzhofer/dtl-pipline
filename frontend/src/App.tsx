import { useState, useEffect } from 'react';
import { DTLibList } from './components/DTLibList';
import { DTLibDetail } from './components/DTLibDetail';
import { DTLWorkflow } from './components/DTLWorkflow';
import {
  dtlibAPI,
  dtlAPI,
  DTLibAPI,
  DTLAPI,
  normalizeDTLibStatus,
  normalizeDTLStatus,
} from './services/api';
import { Loader2, AlertCircle } from 'lucide-react';
import { copyToClipboard } from './utils/clipboard';

export type DTLib = {
  id: string;
  name: string;
  lawIdentifier: string;
  jurisdiction: string;
  version: string;
  status: 'draft' | 'in-progress' | 'review' | 'approved';
  effectiveDate: string;
  lawText: string;
  authoritativeUrl: string;
  description: string;
};

export type DTL = {
  id: string;
  dtlibId: string;
  name: string;
  description: string;
  ownerUserId?: number | null;
  version: string;
  legalText: string;
  legalReference: string;
  authoritativeUrl: string;
  category: string;
  tags: string[];
  ontologyOwl?: string;
  configurationOwl?: string;
  apiSpec?: string;
  mcpSpec?: string;
  tests?: Array<{
    id: string;
    name: string;
    description: string;
    status: 'pending' | 'passed' | 'failed';
  }>;
  logic?: string;
  reviewStatus: 'pending' | 'approved' | 'revision-requested';
  reviewComments?: string;
};

type View = 
  | { type: 'list' }
  | { type: 'dtlib-detail'; dtlibId: string }
  | { type: 'dtl-workflow'; dtlibId: string; dtlId: string };

// Helper functions to convert between API and UI types
function apiToUILib(api: DTLibAPI): DTLib {
  return {
    id: api.id,
    name: api.law_name,
    lawIdentifier: api.law_identifier,
    jurisdiction: api.jurisdiction,
    version: api.version,
    status: normalizeDTLibStatus(api.status),
    effectiveDate: api.effective_date || '',
    lawText: api.full_text || '',
    authoritativeUrl: api.authoritative_source_url || '',
    description: api.description || ''
  };
}

function uiToAPILib(ui: Partial<DTLib>): Partial<DTLibAPI> {
  const api: Partial<DTLibAPI> = {};
  if (ui.name !== undefined) api.law_name = ui.name;
  if (ui.lawIdentifier !== undefined) api.law_identifier = ui.lawIdentifier;
  if (ui.jurisdiction !== undefined) api.jurisdiction = ui.jurisdiction;
  if (ui.version !== undefined) api.version = ui.version;
  if (ui.status !== undefined) api.status = ui.status;
  if (ui.effectiveDate !== undefined) api.effective_date = ui.effectiveDate;
  if (ui.lawText !== undefined) api.full_text = ui.lawText;
  if (ui.authoritativeUrl !== undefined) api.authoritative_source_url = ui.authoritativeUrl;
  if (ui.description !== undefined) api.description = ui.description;
  return api;
}

function apiToUIDTL(api: DTLAPI): DTL {
  return {
    id: api.id,
    dtlibId: api.dtlib_id,
    name: api.title,
    description: api.description || '',
    ownerUserId: api.owner_user_id,
    version: api.version,
    legalText: api.legal_text,
    legalReference: api.legal_reference,
    authoritativeUrl: api.source_url || '',
    category: api.classification || '',
    tags: api.tags || [],
    reviewStatus: normalizeDTLStatus(api.status),
    reviewComments: ''
  };
}

function uiToAPIDTL(ui: Partial<DTL>): Partial<DTLAPI> {
  const api: Partial<DTLAPI> = {};
  if (ui.name !== undefined) api.title = ui.name;
  if (ui.description !== undefined) api.description = ui.description;
  if (ui.ownerUserId !== undefined) api.owner_user_id = ui.ownerUserId;
  if (ui.legalText !== undefined) api.legal_text = ui.legalText;
  if (ui.legalReference !== undefined) api.legal_reference = ui.legalReference;
  if (ui.authoritativeUrl !== undefined) api.source_url = ui.authoritativeUrl;
  if (ui.category !== undefined) api.classification = ui.category;
  if (ui.tags !== undefined) api.tags = ui.tags;
  if (ui.version !== undefined) api.version = ui.version;
  if (ui.reviewStatus !== undefined) api.status = ui.reviewStatus;
  return api;
}

export default function App() {
  const [view, setView] = useState<View>({ type: 'list' });
  const [dtlibs, setDtlibs] = useState<DTLib[]>([]);
  const [dtls, setDtls] = useState<DTL[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dtlLoadError, setDtlLoadError] = useState<string | null>(null);

  // Load DTLIBs on mount
  useEffect(() => {
    loadDTLibs();
  }, []);

  // Load DTLs when viewing a DTLIB
  useEffect(() => {
    if (view.type !== 'list') {
      loadDTLs(view.dtlibId);
    }
  }, [view]);

  const loadDTLibs = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiLibs = await dtlibAPI.list();
      setDtlibs(apiLibs.map(apiToUILib));
    } catch (err) {
      setDtlibs([]);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load DTLIBs from the backend'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadDTLs = async (dtlibId: string) => {
    try {
      setDtlLoadError(null);
      const apiDtls = await dtlAPI.list(dtlibId);
      setDtls(apiDtls.map(apiToUIDTL));
    } catch (err) {
      setDtls(prev => prev.filter(d => d.dtlibId !== dtlibId));
      const message = err instanceof Error ? err.message : 'Failed to load DTLs';
      setDtlLoadError(message);
      console.error('Failed to load DTLs:', err);
    }
  };

  const handleNavigate = (newView: View) => {
    setView(newView);
  };

  const handleUpdateDTLib = async (id: string, updates: Partial<DTLib>) => {
    try {
      const apiUpdates = uiToAPILib(updates);
      const updated = await dtlibAPI.update(id, apiUpdates);
      setDtlibs(prev => prev.map(lib => lib.id === id ? apiToUILib(updated) : lib));
    } catch (err) {
      alert('Failed to update DTLIB: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleCreateDTLib = async (newLib: Omit<DTLib, 'id'>) => {
    try {
      const apiData = {
        law_name: newLib.name,
        law_identifier: newLib.lawIdentifier,
        jurisdiction: newLib.jurisdiction,
        version: newLib.version,
        effective_date: newLib.effectiveDate,
        authoritative_source_url: newLib.authoritativeUrl,
        full_text: newLib.lawText,
        description: newLib.description,
        status: newLib.status,
        created_by: 1
      };
      const created = await dtlibAPI.create(apiData);
      setDtlibs(prev => [...prev, apiToUILib(created)]);
    } catch (err) {
      alert('Failed to create DTLIB: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleDeleteDTLib = async (id: string) => {
    try {
      await dtlibAPI.delete(id);
      setDtlibs(prev => prev.filter(lib => lib.id !== id));
      setDtls(prev => prev.filter(dtl => dtl.dtlibId !== id));
      if (view.type !== 'list') {
        setView({ type: 'list' });
      }
    } catch (err) {
      alert('Failed to delete DTLIB: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleCreateDTL = async (dtlibId: string, newDtl: Omit<DTL, 'id' | 'dtlibId'>) => {
    try {
      const apiData = {
        title: newDtl.name,
        legal_text: newDtl.legalText,
        legal_reference: newDtl.legalReference,
        description: newDtl.description,
        owner_user_id: newDtl.ownerUserId,
        classification: newDtl.category,
        tags: newDtl.tags,
        version: newDtl.version,
        status: newDtl.reviewStatus,
      };
      const created = await dtlAPI.create(dtlibId, apiData);
      setDtls(prev => [...prev, apiToUIDTL(created)]);
    } catch (err) {
      alert('Failed to create DTL: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleUpdateDTL = async (id: string, updates: Partial<DTL>) => {
    const dtl = dtls.find(d => d.id === id);
    if (!dtl) return;

    try {
      const apiUpdates = uiToAPIDTL(updates);
      const updated = await dtlAPI.update(dtl.dtlibId, id, apiUpdates);

      setDtls(prev => prev.map(d => {
        return d.id === id ? apiToUIDTL(updated) : d;
      }));
    } catch (err) {
      alert('Failed to update DTL: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleDeleteDTL = async (id: string) => {
    const dtl = dtls.find(d => d.id === id);
    if (!dtl) return;

    try {
      await dtlAPI.delete(dtl.dtlibId, id);
      setDtls(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      alert('Failed to delete DTL: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const currentDTLib = view.type !== 'list' ? dtlibs.find(lib => lib.id === view.dtlibId) : undefined;
  const currentDTLs = view.type !== 'list' ? dtls.filter(dtl => dtl.dtlibId === view.dtlibId) : [];
  const currentDTL = view.type === 'dtl-workflow' ? dtls.find(dtl => dtl.id === view.dtlId) : undefined;

  if (loading && view.type === 'list') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="size-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading Digital Twin Libraries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {view.type === 'list' && error && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-start gap-3">
            <AlertCircle className="size-5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div>
                <p className="font-medium">We couldn't load data from the backend.</p>
                <p className="text-sm">The list below shows no items until the connection is restored.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold">Details:</span>
                <code className="bg-white/60 border border-amber-200 rounded px-2 py-1 text-amber-950 break-words">
                  {error}
                </code>
                <button
                  onClick={() => copyToClipboard(error)}
                  className="px-2 py-1 bg-white/70 border border-amber-200 rounded text-amber-900 hover:bg-white"
                >
                  Copy error
                </button>
              </div>
            </div>
            <button
              onClick={loadDTLibs}
              className="ml-auto px-4 py-2 bg-amber-100 text-amber-900 rounded-lg hover:bg-amber-200 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {view.type === 'list' && (
        <DTLibList
          dtlibs={dtlibs}
          onSelectDTLib={(id) => handleNavigate({ type: 'dtlib-detail', dtlibId: id })}
          onCreateDTLib={handleCreateDTLib}
          onDeleteDTLib={handleDeleteDTLib}
        />
      )}

      {view.type === 'dtlib-detail' && dtlLoadError && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-start gap-3">
            <AlertCircle className="size-5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <p>DTLs could not be loaded for this library.</p>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold">Details:</span>
                <code className="bg-white/60 border border-amber-200 rounded px-2 py-1 text-amber-950 break-words">
                  {dtlLoadError}
                </code>
                <button
                  onClick={() => copyToClipboard(dtlLoadError)}
                  className="px-2 py-1 bg-white/70 border border-amber-200 rounded text-amber-900 hover:bg-white"
                >
                  Copy error
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {view.type === 'dtlib-detail' && currentDTLib && (
        <DTLibDetail
          dtlib={currentDTLib}
          dtls={currentDTLs}
          onBack={() => handleNavigate({ type: 'list' })}
          onUpdateDTLib={handleUpdateDTLib}
          onCreateDTL={(newDtl) => handleCreateDTL(currentDTLib.id, newDtl)}
          onSelectDTL={(dtlId) => handleNavigate({ type: 'dtl-workflow', dtlibId: currentDTLib.id, dtlId })}
          onDeleteDTL={handleDeleteDTL}
        />
      )}

      {view.type === 'dtl-workflow' && currentDTLib && currentDTL && (
        <DTLWorkflow
          dtlib={currentDTLib}
          dtl={currentDTL}
          onBack={() => handleNavigate({ type: 'dtlib-detail', dtlibId: currentDTLib.id })}
          onUpdateDTL={handleUpdateDTL}
        />
      )}
    </div>
  );
}
