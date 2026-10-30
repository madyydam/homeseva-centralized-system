import { BusinessModule } from '../types';
import { ndaServicesConfig } from './config';
import NdaServicesDashboard from './Dashboard';
export * from './types';
export * from './config';
export * from './db';

export const ndaServicesModule: BusinessModule = {
  config: ndaServicesConfig,
  Dashboard: NdaServicesDashboard,
};

