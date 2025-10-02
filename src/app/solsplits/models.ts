export interface RecipientDto {
  address: string;
  percentage: number;
}

export interface SplitterListItemDto {
  id: string;
  owner: string;
  name: string | null;
  recipients: RecipientDto[];
  isMutable: boolean;
  createdTimestamp: string | null;
  updateTimestamp: string | null;  
}

export interface SplittersResponse {
  splitters: SplitterListItemDto[];
  count: number;
}

export interface SplitterDetailsDto {
  id: string;
  owner: string;
  name: string | null;
  recipients: RecipientDto[];
  isMutable: boolean;
  createdTimestamp: string | null;
  updateTimestamp: string | null;
}

export type DepositSortField = 'amount' | 'timestamp';
export type SplitterSortField = 'createdTimestamp' | 'updateTimestamp';
export type SortingDir = 'ASC' | 'DESC';

export interface DepositItemDto {
  id: string;
  amount: string; 
  depositor: string;
  individualAmount?: string[];
  recipients?: string[];
  mint?: string | null;
  splitter: string;
  timestamp: string;
}

export interface DepositsResponse {
  deposits: DepositItemDto[];
  count: number;
}
