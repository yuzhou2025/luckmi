import type { Role, Capabilities } from './types';

const MATRIX: Record<Role, Capabilities> = {
  guest:        { fullBaZi:false, timeline:false, hourPillar:false, namingFullCount:3, namingDetail:false, nameReport:false, annualReport:false, monthlyReport:false, dailyFortune:false, dailyFortunePlus:false, consultDiscount:0 },
  registered:   { fullBaZi:false, timeline:false, hourPillar:false, namingFullCount:3, namingDetail:false, nameReport:false, annualReport:false, monthlyReport:false, dailyFortune:true,  dailyFortunePlus:false, consultDiscount:0 },
  single_paid:  { fullBaZi:false, timeline:false, hourPillar:false, namingFullCount:10, namingDetail:true,  nameReport:false, annualReport:false, monthlyReport:false, dailyFortune:true,  dailyFortunePlus:false, consultDiscount:0 },
  bazi_report:  { fullBaZi:true,  timeline:true,  hourPillar:false, namingFullCount:10, namingDetail:true,  nameReport:true,  annualReport:false, monthlyReport:false, dailyFortune:true,  dailyFortunePlus:false, consultDiscount:0 },
  pro_monthly:  { fullBaZi:true,  timeline:true,  hourPillar:false, namingFullCount:10, namingDetail:true,  nameReport:true,  annualReport:false, monthlyReport:true,  dailyFortune:true,  dailyFortunePlus:false, consultDiscount:0.9 },
  pro_yearly:   { fullBaZi:true,  timeline:true,  hourPillar:true,  namingFullCount:10, namingDetail:true,  nameReport:true,  annualReport:true,  monthlyReport:true,  dailyFortune:true,  dailyFortunePlus:true,  consultDiscount:0.9 },
  consult_owner:{ fullBaZi:true,  timeline:false, hourPillar:false, namingFullCount:0,  namingDetail:false, nameReport:false, annualReport:false, monthlyReport:false, dailyFortune:false, dailyFortunePlus:false, consultDiscount:0 },
};

export function getCapabilities(role: Role, expired = false): Capabilities {
  if (expired && (role === 'pro_monthly' || role === 'pro_yearly')) return MATRIX.registered;
  return MATRIX[role];
}
export { MATRIX as ROLE_MATRIX };
