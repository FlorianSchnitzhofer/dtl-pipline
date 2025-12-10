import { useState, useEffect, useCallback } from 'react';
import {
  ontologyAPI,
  interfaceAPI,
  configurationAPI,
  testAPI,
  logicAPI,
  reviewAPI,
  type OntologyData,
  type InterfaceData,
  type ConfigurationData,
  type TestCase,
  type LogicData
} from '../services/api';

export function useDTLWorkflow(dtlibId: string, dtlId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ontology Stage
  const [ontology, setOntology] = useState<string | null>(null);
  const [loadingOntology, setLoadingOntology] = useState(false);

  const loadOntology = useCallback(async () => {
    try {
      setLoadingOntology(true);
      const data = await ontologyAPI.get(dtlibId, dtlId);
      setOntology(data?.ontology_owl || null);
    } catch (err) {
      console.error('Failed to load ontology:', err);
    } finally {
      setLoadingOntology(false);
    }
  }, [dtlibId, dtlId]);

  const saveOntology = useCallback(async (owlContent: string) => {
    try {
      await ontologyAPI.save(dtlibId, dtlId, { ontology_owl: owlContent });
      setOntology(owlContent);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to save ontology');
    }
  }, [dtlibId, dtlId]);

  const generateOntology = useCallback(async (): Promise<string | null> => {
    try {
      const data = await ontologyAPI.generate(dtlibId, dtlId);
      if (data) {
        setOntology(data.ontology_owl);
        return data.ontology_owl;
      }
      return null;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to generate ontology');
    }
  }, [dtlibId, dtlId]);

  // Interface Stage
  const [interfaceData, setInterfaceData] = useState<InterfaceData | null>(null);

  const loadInterface = useCallback(async () => {
    try {
      const data = await interfaceAPI.get(dtlibId, dtlId);
      setInterfaceData(data);
    } catch (err) {
      console.error('Failed to load interface:', err);
    }
  }, [dtlibId, dtlId]);

  const saveInterface = useCallback(async (data: InterfaceData) => {
    try {
      await interfaceAPI.save(dtlibId, dtlId, data);
      setInterfaceData(data);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to save interface');
    }
  }, [dtlibId, dtlId]);

  const generateInterface = useCallback(async (): Promise<InterfaceData | null> => {
    try {
      const data = await interfaceAPI.generate(dtlibId, dtlId);
      if (data) {
        setInterfaceData(data);
      }
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to generate interface');
    }
  }, [dtlibId, dtlId]);

  // Configuration Stage
  const [configuration, setConfiguration] = useState<ConfigurationData | null>(null);

  const loadConfiguration = useCallback(async () => {
    try {
      const data = await configurationAPI.get(dtlibId, dtlId);
      setConfiguration(data);
    } catch (err) {
      console.error('Failed to load configuration:', err);
    }
  }, [dtlibId, dtlId]);

  const saveConfiguration = useCallback(async (data: ConfigurationData) => {
    try {
      await configurationAPI.save(dtlibId, dtlId, data);
      setConfiguration(data);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to save configuration');
    }
  }, [dtlibId, dtlId]);

  const generateConfiguration = useCallback(async (): Promise<ConfigurationData | null> => {
    try {
      const data = await configurationAPI.generate(dtlibId, dtlId);
      if (data) {
        setConfiguration(data);
      }
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to generate configuration');
    }
  }, [dtlibId, dtlId]);

  // Tests Stage
  const [tests, setTests] = useState<TestCase[]>([]);

  const loadTests = useCallback(async () => {
    try {
      const data = await testAPI.list(dtlibId, dtlId);
      setTests(data);
    } catch (err) {
      console.error('Failed to load tests:', err);
    }
  }, [dtlibId, dtlId]);

  const createTest = useCallback(async (testData: {
    name: string;
    input: any;
    expected_output: any;
    description?: string;
  }) => {
    try {
      const created = await testAPI.create(dtlibId, dtlId, testData);
      setTests(prev => [...prev, created]);
      return created;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create test');
    }
  }, [dtlibId, dtlId]);

  const updateTest = useCallback(async (testId: string, data: Partial<TestCase>) => {
    try {
      const updated = await testAPI.update(dtlibId, dtlId, testId, data);
      setTests(prev => prev.map(t => t.id === testId ? updated : t));
      return updated;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update test');
    }
  }, [dtlibId, dtlId]);

  const deleteTest = useCallback(async (testId: string) => {
    try {
      await testAPI.delete(dtlibId, dtlId, testId);
      setTests(prev => prev.filter(t => t.id !== testId));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete test');
    }
  }, [dtlibId, dtlId]);

  const runTests = useCallback(async () => {
    try {
      const result = await testAPI.run(dtlibId, dtlId);
      setTests(result.results);
      return result.results;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to run tests');
    }
  }, [dtlibId, dtlId]);

  const generateTests = useCallback(async (): Promise<TestCase[] | null> => {
    try {
      const data = await testAPI.generate(dtlibId, dtlId);
      if (data) {
        setTests(data);
      }
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to generate tests');
    }
  }, [dtlibId, dtlId]);

  // Logic Stage
  const [logic, setLogic] = useState<LogicData | null>(null);

  const loadLogic = useCallback(async () => {
    try {
      const data = await logicAPI.get(dtlibId, dtlId);
      setLogic(data);
    } catch (err) {
      console.error('Failed to load logic:', err);
    }
  }, [dtlibId, dtlId]);

  const saveLogic = useCallback(async (data: LogicData) => {
    try {
      await logicAPI.save(dtlibId, dtlId, data);
      setLogic(data);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to save logic');
    }
  }, [dtlibId, dtlId]);

  const generateLogic = useCallback(async (): Promise<LogicData | null> => {
    try {
      const data = await logicAPI.generate(dtlibId, dtlId);
      if (data) {
        setLogic(data);
      }
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to generate logic');
    }
  }, [dtlibId, dtlId]);

  // Review Stage
  const approveDTL = useCallback(async (comment?: string) => {
    try {
      await reviewAPI.approve(dtlibId, dtlId, comment ? { comment } : undefined);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to approve DTL');
    }
  }, [dtlibId, dtlId]);

  const requestRevision = useCallback(async (comment?: string) => {
    try {
      await reviewAPI.requestRevision(dtlibId, dtlId, comment ? { comment } : undefined);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to request revision');
    }
  }, [dtlibId, dtlId]);

  return {
    loading,
    error,
    // Ontology
    ontology,
    loadingOntology,
    loadOntology,
    saveOntology,
    generateOntology,
    // Interface
    interfaceData,
    loadInterface,
    saveInterface,
    generateInterface,
    // Configuration
    configuration,
    loadConfiguration,
    saveConfiguration,
    generateConfiguration,
    // Tests
    tests,
    loadTests,
    createTest,
    updateTest,
    deleteTest,
    runTests,
    generateTests,
    // Logic
    logic,
    loadLogic,
    saveLogic,
    generateLogic,
    // Review
    approveDTL,
    requestRevision
  };
}
