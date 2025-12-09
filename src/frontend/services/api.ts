// API Service for Digital Twins of Legislation
// Handles all REST API communication with authentication

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'https://api.dtl.example.com/api';

// Types matching the API specification
export type DTLibStatus = 'draft' | 'in-progress' | 'review' | 'approved';
export type DTLReviewStatus = 'pending' | 'approved' | 'revision-requested';

export interface DTLibAPI {
  id: string;
  law_name: string;
  law_identifier: string;
  jurisdiction: string;
  version: string;
  status: DTLibStatus;
  effective_date?: string;
  authoritative_source_url?: string;
  full_text?: string;
  description?: string;
  repository_url?: string;
  repository_branch?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DTLAPI {
  id: string;
  dtlib_id: string;
  title: string;
  description?: string;
  owner?: string;
  version: string;
  legal_text: string;
  legal_reference: string;
  source_url?: string;
  classification?: string;
  tags?: string[];
  status?: DTLReviewStatus;
  created_at?: string;
  updated_at?: string;
}

export interface SegmentationSuggestion {
  suggestion_id: string;
  title: string;
  description: string;
  legal_text: string;
  legal_reference: string;
}

export interface TestCase {
  id: string;
  name: string;
  input: any;
  expected_output: any;
  description?: string;
  last_run?: string;
  last_result?: 'passed' | 'failed' | 'pending';
}

export interface OntologyData {
  ontology_owl: string;
}

export interface InterfaceData {
  function_name: string;
  inputs: Array<{ name: string; type: string; description?: string }>;
  outputs: Array<{ name: string; type: string; description?: string }>;
}

export interface ConfigurationParameter {
  name: string;
  value: string | number;
  unit?: string;
  description?: string;
}

export interface ConfigurationData {
  parameters: ConfigurationParameter[];
}

export interface LogicData {
  language: string;
  code: string;
}

export interface ReviewComment {
  id: string;
  author: string;
  role: string;
  comment: string;
  timestamp: string;
  type?: string;
}

class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

// Get authentication token from your auth provider (e.g., MSAL)
function getAuthToken(): string {
  // TODO: Integrate with your actual authentication provider
  // For now, return a placeholder or get from localStorage
  return localStorage.getItem('auth_token') || '';
}

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null as T;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new APIError(response.status, errorText || response.statusText);
  }

  return response.json();
}

