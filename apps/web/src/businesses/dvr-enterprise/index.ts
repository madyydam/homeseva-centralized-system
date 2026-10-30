import { BusinessModule } from '../types';
import { dvrEnterpriseConfig } from './config';
import DvrEnterpriseDashboard from './Dashboard';
export * from './types';
export * from './config';
export * from './db';

export const dvrEnterpriseModule: BusinessModule = {
  config: dvrEnterpriseConfig,
  Dashboard: DvrEnterpriseDashboard,
};
