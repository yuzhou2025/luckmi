/**
 * src/lib/naming/config.ts
 * 起名引擎参数唯一来源 —— 权重经规划 v7 §7.1④ 锁定。
 * 修改本文件须跑 naming 快照测试；八字侧口径见 src/lib/bazi/config.ts，本文件不重复定义。
 */

// ── 评分权重（合计 1.00，锁死） ──────────────────────────
export const NAMING_WEIGHT = {
  xiyong: 0.35,   // 喜用契合（wuxing.calcXiYong 确定性引擎）
  yinlv: 0.20,    // 音律（声调流/双声叠韵/平仄）
  ziyi: 0.15,     // 字义
  zixing: 0.10,   // 字形
  shuli: 0.10,    // 数理（五格/81 仅查表）
  dute: 0.10,     // 独特性（重名率）
} as const;

// ── 六项硬过滤（一票否决，顺序即执行顺序） ────────────────
export const HARD_FILTER = {
  /** ① 喜用契合：候选字五行 ∈ 喜用 ∪ 不忌，不加重忌神 */
  xiyongFit: true,
  /** ② 数理：人格/总格须达「中吉」及以上（81 表查表，不自造） */
  wugeMinLevel: 'zhongji' as const,
  /** ③ 谐音：普通话 + 粤语粗俗谐音黑名单 */
  homophone: true,
  /** ④ 避讳：长辈名/历史负面人物/品牌商标 */
  taboo: true,
  /** ⑤ 生僻字：语料频次排名上限（海外输入法可打性） */
  freqRankMax: 8000,
  /** ⑥ 流行度：仅标注不过滤（US SSA / 中文重名率） */
  popularityLabelOnly: true,
} as const;

// ── 音律参数 ────────────────────────────────────────────
export const PHONOLOGY = {
  /** 姓名全名声调种类下限（声调有起伏） */
  toneVarietyMin: 2,
  /** 声调种类每缺一档扣分 */
  toneVarietyPenalty: 0.2,
  /** 相邻字同声母/同韵母扣分 */
  sameShengmuPenalty: 0.5,
  sameYunmuPenalty: 0.3,
  /** 仄起平收加分 */
  levelEndBonus: 0.1,
} as const;

// ── 音译通道参数（string-similarity，Sørensen-Dice） ─────
export const TRANSLIT = {
  /** 音节相似度阈值 */
  syllableThreshold: 0.6,
  /** 每音节候选汉字簇上限 */
  clusterMax: 8,
} as const;

// ── 多音字口径（M1-3 仲裁锁死） ──────────────────────────
export const POLYPHONE = {
  /** 读音唯一事实源 = pinyin-pro；Fate/Unihan 读音仅参考，不参与评分与过滤 */
  canonicalSource: 'pinyin-pro' as const,
  /** 音律评分读音组合数上限，超限仅用各字默认读音组合 */
  comboCap: 8,
} as const;

// ── 输出数量 ────────────────────────────────────────────
export const OUTPUT = {
  /** $2.99 快速起名条数 */
  quickTopN: 10,
  /** $49 报告精解条数 */
  reportTopN: 5,
} as const;
