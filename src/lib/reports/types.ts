/**
 * src/lib/reports/types.ts
 * 报告统一类型（规则：先做数据结构 + snapshot 测试，再接渲染层）。
 * 所有报告数据为纯 JSON 可序列化结构，供 HTML 渲染与 JSON 存档共用。
 */
import type { PaipanResult, GanZhiRelation } from '@/lib/bazi/paipan';
import type { TimelineItem } from '@/lib/bazi/timeline';
import type { DuanyuEntry } from '@/lib/bazi/duanyu';
import type { ZodiacEntry } from '@/lib/i18n/zodiac';

export type ReportLocale = 'en' | 'zh';

export type ReportKind = 'life' | 'year' | 'month';

export interface ReportMeta {
  /** 报告种类 */
  kind: ReportKind;
  /** 生成时间 ISO（由 opts.now 注入，测试可锁定） */
  generatedAt: string;
  /** 引擎标识（断语/数据均出自 bazi-engine 带出处库） */
  engine: 'bazi-engine';
  locale: ReportLocale;
}

/** 报告当事人/出生信息 */
export interface ReportSubject {
  gender: 'male' | 'female';
  /** 原始输入（公历/农历） */
  birth: {
    year: number; month: number; day: number; hour: number; minute: number;
    calendar?: 'solar' | 'lunar';
  };
  /** 东八区真太阳时（排盘实际所用时间），YYYY-MM-DD HH:mm */
  trueSolarTime: string;
  /** 生肖卡数据（年支 → 生肖；无匹配为 null） */
  zodiac: ZodiacEntry | null;
}

/** 命局章节数据（四柱 + 作用关系） */
export interface ChartSection {
  pillars: PaipanResult['pillars'];
  dayGan: string;
  dayGanWuxing: string;
  relations: GanZhiRelation[];
}

/** 五行/强弱章节 */
export interface WuxingSection {
  score: PaipanResult['wuxingScore'];
  /** 强弱五档：极强/偏强/均衡/偏弱/极弱 */
  strength: PaipanResult['strength'];
}

/** 格局章节（pattern=null 时 result=null、duanyu=[]，整卡缺省） */
export interface PatternSection {
  result: NonNullable<PaipanResult['pattern']> | null;
  duanyu: DuanyuEntry[];
}

/** 调候章节（仅标注，不参与喜用合成） */
export interface TiaohouSection {
  gods: string[];
  source: string;
  /** 月支所归四季：春/夏/秋/冬 */
  season: string;
  duanyu: DuanyuEntry[];
}

/** 大运章节 */
export interface DayunSection {
  qiYun: PaipanResult['qiYun'];
  direction: PaipanResult['dayunDirection'];
  list: PaipanResult['dayun'];
  current: PaipanResult['dayun'][number] | null;
}

/**
 * 命理报告（life）完整数据结构。
 * 断语只来自 duanyu 带出处库；LLM 白话转写不在本结构内。
 */
export interface LifeReportData {
  meta: ReportMeta;
  subject: ReportSubject;
  chart: ChartSection;
  wuxing: WuxingSection;
  xiyong: PaipanResult['xiYong'];
  pattern: PatternSection;
  tiaohou: TiaohouSection;
  /** 旺衰扶抑断语（按强弱五档映射 身弱/身强/中和） */
  strengthDuanyu: DuanyuEntry[];
  dayun: DayunSection;
  /**
   * 流年快照：当前大运覆盖的 10 年（全部走 bazi-engine timeline，
   * 禁止手写干支递推）；渲染层自行决定展示窗口与当前高亮。
   */
  liunian: TimelineItem[];
}

/**
 * 流年报告（year）数据结构（骨架：数据 + snapshot，渲染层后续接入）。
 * 流月以节气为界，全部走 bazi-engine。
 */
export interface YearReportData {
  meta: ReportMeta;
  subject: ReportSubject;
  /** 当年所在大运（童限期可为 null） */
  dayun: { ganzhi: string; isCurrent: boolean; startAge: number; startYear: number } | null;
  /** 当前流年（now 所在公历年；无匹配为 null） */
  liunian: TimelineItem | null;
  /** 当年 12 个节气月（getLiuyue，以节气为界） */
  liuyue: TimelineItem[];
  /** 流年天干十神义理断语（《渊海子平》）；无匹配为 [] */
  duanyu: {
    shishen: DuanyuEntry[];
  };
}

/**
 * 月度报告（month）数据结构（骨架：数据 + snapshot，渲染层后续接入）。
 */
export interface MonthReportData {
  meta: ReportMeta;
  subject: ReportSubject;
  /** 当前流年锚点 */
  liunian: { year: number; ganzhi: string } | null;
  /** 当前流月（now 所在节气月；无匹配为 null） */
  liuyue: TimelineItem | null;
  /** 当前节气月内流日（getLiuri，按节气为界回扫/扫描） */
  liuri: TimelineItem[];
}
