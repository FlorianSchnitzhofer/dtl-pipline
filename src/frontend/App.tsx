import { useState } from 'react';
import { DTLibList } from './components/DTLibList';
import { DTLibDetail } from './components/DTLibDetail';
import { DTLWorkflow } from './components/DTLWorkflow';

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
  owner: string;
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

export default function App() {
  const [view, setView] = useState<View>({ type: 'list' });
  const [dtlibs, setDtlibs] = useState<DTLib[]>([
    {
      id: '1',
      name: 'Family Benefits Act 2024',
      lawIdentifier: 'FBA-2024-01',
      jurisdiction: 'Federal',
      version: '1.0',
      status: 'in-progress',
      effectiveDate: '2024-01-01',
      lawText: 'FAMILY BENEFITS ACT 2024\n\nSection 1: Definitions\n1.1 In this Act, "eligible family" means a family unit that meets the criteria specified in Section 2.\n1.2 "Dependent child" means a child under the age of 18 years or under 25 years if enrolled in full-time education.\n\nSection 2: Eligibility Criteria\n2.1 A family is eligible for benefits under this Act if:\n(a) the family includes at least one dependent child;\n(b) the combined household income does not exceed $75,000 per annum;\n(c) at least one parent or guardian is a citizen or permanent resident.\n\nSection 3: Benefit Calculation\n3.1 The monthly benefit amount shall be calculated as follows:\n(a) Base amount: $500 per family;\n(b) Additional amount per child: $200;\n(c) Low-income supplement: $150 if household income is below $40,000.\n\nSection 4: Application Process\n4.1 Applications must be submitted within 60 days of the qualifying event.\n4.2 Supporting documentation must include proof of income, citizenship status, and dependent children.',
      authoritativeUrl: 'https://legislation.gov/fba-2024-01',
      description: 'Federal legislation governing family benefit eligibility and calculation'
    },
    {
      id: '2',
      name: 'Tax Relief Act 2023',
      lawIdentifier: 'TRA-2023-15',
      jurisdiction: 'Federal',
      version: '2.1',
      status: 'approved',
      effectiveDate: '2023-07-01',
      lawText: 'TAX RELIEF ACT 2023\n\nSection 1: Income Tax Deductions\n1.1 Taxpayers may claim deductions for charitable contributions up to 30% of adjusted gross income...',
      authoritativeUrl: 'https://legislation.gov/tra-2023-15',
      description: 'Tax relief provisions for individuals and corporations'
    }
  ]);

  const [dtls, setDtls] = useState<DTL[]>([
    {
      id: 'dtl-1',
      dtlibId: '1',
      name: 'Family Eligibility Rule',
      description: 'Determines whether a family unit qualifies for benefits under the Family Benefits Act',
      owner: 'Sarah Chen',
      version: '1.0',
      legalText: 'Section 2: Eligibility Criteria\n2.1 A family is eligible for benefits under this Act if:\n(a) the family includes at least one dependent child;\n(b) the combined household income does not exceed $75,000 per annum;\n(c) at least one parent or guardian is a citizen or permanent resident.',
      legalReference: 'Section 2, Subsection 2.1, Paragraphs (a)-(c)',
      authoritativeUrl: 'https://legislation.gov/fba-2024-01#section-2',
      category: 'Eligibility',
      tags: ['eligibility', 'family', 'income-test'],
      ontologyOwl: '<?xml version="1.0"?>\n<rdf:RDF xmlns="http://www.legislation.gov/ontology/fba#"\n     xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"\n     xmlns:owl="http://www.w3.org/2002/07/owl#"\n     xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#">\n    \n    <owl:Class rdf:about="#Family">\n        <rdfs:label>Family</rdfs:label>\n        <rdfs:comment>A family unit applying for benefits</rdfs:comment>\n    </owl:Class>\n    \n    <owl:Class rdf:about="#DependentChild">\n        <rdfs:label>Dependent Child</rdfs:label>\n        <rdfs:comment>A child under 18 or under 25 if in education</rdfs:comment>\n    </owl:Class>\n    \n    <owl:DatatypeProperty rdf:about="#householdIncome">\n        <rdfs:domain rdf:resource="#Family"/>\n        <rdfs:range rdf:resource="http://www.w3.org/2001/XMLSchema#decimal"/>\n    </owl:DatatypeProperty>\n    \n    <owl:DatatypeProperty rdf:about="#hasCitizenship">\n        <rdfs:domain rdf:resource="#Family"/>\n        <rdfs:range rdf:resource="http://www.w3.org/2001/XMLSchema#boolean"/>\n    </owl:DatatypeProperty>\n    \n</rdf:RDF>',
      configurationOwl: '<?xml version="1.0"?>\n<rdf:RDF xmlns="http://www.legislation.gov/config/fba#"\n     xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">\n    \n    <Configuration rdf:about="#EligibilityConfig">\n        <maxHouseholdIncome rdf:datatype="http://www.w3.org/2001/XMLSchema#decimal">75000</maxHouseholdIncome>\n        <minDependentChildren rdf:datatype="http://www.w3.org/2001/XMLSchema#integer">1</minDependentChildren>\n        <childAgeLimit rdf:datatype="http://www.w3.org/2001/XMLSchema#integer">18</childAgeLimit>\n        <educationChildAgeLimit rdf:datatype="http://www.w3.org/2001/XMLSchema#integer">25</educationChildAgeLimit>\n    </Configuration>\n    \n</rdf:RDF>',
      apiSpec: '{\n  "openapi": "3.0.0",\n  "info": {\n    "title": "Family Eligibility API",\n    "version": "1.0.0"\n  },\n  "paths": {\n    "/check-eligibility": {\n      "post": {\n        "summary": "Check family eligibility",\n        "requestBody": {\n          "content": {\n            "application/json": {\n              "schema": {\n                "$ref": "#/components/schemas/EligibilityRequest"\n              }\n            }\n          }\n        },\n        "responses": {\n          "200": {\n            "description": "Eligibility result",\n            "content": {\n              "application/json": {\n                "schema": {\n                  "$ref": "#/components/schemas/EligibilityResponse"\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n  },\n  "components": {\n    "schemas": {\n      "EligibilityRequest": {\n        "type": "object",\n        "required": ["householdIncome", "dependentChildren", "hasCitizenship"],\n        "properties": {\n          "householdIncome": { "type": "number" },\n          "dependentChildren": { "type": "integer" },\n          "hasCitizenship": { "type": "boolean" }\n        }\n      },\n      "EligibilityResponse": {\n        "type": "object",\n        "properties": {\n          "eligible": { "type": "boolean" },\n          "reason": { "type": "string" },\n          "legalReference": { "type": "string" }\n        }\n      }\n    }\n  }\n}',
      mcpSpec: '{\n  "name": "family-eligibility",\n  "description": "Determines family benefit eligibility",\n  "inputSchema": {\n    "type": "object",\n    "properties": {\n      "householdIncome": { "type": "number", "description": "Annual household income" },\n      "dependentChildren": { "type": "number", "description": "Number of dependent children" },\n      "hasCitizenship": { "type": "boolean", "description": "At least one parent is citizen/resident" }\n    },\n    "required": ["householdIncome", "dependentChildren", "hasCitizenship"]\n  }\n}',
      tests: [
        { id: 't1', name: 'Eligible family - standard case', description: 'Income $50k, 2 children, citizen', status: 'passed' },
        { id: 't2', name: 'Ineligible - income too high', description: 'Income $80k, 1 child, citizen', status: 'passed' },
        { id: 't3', name: 'Ineligible - no children', description: 'Income $40k, 0 children, citizen', status: 'passed' },
        { id: 't4', name: 'Ineligible - no citizenship', description: 'Income $50k, 2 children, no citizenship', status: 'passed' },
        { id: 't5', name: 'Boundary case - exactly $75k income', description: 'Income $75k, 1 child, citizen', status: 'passed' }
      ],
      logic: 'function checkEligibility(input) {\n  const { householdIncome, dependentChildren, hasCitizenship } = input;\n  \n  // Check dependent children requirement (Section 2.1(a))\n  if (dependentChildren < 1) {\n    return {\n      eligible: false,\n      reason: "Family must include at least one dependent child",\n      legalReference: "Section 2.1(a)"\n    };\n  }\n  \n  // Check income threshold (Section 2.1(b))\n  if (householdIncome > 75000) {\n    return {\n      eligible: false,\n      reason: "Combined household income exceeds $75,000",\n      legalReference: "Section 2.1(b)"\n    };\n  }\n  \n  // Check citizenship requirement (Section 2.1(c))\n  if (!hasCitizenship) {\n    return {\n      eligible: false,\n      reason: "At least one parent/guardian must be citizen or permanent resident",\n      legalReference: "Section 2.1(c)"\n    };\n  }\n  \n  return {\n    eligible: true,\n    reason: "Family meets all eligibility criteria",\n    legalReference: "Section 2.1"\n  };\n}',
      reviewStatus: 'approved',
      reviewComments: ''
    },
    {
      id: 'dtl-2',
      dtlibId: '1',
      name: 'Benefit Amount Calculation',
      description: 'Calculates the monthly benefit amount based on family composition and income',
      owner: 'Michael Rodriguez',
      version: '1.0',
      legalText: 'Section 3: Benefit Calculation\n3.1 The monthly benefit amount shall be calculated as follows:\n(a) Base amount: $500 per family;\n(b) Additional amount per child: $200;\n(c) Low-income supplement: $150 if household income is below $40,000.',
      legalReference: 'Section 3, Subsection 3.1, Paragraphs (a)-(c)',
      authoritativeUrl: 'https://legislation.gov/fba-2024-01#section-3',
      category: 'Calculation',
      tags: ['benefit', 'calculation', 'payment'],
      reviewStatus: 'pending',
      reviewComments: ''
    },
    {
      id: 'dtl-3',
      dtlibId: '1',
      name: 'Application Deadline Rule',
      description: 'Determines whether an application is submitted within the required timeframe',
      owner: 'Sarah Chen',
      version: '1.0',
      legalText: 'Section 4: Application Process\n4.1 Applications must be submitted within 60 days of the qualifying event.',
      legalReference: 'Section 4, Subsection 4.1',
      authoritativeUrl: 'https://legislation.gov/fba-2024-01#section-4',
      category: 'Process',
      tags: ['application', 'deadline', 'timeframe'],
      reviewStatus: 'revision-requested',
      reviewComments: 'Need clarification on how "qualifying event" is defined across different scenarios'
    }
  ]);

  const handleNavigate = (newView: View) => {
    setView(newView);
  };

  const handleUpdateDTLib = (id: string, updates: Partial<DTLib>) => {
    setDtlibs(prev => prev.map(lib => lib.id === id ? { ...lib, ...updates } : lib));
  };

  const handleCreateDTLib = (newLib: Omit<DTLib, 'id'>) => {
    const id = `dtlib-${Date.now()}`;
    setDtlibs(prev => [...prev, { ...newLib, id }]);
  };

  const handleDeleteDTLib = (id: string) => {
    setDtlibs(prev => prev.filter(lib => lib.id !== id));
    setDtls(prev => prev.filter(dtl => dtl.dtlibId !== id));
    if (view.type !== 'list') {
      setView({ type: 'list' });
    }
  };

  const handleCreateDTL = (dtlibId: string, newDtl: Omit<DTL, 'id' | 'dtlibId'>) => {
    const id = `dtl-${Date.now()}`;
    setDtls(prev => [...prev, { ...newDtl, id, dtlibId }]);
  };

  const handleUpdateDTL = (id: string, updates: Partial<DTL>) => {
    setDtls(prev => prev.map(dtl => dtl.id === id ? { ...dtl, ...updates } : dtl));
  };

  const handleDeleteDTL = (id: string) => {
    setDtls(prev => prev.filter(dtl => dtl.id !== id));
  };

  const currentDTLib = view.type !== 'list' ? dtlibs.find(lib => lib.id === view.dtlibId) : undefined;
  const currentDTLs = view.type !== 'list' ? dtls.filter(dtl => dtl.dtlibId === view.dtlibId) : [];
  const currentDTL = view.type === 'dtl-workflow' ? dtls.find(dtl => dtl.id === view.dtlId) : undefined;

  return (
    <div className="min-h-screen bg-slate-50">
      {view.type === 'list' && (
        <DTLibList
          dtlibs={dtlibs}
          onSelectDTLib={(id) => handleNavigate({ type: 'dtlib-detail', dtlibId: id })}
          onCreateDTLib={handleCreateDTLib}
          onDeleteDTLib={handleDeleteDTLib}
        />
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
