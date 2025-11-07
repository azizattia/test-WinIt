export interface SearchRequest {
  firstName: string;
  lastName: string;
}

export interface Party {
  name: string;
  role: string;
  details?: string;
}

export interface Hearing {
  dateTime: string;
  type: string;
  department?: string;
  judge?: string;
  result?: string;
}

export interface Financial {
  fines?: number;
  fees?: number;
  balance?: number;
}

export interface CaseInfo {
  caseNumber: string;
  filingDate: string;
  caseType: string;
  status: string;
  courtLocation: string;
}

export interface SourceMetadata {
  sourceUrl: string;
  scrapeTimestamp: string;
  dataSource: 'mock' | 'live';
}

export interface CourtCase {
  caseInfo: CaseInfo;
  parties: Party[];
  hearings: Hearing[];
  financials?: Financial;
  sourceMetadata: SourceMetadata;
}

export interface SearchResponse {
  success: boolean;
  totalCases: number;
  cases: CourtCase[];
  query: {
    firstName: string;
    lastName: string;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
}
