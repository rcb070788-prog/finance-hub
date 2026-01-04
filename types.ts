
export enum Category {
  EXPENSES = 'expenses',
  REVENUES = 'revenues',
  ASSETS = 'assets',
  LIABILITIES = 'liabilities'
}

export interface DashboardLink {
  id: string;
  title: string;
  category: Category;
  path: string; // The URL to the index.html inside the folder
  description: string;
}

export interface Poll {
  id: string;
  question: string;
  description: string;
  options: string[];
  isOpen: boolean;
  createdAt: string;
  expiresAt: string;
}

export interface Vote {
  pollId: string;
  voterId: string;
  optionIndex: number;
  isAnonymous: boolean;
  voterName: string;
  district: string;
}

export interface Comment {
  id: string;
  pollId: string;
  voterName: string;
  text: string;
  timestamp: string;
}

export interface User {
  username: string;
  voterId: string;
  fullName: string;
  district: string;
  notifications: {
    email: boolean;
    text: boolean;
  };
}
