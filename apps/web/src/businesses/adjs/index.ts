import { BusinessModule } from '../types';
import { adjsConfig } from './config';
import AdjsDashboard from './Dashboard';

export * from './types';
export * from './config';
export * from './db';
export * from './CrmView';
export * from './ColdcallerDashboard';

export const adjsModule: BusinessModule = {
  config: adjsConfig,
  Dashboard: AdjsDashboard,
};

