/**
 * src/app/[locale]/components/TimelineView.tsx
 * 大运/流年/流月/流日（参考图4）：
 * 顶部七柱横排（年/月/日/时 | 大运/流年/流月，含主星/干支/藏干十神/地势/自坐）；
 * 下方横向轨道：大运（含童限、起运日期）、流年（虚岁+公历年）、流月（节气日期+节气名）、流日。
 * 全部干支/十神/地势由 bazi-engine 给出（禁止手写递推），当前项金色高亮。
 */
'use client';

import type { PaipanResult } from '@/lib/bazi/paipan';
import type { TimelineItem } from '@/lib/bazi/timeline';
import { CANGGAN, getDiShi } from '@/lib/bazi/constants';
import { getShiShen, shishenAbbr } from '@/lib/bazi/shishen';
import { ganColor, zhiColor, ssColor } from './ui-utils';
import { useTranslations, useLocale } from 'next-intl';
import { termKey } from '@/lib/i18n/terms';

/** 单字简称 → 十神名（仅用于取五行色） */
const ABBR_TO_NAME: Record<string, string> = {
  比: '比肩', 劫: '劫财', 食: '食神', 伤: '伤官', 财: '正财', 才: '偏财',
  官: '正官', 杀: '七杀', 印: '正印', 枭: '偏印', 主: '日主',
};
const abbrToName = (abbr: string) => ABBR_TO_NAME[abbr] ?? '日主';

/** 大运干支 → 干/支本气十神单字（日干为轴） */
function dayunAbbr(dayGan: string, ganzhi: string) {
  const gan = ganzhi[0];
  const zhi = ganzhi[1];
  const benqi = (CANGGAN[zhi] ?? [''])[0];
  return {
    ganAbbr: shishenAbbr(getShiShen(dayGan, gan, true)),
    zhiAbbr: shishenAbbr(getShiShen(dayGan, benqi, true)),
  };
}

/** 干支 + 十神单字小字（如 丁杀 / 亥伤） */
function GzAbbr({ gan, zhi, ganAbbr, zhiAbbr, dayWx }: {
  gan: string; zhi: string; ganAbbr: string; zhiAbbr: string; dayWx: string;
}) {
  return (
    <div className="gz-abbr">
      <div className="gz-abbr-line">
        <span className="gz-ch" style={{ color: ganColor(gan) }}>{gan}</span>
        <span className="gz-ab" style={{ color: ssColor(dayWx, abbrToName(ganAbbr)) }}>{ganAbbr}</span>
      </div>
      <div className="gz-abbr-line">
        <span className="gz-ch" style={{ color: zhiColor(zhi) }}>{zhi}</span>
        <span className="gz-ab" style={{ color: ssColor(dayWx, abbrToName(zhiAbbr)) }}>{zhiAbbr}</span>
      </div>
    </div>
  );
}

function Track({ title, right, children }: { title: string; right?: string; children: React.ReactNode }) {
  return (
    <div className="track-section">
      <div className="track-head">
        <span className="track-title">{title}</span>
        {right && <span className="track-right">{right}</span>}
      </div>
      <div className="track">{children}</div>
    </div>
  );
}

interface SpCol {
  title: string;
  gan: string; zhi: string;
  ganShen: string;
  canggan: string[]; zhishen: string[];
  dishi: string; zizuo: string;
  isDay?: boolean; isTime?: boolean;
}

