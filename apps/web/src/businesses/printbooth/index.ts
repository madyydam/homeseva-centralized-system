import { BusinessModule } from '../types';
import { printboothConfig } from './config';
import PrintboothDashboard from './Dashboard';
export * from './types';
export * from './config';
export * from './db';

export const printboothModule: BusinessModule = {
  config: printboothConfig,
  Dashboard: PrintboothDashboard,
};

