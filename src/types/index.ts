export interface FundInfo {
  fundName: string;
  amcName: string;
  fundCategory: string;
  fundManager: string[];
  benchmark: string;
  aum: string;
  expenseRatio: string;
  inceptionDate: string;
  riskProfile: string;
}

export interface TopPerformer {
  name: string;
  specifics: string;
  contribution: string;
  reason: string;
}

export interface BottomPerformer {
  name: string;
  specifics: string;
  contribution: string;
  reason: string;
}

export interface CommentaryData {
  fundInfo: FundInfo;
  fundManagerTeam: string;
  strategy: string;
  performanceAttribution: {
    summary: string;
    topPerformers: TopPerformer[];
    bottomPerformers: BottomPerformer[];
  };
  benchmarkComparison: string;
  outlook: string;
  quarter: string;
  year: string;
}