/** 七柱横排：年/月/日/时 + 大运/流年/流月 */
function SevenPillars({ result, gender, dayunGanzhi, liunian, liuyue }: {
  result: PaipanResult;
  gender: 'male' | 'female';
  dayunGanzhi: string;
  liunian: TimelineItem;
  liuyue: TimelineItem;
}) {
  const t = useTranslations();
  const termT = (s: string) => { const k = termKey(s); return k ? t(k) : s; };
  const dayGan = result.dayGan;
  const dayWx = result.dayGanWuxing;
  const p = result.pillars;

  const pillarCol = (title: string, pos: 'year' | 'month' | 'day' | 'hour'): SpCol => {
    const q = p[pos];
    return {
      title,
      gan: q.gan, zhi: q.zhi,
      ganShen: pos === 'day' ? (gender === 'female' ? '女主' : '男主') : q.shishen,
      canggan: q.canggan, zhishen: q.zhishen,
      dishi: q.dishi, zizuo: q.zizuo,
      isDay: pos === 'day',
    };
  };
  const itemCol = (title: string, it: TimelineItem): SpCol => ({
    title,
    gan: it.gan, zhi: it.zhi,
    ganShen: it.shishen,
    canggan: it.canggan, zhishen: it.zhishen,
    dishi: it.dishi, zizuo: it.zizuo,
    isTime: true,
  });

  const dyGan = dayunGanzhi[0];
  const dyZhi = dayunGanzhi[1];
  const dyCang = CANGGAN[dyZhi] ?? [];
  const dayunCol: SpCol = {
    title: t('pillar.daYun'),
    gan: dyGan, zhi: dyZhi,
    ganShen: getShiShen(dayGan, dyGan, true),
    canggan: dyCang,
    zhishen: dyCang.map(g => getShiShen(dayGan, g, true)),
    dishi: getDiShi(dayGan, dyZhi),
    zizuo: getDiShi(dyGan, dyZhi),
    isTime: true,
  };

  const cols: SpCol[] = [
    pillarCol(t('pillar.yearPillar'), 'year'),
    pillarCol(t('pillar.monthPillar'), 'month'),
    pillarCol(t('pillar.dayPillar'), 'day'),
    pillarCol(t('pillar.hourPillar'), 'hour'),
    dayunCol,
    itemCol(t('pillar.liuNian'), liunian),
    itemCol(t('pillar.liuYue'), liuyue),
  ];

  const renderGanShen = (s: string) =>
    s === '女主' ? t('pillar.femaleMaster')
    : s === '男主' ? t('pillar.maleMaster')
    : termT(s);

  return (
    <div className="seven-pillars">
      <div className="sp-grid">
        {cols.map((c, i) => (
          <div key={i} className={`sp-col ${c.isDay ? 'sp-day' : ''} ${c.isTime ? 'sp-time' : ''}`}>
            <div className="sp-title">{c.title}</div>
            <div className="sp-zhuxing" style={{ color: ssColor(dayWx, c.ganShen) }}>{renderGanShen(c.ganShen)}</div>
            <div className="big-char" style={{ color: ganColor(c.gan) }}>{c.gan}</div>
            <div className="big-char" style={{ color: zhiColor(c.zhi) }}>{c.zhi}</div>
            <div className="sp-canggan">
              {c.canggan.map((g, j) => (
                <div key={g} className="cg-line">
                  <span style={{ color: ganColor(g) }}>{g}</span>
                  <span className="cg-dot">·</span>
                  <span style={{ color: ssColor(dayWx, c.zhishen[j] ?? '') }}>{termT(c.zhishen[j] ?? '')}</span>
                </div>
              ))}
            </div>
            <div className="sp-dishi">{termT(c.dishi)}</div>
            <div className="sp-zizuo">{termT(c.zizuo)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimelineView({ result, gender, liunian, liuyue, liuri }: {
  result: PaipanResult;
  gender: 'male' | 'female';
  liunian: TimelineItem[];
  liuyue: TimelineItem[];
  liuri: TimelineItem[];
}) {
  const t = useTranslations();
  const locale = useLocale();
  const isZh = locale === 'zh';
  const dayWx = result.dayGanWuxing;

  // 当前大运/流年/流月（isCurrent；无则首项兜底）
  const curDayun = result.dayun.find(d => d.isCurrent) ?? result.dayun[0];
  const curLiunian = liunian.find(x => x.isCurrent) ?? liunian[0];
  const curLiuyue = liuyue.find(x => x.isCurrent) ?? liuyue[0];

  // 起运日期 1983-06-24 → 1983年06月24日（EN: 1983/06/24）
  const qy = result.qiYun;
  const qyText = qy?.solar
    ? `${qy.solar.replace(/-(\d+)-(\d+)/, (_m, mm, dd) => isZh ? `年${mm}月${dd}日` : `/${mm}/${dd}`)}（${qy.age}${t('pillar.ageSuffix')}）${t('pillar.qiYunSuffix')}`
    : '';

  const birthYear = result.trueSolarTime.year;
  // 童限：出生至第一步大运起运前（1 ~ 起运虚岁-1）
  const tongxianEnd = (result.dayun[0]?.startAge ?? 1) - 1;

  return (
    <div>
      {curDayun && curLiunian && curLiuyue && (
        <SevenPillars
          result={result}
          gender={gender}
          dayunGanzhi={curDayun.ganzhi}
          liunian={curLiunian}
          liuyue={curLiuyue}
        />
      )}

      {/* 大运 */}
      <Track title={t('pillar.daYun')} right={qyText}>
        <div className="tcell tcell-tongxian">
          <div className="tcell-age">1~{tongxianEnd}{t('pillar.ageSuffix')}</div>
          <div className="tcell-year">{birthYear}</div>
          <div className="tcell-gz muted">{t('pillar.tongXian')}</div>
        </div>
        {result.dayun.map((d, i) => {
          const ab = dayunAbbr(result.dayGan, d.ganzhi);
          return (
            <div key={i} className={d.isCurrent ? 'tcell current' : 'tcell'}>
              <div className="tcell-age">{d.startAge}{t('pillar.ageSuffix')}</div>
              <div className="tcell-year">{d.startYear}</div>
              <GzAbbr gan={d.ganzhi[0]} zhi={d.ganzhi[1]}
                      ganAbbr={ab.ganAbbr} zhiAbbr={ab.zhiAbbr} dayWx={dayWx} />
            </div>
          );
        })}
      </Track>

      {/* 流年 */}
      <Track title={t('pillar.liuNian')}>
        {liunian.map((x, i) => (
          <div key={i} className={x.isCurrent ? 'tcell current' : 'tcell'}>
            <div className="tcell-age">{x.age}{t('pillar.ageSuffix')}</div>
            <div className="tcell-year">{x.year}</div>
            <GzAbbr gan={x.gan} zhi={x.zhi} ganAbbr={x.ganAbbr} zhiAbbr={x.zhiAbbr} dayWx={dayWx} />
          </div>
        ))}
      </Track>

      {/* 流月（以节气为界） */}
      <Track title={t('pillar.liuYue')}>
        {liuyue.map((x, i) => (
          <div key={i} className={x.isCurrent ? 'tcell current' : 'tcell'}>
            <div className="tcell-age">{x.jieqiDate}</div>
            <div className="tcell-year jieqi-name">{x.jieqiName}</div>
            <GzAbbr gan={x.gan} zhi={x.zhi} ganAbbr={x.ganAbbr} zhiAbbr={x.zhiAbbr} dayWx={dayWx} />
          </div>
        ))}
      </Track>

      {/* 流日（当前节气月） */}
      <Track title={t('pillar.liuRiCurrent')}>
        {liuri.map((x, i) => (
          <div key={i} className={x.isCurrent ? 'tcell tcell-day current' : 'tcell tcell-day'}>
            <div className="tcell-year">{x.label}</div>
            <GzAbbr gan={x.gan} zhi={x.zhi} ganAbbr={x.ganAbbr} zhiAbbr={x.zhiAbbr} dayWx={dayWx} />
          </div>
        ))}
      </Track>
    </div>
  );
}
