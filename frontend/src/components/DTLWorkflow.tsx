import { useEffect, useState } from 'react';
import { ChevronLeft, FileText, Network, Code, Settings, TestTube, Cpu, CheckCircle, BookOpen, ExternalLink, Sparkles, Check, AlertCircle, Clock } from 'lucide-react';
import type { DTLib, DTL } from '../App';
import {
  configurationAPI,
  interfaceAPI,
  logicAPI,
  ontologyAPI,
  testAPI,
  type ConfigurationData,
  type InterfaceData,
  type LogicData,
  type OntologyData,
  type TestCase,
  dtlAPI,
} from '../services/api';

type Stage = 0 | 1 | 2 | 3 | 4 | 5 | 6;

type Props = {
  dtlib: DTLib;
  dtl: DTL;
  onBack: () => void;
  onUpdateDTL: (id: string, updates: Partial<DTL>) => void;
};

function useGenerationProgress(isActive: boolean) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setProgress((prev) => (prev > 0 && prev < 100 ? 100 : prev));
      return;
    }

    setElapsedSeconds(0);
    setProgress(2);
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      setElapsedSeconds(Number(elapsed.toFixed(1)));
      const nextProgress = Math.min(90, elapsed * 7.5);
      setProgress(Number(nextProgress.toFixed(1)));
    }, 200);

    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    if (!isActive && progress === 100) {
      const reset = setTimeout(() => setElapsedSeconds(0), 1500);
      return () => clearTimeout(reset);
    }
  }, [isActive, progress]);

  return { progress: Math.min(progress, 100), elapsedSeconds };
}

function GenerationProgressBar({
  label,
  progress,
  elapsedSeconds,
}: {
  label: string;
  progress: number;
  elapsedSeconds: number;
}) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-600">
      <Clock className="size-4 text-indigo-500" />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-slate-700">{label}</span>
          <span className="text-xs text-slate-500">{elapsedSeconds.toFixed(1)}s</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function RawResponsePanel({ label, content }: { label: string; content?: string }) {
  if (!content) return null;
  return (
    <div className="mt-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">{label}</p>
      <pre className="text-xs text-slate-800 whitespace-pre-wrap break-words max-h-64 overflow-auto">{content}</pre>
    </div>
  );
}

