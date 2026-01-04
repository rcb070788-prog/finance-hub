
export interface BudgetCategory {
  name: string;
  value: number;
  color: string;
  description: string;
}

export interface Fund {
  id: string;
  name: string;
  totalBudget: number;
  spent: number;
  description: string;
  jsonPath: string; // The relative path to the JSON file inside "public/Expenses by Fund/"
}

export interface ExpenditureRecord {
  id: string;
  date: string;
  department: string;
  fundId: string;
  amount: number;
  vendor: string;
  purpose: string;
}

export interface User {
  voterId: string;
  fullName: string;
  district: string;
  isLoggedIn: boolean;
}

export type ViewType = 'dashboard' | 'funds' | 'voter-login' | 'ai-analysis' | 'voter-portal';
