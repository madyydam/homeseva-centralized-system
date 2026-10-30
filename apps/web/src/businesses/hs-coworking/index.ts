import { BusinessModule } from '../types';
import { hsCoworkingConfig } from './config';
import HsCoworkingDashboard from './Dashboard';
export * from './types';
export * from './config';
export * from './db';

export const hsCoworkingModule: BusinessModule = {
  config: hsCoworkingConfig,
  Dashboard: HsCoworkingDashboard,
};

