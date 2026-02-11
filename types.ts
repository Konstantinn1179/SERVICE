/// <reference types="vite/client" />

export interface Message {
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
}

export type StatusColor = 'red' | 'yellow' | 'green' | 'blue' | 'black';
export type BranchType = 'triage' | 'consult' | 'defense';

export interface ClassifierResult {
  branch: BranchType;
  status: StatusColor;
  reason: string;
}

export interface VehicleCard {
  brand: string | null;
  model: string | null;
  year: string | null;
  gearbox: string | null;
  symptoms: string[];
  drivable: boolean | null;
  status: string | null;
  queue_season: string | null;
  needs_diagnosis: boolean;
  wants_booking: boolean;
}

export interface BookingStatus {
  ready_for_booking: boolean;
  needs_operator: boolean;
  reason: string;
}

export interface QuickButtons {
  buttons: string[];
}

export const INITIAL_VEHICLE_CARD: VehicleCard = {
  brand: null,
  model: null,
  year: null,
  gearbox: null,
  symptoms: [],
  drivable: null,
  status: null,
  queue_season: null,
  needs_diagnosis: true,
  wants_booking: false,
};

// Telegram Web App Types
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        sendData: (data: string) => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          showProgress: (leaveActive: boolean) => void;
          hideProgress: () => void;
        };
        initDataUnsafe?: {
            user?: {
                id?: number;
                first_name?: string;
                username?: string;
                language_code?: string;
            }
        }
      };
    };
  }
}
