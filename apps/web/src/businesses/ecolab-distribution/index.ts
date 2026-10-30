import { BusinessModule } from '../types';
import { ecolabDistributionConfig } from './config';
import EcolabDistributionDashboard from './Dashboard';
export * from './types';
export * from './config';
export * from './db';

export const ecolabDistributionModule: BusinessModule = {
  config: ecolabDistributionConfig,
  Dashboard: EcolabDistributionDashboard,
};

