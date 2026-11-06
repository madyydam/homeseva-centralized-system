import { BusinessModule } from './types';
import { prefabConstructionModule } from './prefab-construction';
import { horecaEssentialsModule } from './horeca-essentials';
import { gentleHairWigsModule } from './gentle-hair-wigs';
import { ecolabDistributionModule } from './ecolab-distribution';
import { hsCoworkingModule } from './hs-coworking';
import { firstMoverAdvantageModule } from './first-mover-advantage';
import { printboothModule } from './printbooth';
import { adjsModule } from './adjs';
import { dvrEnterpriseModule } from './dvr-enterprise';
import { dveEnterprisesModule } from './dve-enterprises';
import { ndaServicesModule } from './nda-services';
import { hsRealEstateModule } from './hs-real-estate';

export * from './types';

export const BUSINESS_MODULES: Record<string, BusinessModule> = {
  'prefab-construction': prefabConstructionModule,
  'horeca-essentials': horecaEssentialsModule,
  'gentle-hair-wigs': gentleHairWigsModule,
  'ecolab-distribution': ecolabDistributionModule,
  'hs-coworking': hsCoworkingModule,
  'first-mover-advantage': firstMoverAdvantageModule,
  'adjs': adjsModule,
  'printbooth': adjsModule,
  'dvr-enterprise': dvrEnterpriseModule,
  'dvr-enterprises': dvrEnterpriseModule,
  'dve-enterprises': dvrEnterpriseModule,
  'nda-services': ndaServicesModule,
  'hs-real-estate': hsRealEstateModule,

  // Backward compatibility alias slugs if needed
  'business-1': prefabConstructionModule,
  'crockery-rental': horecaEssentialsModule,
  'business-2': gentleHairWigsModule,
  'business-4': ecolabDistributionModule,
};

export function getBusinessModule(slug: string): BusinessModule | undefined {
  return BUSINESS_MODULES[slug];
}

export function getAllBusinessModules(): BusinessModule[] {
  return [
    prefabConstructionModule,
    horecaEssentialsModule,
    gentleHairWigsModule,
    ecolabDistributionModule,
    hsCoworkingModule,
    firstMoverAdvantageModule,
    printboothModule,
    dvrEnterpriseModule,
    ndaServicesModule,
    hsRealEstateModule,
  ];
}

