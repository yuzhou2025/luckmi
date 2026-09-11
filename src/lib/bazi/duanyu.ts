/**
 * src/lib/bazi/duanyu.ts
 * 断语出处库（规则 13/14）：报告断语一律取自本库，LLM 只做白话转写，不做命理判断。
 *
 * 收录口径（防语感编造）：
 * - source 仅取 config.ALLOWED_CLASSICS 四书：渊海子平 / 子平真诠 / 穷通宝鉴 / 三命通会。
 * - text 为义理摘要（该经典确立的格局/十神/调候/旺衰框架结论），非逐字原文摘抄；
 *   凡一书确立、诸书因循、无版本争议者方可收录。
 * - 不确定、无匹配 → getDuanyu 返回 []，报告对应断语卡缺省，绝不编造。
 * - 新增/修改条目须跑 tests/reports/duanyu.test.ts（出处白名单 + id 唯一 + snapshot）。
 *
 * 分工：
 * - topic 'pattern'  格局义理（八正格顺逆用、相神组合）—— 源《子平真诠》
 * - topic 'shishen'  十神义理（十神定性）              —— 源《渊海子平》
 * - topic 'tiaohou'  调候寒暖燥湿（按四季）            —— 源《穷通宝鉴》
 * - topic 'strength' 旺衰扶抑                          —— 源《三命通会》
 */

import { ALLOWED_CLASSICS } from './config';

export type ClassicName = (typeof ALLOWED_CLASSICS)[number];
export type DuanyuTopic = 'pattern' | 'shishen' | 'tiaohou' | 'strength';

export interface DuanyuEntry {
  id: string;
  topic: DuanyuTopic;
  /** 匹配键：pattern=格局名(如 七杀格)；shishen=十神名；tiaohou=四季(春/夏/秋/冬)；strength=身弱/身强/中和 */
  matchKey: string;
  /** 仅 pattern：组合格相神名（如 杀印相生/食神制杀/伤官佩印），缺省=主格通条 */
  matchSub?: string;
  /** 义理摘要（非逐字原文） */
  text: string;
  /** 出处书名（四书白名单） */
  source: ClassicName;
}

