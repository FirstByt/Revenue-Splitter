import { ApplicationConfig, provideAppInitializer } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';

export type AppConfig = {
  network: 'devnet' | 'mainnet-beta';
  rpcUrl: string;
  programId: string;
};

const APP_CONFIG_SYMBOL = Symbol('APP_CONFIG');
export const setAppConfig = (cfg: AppConfig) => (globalThis as any)[APP_CONFIG_SYMBOL] = cfg;
export const getAppConfig = () => (globalThis as any)[APP_CONFIG_SYMBOL] as AppConfig | undefined;

export async function ensureAppConfigLoaded() {
  if (!getAppConfig()) {
    const res = await fetch('/assets/app-config.json', { cache: 'no-store' });
    setAppConfig(await res.json());
  }
}

export const baseAppConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideAppInitializer(() => ensureAppConfigLoaded()),
  ],
};
