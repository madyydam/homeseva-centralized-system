import { BusinessConfig } from '../types';

export const firstMoverAdvantageConfig: BusinessConfig = {
  id: '6',
  name: 'First Mover Advantage',
  slug: 'first-mover-advantage',
  subtitle: 'App SaaS Platform',
  description: 'Enterprise Mobile & Web Application SaaS Platform, API Gateway & Microservices',
  themeColor: 'cyan',
  roles: [
    {
      id: 'SaaS Product Architect',
      label: 'SaaS Product Architect',
      desc: 'API quotas, tenant infrastructure & multi-region deployment',
      badge: 'Architecture',
    },
    {
      id: 'Enterprise Customer Success',
      label: 'Enterprise Customer Success',
      desc: 'Developer onboarding, SLA monitoring & churn prevention',
      badge: 'Success',
    },
    {
      id: 'DevOps & Security Lead',
      label: 'DevOps & Security Lead',
      desc: 'Container clusters, automated CI/CD builds & secret keys',
      badge: 'DevOps',
    },
  ],
};

