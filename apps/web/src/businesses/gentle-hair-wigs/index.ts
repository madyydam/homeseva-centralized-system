import { BusinessModule } from '../types';
import { gentleHairWigsConfig } from './config';
import GentleHairWigsDashboard from './Dashboard';
export * from './types';
export * from './config';
export * from './db';

export const gentleHairWigsModule: BusinessModule = {
  config: gentleHairWigsConfig,
  Dashboard: GentleHairWigsDashboard,
};

