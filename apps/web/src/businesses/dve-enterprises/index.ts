import { BusinessModule } from '../types';
import { dveEnterprisesConfig } from './config';
import DveEnterprisesDashboard from './Dashboard';
export * from './types';
export * from './config';
export * from './db';

export const dveEnterprisesModule: BusinessModule = {
  config: dveEnterprisesConfig,
  Dashboard: DveEnterprisesDashboard,
};

