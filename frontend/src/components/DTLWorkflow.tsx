import { useState } from 'react';
import { ChevronLeft, FileText, Network, Code, Settings, TestTube, Cpu, CheckCircle, BookOpen, ExternalLink, Sparkles, Check, AlertCircle, Clock } from 'lucide-react';
import type { DTLib, DTL } from '../App';

type Stage = 0 | 1 | 2 | 3 | 4 | 5 | 6;

type Props = {
  dtlib: DTLib;
  dtl: DTL;
  onBack: () => void;
  onUpdateDTL: (id: string, updates: Partial<DTL>) => void;
};

export function DTLWorkflow({ dtlib, dtl, onBack, onUpdateDTL }: Props) {
  const [currentStage, setCurrentStage] = useState<Stage>(0);

  const stages = [
    { id: 0 as Stage, name: 'Metadata', icon: FileText, color: 'blue' },
    { id: 1 as Stage, name: 'Ontology', icon: Network, color: 'purple' },
    { id: 2 as Stage, name: 'Interface', icon: Code, color: 'cyan' },
    { id: 3 as Stage, name: 'Configuration', icon: Settings, color: 'orange' },
    { id: 4 as Stage, name: 'Tests', icon: TestTube, color: 'pink' },
    { id: 5 as Stage, name: 'Logic', icon: Cpu, color: 'indigo' },
    { id: 6 as Stage, name: 'Review', icon: CheckCircle, color: 'emerald' }
  ];

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
              <p className="text-slate-900">{dtl.owner}</p>
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
        <div className="bg-white border-b border-slate-200 px-8 py-6">
          <h1 className="text-slate-900 mb-6">DTL Workflow</h1>
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
          {currentStage === 1 && <OntologyStage dtl={dtl} onUpdate={onUpdateDTL} />}
          {currentStage === 2 && <InterfaceStage dtl={dtl} onUpdate={onUpdateDTL} />}
          {currentStage === 3 && <ConfigurationStage dtl={dtl} onUpdate={onUpdateDTL} />}
          {currentStage === 4 && <TestsStage dtl={dtl} onUpdate={onUpdateDTL} />}
          {currentStage === 5 && <LogicStage dtl={dtl} onUpdate={onUpdateDTL} />}
          {currentStage === 6 && <ReviewStage dtl={dtl} onUpdate={onUpdateDTL} />}
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
    owner: dtl.owner,
    category: dtl.category,
    tags: dtl.tags.join(', ')
  });

  const handleSave = () => {
    onUpdate(dtl.id, {
      name: formData.name,
      description: formData.description,
      owner: formData.owner,
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
                  type="text"
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
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
                    owner: dtl.owner,
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
                <p className="text-slate-900 mt-1">{dtl.owner}</p>
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

function OntologyStage({ dtl, onUpdate }: { dtl: DTL; onUpdate: (id: string, updates: Partial<DTL>) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [owlContent, setOwlContent] = useState(dtl.ontologyOwl || '');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const generated = `<?xml version="1.0"?>
<rdf:RDF xmlns="http://www.legislation.gov/ontology/${dtl.id}#"
     xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
     xmlns:owl="http://www.w3.org/2002/07/owl#"
     xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#">
    
    <!-- Generated from legal text -->
    <owl:Class rdf:about="#LegalEntity">
        <rdfs:label>Legal Entity</rdfs:label>
        <rdfs:comment>Base class for entities referenced in legislation</rdfs:comment>
    </owl:Class>
    
</rdf:RDF>`;
      setOwlContent(generated);
      setIsGenerating(false);
    }, 2000);
  };

  const handleSave = () => {
    onUpdate(dtl.id, { ontologyOwl: owlContent });
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
          {!dtl.ontologyOwl && !owlContent && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <Sparkles className="size-4" />
              {isGenerating ? 'Generating...' : 'Generate from Law'}
            </button>
          )}
          {!isEditing && (dtl.ontologyOwl || owlContent) && (
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
        {!dtl.ontologyOwl && !owlContent ? (
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
                  setOwlContent(dtl.ontologyOwl || '');
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
                {dtl.ontologyOwl || owlContent}
              </pre>
            </div>
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-900">
                <strong>Traceability:</strong> This ontology is derived from {dtl.legalReference} and defines the semantic concepts used in the DTL interface and logic.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InterfaceStage({ dtl, onUpdate }: { dtl: DTL; onUpdate: (id: string, updates: Partial<DTL>) => void }) {
  const [activeTab, setActiveTab] = useState<'api' | 'mcp'>('api');
  const [isEditing, setIsEditing] = useState(false);
  const [apiSpec, setApiSpec] = useState(dtl.apiSpec || '');
  const [mcpSpec, setMcpSpec] = useState(dtl.mcpSpec || '');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const generatedApi = `{
  "openapi": "3.0.0",
  "info": {
    "title": "${dtl.name} API",
    "version": "${dtl.version}"
  },
  "paths": {
    "/execute": {
      "post": {
        "summary": "${dtl.description}",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    }
  }
}`;
      const generatedMcp = `{
  "name": "${dtl.id}",
  "description": "${dtl.description}",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}`;
      setApiSpec(generatedApi);
      setMcpSpec(generatedMcp);
      setIsGenerating(false);
    }, 2000);
  };

  const handleSave = () => {
    onUpdate(dtl.id, { apiSpec, mcpSpec });
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-slate-900 mb-2">Interface Specification</h2>
          <p className="text-slate-600">Define API and MCP interfaces for external integration</p>
        </div>
        <div className="flex items-center gap-3">
          {!dtl.apiSpec && !apiSpec && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50"
            >
              <Sparkles className="size-4" />
              {isGenerating ? 'Generating...' : 'Generate Specs'}
            </button>
          )}
          {!isEditing && (dtl.apiSpec || apiSpec) && (
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
        {!dtl.apiSpec && !apiSpec ? (
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
                          setApiSpec(dtl.apiSpec || '');
                          setMcpSpec(dtl.mcpSpec || '');
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
                    {activeTab === 'api' ? (dtl.apiSpec || apiSpec) : (dtl.mcpSpec || mcpSpec)}
                  </pre>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ConfigurationStage({ dtl, onUpdate }: { dtl: DTL; onUpdate: (id: string, updates: Partial<DTL>) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [configOwl, setConfigOwl] = useState(dtl.configurationOwl || '');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const generated = `<?xml version="1.0"?>
<rdf:RDF xmlns="http://www.legislation.gov/config/${dtl.id}#"
     xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    
    <Configuration rdf:about="#${dtl.id}Config">
        <!-- Extracted from ${dtl.legalReference} -->
    </Configuration>
    
</rdf:RDF>`;
      setConfigOwl(generated);
      setIsGenerating(false);
    }, 2000);
  };

  const handleSave = () => {
    onUpdate(dtl.id, { configurationOwl: configOwl });
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
          {!dtl.configurationOwl && !configOwl && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              <Sparkles className="size-4" />
              {isGenerating ? 'Extracting...' : 'Extract from Law'}
            </button>
          )}
          {!isEditing && (dtl.configurationOwl || configOwl) && (
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
        {!dtl.configurationOwl && !configOwl ? (
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
                  setConfigOwl(dtl.configurationOwl || '');
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
                {dtl.configurationOwl || configOwl}
              </pre>
            </div>
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-900">
                <strong>Note:</strong> Configuration parameters are maintained separately from logic to support future legal amendments without code changes.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TestsStage({ dtl, onUpdate }: { dtl: DTL; onUpdate: (id: string, updates: Partial<DTL>) => void }) {
  const [tests, setTests] = useState(dtl.tests || []);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const generated = [
        { id: 't1', name: 'Standard case', description: 'Test with typical input values', status: 'pending' as const },
        { id: 't2', name: 'Boundary condition', description: 'Test at threshold limits', status: 'pending' as const },
        { id: 't3', name: 'Error handling', description: 'Test with invalid input', status: 'pending' as const }
      ];
      setTests(generated);
      onUpdate(dtl.id, { tests: generated });
      setIsGenerating(false);
    }, 2000);
  };

  const handleToggleStatus = (testId: string) => {
    const updated = tests.map(t => 
      t.id === testId 
        ? { ...t, status: (t.status === 'passed' ? 'pending' : 'passed') as const }
        : t
    );
    setTests(updated);
    onUpdate(dtl.id, { tests: updated });
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
                        test.status === 'passed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : test.status === 'failed'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {test.status === 'passed' ? 'Passed' : test.status === 'failed' ? 'Failed' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm">{test.description}</p>
                  </div>
                  <button
                    onClick={() => handleToggleStatus(test.id)}
                    className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm"
                  >
                    {test.status === 'passed' ? 'Reset' : 'Run Test'}
                  </button>
                </div>
              </div>
            ))}

            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  {tests.filter(t => t.status === 'passed').length} of {tests.length} tests passed
                </span>
                <button className="text-pink-600 hover:text-pink-700">
                  Add Custom Test
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LogicStage({ dtl, onUpdate }: { dtl: DTL; onUpdate: (id: string, updates: Partial<DTL>) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [logic, setLogic] = useState(dtl.logic || '');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const generated = `// ${dtl.name}
// Legal Reference: ${dtl.legalReference}

function execute(input) {
  // TODO: Implement logic based on statutory text
  // Refer to configuration parameters and ontology
  
  return {
    result: null,
    legalReference: "${dtl.legalReference}"
  };
}`;
      setLogic(generated);
      setIsGenerating(false);
    }, 2000);
  };

  const handleSave = () => {
    onUpdate(dtl.id, { logic });
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-slate-900 mb-2">Logic Implementation</h2>
          <p className="text-slate-600">Implement deterministic, auditable logic for the DTL</p>
        </div>
        <div className="flex items-center gap-3">
          {!dtl.logic && !logic && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Sparkles className="size-4" />
              {isGenerating ? 'Drafting...' : 'Draft Logic'}
            </button>
          )}
          {!isEditing && (dtl.logic || logic) && (
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
        {!dtl.logic && !logic ? (
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
              value={logic}
              onChange={(e) => setLogic(e.target.value)}
              rows={20}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm bg-slate-50"
            />
            <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setLogic(dtl.logic || '');
                }}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
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
                {dtl.logic || logic}
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
    </div>
  );
}

function ReviewStage({ dtl, onUpdate }: { dtl: DTL; onUpdate: (id: string, updates: Partial<DTL>) => void }) {
  const [reviewComments, setReviewComments] = useState(dtl.reviewComments || '');
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const completionStatus = {
    metadata: true,
    ontology: !!dtl.ontologyOwl,
    interface: !!dtl.apiSpec && !!dtl.mcpSpec,
    configuration: !!dtl.configurationOwl,
    tests: (dtl.tests?.length || 0) > 0,
    logic: !!dtl.logic
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
                <span className={dtl.ontologyOwl ? 'text-emerald-600' : 'text-amber-600'}>
                  {dtl.ontologyOwl ? 'Defined' : 'Missing'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">API Specification</span>
                <span className={dtl.apiSpec ? 'text-emerald-600' : 'text-amber-600'}>
                  {dtl.apiSpec ? 'Defined' : 'Missing'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Configuration</span>
                <span className={dtl.configurationOwl ? 'text-emerald-600' : 'text-amber-600'}>
                  {dtl.configurationOwl ? 'Defined' : 'Missing'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Unit Tests</span>
                <span className={(dtl.tests?.length || 0) > 0 ? 'text-emerald-600' : 'text-amber-600'}>
                  {dtl.tests?.length || 0} tests
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Logic</span>
                <span className={dtl.logic ? 'text-emerald-600' : 'text-amber-600'}>
                  {dtl.logic ? 'Implemented' : 'Missing'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Test Results */}
        {dtl.tests && dtl.tests.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h4 className="text-slate-900 mb-4">Test Execution Summary</h4>
            <div className="space-y-2">
              {dtl.tests.map((test) => (
                <div key={test.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{test.name}</span>
                  <span className={`px-3 py-1 rounded-full ${
                    test.status === 'passed'
                      ? 'bg-emerald-100 text-emerald-700'
                      : test.status === 'failed'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {test.status}
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