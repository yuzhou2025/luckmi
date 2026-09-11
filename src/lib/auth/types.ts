export type Role =
  | 'guest'
  | 'registered'
  | 'single_paid'
  | 'bazi_report'
  | 'pro_monthly'
  | 'pro_yearly'
  | 'consult_owner';

export interface Capabilities {
  fullBaZi: boolean;
  timeline: boolean;
  hourPillar: boolean;
  namingFullCount: number;
  namingDetail: boolean;
  nameReport: boolean;
  annualReport: boolean;
  monthlyReport: boolean;
  dailyFortune: boolean;
  dailyFortunePlus: boolean;
  consultDiscount: number;
}
