
import { BudgetCategory, Fund } from './types';

/**
 * CONFIGURATION: DATA MANIFEST
 * These paths are relative to: public/Expenses by Fund/
 * 
 * Update 'jsonPath' to match your actual folder/file names exactly.
 * Example: if you have public/Expenses by Fund/General Fund/data.json
 * Set jsonPath to: 'General Fund/data.json'
 */
export const MC_FUNDS: Fund[] = [
  { 
    id: 'F1', 
    name: 'General Fund', 
    totalBudget: 65000000, 
    spent: 42000000, 
    description: 'Primary operating budget for Montgomery County.',
    jsonPath: 'General_Fund.json' // Change this to match your folder/file, e.g. 'General Fund/expenses.json'
  },
  { 
    id: 'F2', 
    name: 'Water & Sewer', 
    totalBudget: 25000000, 
    spent: 18500000, 
    description: 'Utility and infrastructure maintenance.',
    jsonPath: 'Water_Sewer_Fund.json'
  },
  { 
    id: 'F3', 
    name: 'Roads & Bridges', 
    totalBudget: 18000000, 
    spent: 9000000, 
    description: 'Special revenue for highway improvements.',
    jsonPath: 'Roads_Bridges.json'
  }
];

export const MC_BUDGET_DATA: BudgetCategory[] = [
  { name: 'Public Education', value: 45000000, color: '#3b82f6', description: 'K-12 schools and community colleges.' },
  { name: 'Public Safety', value: 25000000, color: '#ef4444', description: 'Police and Emergency Management.' },
  { name: 'Infrastructure', value: 18000000, color: '#10b981', description: 'Road maintenance and water systems.' },
  { name: 'Social Services', value: 12000000, color: '#f59e0b', description: 'Health and housing assistance.' },
  { name: 'Administration', value: 8000000, color: '#6366f1', description: 'County overhead and elections.' },
];

export const RECENT_EXPENDITURES = [
  { id: '1', date: '2024-03-10', department: 'Public Education', fundId: 'GF01', amount: 15200.50, vendor: 'EduSmart Solutions', purpose: 'STEM Lab Equipment' },
  { id: '2', date: '2024-03-08', department: 'Infrastructure', fundId: 'EF02', amount: 89000.00, vendor: 'Metro Paving Co.', purpose: 'Road Resurfacing - District 4' },
];

export const MOCK_VOTERS = [
  { voterId: 'V12345', fullName: 'Jane Citizen', district: 'District 4', pin: '1234' },
];
