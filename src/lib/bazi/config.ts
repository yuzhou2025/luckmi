/**
 * src/lib/bazi/config.ts
 * 派别参数唯一来源 —— 任何文件不得另写立春/晚子时/翻日逻辑。
 * 修改本文件须跑神煞 + 排盘快照测试。
 */

// ── 派别 / 历法 ──────────────────────────────────────────
export const SECT = {
  /** 年柱以立春为界（非正月初一） */
  yearBoundary: 'lichun' as const,
  /** 晚子时（23:00–00:00）归属当日，日柱不翻日 */
  lateHourDayCross: false,
  /** 子时跨日：早子时 00:00–01:00 归当日 */
  earlyZiSameDay: true,
} as const;

// ── 十神轴 ──────────────────────────────────────────────
/** 十神一律以日干为轴，禁止混合年干口径 */
export const SHISHEN_AXIS = 'dayGan' as const;

// ── 神煞查表基准 ─────────────────────────────────────────
export const SHENSHA = {
  /** 天干类神煞：年干查=大，日干查=小，两者并存不二选一 */
  tiangan: {
    big: 'yearGan' as const,   // 大天乙/大文昌/大福星（年干所查）
    small: 'dayGan' as const,  // 小天乙/小文昌/小福星（日干所查）
  },
  /** 地支类神煞：年支查=大，日支查=小，两者并存不二选一 */
  dizhi: {
    big: 'yearZhi' as const,   // 大桃花/大驿马/大华盖
    small: 'dayZhi' as const,  // 小桃花/小驿马/小华盖
  },
  /** 天乙贵人歌诀锁定：甲戊庚牛羊（丑未）。不提供另一套 */
  tianyiGuiRen: {
    甲: ['丑', '未'],
    戊: ['丑', '未'],
    庚: ['丑', '未'],
    乙: ['子', '申'],
    丙: ['亥', '酉'],
    丁: ['亥', '酉'],
    己: ['子', '申'],
    辛: ['寅', '午'],
    壬: ['卯', '巳'],
    癸: ['卯', '巳'],
  } as Record<string, string[]>,
} as const;

// ── 五行量化计分（V1.1 现代量化模拟模型）────────────────────
/**
 * 【模型约束 · 代码注释必须保留】
 * 1. 本模型为现代量化模拟，古代命理无此数字体系；仅用于程序演算，不替代传统子平论命。
 * 2. 作用优先级：合 > 冲 > 刑 > 害 > 破；
 *    - 有会/合局时，不计冲刑害破的力量；
 *    - 无会合局时，多重关系系数连续相乘（不是相加）。
 * 3. 静态权重无法完全模拟"气势"，结果仅作演算参考，不能直接替代传统命理实战。
 * 4. 日干（日主）不参与五行力量累加，只作为参照对象。
 * 5. 十神没有独立分数，十神力量 = 对应五行的最终得分（正/偏只区分阴阳，不改变分值）。
 */
export const WUXING_SCORE = {
  /** 四柱位置权重（曲炜版本二，总分 100；日干不计入） */
  position: {
    yearGan: 8, yearZhi: 4,
    monthGan: 12, monthZhi: 40,   // 月令提纲，最高权重
    dayZhi: 12,                   // 日主贴身根气
    hourGan: 12, hourZhi: 12,
  },
  /** 天干通根折扣系数（取最高根，不叠加） */
  root: {
    benqi: 1.0,    // 本气根：天干五行 = 地支本气五行
    zhongqi: 0.7,  // 中气根
    yuqi: 0.4,     // 余气根
    float: 0.3,    // 完全虚浮：全局地支无该五行藏干
  },
  /** 地支作用修正系数 */
  interaction: {
    bureau: 1.5,       // 成局五行总分 ×1.5（六合/三合/三会/半拱局）
    bureauOther: 0.3,  // 局内地支非局的其余藏干 ×0.3
    chong: 0.5,        // 六冲：两支互冲全部藏干 ×0.5
    xingFull: 0.8,     // 三刑三字齐全：参与地支藏干 ×0.8
    xingPair: 0.85,    // 相刑两支 / 子卯刑 / 自刑 ×0.85
    hai: 0.9,          // 六害（六穿）×0.9
    po: 0.95,          // 相破 ×0.95（力量最弱）
  },
  /** 同柱盖头（干克支）/ 截脚（支克干）：天干、地支双方分数 ×0.8 */
  gaitouJiejiao: 0.8,
  /** 月令旺相休囚死乘数（最终乘此系数） */
  wangxiang: { wang: 1.2, xiang: 1.1, xiu: 1.0, qiu: 0.7, si: 0.5 },
  /** 强弱判定阈值：生扶/克泄耗 比值超过此值判偏强/偏弱 */
  strengthThreshold: 1.1,
} as const;

