import { BusinessModule } from '../types';
import { firstMoverAdvantageConfig } from './config';
import FirstMoverAdvantageDashboard from './Dashboard';
export * from './types';
export * from './config';
export * from './db';

export const firstMoverAdvantageModule: BusinessModule = {
  config: firstMoverAdvantageConfig,
  Dashboard: FirstMoverAdvantageDashboard,
};