export function DTLWorkflow({ dtlib, dtl, onBack, onUpdateDTL }: Props) {
  const [currentStage, setCurrentStage] = useState<Stage>(0);
  const ownerLabel = dtl.ownerUserId ? `User #${dtl.ownerUserId}` : 'Unassigned';
  const [ontology, setOntology] = useState<OntologyData | null>(null);
  const [interfaceSpec, setInterfaceSpec] = useState<InterfaceData | null>(null);
  const [configuration, setConfiguration] = useState<ConfigurationData | null>(null);
  const [tests, setTests] = useState<TestCase[]>([]);
  const [logic, setLogic] = useState<LogicData | null>(null);
  const [rawResponses, setRawResponses] = useState<Record<string, string>>(() => {
    const stored = localStorage.getItem(`llm-responses-${dtl.id}`);
    return stored ? (JSON.parse(stored) as Record<string, string>) : {};
  });
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isLoadingArtifacts, setIsLoadingArtifacts] = useState(false);
  const [artifactError, setArtifactError] = useState<string | null>(null);
  const bulkProgress = useGenerationProgress(isGeneratingAll);

  const stages = [
    { id: 0 as Stage, name: 'Metadata', icon: FileText, color: 'blue' },
    { id: 1 as Stage, name: 'Ontology', icon: Network, color: 'purple' },
    { id: 2 as Stage, name: 'Interface', icon: Code, color: 'cyan' },
    { id: 3 as Stage, name: 'Configuration', icon: Settings, color: 'orange' },
    { id: 4 as Stage, name: 'Tests', icon: TestTube, color: 'pink' },
    { id: 5 as Stage, name: 'Logic', icon: Cpu, color: 'indigo' },
    { id: 6 as Stage, name: 'Review', icon: CheckCircle, color: 'emerald' }
  ];

  useEffect(() => {
    const fetchArtifacts = async () => {
      setIsLoadingArtifacts(true);
      setArtifactError(null);
      try {
        const [existingOntology, existingInterface, existingConfiguration, existingTests, existingLogic] = await Promise.all([
          ontologyAPI.get(dtlib.id, dtl.id),
          interfaceAPI.get(dtlib.id, dtl.id),
          configurationAPI.get(dtlib.id, dtl.id),
          testAPI.list(dtlib.id, dtl.id),
          logicAPI.get(dtlib.id, dtl.id),
        ]);

        setOntology(existingOntology);
        setInterfaceSpec(existingInterface);
        setConfiguration(existingConfiguration);
        setTests(existingTests || []);
        setLogic(existingLogic);
          setRawResponses((prev) => {
            const next = { ...prev };
          if (!next.ontology && existingOntology?.ontology_owl) {
            next.ontology = existingOntology.raw_response ?? existingOntology.ontology_owl;
          }
          if (!next.interface && existingInterface) {
            next.interface = JSON.stringify(existingInterface, null, 2);
          }
          if (!next.configuration && existingConfiguration?.configuration_owl) {
            next.configuration = existingConfiguration.configuration_owl;
          }
          if (!next.tests && existingTests?.length) {
            next.tests = JSON.stringify(existingTests, null, 2);
          }
          if (!next.logic && existingLogic?.code) {
            next.logic = existingLogic.code;
          }
          return next;
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load artifacts';
        setArtifactError(message);
      } finally {
        setIsLoadingArtifacts(false);
      }
    };

    fetchArtifacts();
  }, [dtl.id, dtl.dtlibId, dtlib.id]);

  useEffect(() => {
    localStorage.setItem(`llm-responses-${dtl.id}`, JSON.stringify(rawResponses));
  }, [dtl.id, rawResponses]);

  const handleGenerateAll = async () => {
    setIsGeneratingAll(true);
    setArtifactError(null);
    try {
      const result = await dtlAPI.generateAll(dtlib.id, dtl.id);
      setOntology(result.ontology);
      setInterfaceSpec(result.interface);
      setConfiguration(result.configuration);
      setTests(result.tests || []);
      setLogic(result.logic);
      setRawResponses({
        ontology: result.ontology_raw,
        interface: result.interface_raw,
        configuration: result.configuration_raw,
        tests: result.tests_raw,
        logic: result.logic_raw,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate artifacts';
      setArtifactError(message);
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const handleSaveOntology = async (ontologyOwl: string) => {
    const payload = await ontologyAPI.save(dtlib.id, dtl.id, { ontology_owl: ontologyOwl });
    setOntology(payload);
  };

  const handleGenerateOntology = async () => {
    const payload = await ontologyAPI.generate(dtlib.id, dtl.id);
    if (payload) {
      setOntology(payload);
      setRawResponses((prev) => ({
        ...prev,
        ontology: payload.raw_response ?? payload.ontology_owl,
      }));
      return payload.ontology_owl;
    }
    return null;
  };

  const handleSaveInterface = async (data: InterfaceData) => {
    const payload = await interfaceAPI.save(dtlib.id, dtl.id, data);
    setInterfaceSpec(payload);
  };

  const handleGenerateInterface = async () => {
    const payload = await interfaceAPI.generate(dtlib.id, dtl.id);
    if (payload) {
      setInterfaceSpec(payload);
      setRawResponses((prev) => ({ ...prev, interface: JSON.stringify(payload, null, 2) }));
    }
  };

  const handleSaveConfiguration = async (configurationOwl: string) => {
    const payload = await configurationAPI.save(dtlib.id, dtl.id, { configuration_owl: configurationOwl });
    setConfiguration(payload);
  };

  const handleGenerateConfiguration = async () => {
    const payload = await configurationAPI.generate(dtlib.id, dtl.id);
    if (payload) {
      setConfiguration(payload);
      setRawResponses((prev) => ({ ...prev, configuration: payload.configuration_owl }));
      return payload.configuration_owl;
    }
    return null;
  };

  const handleGenerateTests = async () => {
    const payload = await testAPI.generate(dtlib.id, dtl.id);
    if (payload) {
      setTests(payload);
      setRawResponses((prev) => ({ ...prev, tests: JSON.stringify(payload, null, 2) }));
    }
  };

  const handleGenerateLogic = async () => {
    const payload = await logicAPI.generate(dtlib.id, dtl.id);
    if (payload) {
      setLogic(payload);
      setRawResponses((prev) => ({ ...prev, logic: payload.code }));
    }
  };

  const handleSaveLogic = async (code: string, language?: string) => {
    const payload = await logicAPI.save(dtlib.id, dtl.id, { code, language: language || 'Python' });
    setLogic({ code, language: language || 'Python' });
    return payload;
  };

  const getStageColor = (color: string, variant: 'bg' | 'text' | 'border' | 'hover') => {
    const colors = {
      blue: { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-500', hover: 'hover:bg-blue-600' },
      purple: { bg: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-500', hover: 'hover:bg-purple-600' },
      cyan: { bg: 'bg-cyan-500', text: 'text-cyan-600', border: 'border-cyan-500', hover: 'hover:bg-cyan-600' },
      orange: { bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-500', hover: 'hover:bg-orange-600' },
      pink: { bg: 'bg-pink-500', text: 'text-pink-600', border: 'border-pink-500', hover: 'hover:bg-pink-600' },
      indigo: { bg: 'bg-indigo-500', text: 'text-indigo-600', border: 'border-indigo-500', hover: 'hover:bg-indigo-600' },
      emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-500', hover: 'hover:bg-emerald-600' }
    };
    return colors[color as keyof typeof colors]?.[variant] || '';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Sidebar - DTLIB Context */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-4"
          >
            <ChevronLeft className="size-5" />
            Back to DTLIB
          </button>
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="size-5 text-blue-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-slate-500 truncate">DTLIB</p>
              <p className="text-slate-900 truncate">{dtlib.name}</p>
            </div>
          </div>
          <div className="text-sm text-slate-600">
            <p>{dtlib.lawIdentifier} • v{dtlib.version}</p>
          </div>
        </div>

          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <p className="text-sm text-slate-500 mb-2">Current DTL</p>
            <h3 className="text-slate-900 mb-3">{dtl.name}</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-500">Owner:</span>
                <p className="text-slate-900">{ownerLabel}</p>
              </div>
            <div>
              <span className="text-slate-500">Category:</span>
              <p className="text-slate-900">{dtl.category}</p>
            </div>
            <div>
              <span className="text-slate-500">Reference:</span>
              <p className="text-slate-900">{dtl.legalReference}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-sm text-slate-500 mb-3">Legal Text</p>
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <pre className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
              {dtl.legalText}
            </pre>
          </div>
          {dtl.authoritativeUrl && (
            <a
              href={dtl.authoritativeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 mt-3 flex items-center gap-2 text-sm"
            >
              View Source
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Stage Navigation */}
        <div className="bg-white border-b border-slate-200 px-8 py-6 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-slate-900 mb-1">DTL Workflow</h1>
              <p className="text-sm text-slate-600">Generate ontology, interfaces, configuration, tests, and logic directly from the legal text.</p>
            </div>
            <div className="flex items-center gap-3">
              {artifactError && (
                <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                  <AlertCircle className="size-4" />
                  <span className="text-sm">{artifactError}</span>
                </div>
              )}
              <button
                onClick={handleGenerateAll}
                disabled={isGeneratingAll || isLoadingArtifacts}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <Sparkles className="size-4" />
                {isGeneratingAll ? 'Generating with AI...' : 'Generate All Artifacts'}
              </button>
            </div>
          </div>
          {isGeneratingAll && (
            <div className="pt-2">
              <GenerationProgressBar
                label="Gesamte Artefakt-Generierung"
                progress={bulkProgress.progress}
                elapsedSeconds={bulkProgress.elapsedSeconds}
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            {stages.map((stage, idx) => {
              const Icon = stage.icon;
              const isActive = currentStage === stage.id;
              const isCompleted = currentStage > stage.id;
              
              return (
                <div key={stage.id} className="flex items-center">
                  <button
                    onClick={() => setCurrentStage(stage.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isActive
                        ? `${getStageColor(stage.color, 'bg')} text-white shadow-lg`
                        : isCompleted
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="size-4" />
                    ) : (
                      <Icon className="size-4" />
                    )}
                    <span className="text-sm">{stage.name}</span>
                  </button>
                  {idx < stages.length - 1 && (
                    <div className={`w-8 h-0.5 ${isCompleted ? 'bg-slate-300' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stage Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {currentStage === 0 && <MetadataStage dtl={dtl} onUpdate={onUpdateDTL} />}
          {currentStage === 1 && (
            <OntologyStage
              dtl={dtl}
              ontology={ontology}
              rawResponse={rawResponses.ontology}
              isLoading={isLoadingArtifacts}
              onGenerate={handleGenerateOntology}
              onSave={handleSaveOntology}
            />
          )}
          {currentStage === 2 && (
            <InterfaceStage
              dtl={dtl}
              interfaceSpec={interfaceSpec}
              rawResponse={rawResponses.interface}
              isLoading={isLoadingArtifacts}
              onGenerate={handleGenerateInterface}
              onSave={handleSaveInterface}
            />
          )}
          {currentStage === 3 && (
            <ConfigurationStage
              dtl={dtl}
              configuration={configuration}
              rawResponse={rawResponses.configuration}
              isLoading={isLoadingArtifacts}
              onGenerate={handleGenerateConfiguration}
              onSave={handleSaveConfiguration}
            />
          )}
          {currentStage === 4 && (
            <TestsStage
              dtl={dtl}
              tests={tests}
              rawResponse={rawResponses.tests}
              isLoading={isLoadingArtifacts}
              onGenerate={handleGenerateTests}
            />
          )}
          {currentStage === 5 && (
            <LogicStage
              dtl={dtl}
              logic={logic}
              rawResponse={rawResponses.logic}
              isLoading={isLoadingArtifacts}
              onGenerate={handleGenerateLogic}
              onSave={handleSaveLogic}
            />
          )}
          {currentStage === 6 && (
            <ReviewStage
              dtl={dtl}
              onUpdate={onUpdateDTL}
              artifacts={{
                ontology: !!ontology?.ontology_owl,
                interface: !!interfaceSpec,
                configuration: !!configuration?.configuration_owl,
                tests: tests.length > 0,
                logic: !!logic?.code,
              }}
              rawResponses={rawResponses}
              tests={tests}
            />
          )}
        </div>

        {/* Navigation Footer */}
        <div className="bg-white border-t border-slate-200 px-8 py-4 flex justify-between">
          <button
            onClick={() => currentStage > 0 && setCurrentStage((currentStage - 1) as Stage)}
            disabled={currentStage === 0}
            className="px-6 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => currentStage < 6 && setCurrentStage((currentStage + 1) as Stage)}
            disabled={currentStage === 6}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentStage === 6 ? 'Complete' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

function MetadataStage({ dtl, onUpdate }: { dtl: DTL; onUpdate: (id: string, updates: Partial<DTL>) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: dtl.name,
    description: dtl.description,
    ownerUserId: dtl.ownerUserId ? String(dtl.ownerUserId) : '',
    category: dtl.category,
    tags: dtl.tags.join(', ')
  });

  const handleSave = () => {
    onUpdate(dtl.id, {
      name: formData.name,
      description: formData.description,
      ownerUserId: formData.ownerUserId ? Number(formData.ownerUserId) : null,
      category: formData.category,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
    });
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-slate-900 mb-2">DTL Metadata</h2>
          <p className="text-slate-600">Define core information about this Digital Twin of Legislation</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Edit Metadata
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        {isEditing ? (
          <div className="space-y-6">
            <div>
              <label className="block text-slate-700 mb-2">DTL Title / Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-2">Semantic Description <span className="text-red-500">*</span></label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Explain what legal function this DTL performs..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-slate-700 mb-2">Owner / Responsible Person</label>
              <input
                type="number"
                value={formData.ownerUserId}
                onChange={(e) => setFormData({ ...formData, ownerUserId: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

              <div>
                <label className="block text-slate-700 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Eligibility">Eligibility</option>
                  <option value="Calculation">Calculation</option>
                  <option value="Process">Process</option>
                  <option value="Definition">Definition</option>
                  <option value="Validation">Validation</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 mb-2">Tags (comma-separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="eligibility, income-test, family"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    name: dtl.name,
                    description: dtl.description,
                    ownerUserId: dtl.ownerUserId ? String(dtl.ownerUserId) : '',
                    category: dtl.category,
                    tags: dtl.tags.join(', ')
                  });
                }}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <span className="text-slate-500 text-sm">DTL Title / Name</span>
              <p className="text-slate-900 mt-1">{dtl.name}</p>
            </div>
            <div>
              <span className="text-slate-500 text-sm">Semantic Description</span>
              <p className="text-slate-900 mt-1">{dtl.description}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <span className="text-slate-500 text-sm">Owner</span>
                <p className="text-slate-900 mt-1">{dtl.ownerUserId ? `User #${dtl.ownerUserId}` : 'Unassigned'}</p>
              </div>
              <div>
                <span className="text-slate-500 text-sm">Category</span>
                <p className="text-slate-900 mt-1">{dtl.category}</p>
              </div>
              <div>
                <span className="text-slate-500 text-sm">Version</span>
                <p className="text-slate-900 mt-1">{dtl.version}</p>
              </div>
            </div>
            <div>
              <span className="text-slate-500 text-sm">Tags</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {dtl.tags.length > 0 ? dtl.tags.map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                    {tag}
                  </span>
                )) : (
                  <p className="text-slate-500 text-sm">No tags</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OntologyStage({
  dtl,
  ontology,
  rawResponse,
  isLoading: _isLoading,
  onGenerate,
  onSave,
}: {
  dtl: DTL;
  ontology: OntologyData | null;
  rawResponse?: string;
  isLoading: boolean;
  onGenerate: () => Promise<string | null>;
  onSave: (value: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [owlContent, setOwlContent] = useState(ontology?.ontology_owl || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const progress = useGenerationProgress(isGenerating);

  useEffect(() => {
    setOwlContent(ontology?.ontology_owl || '');
  }, [ontology?.ontology_owl, dtl.id]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const generated = await onGenerate();
    if (generated) {
      setOwlContent(generated);
    }
    setIsGenerating(false);
  };

  const handleSave = async () => {
    await onSave(owlContent);
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-slate-900 mb-2">Ontology Design</h2>
          <p className="text-slate-600">Define the semantic model and concepts for this DTL</p>
        </div>
        <div className="flex items-center gap-3">
          {!ontology?.ontology_owl && !owlContent && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <Sparkles className="size-4" />
              {isGenerating ? 'Generating...' : 'Generate from Law'}
            </button>
          )}
          {!isEditing && (ontology?.ontology_owl || owlContent) && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            >
              Edit OWL
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        {isGenerating && (
          <div className="mb-4">
            <GenerationProgressBar
              label="Processing ontology response"
              progress={progress.progress}
              elapsedSeconds={progress.elapsedSeconds}
            />
          </div>
        )}
        {!ontology?.ontology_owl && !owlContent ? (
          <div className="text-center py-12">
            <Network className="size-12 text-purple-300 mx-auto mb-4" />
            <h3 className="text-slate-900 mb-2">No ontology defined yet</h3>
            <p className="text-slate-600 mb-6">
              Generate an ontology from the legal text using AI assistance
            </p>
          </div>
        ) : isEditing ? (
          <div className="space-y-4">
            <textarea
              value={owlContent}
              onChange={(e) => setOwlContent(e.target.value)}
              rows={20}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm bg-slate-50"
            />
            <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setOwlContent(ontology?.ontology_owl || '');
                }}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Save OWL
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <pre className="text-xs text-slate-800 overflow-x-auto">
                {ontology?.ontology_owl || owlContent}
              </pre>
            </div>
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-900">
                <strong>Traceability:</strong> This ontology is derived from {dtl.legalReference} and defines the semantic concepts used in the DTL interface and logic.
              </p>
            </div>
            <RawResponsePanel label="LLM Antwort" content={rawResponse} />
          </div>
        )}
      </div>
    </div>
  );
}

function InterfaceStage({
  dtl,
  interfaceSpec,
  rawResponse,
  isLoading: _isLoading,
  onGenerate,
  onSave,
}: {
  dtl: DTL;
  interfaceSpec: InterfaceData | null;
  rawResponse?: string;
  isLoading: boolean;
  onGenerate: () => Promise<void>;
  onSave: (data: InterfaceData) => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<'api' | 'mcp'>('api');
  const [isEditing, setIsEditing] = useState(false);
  const [apiSpec, setApiSpec] = useState(
    interfaceSpec ? JSON.stringify({
      function_name: interfaceSpec.function_name,
      inputs: interfaceSpec.inputs,
      outputs: interfaceSpec.outputs,
    }, null, 2) : ''
  );
  const [mcpSpec, setMcpSpec] = useState(interfaceSpec?.mcp_spec ? JSON.stringify(interfaceSpec.mcp_spec, null, 2) : '');
  const [isGenerating, setIsGenerating] = useState(false);
  const progress = useGenerationProgress(isGenerating);

  useEffect(() => {
    if (interfaceSpec) {
      setApiSpec(
        JSON.stringify(
          {
            function_name: interfaceSpec.function_name,
            inputs: interfaceSpec.inputs,
            outputs: interfaceSpec.outputs,
          },
          null,
          2,
        ),
      );
      setMcpSpec(interfaceSpec.mcp_spec ? JSON.stringify(interfaceSpec.mcp_spec, null, 2) : '');
    }
  }, [interfaceSpec, dtl.id]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    await onGenerate();
    setIsGenerating(false);
  };

  const handleSave = async () => {
    try {
      const parsedApi = JSON.parse(apiSpec || '{}');
      const payload: InterfaceData = {
        function_name: parsedApi.function_name || dtl.name,
        inputs: parsedApi.inputs || [],
        outputs: parsedApi.outputs || [],
        mcp_spec: mcpSpec ? JSON.parse(mcpSpec) : undefined,
      };
      await onSave(payload);
      setIsEditing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save interface';
      alert(message);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-slate-900 mb-2">Interface Specification</h2>
          <p className="text-slate-600">Define API and MCP interfaces for external integration</p>
        </div>
        <div className="flex items-center gap-3">
          {!interfaceSpec && !apiSpec && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50"
            >
              <Sparkles className="size-4" />
              {isGenerating ? 'Generating...' : 'Generate Specs'}
            </button>
          )}
          {!isEditing && (interfaceSpec || apiSpec) && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
            >
              Edit Specs
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200">
        {isGenerating && (
          <div className="px-6 pt-6">
            <GenerationProgressBar
              label="Processing interface response"
              progress={progress.progress}
              elapsedSeconds={progress.elapsedSeconds}
            />
          </div>
        )}
        {!interfaceSpec && !apiSpec ? (
          <div className="p-6 text-center py-12">
            <Code className="size-12 text-cyan-300 mx-auto mb-4" />
            <h3 className="text-slate-900 mb-2">No interfaces defined yet</h3>
            <p className="text-slate-600 mb-6">
              Generate API and MCP specifications based on the ontology
            </p>
          </div>
        ) : (
          <>
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveTab('api')}
                className={`flex-1 px-6 py-3 text-sm transition-colors ${
                  activeTab === 'api'
                    ? 'border-b-2 border-cyan-600 text-cyan-600 bg-cyan-50'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                OpenAPI Specification
              </button>
              <button
                onClick={() => setActiveTab('mcp')}
                className={`flex-1 px-6 py-3 text-sm transition-colors ${
                  activeTab === 'mcp'
                    ? 'border-b-2 border-cyan-600 text-cyan-600 bg-cyan-50'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                MCP Definition
              </button>
            </div>

            <div className="p-6">
              {isEditing ? (
                <div className="space-y-4">
                  <textarea
                    value={activeTab === 'api' ? apiSpec : mcpSpec}
                    onChange={(e) => activeTab === 'api' ? setApiSpec(e.target.value) : setMcpSpec(e.target.value)}
                    rows={20}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-sm bg-slate-50"
                  />
                  {activeTab === 'api' && (
                    <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
                      <button
                        onClick={() => {
                  setIsEditing(false);
                  setApiSpec(interfaceSpec ? JSON.stringify(interfaceSpec, null, 2) : '');
                  setMcpSpec(interfaceSpec?.mcp_spec ? JSON.stringify(interfaceSpec.mcp_spec, null, 2) : '');
                }}
                        className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                      >
                        Save Specifications
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <pre className="text-xs text-slate-800 overflow-x-auto">
                    {activeTab === 'api' ? apiSpec : mcpSpec}
                  </pre>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <RawResponsePanel label="LLM Antwort" content={rawResponse} />
    </div>
  );
}

function ConfigurationStage({
  dtl,
  configuration,
  rawResponse,
  isLoading: _isLoading,
  onGenerate,
  onSave,
}: {
  dtl: DTL;
  configuration: ConfigurationData | null;
  rawResponse?: string;
  isLoading: boolean;
  onGenerate: () => Promise<string | null>;
  onSave: (value: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [configOwl, setConfigOwl] = useState(configuration?.configuration_owl || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const progress = useGenerationProgress(isGenerating);

  useEffect(() => {
    setConfigOwl(configuration?.configuration_owl || '');
  }, [configuration?.configuration_owl, dtl.id]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const generated = await onGenerate();
    if (generated) {
      setConfigOwl(generated);
    }
    setIsGenerating(false);
  };

  const handleSave = async () => {
    await onSave(configOwl);
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-slate-900 mb-2">Configuration Parameters</h2>
          <p className="text-slate-600">Define rates, thresholds, and time periods from the statute</p>
        </div>
        <div className="flex items-center gap-3">
          {!configuration?.configuration_owl && !configOwl && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              <Sparkles className="size-4" />
              {isGenerating ? 'Extracting...' : 'Extract from Law'}
            </button>
          )}
          {!isEditing && (configuration?.configuration_owl || configOwl) && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            >
              Edit Config
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        {isGenerating && (
          <div className="mb-4">
            <GenerationProgressBar
              label="Processing configuration response"
              progress={progress.progress}
              elapsedSeconds={progress.elapsedSeconds}
            />
          </div>
        )}
        {!configuration?.configuration_owl && !configOwl ? (
          <div className="text-center py-12">
            <Settings className="size-12 text-orange-300 mx-auto mb-4" />
            <h3 className="text-slate-900 mb-2">No configuration defined yet</h3>
            <p className="text-slate-600 mb-6">
              Extract configuration parameters from the statutory text
            </p>
          </div>
        ) : isEditing ? (
          <div className="space-y-4">
            <textarea
              value={configOwl}
              onChange={(e) => setConfigOwl(e.target.value)}
              rows={20}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm bg-slate-50"
            />
            <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setConfigOwl(configuration?.configuration_owl || '');
                }}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Save Configuration
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <pre className="text-xs text-slate-800 overflow-x-auto">
                {configuration?.configuration_owl || configOwl}
              </pre>
            </div>
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-900">
                <strong>Note:</strong> Configuration parameters are maintained separately from logic to support future legal amendments without code changes.
              </p>
            </div>
            <RawResponsePanel label="LLM Antwort" content={rawResponse} />
          </div>
        )}
      </div>
    </div>
  );
}

function TestsStage({
  dtl,
  tests,
  rawResponse,
  isLoading: _isLoading,
  onGenerate,
}: {
  dtl: DTL;
  tests: TestCase[];
  rawResponse?: string;
  isLoading: boolean;
  onGenerate: () => Promise<void>;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const progress = useGenerationProgress(isGenerating);

  const handleGenerate = async () => {
    setIsGenerating(true);
    await onGenerate();
    setIsGenerating(false);
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-slate-900 mb-2">Unit Test Design</h2>
          <p className="text-slate-600">Define test scenarios to validate DTL logic</p>
        </div>
        {tests.length === 0 && (
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50"
          >
            <Sparkles className="size-4" />
            {isGenerating ? 'Generating...' : 'Generate Tests'}
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        {isGenerating && (
          <div className="mb-4">
            <GenerationProgressBar
              label="Processing test scenarios"
              progress={progress.progress}
              elapsedSeconds={progress.elapsedSeconds}
            />
          </div>
        )}
        {tests.length === 0 ? (
          <div className="text-center py-12">
            <TestTube className="size-12 text-pink-300 mx-auto mb-4" />
            <h3 className="text-slate-900 mb-2">No tests defined yet</h3>
            <p className="text-slate-600 mb-6">
              Generate test scenarios based on the interface and configuration
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tests.map((test) => (
              <div
                key={test.id}
                className="border border-slate-200 rounded-lg p-4 hover:border-pink-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-slate-900">{test.name}</h4>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        test.last_result === 'passed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : test.last_result === 'failed'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {test.last_result === 'passed'
                          ? 'Passed'
                          : test.last_result === 'failed'
                          ? 'Failed'
                          : 'Pending'}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm">{test.description}</p>
                    <p className="text-slate-500 text-xs">Expected: {JSON.stringify(test.expected_output)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <RawResponsePanel label="LLM Antwort" content={rawResponse} />
    </div>
  );
}

function LogicStage({
  dtl,
  logic,
  rawResponse,
  isLoading: _isLoading,
  onGenerate,
  onSave,
}: {
  dtl: DTL;
  logic: LogicData | null;
  rawResponse?: string;
  isLoading: boolean;
  onGenerate: () => Promise<void>;
  onSave: (code: string, language?: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [logicContent, setLogicContent] = useState(logic?.code || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const progress = useGenerationProgress(isGenerating);

  useEffect(() => {
    setLogicContent(logic?.code || '');
  }, [logic?.code, dtl.id]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    await onGenerate();
    setIsGenerating(false);
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-slate-900 mb-2">Logic Implementation</h2>
          <p className="text-slate-600">Implement deterministic, auditable logic for the DTL</p>
        </div>
        <div className="flex items-center gap-3">
          {!logicContent && !logic && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Sparkles className="size-4" />
              {isGenerating ? 'Drafting...' : 'Draft Logic'}
            </button>
          )}
          {!isEditing && (logicContent || logic) && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              Edit Logic
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        {isGenerating && (
          <div className="mb-4">
            <GenerationProgressBar
              label="Processing logic response"
              progress={progress.progress}
              elapsedSeconds={progress.elapsedSeconds}
            />
          </div>
        )}
        {!logicContent && !logic ? (
          <div className="text-center py-12">
            <Cpu className="size-12 text-indigo-300 mx-auto mb-4" />
            <h3 className="text-slate-900 mb-2">No logic implemented yet</h3>
            <p className="text-slate-600 mb-6">
              Draft executable logic based on the statutory text, configuration, and tests
            </p>
          </div>
        ) : isEditing ? (
          <div className="space-y-4">
            <textarea
              value={logicContent}
              onChange={(e) => setLogicContent(e.target.value)}
              rows={20}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm bg-slate-50"
            />
            <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setLogicContent(logic?.code || '');
                }}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onSave(logicContent, logic?.language);
                  setIsEditing(false);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Save Logic
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <pre className="text-sm text-slate-800 overflow-x-auto">
                {logicContent}
              </pre>
            </div>
            <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <p className="text-sm text-indigo-900">
                <strong>Traceability:</strong> Logic steps are linked to {dtl.legalReference}, configuration parameters, and ontology elements.
              </p>
            </div>
          </div>
        )}
      </div>

      <RawResponsePanel label="LLM Antwort" content={rawResponse} />
    </div>
  );
}

function ReviewStage({
  dtl,
  onUpdate,
  artifacts,
  rawResponses,
  tests,
}: {
  dtl: DTL;
  onUpdate: (id: string, updates: Partial<DTL>) => void;
  artifacts: { ontology: boolean; interface: boolean; configuration: boolean; tests: boolean; logic: boolean };
  rawResponses: Record<string, string>;
  tests: TestCase[];
}) {
  const [reviewComments, setReviewComments] = useState(dtl.reviewComments || '');
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const completionStatus = {
    metadata: true,
    ontology: artifacts.ontology,
    interface: artifacts.interface,
    configuration: artifacts.configuration,
    tests: artifacts.tests,
    logic: artifacts.logic
  };

  const completionPercentage = Math.round(
    (Object.values(completionStatus).filter(Boolean).length / Object.keys(completionStatus).length) * 100
  );

  const handleApprove = () => {
    onUpdate(dtl.id, { reviewStatus: 'approved', reviewComments: '' });
    setShowApprovalModal(false);
  };

  const handleRequestRevision = () => {
    onUpdate(dtl.id, { reviewStatus: 'revision-requested', reviewComments });
    setShowApprovalModal(false);
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-slate-900 mb-2">Review & Approval</h2>
          <p className="text-slate-600">Consolidated view of all DTL artifacts for final approval</p>
        </div>
        <button
          onClick={() => setShowApprovalModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <CheckCircle className="size-4" />
          Review & Approve
        </button>
      </div>

      <div className="space-y-6">
        {/* Completion Status */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-900">Workflow Completion</h3>
            <span className="text-2xl text-emerald-600">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 mb-4">
            <div
              className="bg-emerald-600 h-3 rounded-full transition-all"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(completionStatus).map(([key, completed]) => (
              <div key={key} className="flex items-center gap-2">
                {completed ? (
                  <CheckCircle className="size-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="size-5 text-amber-600" />
                )}
                <span className="text-slate-700 capitalize">{key}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h4 className="text-slate-900 mb-4">Legal Basis</h4>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-slate-500">Reference:</span>
                <p className="text-slate-900">{dtl.legalReference}</p>
              </div>
              <div>
                <span className="text-slate-500">Legal Text:</span>
                <p className="text-slate-700 text-xs bg-slate-50 p-2 rounded mt-1 line-clamp-3">
                  {dtl.legalText}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h4 className="text-slate-900 mb-4">Artifacts Status</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Ontology (OWL)</span>
                <span className={artifacts.ontology ? 'text-emerald-600' : 'text-amber-600'}>
                  {artifacts.ontology ? 'Defined' : 'Missing'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">API Specification</span>
                <span className={artifacts.interface ? 'text-emerald-600' : 'text-amber-600'}>
                  {artifacts.interface ? 'Defined' : 'Missing'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Configuration</span>
                <span className={artifacts.configuration ? 'text-emerald-600' : 'text-amber-600'}>
                  {artifacts.configuration ? 'Defined' : 'Missing'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Unit Tests</span>
                <span className={tests.length > 0 ? 'text-emerald-600' : 'text-amber-600'}>
                  {tests.length} tests
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Logic</span>
                <span className={artifacts.logic ? 'text-emerald-600' : 'text-amber-600'}>
                  {artifacts.logic ? 'Implemented' : 'Missing'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Test Results */}
        {tests && tests.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h4 className="text-slate-900 mb-4">Test Execution Summary</h4>
            <div className="space-y-2">
              {tests.map((test) => (
                <div key={test.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{test.name}</span>
                  <span className={`px-3 py-1 rounded-full ${
                    test.last_result === 'passed'
                      ? 'bg-emerald-100 text-emerald-700'
                      : test.last_result === 'failed'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {test.last_result || 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Review Status */}
        <div className={`rounded-lg border p-6 ${
          dtl.reviewStatus === 'approved'
            ? 'bg-emerald-50 border-emerald-200'
            : dtl.reviewStatus === 'revision-requested'
            ? 'bg-red-50 border-red-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            {dtl.reviewStatus === 'approved' ? (
              <CheckCircle className="size-5 text-emerald-600" />
            ) : dtl.reviewStatus === 'revision-requested' ? (
              <AlertCircle className="size-5 text-red-600" />
            ) : (
              <Clock className="size-5 text-amber-600" />
            )}
            <h4 className={
              dtl.reviewStatus === 'approved'
                ? 'text-emerald-900'
                : dtl.reviewStatus === 'revision-requested'
                ? 'text-red-900'
                : 'text-amber-900'
            }>
              {dtl.reviewStatus === 'approved'
                ? 'DTL Approved'
                : dtl.reviewStatus === 'revision-requested'
                ? 'Revision Requested'
                : 'Pending Review'}
            </h4>
          </div>
          {dtl.reviewComments && (
            <p className={`text-sm ${
              dtl.reviewStatus === 'approved'
                ? 'text-emerald-800'
                : dtl.reviewStatus === 'revision-requested'
                ? 'text-red-800'
                : 'text-amber-800'
            }`}>
              {dtl.reviewComments}
            </p>
          )}
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 className="text-slate-900">DTL Review Decision</h3>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-slate-600">
                Review all artifacts and decide whether to approve this DTL or request revisions.
              </p>

              <div>
                <label className="block text-slate-700 mb-2">Review Comments (optional for approval, required for revisions)</label>
                <textarea
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  rows={4}
                  placeholder="Add any comments or feedback..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="border-t border-slate-200 px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestRevision}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Request Revision
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Approve DTL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
