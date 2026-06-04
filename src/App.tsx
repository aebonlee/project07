import { useState } from 'react';
import { Hero, Stack, Pill, type Meta } from './ui';

const M: Meta = { id: 7, icon: '🏯', title: '문화재 AI 해설 앱', tagline: '문화재를 골라 AI 해설과 퀴즈로 배우기', members: ['박남영'], color: '#b45309' };

interface Heritage { name: string; emoji: string; era: string; region: string; desc: string; quiz: { q: string; opts: string[]; a: number }; }
const DATA: Heritage[] = [
  { name: '경복궁', emoji: '🏯', era: '조선 1395', region: '서울', desc: '조선 왕조의 법궁으로, 근정전과 경회루가 대표적입니다. 임진왜란으로 소실됐다가 고종 때 중건되었습니다.', quiz: { q: '경복궁을 창건한 왕조는?', opts: ['고려', '조선', '신라'], a: 1 } },
  { name: '석굴암', emoji: '🛕', era: '통일신라 751', region: '경주', desc: '인공으로 축조한 석굴 사원으로 본존불의 조형미가 뛰어납니다. 불국사와 함께 유네스코 세계유산입니다.', quiz: { q: '석굴암이 만들어진 시대는?', opts: ['백제', '통일신라', '조선'], a: 1 } },
  { name: '수원화성', emoji: '🧱', era: '조선 1796', region: '수원', desc: '정조가 축조한 계획 도시 성곽으로, 거중기 등 당대 과학기술이 집약되었습니다.', quiz: { q: '수원화성 축조를 명한 왕은?', opts: ['세종', '정조', '영조'], a: 1 } },
  { name: '훈민정음', emoji: '📜', era: '조선 1443', region: '서울', desc: '세종대왕이 창제한 우리 고유 문자로, 창제 원리를 담은 해례본이 세계기록유산입니다.', quiz: { q: '훈민정음을 창제한 왕은?', opts: ['태종', '세종', '성종'], a: 1 } },
  { name: '첨성대', emoji: '🔭', era: '신라 7세기', region: '경주', desc: '동양에서 가장 오래된 천문 관측대로 알려진 석조 건축물입니다.', quiz: { q: '첨성대의 주요 용도는?', opts: ['천문 관측', '군사 망루', '곡식 저장'], a: 0 } },
  { name: '불국사', emoji: '⛩️', era: '통일신라 751', region: '경주', desc: '다보탑과 석가탑, 청운교·백운교로 유명한 사찰로 신라 불교 예술의 정수입니다.', quiz: { q: '불국사에 있는 탑이 아닌 것은?', opts: ['다보탑', '석가탑', '미륵탑'], a: 2 } },
];

export default function App() {
  const [sel, setSel] = useState<Heritage | null>(null);
  const [pick, setPick] = useState<number | null>(null);

  return (
    <div className="wrap">
      <Hero m={M} />
      <main style={{ marginTop: 22 }}>
        <Stack>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
            {DATA.map((h) => (
              <button key={h.name} onClick={() => { setSel(h); setPick(null); }} className="box" style={{ cursor: 'pointer', textAlign: 'center', borderColor: sel?.name === h.name ? M.color : 'var(--soft)' }}>
                <div style={{ fontSize: 30 }}>{h.emoji}</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{h.name}</div>
              </button>
            ))}
          </div>

          {sel && (
            <Stack gap={12}>
              <div className="box">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 26 }}>{sel.emoji}</span><strong style={{ fontSize: 17 }}>{sel.name}</strong>
                  <Pill color={M.color}>{sel.era}</Pill><Pill color="#0ea5e9">{sel.region}</Pill>
                </div>
                <p style={{ margin: '10px 0 0', fontSize: 14.5, lineHeight: 1.8 }}>🤖 {sel.desc}</p>
              </div>
              <div className="box">
                <div style={{ fontWeight: 700, marginBottom: 8 }}>❓ {sel.quiz.q}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {sel.quiz.opts.map((o, i) => {
                    const chosen = pick === i; const correct = i === sel.quiz.a;
                    const bg = pick === null ? 'var(--card)' : correct ? '#d1fae5' : chosen ? '#fee2e2' : 'var(--card)';
                    return <button key={i} onClick={() => setPick(i)} disabled={pick !== null} style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: bg, cursor: pick === null ? 'pointer' : 'default', color: 'var(--text)', fontSize: 14 }}>{o}{pick !== null && correct ? ' ✓' : ''}</button>;
                  })}
                </div>
                {pick !== null && <p style={{ margin: '10px 0 0', fontSize: 14, fontWeight: 700, color: pick === sel.quiz.a ? '#10b981' : '#ef4444' }}>{pick === sel.quiz.a ? '정답이에요! 🎉' : '아쉬워요. 해설을 다시 읽어보세요.'}</p>}
              </div>
            </Stack>
          )}
        </Stack>
      </main>
    </div>
  );
}
