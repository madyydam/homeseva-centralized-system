import { BusinessModule } from '../types';
import { horecaEssentialsConfig } from './config';
import HorecaEssentialsDashboard from './Dashboard';
export * from './types';
export * from './config';
export * from './db';

export const horecaEssentialsModule: BusinessModule = {
  config: horecaEssentialsConfig,
  Dashboard: HorecaEssentialsDashboard,
};

