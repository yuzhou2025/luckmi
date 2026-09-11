/**
 * src/lib/shensha/tiangan.ts
 * 天干类神煞 —— 以日干（日元/日柱天干）为轴（规则 8A/9）。
 *
 * 包含：天乙贵人、文昌、福星贵人、学堂、月德、月德合、阴差阳错
 * 天乙贵人歌诀锁定：甲戊庚牛羊（丑未），来自 config.ts。
 */

import { SHENSHA } from '@/lib/bazi/config';
import type { ShenSha } from '@/lib/bazi/paipan';

// ── 类型 ────────────────────────────────────────────────

export interface ShenshaHit {
  pillar: 'year' | 'month' | 'day' | 'hour';
  shensha: ShenSha;
}

// ── 歌诀表 ──────────────────────────────────────────────

/** 文昌：甲见巳, 乙见午, 丙戊见申, 丁己见酉, 庚见亥, 辛见子, 壬见寅, 癸见卯 */
const WENCHANG: Record<string, string[]> = {
  甲: ['巳'], 乙: ['午'], 丙: ['申'], 丁: ['酉'],
  戊: ['申'], 己: ['酉'], 庚: ['亥'], 辛: ['子'],
  壬: ['寅'], 癸: ['卯'],
};

/** 福星贵人：甲乙寅卯, 丙丁亥丑, 戊己子卯, 庚辛巳酉, 壬癸午未 */
const FUXING: Record<string, string[]> = {
  甲: ['寅', '卯'], 乙: ['寅', '卯'],
  丙: ['亥', '丑'], 丁: ['亥', '丑'],
  戊: ['子', '卯'], 己: ['子', '卯'],
  庚: ['巳', '酉'], 辛: ['巳', '酉'],
  壬: ['午', '未'], 癸: ['午', '未'],
};

/** 学堂：甲见亥, 乙见午, 丙戊见寅, 丁己见酉, 庚见巳, 辛见子, 壬见申, 癸见卯 */
const XUETANG: Record<string, string[]> = {
  甲: ['亥'], 乙: ['午'], 丙: ['寅'], 丁: ['酉'],
  戊: ['寅'], 己: ['酉'], 庚: ['巳'], 辛: ['子'],
  壬: ['申'], 癸: ['卯'],
};

/**
 * 太极贵人（日干轴，《三命通会》歌诀）：
 * 甲乙见子午, 丙丁见卯酉, 戊己见辰戌丑未, 庚辛见寅亥, 壬癸见巳申
 */
const TAIJI: Record<string, string[]> = {
  甲: ['子', '午'], 乙: ['子', '午'],
  丙: ['卯', '酉'], 丁: ['卯', '酉'],
  戊: ['辰', '戌', '丑', '未'], 己: ['辰', '戌', '丑', '未'],
  庚: ['寅', '亥'], 辛: ['寅', '亥'],
  壬: ['巳', '申'], 癸: ['巳', '申'],
};

/**
 * 词馆（日干轴，《三命通会》：词馆为食神临官之位）：
 * 甲乙见巳, 丙戊见申, 丁己见酉, 庚见亥, 辛见子, 壬见寅, 癸见卯
 */
const CIGUAN: Record<string, string[]> = {
  甲: ['巳'], 乙: ['巳'],
  丙: ['申'], 戊: ['申'],
  丁: ['酉'], 己: ['酉'],
  庚: ['亥'], 辛: ['子'],
  壬: ['寅'], 癸: ['卯'],
};

/** 月德：寅午戌月→丙, 申子辰月→壬, 巳酉丑月→庚, 亥卯未月→甲 */
const YUEDE: Record<string, string> = {
  // 三合局月支 → 月德天干
  寅: '丙', 午: '丙', 戌: '丙',
  申: '壬', 子: '壬', 辰: '壬',
  巳: '庚', 酉: '庚', 丑: '庚',
  亥: '甲', 卯: '甲', 未: '甲',
};

/** 月德合：寅午戌→辛(丙合辛), 申子辰→丁(壬合丁), 巳酉丑→乙(庚合乙), 亥卯未→己(甲合己) */
const YUEDE_HE: Record<string, string> = {
  寅: '辛', 午: '辛', 戌: '辛',
  申: '丁', 子: '丁', 辰: '丁',
  巳: '乙', 酉: '乙', 丑: '乙',
  亥: '己', 卯: '己', 未: '己',
};

