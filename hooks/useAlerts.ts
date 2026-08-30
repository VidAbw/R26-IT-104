// hooks/useAlerts.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { API_BASE_URL } from '../lib/apiConfig';
import {
  AlertLog,
  AlertStatus,
  PaginatedAlertHistory,
  PipelineConfig,
  ThresholdConfigUpdate,
} from '../types/alerts';

export function useAlerts() {
  const [alerts, setAlerts] = useState<AlertLog[]>([]);
  const [activeEmergency, setActiveEmergency] = useState<AlertLog | null>(null);
  const [dismissedModalId, setDismissedModalId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Pipeline configuration state
  const [config, setConfig] = useState<PipelineConfig | null>({
    audio_confidence_threshold: 0.75,
    audio_rms_threshold_db: 70.0,
    vision_confidence_threshold: 0.70,
    cooldown_seconds: 10.0,
    enable_auto_suppression: true,
  });
  const [configLoading, setConfigLoading] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // 1. Fetch Alert History from Backend
  // ---------------------------------------------------------------------------
  const fetchHistory = useCallback(
    async (
      page = 1,
      limit = 30,
      eventType?: string,
      status?: AlertStatus
    ) => {
      try {
        setError(null);
        let url = `${API_BASE_URL}/api/v1/alerts/history?page=${page}&limit=${limit}`;
        if (eventType) url += `&event_type=${encodeURIComponent(eventType)}`;
        if (status) url += `&status=${encodeURIComponent(status)}`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Server returned HTTP ${response.status}`);
        }

        const data: PaginatedAlertHistory = await response.json();
        setAlerts(data.items || []);

        // Check if there is an unacknowledged emergency alert to pop up
        const latestUnacknowledgedEmergency = data.items?.find(
          (a) => a.status === 'triggered'
        );
        if (
          latestUnacknowledgedEmergency &&
          latestUnacknowledgedEmergency.id !== dismissedModalId
        ) {
          setActiveEmergency(latestUnacknowledgedEmergency);
        }
      } catch (err: any) {
        console.warn('FastAPI fetchHistory failed, falling back to Supabase client:', err?.message);
        // Supabase Direct Query Fallback
        try {
          let query = supabase
            .from('alert_logs')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(limit);

          if (eventType) query = query.eq('event_type', eventType);
          if (status) query = query.eq('status', status);

          const { data, error: sbError } = await query;
          if (sbError) throw sbError;

          const items: AlertLog[] = (data || []).map((row) => ({
            id: row.id,
            event_type: row.event_type,
            confidence: row.confidence,
            timestamp: row.timestamp,
            metadata: row.metadata || {},
            status: row.status as AlertStatus,
          }));

          setAlerts(items);
          const latestUnacknowledgedEmergency = items.find((a) => a.status === 'triggered');
          if (
            latestUnacknowledgedEmergency &&
            latestUnacknowledgedEmergency.id !== dismissedModalId
          ) {
            setActiveEmergency(latestUnacknowledgedEmergency);
          }
        } catch (fbErr: any) {
          setError(fbErr?.message || 'Failed to fetch alert logs.');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [dismissedModalId]
  );

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchHistory(1, 30);
  }, [fetchHistory]);

  // ---------------------------------------------------------------------------
  // 2. Acknowledge Alert API Call
  // ---------------------------------------------------------------------------
  const acknowledgeAlert = async (alertId: string) => {
    try {
      const url = `${API_BASE_URL}/api/v1/alerts/${alertId}/acknowledge`;
      const response = await fetch(url, { method: 'POST' });

      if (!response.ok) {
        throw new Error(`Failed to acknowledge alert. HTTP ${response.status}`);
      }

      const updatedRecord: AlertLog = await response.json();

      // Update local state feed
      setAlerts((prev) =>
        prev.map((item) => (item.id === alertId ? updatedRecord : item))
      );

      // Clear active emergency modal if it matches
      if (activeEmergency?.id === alertId) {
        setActiveEmergency(null);
      }

      return updatedRecord;
    } catch (err: any) {
      console.warn('Acknowledge via API failed, using Supabase fallback:', err?.message);
      // Supabase Fallback Update
      try {
        const { data, error: sbErr } = await supabase
          .from('alert_logs')
          .update({
            status: 'acknowledged',
            metadata: { acknowledged_at: new Date().toISOString() },
          })
          .eq('id', alertId)
          .select()
          .single();

        if (sbErr) throw sbErr;

        const updated: AlertLog = {
          id: data.id,
          event_type: data.event_type,
          confidence: data.confidence,
          timestamp: data.timestamp,
          metadata: data.metadata || {},
          status: data.status as AlertStatus,
        };

        setAlerts((prev) =>
          prev.map((item) => (item.id === alertId ? updated : item))
        );

        if (activeEmergency?.id === alertId) {
          setActiveEmergency(null);
        }
        return updated;
      } catch (fbErr: any) {
        console.error('Failed to acknowledge alert:', fbErr);
        throw fbErr;
      }
    }
  };

  const dismissEmergencyModal = () => {
    if (activeEmergency) {
      setDismissedModalId(activeEmergency.id);
      setActiveEmergency(null);
    }
  };

  // ---------------------------------------------------------------------------
  // 3. Pipeline Configuration API Calls
  // ---------------------------------------------------------------------------
  const fetchConfig = useCallback(async () => {
    try {
      setConfigLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/config/thresholds`);
      if (response.ok) {
        const data: PipelineConfig = await response.json();
        setConfig(data);
      }
    } catch (err) {
      console.warn('Could not fetch pipeline threshold config from backend:', err);
    } finally {
      setConfigLoading(false);
    }
  }, []);

  const updateConfig = async (updateData: ThresholdConfigUpdate) => {
    try {
      setConfigLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/config/thresholds`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update config. HTTP ${response.status}`);
      }

      const updated: PipelineConfig = await response.json();
      setConfig(updated);
      return updated;
    } catch (err: any) {
      console.error('Error updating threshold configuration:', err);
      // Local optimistic update fallback
      if (config) {
        const optimistic: PipelineConfig = {
          ...config,
          ...updateData,
        };
        setConfig(optimistic);
        return optimistic;
      }
      throw err;
    } finally {
      setConfigLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 4. Real-Time Supabase Subscription
  // ---------------------------------------------------------------------------
  useEffect(() => {
    fetchHistory();
    fetchConfig();

    // Subscribe to real-time inserts on alert_logs table
    const subscription = supabase
      .channel('alert_logs_realtime_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alert_logs' },
        (payload) => {
          const newRow = payload.new;
          if (!newRow) return;

          const newAlert: AlertLog = {
            id: newRow.id,
            event_type: newRow.event_type,
            confidence: newRow.confidence,
            timestamp: newRow.timestamp,
            metadata: newRow.metadata || {},
            status: newRow.status as AlertStatus,
          };

          // Prepend to alerts feed
          setAlerts((prev) => [newAlert, ...prev.filter((a) => a.id !== newAlert.id)]);

          // Trigger high-priority modal if alert is triggered emergency
          if (newAlert.status === 'triggered') {
            setActiveEmergency(newAlert);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchHistory, fetchConfig]);

  return {
    alerts,
    activeEmergency,
    loading,
    refreshing,
    error,
    config,
    configLoading,
    fetchHistory,
    refresh,
    acknowledgeAlert,
    dismissEmergencyModal,
    fetchConfig,
    updateConfig,
  };
}
