import { BusinessModule } from '../../types';
import { crockeryRentalConfig } from './config';
import { CrockeryRentalApp } from './CrockeryRentalApp';

export const crockeryRentalModule: BusinessModule = {
  config: crockeryRentalConfig,
  Dashboard: CrockeryRentalApp,
};
