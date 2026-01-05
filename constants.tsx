
import { DashboardConfig } from './types';

/**
 * COACH TIP: 
 * We use strings like 'fa-money-bill-trend-up' here. 
 * This makes our data "serializable" (easy to save or move) 
 * and prevents React from getting confused by nested objects.
 */

export const CATEGORIES = [
  { id: 'expenses', label: 'Expenses', icon: 'fa-money-bill-trend-up', color: 'bg-red-500' },
  { id: 'revenues', label: 'Revenues', icon: 'fa-hand-holding-dollar', color: 'bg-green-500' },
  { id: 'assets', label: 'Assets', icon: 'fa-building-columns', color: 'bg-blue-500' },
  { id: 'liabilities', label: 'Liabilities', icon: 'fa-file-invoice-dollar', color: 'bg-amber-500' },
];

export const DASHBOARDS: DashboardConfig[] = [
  {
    id: 'expenses-by-fund',
    category: 'expenses',
    title: 'Expenses by Fund',
    description: 'A detailed breakdown of community spending across various public funds including CSV data and fiscal reports.',
    folderPath: '/dashboards/expensesbyfund/index.html'
  }
];

export const TN_VOTER_LOOKUP_URL = "https://tnmap.tn.gov/voterlookup/";
