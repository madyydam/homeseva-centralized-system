import { BusinessModule } from '../types';
import { prefabConstructionConfig } from './config';
import PrefabConstructionDashboard from './Dashboard';
export * from './types';
export * from './config';
export * from './db';

export const prefabConstructionModule: BusinessModule = {
  config: prefabConstructionConfig,
  Dashboard: PrefabConstructionDashboard,
};

