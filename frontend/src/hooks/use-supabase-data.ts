import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';

type Tables = Database['public']['Tables'];
type KilnOperations = Tables['kiln_operations']['Row'];
type AlternativeFuels = Tables['alternative_fuels']['Row'];
type OptimizationResults = Tables['optimization_results']['Row'];
type UtilitiesMonitoring = Tables['utilities_monitoring']['Row'];
type RawMaterialFeed = Tables['raw_material_feed']['Row'];
type GrindingOperations = Tables['grinding_operations']['Row'];
type QualityControl = Tables['quality_control']['Row'];
type AIRecommendations = Tables['ai_recommendations']['Row'];

export function useKilnOperations() {
  const [data, setData] = useState<KilnOperations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('🔥 Fetching kiln operations data...');
        const { data: kilnData, error } = await supabase
          .from('kiln_operations')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        console.log('🔥 Kiln operations data fetched:', kilnData);
        setData(kilnData || []);
      } catch (err) {
        console.error('❌ Error fetching kiln operations:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { data, loading, error };
}

export function useAlternativeFuels() {
  const [data, setData] = useState<AlternativeFuels[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('⛽ Fetching alternative fuels data...');
        const { data: fuelData, error } = await supabase
          .from('alternative_fuels')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        console.log('⛽ Alternative fuels data fetched:', fuelData);
        setData(fuelData || []);
      } catch (err) {
        console.error('❌ Error fetching alternative fuels:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { data, loading, error };
}

export function useOptimizationResults(type?: string) {
  const [data, setData] = useState<OptimizationResults[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('🚀 Fetching optimization results data...', type ? `for type: ${type}` : '');
        let query = supabase
          .from('optimization_results')
          .select('*')
          .order('created_at', { ascending: false });

        if (type) {
          query = query.eq('optimization_type', type);
        }

        const { data: optimizationData, error } = await query.limit(50);

        if (error) throw error;
        console.log('🚀 Optimization results data fetched:', optimizationData);
        setData(optimizationData || []);
      } catch (err) {
        console.error('❌ Error fetching optimization results:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [type]);

  return { data, loading, error };
}

export function useUtilitiesMonitoring() {
  const [data, setData] = useState<UtilitiesMonitoring[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: utilitiesData, error } = await supabase
          .from('utilities_monitoring')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setData(utilitiesData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { data, loading, error };
}

export function useRawMaterialFeed() {
  const [data, setData] = useState<RawMaterialFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: rawMaterialData, error } = await supabase
          .from('raw_material_feed')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setData(rawMaterialData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { data, loading, error };
}

export function useGrindingOperations() {
  const [data, setData] = useState<GrindingOperations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: grindingData, error } = await supabase
          .from('grinding_operations')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setData(grindingData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { data, loading, error };
}

export function useQualityControl() {
  const [data, setData] = useState<QualityControl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: qualityData, error } = await supabase
          .from('quality_control')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setData(qualityData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { data, loading, error };
}

export function useAIRecommendations() {
  const [data, setData] = useState<AIRecommendations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: aiData, error } = await supabase
          .from('ai_recommendations')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        setData(aiData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { data, loading, error };
}
