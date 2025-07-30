import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface HealthDataHook {
  isLoading: boolean;
  healthData: any;
  fetchHealthData: (userId: string, dataTypes?: string[], dateRange?: number) => Promise<any>;
  error: string | null;
}

export const useHealthData = (): HealthDataHook => {
  const [isLoading, setIsLoading] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthData = useCallback(async (
    userId: string, 
    dataTypes: string[] = ['heart_rate', 'steps', 'sleep'], 
    dateRange: number = 7
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await supabase.functions.invoke('google-health-data', {
        body: {
          userId: userId,
          dataTypes: dataTypes,
          dateRange: dateRange
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao buscar dados de saúde');
      }

      setHealthData(response.data);
      return response.data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    healthData,
    fetchHealthData,
    error
  };
};