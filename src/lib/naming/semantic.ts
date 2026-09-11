/**
 * src/lib/naming/semantic.ts
 * 意译通道（M1-3）：英文名 → 语义标签 → 字义契合汉字。
 *
 * SEMANTIC_SEED 为人工审校种子表（v7 §7.1②⑧「音译表 + 意译表」口径），
 * 纯查表、零运行时生成；M6 内容期由 Chinese-Names-Corpus + 典籍标注扩充，
 * 扩充须保持本表结构不变。候选字最终是否可用由 M1-4 硬过滤链裁决。
 */
import type { CharMeta } from './charMeta';

export interface SemanticEntry {
  /** 语义标签（中英对照展示用） */
  meaning: string;
  /** 字义契合候选字（按契合度排序；存在字库即可，查无此字会被过滤） */
  chars: string[];
}

export const SEMANTIC_SEED: Record<string, SemanticEntry> = {
  ethan: { meaning: '坚定、持久', chars: ['毅', '恒', '坚', '远'] },
  liam: { meaning: '坚毅守护', chars: ['毅', '安', '守', '卫'] },
  emma: { meaning: '完整、博大', chars: ['博', '雅', '容', '圆'] },
  olivia: { meaning: '橄榄树·和平', chars: ['宁', '和', '安', '桐'] },
  noah: { meaning: '安息、宁静', chars: ['宁', '静', '安', '泰'] },
  ava: { meaning: '灵动如鸟', chars: ['灵', '羽', '燕', '飞'] },
  sophia: { meaning: '智慧', chars: ['慧', '睿', '智', '颖'] },
  mia: { meaning: '心之所爱', chars: ['爱', '怡', '心', '悦'] },
  oliver: { meaning: '橄榄树', chars: ['桐', '和', '宁', '安'] },
  amelia: { meaning: '勤勉进取', chars: ['勤', '敏', '进', '勉'] },
  elijah: { meaning: '虔敬诚实', chars: ['诚', '敬', '正', '穆'] },
  harper: { meaning: '琴韵悠扬', chars: ['琴', '韵', '音', '雅'] },
  james: { meaning: '承继有为', chars: ['继', '承', '成', '立'] },
  evelyn: { meaning: '欣欣向荣', chars: ['欣', '荣', '生', '曦'] },
  benjamin: { meaning: '福佑之子', chars: ['佑', '福', '幸', '子'] },
  henry: { meaning: '安家定邦', chars: ['安', '邦', '家', '定'] },
  emily: { meaning: '勤勉聪敏', chars: ['敏', '慧', '勤', '颖'] },
  alexander: { meaning: '守护万人', chars: ['护', '安', '卫', '民'] },
  elizabeth: { meaning: '圣洁典雅', chars: ['雅', '洁', '圣', '穆'] },
  charlotte: { meaning: '自由洒脱', chars: ['逸', '然', '自', '悠'] },
  daniel: { meaning: '公正诚信', chars: ['正', '诚', '义', '信'] },
  grace: { meaning: '优雅恩惠', chars: ['雅', '恩', '惠', '嘉'] },
  chloe: { meaning: '新绿初萌', chars: ['萌', '新', '青', '苗'] },
  leo: { meaning: '威武雄健', chars: ['威', '武', '雄', '健'] },
  luna: { meaning: '皎月清辉', chars: ['月', '皎', '明', '夕'] },
  aiden: { meaning: '烈火明光', chars: ['煜', '炜', '晖', '炎'] },
  ryan: { meaning: '君王气度', chars: ['君', '睿', '邦', '成'] },
  ella: { meaning: '灵秀优雅', chars: ['灵', '秀', '雅', '嫣'] },
  vivian: { meaning: '生气勃勃', chars: ['欣', '荣', '活', '力'] },
  stella: { meaning: '星辰闪耀', chars: ['星', '辰', '曜', '曦'] },
  nora: { meaning: '荣誉光彩', chars: ['荣', '耀', '誉', '光'] },
  hannah: { meaning: '恩典慈惠', chars: ['恩', '惠', '慈', '泽'] },
  jack: { meaning: '仁厚恩慈', chars: ['仁', '厚', '恩', '慈'] },
  lily: { meaning: '纯洁如百合', chars: ['洁', '纯', '素', '雅'] },
  zoe: { meaning: '生命活力', chars: ['生', '欣', '灵', '力'] },
  william: { meaning: '坚定守护', chars: ['守', '坚', '卫', '恒'] },
  aria: { meaning: '旋律歌声', chars: ['韵', '律', '歌', '音'] },
  hazel: { meaning: '挺拔如林', chars: ['林', '森', '梓', '青'] },
  victoria: { meaning: '凯旋胜利', chars: ['胜', '凯', '捷', '功'] },
  michael: { meaning: '谦诚如圣', chars: ['诚', '谦', '敬', '穆'] },
  sarah: { meaning: '尊贵华雅', chars: ['贵', '华', '雅', '珍'] },
  aaron: { meaning: '力量如山', chars: ['岳', '山', '力', '恒'] },
  adam: { meaning: '淳厚朴实', chars: ['朴', '厚', '敦', '诚'] },
  carter: { meaning: '行稳致远', chars: ['行', '达', '远', '进'] },
  lucas: { meaning: '光明朗照', chars: ['明', '朗', '光', '曦'] },
  mason: { meaning: '匠心巧成', chars: ['巧', '成', '筑', '工'] },
  isabella: { meaning: '虔敬奉献', chars: ['敬', '虔', '雅', '穆'] },
  abigail: { meaning: '智慧欢愉', chars: ['慧', '愉', '悦', '颖'] },
};

export interface SemanticMatch {
  /** 归一化英文名（小写、仅字母） */
  name: string;
  meaning: string;
  /** 意译候选字（已过滤字库查无/nameable=false） */
  candidates: CharMeta[];
}

/** 英文名 → 意译匹配；种子表未收录返回 null */
export function semanticName(englishName: string, meta: Map<string, CharMeta>): SemanticMatch | null {
  const key = englishName.toLowerCase().replace(/[^a-z]/g, '');
  const entry = SEMANTIC_SEED[key];
  if (!entry) return null;
  const candidates = entry.chars
    .map(c => meta.get(c))
    .filter((m): m is CharMeta => !!m && m.nameable !== false);
  return { name: key, meaning: entry.meaning, candidates };
}
