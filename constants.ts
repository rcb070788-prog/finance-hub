
import { DashboardConfig } from './types';

export const CATEGORIES = [
  { id: 'expenses', label: 'Expenses', icon: 'fa-money-bill-trend-up', color: 'bg-red-500' },
  { id: 'revenues', label: 'Revenues', icon: 'fa-hand-holding-dollar', color: 'bg-green-500' },
  { id: 'assets', label: 'Assets', icon: 'fa-building-columns', color: 'bg-blue-500' },
  { id: 'liabilities', label: 'Liabilities', icon: 'fa-file-invoice-dollar', color: 'bg-amber-500' },
];

/**
 * CONFIGURATION: Add your new dashboards here!
 */
export const DASHBOARDS: (DashboardConfig & { status?: string })[] = [
  {
    id: 'expenses-by-fund',
    category: 'expenses',
    title: 'General Fund Spending',
    description: 'A detailed breakdown of community spending across various public funds including CSV data.',
    folderPath: '/dashboards/expensesbyfund/index.html',
    status: 'Live'
  },
  {
    id: 'education-budget',
    category: 'expenses',
    title: 'School District Allocation',
    description: 'Transparency report on how local taxes are being used for school infrastructure and staffing.',
    folderPath: '/dashboards/education/index.html',
    status: 'Updated Today'
  },
  {
    id: 'property-tax-revenue',
    category: 'revenues',
    title: 'Property Tax Collection',
    description: 'Visualization of tax revenue trends over the last 10 years for our district.',
    folderPath: '/dashboards/property-tax/index.html',
    status: 'Official'
  }
];

export const TN_VOTER_LOOKUP_URL = "https://tnmap.tn.gov/voterlookup/";
