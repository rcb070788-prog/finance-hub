
import { Category, DashboardLink } from './types';

/**
 * INSTRUCTIONS FOR ADDING DASHBOARDS:
 * 1. Place your folder (e.g. "expenses-2023") into the /public/dashboards/ folder.
 * 2. Add a new entry to the DASHBOARDS array below.
 * 3. The 'path' should start with '/dashboards/' followed by your folder name and '/index.html'.
 */

export const DASHBOARDS: DashboardLink[] = [
  {
    id: 'exp-2023-fund',
    title: 'Expenses by Fund (2023)',
    category: Category.EXPENSES,
    path: '/dashboards/expenses/expensesbyfund/index.html',
    description: 'Detailed breakdown of annual expenditures across all major county funds.'
  },
  {
    id: 'rev-2023-summary',
    title: 'Revenue Overview (2023)',
    category: Category.REVENUES,
    path: '/dashboards/revenues/general-revenue/index.html',
    description: 'Summary of all tax collection and grant revenues for the fiscal year.'
  }
];

export const CATEGORY_EXPLANATIONS = {
  [Category.EXPENSES]: {
    title: "Expenses",
    what: "This section tracks where the money goes. It includes salaries, infrastructure, services, and operations.",
    how: "Compare different funds using the interactive charts. Hover over bars to see exact figures. Click 'Expenses by Fund' below to open the dashboard."
  },
  [Category.REVENUES]: {
    title: "Revenues",
    what: "This shows where the money comes from—taxes, state grants, and fees.",
    how: "Look for trends in year-over-year tax collection. Pie charts show the percentage of revenue from different sources."
  },
  [Category.ASSETS]: {
    title: "Assets",
    what: "These are the things the county owns: buildings, equipment, and cash reserves.",
    how: "Review the asset lifecycle charts to see how long equipment has left before it needs replacement."
  },
  [Category.LIABILITIES]: {
    title: "Liabilities",
    what: "These are the county's debts and obligations, like bond payments and pensions.",
    how: "Focus on the 'Debt Schedule' to see how much we owe over the next 10 years."
  }
};