// DTLIB Endpoints
export const dtlibAPI = {
  // List DTLIBs
  list: async (params?: {
    search?: string;
    jurisdiction?: string;
    status?: DTLibStatus;
    limit?: number;
    offset?: number;
  }): Promise<DTLibAPI[]> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.set('search', params.search);
    if (params?.jurisdiction) queryParams.set('jurisdiction', params.jurisdiction);
    if (params?.status) queryParams.set('status', params.status);
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());
    
    const query = queryParams.toString();
    return fetchAPI<DTLibAPI[]>(`/dtlibs${query ? `?${query}` : ''}`);
  },

  // Create DTLIB
  create: async (data: {
    law_name: string;
    law_identifier: string;
    jurisdiction: string;
    version: string;
    effective_date?: string;
    authoritative_source_url?: string;
    full_text?: string;
    description?: string;
    status?: DTLibStatus;
    repository_url?: string;
    repository_branch?: string;
  }): Promise<DTLibAPI> => {
    return fetchAPI<DTLibAPI>('/dtlibs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get DTLIB
  get: async (dtlibId: string): Promise<DTLibAPI> => {
    return fetchAPI<DTLibAPI>(`/dtlibs/${dtlibId}`);
  },

  // Update DTLIB
  update: async (dtlibId: string, data: Partial<DTLibAPI>): Promise<DTLibAPI> => {
    return fetchAPI<DTLibAPI>(`/dtlibs/${dtlibId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete DTLIB
  delete: async (dtlibId: string): Promise<void> => {
    return fetchAPI<void>(`/dtlibs/${dtlibId}`, {
      method: 'DELETE',
    });
  },

  // Segment law text
  segment: async (dtlibId: string): Promise<SegmentationSuggestion[]> => {
    return fetchAPI<SegmentationSuggestion[]>(`/dtlibs/${dtlibId}/segment`, {
      method: 'POST',
    });
  },

  // Get governance overview
  getOverview: async (dtlibId: string): Promise<any> => {
    return fetchAPI<any>(`/dtlibs/${dtlibId}/overview`);
  },

  // Sync with GitHub
  syncGitHub: async (dtlibId: string): Promise<{
    repository_url: string;
    branch: string;
    commit_id: string;
    message: string;
  }> => {
    return fetchAPI(`/dtlibs/${dtlibId}/sync`, {
      method: 'POST',
    });
  },
};

// DTL Endpoints
export const dtlAPI = {
  // List DTLs
  list: async (
    dtlibId: string,
    params?: { search?: string; status?: DTLReviewStatus; owner?: string }
  ): Promise<DTLAPI[]> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.set('search', params.search);
    if (params?.status) queryParams.set('status', params.status);
    if (params?.owner) queryParams.set('owner', params.owner);
    
    const query = queryParams.toString();
    return fetchAPI<DTLAPI[]>(`/dtlibs/${dtlibId}/dtls${query ? `?${query}` : ''}`);
  },

  // Create DTL
  create: async (dtlibId: string, data: {
    title: string;
    legal_text: string;
    legal_reference: string;
    description?: string;
    owner?: string;
    classification?: string;
    tags?: string[];
  }): Promise<DTLAPI> => {
    return fetchAPI<DTLAPI>(`/dtlibs/${dtlibId}/dtls`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get DTL
  get: async (dtlibId: string, dtlId: string): Promise<DTLAPI> => {
    return fetchAPI<DTLAPI>(`/dtlibs/${dtlibId}/dtls/${dtlId}`);
  },

  // Update DTL
  update: async (
    dtlibId: string,
    dtlId: string,
    data: Partial<DTLAPI>
  ): Promise<DTLAPI> => {
    return fetchAPI<DTLAPI>(`/dtlibs/${dtlibId}/dtls/${dtlId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete DTL
  delete: async (dtlibId: string, dtlId: string): Promise<void> => {
    return fetchAPI<void>(`/dtlibs/${dtlibId}/dtls/${dtlId}`, {
      method: 'DELETE',
    });
  },
};

// DTL Ontology Endpoints (Stage 1)
export const ontologyAPI = {
  // Get ontology
  get: async (dtlibId: string, dtlId: string): Promise<OntologyData | null> => {
    try {
      return await fetchAPI<OntologyData>(`/dtlibs/${dtlibId}/dtls/${dtlId}/ontology`);
    } catch (error) {
      if (error instanceof APIError && error.status === 204) {
        return null;
      }
      throw error;
    }
  },

  // Save ontology
  save: async (
    dtlibId: string,
    dtlId: string,
    data: OntologyData
  ): Promise<OntologyData> => {
    return fetchAPI<OntologyData>(`/dtlibs/${dtlibId}/dtls/${dtlId}/ontology`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Generate ontology proposal
  generate: async (dtlibId: string, dtlId: string): Promise<OntologyData | null> => {
    try {
      return await fetchAPI<OntologyData>(
        `/dtlibs/${dtlibId}/dtls/${dtlId}/ontology/generate`,
        { method: 'POST' }
      );
    } catch (error) {
      if (error instanceof APIError && error.status === 204) {
        return null;
      }
      throw error;
    }
  },
};

// DTL Interface Endpoints (Stage 2)
export const interfaceAPI = {
  // Get interface
  get: async (dtlibId: string, dtlId: string): Promise<InterfaceData | null> => {
    try {
      return await fetchAPI<InterfaceData>(`/dtlibs/${dtlibId}/dtls/${dtlId}/interface`);
    } catch (error) {
      if (error instanceof APIError && error.status === 204) {
        return null;
      }
      throw error;
    }
  },

  // Save interface
  save: async (
    dtlibId: string,
    dtlId: string,
    data: InterfaceData
  ): Promise<InterfaceData> => {
    return fetchAPI<InterfaceData>(`/dtlibs/${dtlibId}/dtls/${dtlId}/interface`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Generate interface proposal
  generate: async (dtlibId: string, dtlId: string): Promise<InterfaceData | null> => {
    try {
      return await fetchAPI<InterfaceData>(
        `/dtlibs/${dtlibId}/dtls/${dtlId}/interface/generate`,
        { method: 'POST' }
      );
    } catch (error) {
      if (error instanceof APIError && error.status === 204) {
        return null;
      }
      throw error;
    }
  },
};

// DTL Configuration Endpoints (Stage 3)
export const configurationAPI = {
  // Get configuration
  get: async (dtlibId: string, dtlId: string): Promise<ConfigurationData | null> => {
    try {
      return await fetchAPI<ConfigurationData>(
        `/dtlibs/${dtlibId}/dtls/${dtlId}/configuration`
      );
    } catch (error) {
      if (error instanceof APIError && error.status === 204) {
        return null;
      }
      throw error;
    }
  },

  // Save configuration
  save: async (
    dtlibId: string,
    dtlId: string,
    data: ConfigurationData
  ): Promise<ConfigurationData> => {
    return fetchAPI<ConfigurationData>(
      `/dtlibs/${dtlibId}/dtls/${dtlId}/configuration`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  },

  // Generate configuration proposal
  generate: async (
    dtlibId: string,
    dtlId: string
  ): Promise<ConfigurationData | null> => {
    try {
      return await fetchAPI<ConfigurationData>(
        `/dtlibs/${dtlibId}/dtls/${dtlId}/configuration/generate`,
        { method: 'POST' }
      );
    } catch (error) {
      if (error instanceof APIError && error.status === 204) {
        return null;
      }
      throw error;
    }
  },
};

// DTL Test Endpoints (Stage 4)
export const testAPI = {
  // List tests
  list: async (dtlibId: string, dtlId: string): Promise<TestCase[]> => {
    return fetchAPI<TestCase[]>(`/dtlibs/${dtlibId}/dtls/${dtlId}/tests`);
  },

  // Create test
  create: async (
    dtlibId: string,
    dtlId: string,
    data: {
      name: string;
      input: any;
      expected_output: any;
      description?: string;
    }
  ): Promise<TestCase> => {
    return fetchAPI<TestCase>(`/dtlibs/${dtlibId}/dtls/${dtlId}/tests`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get test
  get: async (dtlibId: string, dtlId: string, testId: string): Promise<TestCase> => {
    return fetchAPI<TestCase>(`/dtlibs/${dtlibId}/dtls/${dtlId}/tests/${testId}`);
  },

  // Update test
  update: async (
    dtlibId: string,
    dtlId: string,
    testId: string,
    data: Partial<TestCase>
  ): Promise<TestCase> => {
    return fetchAPI<TestCase>(`/dtlibs/${dtlibId}/dtls/${dtlId}/tests/${testId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete test
  delete: async (dtlibId: string, dtlId: string, testId: string): Promise<void> => {
    return fetchAPI<void>(`/dtlibs/${dtlibId}/dtls/${dtlId}/tests/${testId}`, {
      method: 'DELETE',
    });
  },

  // Run tests
  run: async (
    dtlibId: string,
    dtlId: string
  ): Promise<{ results: Array<TestCase & { actual_output?: any }> }> => {
    return fetchAPI(`/dtlibs/${dtlibId}/dtls/${dtlId}/tests/run`, {
      method: 'POST',
    });
  },

  // Generate test proposals
  generate: async (dtlibId: string, dtlId: string): Promise<TestCase[] | null> => {
    try {
      return await fetchAPI<TestCase[]>(
        `/dtlibs/${dtlibId}/dtls/${dtlId}/tests/generate`,
        { method: 'POST' }
      );
    } catch (error) {
      if (error instanceof APIError && error.status === 204) {
        return null;
      }
      throw error;
    }
  },
};

// DTL Logic Endpoints (Stage 5)
export const logicAPI = {
  // Get logic
  get: async (dtlibId: string, dtlId: string): Promise<LogicData | null> => {
    try {
      return await fetchAPI<LogicData>(`/dtlibs/${dtlibId}/dtls/${dtlId}/logic`);
    } catch (error) {
      if (error instanceof APIError && error.status === 204) {
        return null;
      }
      throw error;
    }
  },

  // Save logic
  save: async (
    dtlibId: string,
    dtlId: string,
    data: LogicData
  ): Promise<{ updated_at: string }> => {
    return fetchAPI(`/dtlibs/${dtlibId}/dtls/${dtlId}/logic`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Generate logic proposal
  generate: async (dtlibId: string, dtlId: string): Promise<LogicData | null> => {
    try {
      return await fetchAPI<LogicData>(
        `/dtlibs/${dtlibId}/dtls/${dtlId}/logic/generate`,
        { method: 'POST' }
      );
    } catch (error) {
      if (error instanceof APIError && error.status === 204) {
        return null;
      }
      throw error;
    }
  },
};

// DTL Review Endpoints (Stage 6)
export const reviewAPI = {
  // Get review summary
  getSummary: async (dtlibId: string, dtlId: string): Promise<any> => {
    return fetchAPI(`/dtlibs/${dtlibId}/dtls/${dtlId}/review`);
  },

  // Approve DTL
  approve: async (
    dtlibId: string,
    dtlId: string,
    data?: { comment?: string; approved_version?: string }
  ): Promise<{ status: string; approved_at: string }> => {
    return fetchAPI(`/dtlibs/${dtlibId}/dtls/${dtlId}/approve`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },

  // Request revision
  requestRevision: async (
    dtlibId: string,
    dtlId: string,
    data?: { comment?: string }
  ): Promise<{ status: string }> => {
    return fetchAPI(`/dtlibs/${dtlibId}/dtls/${dtlId}/request-revision`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },

  // List comments
  listComments: async (dtlibId: string, dtlId: string): Promise<ReviewComment[]> => {
    return fetchAPI<ReviewComment[]>(`/dtlibs/${dtlibId}/dtls/${dtlId}/comments`);
  },

  // Add comment
  addComment: async (
    dtlibId: string,
    dtlId: string,
    data: { comment: string; type?: string }
  ): Promise<ReviewComment> => {
    return fetchAPI<ReviewComment>(`/dtlibs/${dtlibId}/dtls/${dtlId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export { APIError };