/** 阴差阳错日柱干支组合 */
const YINCHAYANGCUO = new Set([
  '丙子', '丁丑', '戊寅', '辛卯', '壬辰', '癸巳',
  '丙午', '丁未', '戊申', '辛酉', '壬戌', '癸亥',
]);

// ── 查表主函数 ──────────────────────────────────────────

/**
 * 天干类神煞查表：年干查=大, 日干查=小，大小并存。
 *
 * @param yearGan 年干（大基准）
 * @param dayGan 日干（小基准）
 * @param monthZhi 月支（月德/月德合用）
 * @param pillars 四柱干支 [{position, gan, zhi}, ...]
 * @returns 命中神煞列表
 */
export function findTianganShensha(
  yearGan: string,
  dayGan: string,
  monthZhi: string,
  pillars: { position: 'year' | 'month' | 'day' | 'hour'; gan: string; zhi: string }[],
): ShenshaHit[] {
  const hits: ShenshaHit[] = [];

  // 干查双轴：年干=大、日干=小（并存不二选一，config.SHENSHA.tiangan）
  const axes = [
    { gan: yearGan, level: '大' as const, source: '年干' as const },
    { gan: dayGan, level: '小' as const, source: '日干' as const },
  ];

  // 1. 天乙贵人（config.ts 锁定歌诀）
  for (const ax of axes) {
    const guiRenZhi = SHENSHA.tianyiGuiRen[ax.gan] ?? [];
    for (const p of pillars) {
      if (guiRenZhi.includes(p.zhi)) {
        hits.push({
          pillar: p.position,
          shensha: { name: '天乙贵人', level: ax.level, source: ax.source },
        });
      }
    }
  }

  // 2. 文昌
  for (const ax of axes) {
    const wenchangZhi = WENCHANG[ax.gan] ?? [];
    for (const p of pillars) {
      if (wenchangZhi.includes(p.zhi)) {
        hits.push({
          pillar: p.position,
          shensha: { name: '文昌', level: ax.level, source: ax.source },
        });
      }
    }
  }

  // 3. 福星贵人
  for (const ax of axes) {
    const fuxingZhi = FUXING[ax.gan] ?? [];
    for (const p of pillars) {
      if (fuxingZhi.includes(p.zhi)) {
        hits.push({
          pillar: p.position,
          shensha: { name: '福星贵人', level: ax.level, source: ax.source },
        });
      }
    }
  }

  // 4. 学堂
  for (const ax of axes) {
    const xuetaangZhi = XUETANG[ax.gan] ?? [];
    for (const p of pillars) {
      if (xuetaangZhi.includes(p.zhi)) {
        hits.push({
          pillar: p.position,
          shensha: { name: '学堂', level: ax.level, source: ax.source },
        });
      }
    }
  }

  // 5. 太极贵人
  for (const ax of axes) {
    const taijiZhi = TAIJI[ax.gan] ?? [];
    for (const p of pillars) {
      if (taijiZhi.includes(p.zhi)) {
        hits.push({
          pillar: p.position,
          shensha: { name: '太极贵人', level: ax.level, source: ax.source },
        });
      }
    }
  }

  // 6. 词馆
  for (const ax of axes) {
    const ciguanZhi = CIGUAN[ax.gan] ?? [];
    for (const p of pillars) {
      if (ciguanZhi.includes(p.zhi)) {
        hits.push({
          pillar: p.position,
          shensha: { name: '词馆', level: ax.level, source: ax.source },
        });
      }
    }
  }

  // 7. 月德（月支三合局定干，该干现于四柱天干；source=月支，不分大小）
  const yuedeGan = YUEDE[monthZhi];
  if (yuedeGan) {
    for (const p of pillars) {
      if (p.gan === yuedeGan) {
        hits.push({
          pillar: p.position,
          shensha: { name: '月德', level: null, source: '月支' },
        });
      }
    }
  }

  // 8. 月德合（月支三合局定合干；source=月支，不分大小）
  const yuedeHeGan = YUEDE_HE[monthZhi];
  if (yuedeHeGan) {
    for (const p of pillars) {
      if (p.gan === yuedeHeGan) {
        hits.push({
          pillar: p.position,
          shensha: { name: '月德合', level: null, source: '月支' },
        });
      }
    }
  }

  // 9. 阴差阳错（日柱干支组合查，无轴）
  for (const p of pillars) {
    if (YINCHAYANGCUO.has(p.gan + p.zhi)) {
      hits.push({
        pillar: p.position,
        shensha: { name: '阴差阳错', level: null, source: '日柱' as any },
      });
    }
  }

  return hits;
}