export const DUANYU: readonly DuanyuEntry[] = [
  // ── 格局（《子平真诠》：八正格顺用逆用、相神成败）──────────────
  {
    id: 'pat-zhengguan', topic: 'pattern', matchKey: '正官格',
    text: '正官为克身之吉神，主名位礼法；格成喜财印相随以生扶，最忌伤官克伐与刑冲破害。',
    source: '子平真诠',
  },
  {
    id: 'pat-qisha', topic: 'pattern', matchKey: '七杀格',
    text: '七杀（偏官）为攻身之凶神；善驭之者，上用食神制伏，次用印绶化杀，制化得宜则主权贵。',
    source: '子平真诠',
  },
  {
    id: 'pat-qisha-shayin', topic: 'pattern', matchKey: '七杀格', matchSub: '杀印相生',
    text: '杀印相生：七杀得印绶化杀生身，凶神驯而为用，主权贵显达。',
    source: '子平真诠',
  },
  {
    id: 'pat-qisha-shizhi', topic: 'pattern', matchKey: '七杀格', matchSub: '食神制杀',
    text: '食神制杀：食神伏制七杀，英雄独压万人；忌财印交战以夺食。',
    source: '子平真诠',
  },
  {
    id: 'pat-zhengcai', topic: 'pattern', matchKey: '正财格',
    text: '正财为我克之吉神，主勤务实得；喜食伤生财、身旺任财，忌比劫争财。',
    source: '子平真诠',
  },
  {
    id: 'pat-piancai', topic: 'pattern', matchKey: '偏财格',
    text: '偏财为众人流动之财，主慷慨好施；喜食伤生助、身旺能任，忌比劫分夺。',
    source: '子平真诠',
  },
  {
    id: 'pat-zhengyin', topic: 'pattern', matchKey: '正印格',
    text: '正印为生我之吉神，主学业荫庇；喜官杀生印，忌财星破印。',
    source: '子平真诠',
  },
  {
    id: 'pat-pianyin', topic: 'pattern', matchKey: '偏印格',
    text: '偏印（枭神）为忌则夺食；格成喜财星制印，忌再见食神以成枭夺。',
    source: '子平真诠',
  },
  {
    id: 'pat-shishen', topic: 'pattern', matchKey: '食神格',
    text: '食神为我生之秀气，主福寿；喜生财、制杀，忌枭印夺食。',
    source: '子平真诠',
  },
  {
    id: 'pat-shangguan', topic: 'pattern', matchKey: '伤官格',
    text: '伤官为我生之偏气，主才艺聪明而傲物；喜佩印制伤或生财泄秀，忌与官星交战。',
    source: '子平真诠',
  },
  {
    id: 'pat-shangguan-peiyin', topic: 'pattern', matchKey: '伤官格', matchSub: '伤官佩印',
    text: '伤官佩印：伤官得印制伏，泄秀而不逞狂，主文才贵显。',
    source: '子平真诠',
  },

  // ── 十神义理（《渊海子平》：十神定性）────────────────────────
  {
    id: 'ss-bijian', topic: 'shishen', matchKey: '比肩',
    text: '比肩为同我之神，主兄弟朋友助身；身弱赖其帮扶，身旺逢之则争财。',
    source: '渊海子平',
  },
  {
    id: 'ss-jiecai', topic: 'shishen', matchKey: '劫财',
    text: '劫财为同我异性之神，身弱可借以助身任财，身旺逢之则破财争财。',
    source: '渊海子平',
  },
  {
    id: 'ss-shishen', topic: 'shishen', matchKey: '食神',
    text: '食神为我生之秀气，主福寿饮食，能生财、制杀。',
    source: '渊海子平',
  },
  {
    id: 'ss-shangguan', topic: 'shishen', matchKey: '伤官',
    text: '伤官为我生之偏气，主才艺聪明、傲物不羁，见官为祸。',
    source: '渊海子平',
  },
  {
    id: 'ss-piancai', topic: 'shishen', matchKey: '偏财',
    text: '偏财为我克之偏，主流动之财、慷慨好交，透干怕劫。',
    source: '渊海子平',
  },
  {
    id: 'ss-zhengcai', topic: 'shishen', matchKey: '正财',
    text: '正财为我克之正，主勤俭务实，喜身旺以任财。',
    source: '渊海子平',
  },
  {
    id: 'ss-qisha', topic: 'shishen', matchKey: '七杀',
    text: '七杀为克我之偏，凶神无制则祸百端，有制化则主权贵。',
    source: '渊海子平',
  },
  {
    id: 'ss-zhengguan', topic: 'shishen', matchKey: '正官',
    text: '正官为克我之正，吉神主名位，只宜生扶，不可伤克。',
    source: '渊海子平',
  },
  {
    id: 'ss-pianyin', topic: 'shishen', matchKey: '偏印',
    text: '偏印为生我之偏，又名枭神，主偏艺孤清，见食神则夺食。',
    source: '渊海子平',
  },
  {
    id: 'ss-zhengyin', topic: 'shishen', matchKey: '正印',
    text: '正印为生我之正，主文章学业、荫庇护身，为吉神。',
    source: '渊海子平',
  },

  // ── 调候（《穷通宝鉴》：寒暖燥湿，调候为急）──────────────────
  {
    id: 'th-spring', topic: 'tiaohou', matchKey: '春',
    text: '寅卯辰月木旺方生，余寒未退，喜火暄和、水滋养。',
    source: '穷通宝鉴',
  },
  {
    id: 'th-summer', topic: 'tiaohou', matchKey: '夏',
    text: '巳午未月炎燥土焦、水涸金镕，调候急在润泽，喜壬癸水济火。',
    source: '穷通宝鉴',
  },
  {
    id: 'th-autumn', topic: 'tiaohou', matchKey: '秋',
    text: '申酉戌月金凉气肃，喜水泄秀、火锻炼以成器。',
    source: '穷通宝鉴',
  },
  {
    id: 'th-winter', topic: 'tiaohou', matchKey: '冬',
    text: '亥子丑月寒凝冰冻、万物收藏，调候急在解冻，喜丙火暖局。',
    source: '穷通宝鉴',
  },

  // ── 旺衰扶抑（《三命通会》：得令得地为旺，扶抑取用）────────────
  {
    id: 'st-weak', topic: 'strength', matchKey: '身弱',
    text: '身弱难任财官，喜比劫帮身、印绶生扶。',
    source: '三命通会',
  },
  {
    id: 'st-strong', topic: 'strength', matchKey: '身强',
    text: '身强能任财官，喜食伤泄秀、财星官杀克泄为用。',
    source: '三命通会',
  },
  {
    id: 'st-balanced', topic: 'strength', matchKey: '中和',
    text: '八字中和为贵，五行贵在流通，不必强为抑扶。',
    source: '三命通会',
  },
];

const DUANYU_INDEX: ReadonlyMap<string, DuanyuEntry[]> = (() => {
  const map = new Map<string, DuanyuEntry[]>();
  for (const e of DUANYU) {
    const key = `${e.topic}:${e.matchKey}`;
    const list = map.get(key);
    if (list) list.push(e);
    else map.set(key, [e]);
  }
  return map;
})();

/**
 * 按主题 + 匹配键取断语。无匹配返回 []（报告对应断语卡缺省，不编造）。
 * pattern 主题可传 matchSub（组合格相神名）：返回主格通条 + 该组合专条。
 */
export function getDuanyu(
  topic: DuanyuTopic,
  matchKey: string,
  matchSub?: string,
): DuanyuEntry[] {
  const list = DUANYU_INDEX.get(`${topic}:${matchKey}`) ?? [];
  if (topic !== 'pattern') return list;
  // pattern：未传组合名 → 仅主格通条；传组合名 → 主格通条 + 该组合专条
  if (matchSub === undefined) return list.filter(e => e.matchSub === undefined);
  return list.filter(e => e.matchSub === undefined || e.matchSub === matchSub);
}

/** 全量断语（测试 snapshot / 审计用） */
export function getAllDuanyu(): DuanyuEntry[] {
  return [...DUANYU];
}