/**
 * 地支藏干拆分比例（V1.1 固定 60-30-10 体系）。
 * - 子、卯、酉：纯气，本气 100%；
 * - 午：丁火本气 70%，己土中气 30%；
 * - 其余：本气 60% / 中气 30% / 余气 10%。
 * 顺序固定为本气 → 中气 → 余气。
 */
export const CANGGAN_RATIO: Record<string, { gan: string; ratio: number }[]> = {
  子: [{ gan: '癸', ratio: 1.0 }],
  丑: [{ gan: '己', ratio: 0.6 }, { gan: '癸', ratio: 0.3 }, { gan: '辛', ratio: 0.1 }],
  寅: [{ gan: '甲', ratio: 0.6 }, { gan: '丙', ratio: 0.3 }, { gan: '戊', ratio: 0.1 }],
  卯: [{ gan: '乙', ratio: 1.0 }],
  辰: [{ gan: '戊', ratio: 0.6 }, { gan: '乙', ratio: 0.3 }, { gan: '癸', ratio: 0.1 }],
  巳: [{ gan: '丙', ratio: 0.6 }, { gan: '庚', ratio: 0.3 }, { gan: '戊', ratio: 0.1 }],
  午: [{ gan: '丁', ratio: 0.7 }, { gan: '己', ratio: 0.3 }],
  未: [{ gan: '己', ratio: 0.6 }, { gan: '丁', ratio: 0.3 }, { gan: '乙', ratio: 0.1 }],
  申: [{ gan: '庚', ratio: 0.6 }, { gan: '壬', ratio: 0.3 }, { gan: '戊', ratio: 0.1 }],
  酉: [{ gan: '辛', ratio: 1.0 }],
  戌: [{ gan: '戊', ratio: 0.6 }, { gan: '辛', ratio: 0.3 }, { gan: '丁', ratio: 0.1 }],
  亥: [{ gan: '壬', ratio: 0.6 }, { gan: '甲', ratio: 0.3 }, { gan: '戊', ratio: 0.1 }],
};

// ── 喜用口径 ────────────────────────────────────────────
/**
 * 扶抑为主定喜用；调候仅标注（《穷通宝鉴》出处），不参与喜用合成。
 */
export const XIYONG = {
  method: 'fuyi' as const,    // 扶抑法
  tiaohouLabelOnly: true,     // 调候仅报告标注
} as const;

// ── 格局 ────────────────────────────────────────────────
/**
 * 仅输出可确定八正格（正官/七杀/正财/偏财/正印/偏印/食神/伤官及组合）。
 * 复杂/从格/化格/专旺/识别不全 → 不输出格局（pattern=null），也不写"需人工复核"。
 */
export const PATTERN = {
  enableBazheng: true,
  enableCongHua: false,  // 不识别从格/化格
  enableZhuanWang: false, // 不识别专旺
  outputNullWhenUncertain: true,
} as const;

// ── 古籍引用范围 ─────────────────────────────────────────
export const ALLOWED_CLASSICS = [
  '渊海子平',
  '子平真诠',
  '穷通宝鉴',
  '三命通会',
] as const;

// ── 真太阳时 ────────────────────────────────────────────
export const SOLAR_TIME = {
  /** 排盘前统一转东八区真太阳时 */
  toEast8TrueSolar: true,
  /** 基准经度（东八区） */
  baseLongitude: 120,
  /** 夏令时偏移按出生当日实际值取（tz-lookup / Intl），不写死 */
  dstAutoDetect: true,
} as const;

// ── 幸运映射（颜色/方位/数字仅来自五行，不随机）─────────
export const LUCK_MAP: Record<string, {
  colors: string[];
  directions: string[];
  numbers: number[];
}> = {
  木: { colors: ['青', '绿'], directions: ['东', '东南'], numbers: [3, 8] },
  火: { colors: ['红', '紫'], directions: ['南'], numbers: [2, 7] },
  土: { colors: ['黄', '棕'], directions: ['中', '东北', '西南'], numbers: [5, 0] },
  金: { colors: ['白', '金'], directions: ['西', '西北'], numbers: [4, 9] },
  水: { colors: ['黑', '蓝'], directions: ['北'], numbers: [1, 6] },
};
