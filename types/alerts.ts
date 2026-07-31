// types/alerts.ts

export type AlertStatus = 'triggered' | 'suppressed' | 'acknowledged';

export interface BoundingBox {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
}

export interface AlertMetadata {
  rms_db?: number;
  device_info?: string;
  bounding_box?: BoundingBox;
  camera_id?: string;
  suppression_reason?: string;
  source_pipeline?: string;
  acknowledged_at?: string;
  [key: string]: any;
}

export interface AlertLog {
  id: string;
  event_type: string;
  confidence: number;
  timestamp: string;
  metadata: AlertMetadata;
  status: AlertStatus;
}

export interface PaginatedAlertHistory {
  total: number;
  page: number;
  limit: number;
  pages: number;
  items: AlertLog[];
}

export interface PipelineConfig {
  audio_confidence_threshold: number;
  audio_rms_threshold_db: number;
  vision_confidence_threshold: number;
  cooldown_seconds: number;
  enable_auto_suppression: boolean;
}

export interface ThresholdConfigUpdate {
  audio_confidence_threshold?: number;
  audio_rms_threshold_db?: number;
  vision_confidence_threshold?: number;
  cooldown_seconds?: number;
  enable_auto_suppression?: boolean;
}
