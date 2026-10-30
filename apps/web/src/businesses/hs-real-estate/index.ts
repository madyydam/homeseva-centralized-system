import { BusinessModule } from '../types';
import { hsRealEstateConfig } from './config';
import HsRealEstateDashboard from './Dashboard';
export * from './types';
export * from './config';
export * from './db';

export const hsRealEstateModule: BusinessModule = {
  config: hsRealEstateConfig,
  Dashboard: HsRealEstateDashboard,
};

