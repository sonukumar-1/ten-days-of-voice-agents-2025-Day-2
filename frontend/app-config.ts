export interface AppConfig {
  pageTitle: string;
  pageDescription: string;
  companyName: string;

  supportsChatInput: boolean;
  supportsVideoInput: boolean;
  supportsScreenShare: boolean;
  isPreConnectBufferEnabled: boolean;

  logo: string;
  startButtonText: string;
  accent?: string;
  logoDark?: string;
  accentDark?: string;

  // for LiveKit Cloud Sandbox
  sandboxId?: string;
  agentName?: string;
}

export const APP_CONFIG_DEFAULTS: AppConfig = {
  companyName: 'Starbucks',
  pageTitle: 'Starbucks Barista',
  pageDescription: 'Your personal AI Barista',

  supportsChatInput: true,
  supportsVideoInput: true,
  supportsScreenShare: true,
  isPreConnectBufferEnabled: true,

  logo: '/lk-logo.svg', // Keeping default logo for now as I don't have a Starbucks asset
  accent: '#00704A', // Starbucks Green
  logoDark: '/lk-logo-dark.svg',
  accentDark: '#00704A', // Starbucks Green
  startButtonText: 'Start Order',

  // for LiveKit Cloud Sandbox
  sandboxId: undefined,
  agentName: undefined,
};
