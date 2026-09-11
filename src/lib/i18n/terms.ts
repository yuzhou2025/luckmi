/**
 * src/lib/i18n/terms.ts
 * 领域常量翻译层：中文领域词 → i18n key（namespace.key）。
 *
 * 引擎层（src/lib/bazi/*）保持中文单一事实源；
 * 展示层组件用 termKey() 映射后 t() 翻译。
 * 天干/地支/纳音在 EN 场景保留汉字（命理数据符号化，不意译）。
 */

/** 中文领域词 → i18n key（如 '七杀' → 'shishen.qisha'）；未收录返回 null（原样展示） */
const TERM_MAP: Record<string, string> = {
  // 十神
  '比肩': 'shishen.bijian', '劫财': 'shishen.jiecai', '食神': 'shishen.shishen',
  '伤官': 'shishen.shangguan', '偏财': 'shishen.piancai', '正财': 'shishen.zhengcai',
  '七杀': 'shishen.qisha', '正官': 'shishen.zhengguan', '偏印': 'shishen.pianyin',
  '正印': 'shishen.zhengyin', '日主': 'shishen.riZhu',
  // 强弱型
  '极弱型': 'strength.extremeWeakType', '偏弱型': 'strength.weakType',
  '中和型': 'strength.balancedType', '偏强型': 'strength.strongType',
  '极强型': 'strength.extremeStrongType',
  // 强弱原值
  '极弱': 'strength.extremeWeakRaw', '偏弱': 'strength.weakRaw',
  '均衡': 'strength.balancedRaw', '偏强': 'strength.strongRaw',
  '极强': 'strength.extremeStrongRaw',
  // 格局
  '正官格': 'pattern.zhengguan', '七杀格': 'pattern.qisha',
  '正财格': 'pattern.zhengcai', '偏财格': 'pattern.piancai',
  '正印格': 'pattern.zhengyin', '偏印格': 'pattern.pianyin',
  '食神格': 'pattern.shishen', '伤官格': 'pattern.shangguan',
  // 地势
  '长生': 'dishi.changsheng', '沐浴': 'dishi.muyu', '冠带': 'dishi.guandai',
  '临官': 'dishi.linguan', '帝旺': 'dishi.diwang', '衰': 'dishi.shuai',
  '病': 'dishi.bing', '死': 'dishi.si', '墓': 'dishi.mu', '绝': 'dishi.jue',
  '胎': 'dishi.tai', '养': 'dishi.yang',
  // 旺相休囚死（注："死" 与 dishi 的 "死" 同字不同义，dishi.si 优先；旺相休囚死的 "死" 复用 dishi.si 翻译）
  '旺': 'wuxing.wang', '相': 'wuxing.xiang', '休': 'wuxing.xiu',
  '囚': 'wuxing.qiu',
  // 神煞
  '天乙贵人': 'shensha.tianyi', '文昌': 'shensha.wenchang',
  '福星贵人': 'shensha.fuxing', '学堂': 'shensha.xuetang',
  '太极贵人': 'shensha.taiji', '词馆': 'shensha.ciguan',
  '桃花': 'shensha.taohua', '驿马': 'shensha.yima',
  '华盖': 'shensha.huagai', '将星': 'shensha.jiangxing',
  // 关系
  '冲': 'relation.chong', '克': 'relation.ke', '合': 'relation.he',
  '刑': 'relation.xing', '破': 'relation.po', '害': 'relation.hai',
  '生': 'relation.sheng', '泄': 'relation.xie', '耗': 'relation.hao',
};

export function termKey(term: string): string | null {
  return TERM_MAP[term] ?? null;
}

/** 十神简称 → 十神全称（用于 termKey 映射） */
const SHISHEN_ABBR: Record<string, string> = {
  '比': '比肩', '劫': '劫财', '食': '食神', '伤': '伤官',
  '财': '正财', '才': '偏财', '官': '正官', '杀': '七杀',
  '印': '正印', '卩': '偏印', '主': '日主',
};

export function abbrToFullName(abbr: string): string {
  return SHISHEN_ABBR[abbr] ?? '日主';
}
