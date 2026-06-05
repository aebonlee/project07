import { useMemo, useState } from 'react';
import { AppLayout, Stack, Field, Chip, useLocalStorage, type Meta } from './ui';
import { ask, hasKey } from './lib/ai';
import { useReadAloud } from './lib/tts';

const M: Meta = {
  id: 7, icon: '🏯', title: '문화재 AI 해설 앱', tagline: '문화재 이름만 입력하면 AI 도슨트가 청중 수준에 맞춰 해설하고, 음성으로 읽어 줘요',
  members: ['박남영'], color: '#b45309', ai: true,
  problem:
    '안내판의 짧은 설명만으로는 문화재의 의미와 이야기를 느끼기 어렵고, 아이와 전문가에게 같은 글이 제공됩니다. ' +
    '본 앱은 문화재를 선택하면 AI 도슨트가 시대·핵심 해설·흥미로운 사실·용어 풀이·관람 팁을 구성하고, ' +
    '아동/일반/전문 수준으로 다시 설명하며 음성 오디오 가이드로 읽어 줍니다.',
  features: [
    { icon: '🧑‍🏫', title: 'AI 도슨트 해설', desc: '시대·의미·일화를 섹션으로 구성한 깊이 있는 해설' },
    { icon: '🎚️', title: '청중 수준 전환', desc: '아동·일반·전문 수준으로 같은 문화재를 다르게 설명' },
    { icon: '🔊', title: '오디오 가이드(TTS)', desc: '해설을 한국어 음성으로 읽어주는 무료 오디오 가이드' },
    { icon: '📖', title: '용어 풀이', desc: '어려운 용어를 쉬운 말로 정리한 용어집' },
    { icon: '🧭', title: '관람 팁', desc: '함께 보면 좋은 포인트와 방문 팁 제공' },
    { icon: '🔖', title: '관람 기록', desc: '둘러본 문화재를 저장해 나만의 도록 만들기' },
  ],
  howto: [
    '(선택) OpenAI API 키를 입력하면 실제 AI 해설이 켜집니다',
    '분류·시대·청중 수준을 고르고 문화재 이름을 입력합니다',
    '“해설 듣기”로 해설·용어·관람 팁을 받습니다',
    '🔊로 오디오 가이드를 듣고, 🔖로 관람 기록을 저장합니다',
  ],
  facts: [
    { value: 'AI', label: '도슨트' }, { value: '3', label: '청중 수준' }, { value: 'TTS', label: '오디오 가이드' },
    { value: '용어집', label: '쉬운 풀이' }, { value: '도록', label: '관람 기록' }, { value: '무키', label: '폴백 동작' },
  ],
  info: [
    { title: '왜 수준별 해설인가요?', body: '같은 유물도 아이에게는 이야기로, 전문가에게는 양식·편년으로 설명해야 합니다. 청중에 맞춘 해설이 이해와 감동을 높입니다.' },
    { title: '오디오 가이드의 가치', body: '눈은 유물을, 귀는 해설을 — 멀티모달 관람은 집중과 기억을 돕습니다. 본 앱은 브라우저 음성합성으로 별도 기기 없이 오디오 가이드를 제공합니다.' },
    { title: '용어의 장벽 낮추기', body: '“다포식·주심포”처럼 낯선 용어가 관람을 막습니다. 핵심 용어를 쉬운 말로 풀어 진입장벽을 낮춥니다.' },
    { title: '정확성 주의', body: 'AI 해설은 참고용이며 연대·수치는 오류가 있을 수 있습니다. 국가유산청 등 공식 자료로 교차 확인을 권합니다.' },
  ],
  pipeline: [
    '대상 선택 — 분류·시대·청중 수준·문화재명을 구조화',
    '해설 합성 — 수준별 어휘 규칙 + 한국 문화재 맥락 + JSON 스키마',
    'GPT 호출 — json_object 로 해설·일화·용어·관람팁 일괄 수신',
    '검증·폴백 — 누락 시 내장 문화재 DB로 안전 해설',
    '관람 — 섹션 해설 + 용어집 + TTS 오디오 가이드',
    '기록 — 둘러본 문화재 localStorage 도록 저장',
  ],
  techNotes: [
    { title: '수준 적응 프롬프트', body: '청중(아동/일반/전문)에 따라 시스템 프롬프트의 어휘·깊이 규칙을 바꿔 같은 대상도 다른 해설을 생성합니다.' },
    { title: '구조화 해설', body: '요약·섹션·일화·용어·관람팁을 한 번의 json_object로 받아 일관된 도슨트 포맷을 보장합니다.' },
    { title: 'Web Speech 오디오', body: 'ko-KR 음성을 선택해 해설을 순차 낭독하고, 현재 읽는 단락을 상태로 관리합니다.' },
    { title: '정적·오프라인', body: '내장 문화재 DB로 키 없이도 동작하며 localStorage 도록으로 관람 기록을 보존합니다.' },
  ],
  stack: ['React 18', 'TypeScript', 'Vite', 'OpenAI GPT', 'Web Speech API', 'localStorage'],
  links: [
    { label: '국가유산청', url: 'https://www.khs.go.kr' },
    { label: '국가유산 포털', url: 'https://www.heritage.go.kr' },
  ],
};

const CATS = ['궁궐·건축', '사찰·불교', '유물·공예', '서적·기록', '회화·서예'];
const ERAS = ['삼국·통일신라', '고려', '조선', '근대', '미상'];
const LEVELS = [
  { key: 'kid', label: '아동', rule: '초등학생 눈높이로 쉽고 이야기처럼, 어려운 용어는 풀어서.' },
  { key: 'general', label: '일반', rule: '교양 수준으로 핵심 의미와 흥미로운 맥락 중심.' },
  { key: 'expert', label: '전문', rule: '양식·편년·미술사적 의의 등 전문 용어를 포함해 깊이 있게.' },
];

interface Section { heading: string; body: string }
interface Glossary { term: string; meaning: string }
interface Docent { title: string; era: string; summary: string; sections: Section[]; fun_facts: string[]; glossary: Glossary[]; visit_tips: string[] }

const DB: Record<string, Docent> = {
  경복궁: { title: '경복궁', era: '조선', summary: '조선 왕조의 법궁으로 1395년 창건되었습니다. “큰 복을 누리라”는 뜻을 담고 있으며 정전인 근정전을 중심으로 배치됩니다.', sections: [{ heading: '이름의 뜻', body: '“경복(景福)”은 시경에서 따온 말로 큰 복을 빈다는 의미입니다.' }, { heading: '근정전', body: '왕의 즉위와 조회가 열린 정전으로, 품계석과 월대가 위엄을 더합니다.' }], fun_facts: ['임진왜란으로 소실되었다가 고종 때 중건되었습니다.'], glossary: [{ term: '법궁', meaning: '왕조의 으뜸이 되는 정식 궁궐' }, { term: '월대', meaning: '건물 앞에 높게 쌓은 넓은 단' }], visit_tips: ['수문장 교대의식 시간을 확인하세요.', '근정전 뒤 경회루의 연못 풍경이 일품입니다.'] },
  석굴암: { title: '석굴암', era: '삼국·통일신라', summary: '통일신라 8세기, 화강암을 쌓아 만든 인공 석굴 사원으로 본존불을 모십니다. 1995년 유네스코 세계유산에 등재되었습니다.', sections: [{ heading: '과학적 구조', body: '돔 천장과 환기·습도 조절을 고려한 정밀한 축조 기술이 돋보입니다.' }, { heading: '본존불', body: '깨달음의 순간을 표현한 균형 잡힌 조형미로 유명합니다.' }], fun_facts: ['해 뜨는 동쪽을 향하도록 설계되었습니다.'], glossary: [{ term: '본존불', meaning: '사원에서 중심이 되는 부처상' }], visit_tips: ['토함산 일출과 함께 보면 더욱 인상적입니다.'] },
  훈민정음: { title: '훈민정음', era: '조선', summary: '1443년 세종이 창제하고 1446년 반포한 우리 고유 문자이자 그 해설서입니다. 해례본은 국보이며 세계기록유산입니다.', sections: [{ heading: '창제 정신', body: '“백성을 가르치는 바른 소리” — 누구나 쉽게 익혀 쓰도록 만든 애민 정신이 담겼습니다.' }, { heading: '과학적 원리', body: '발음 기관의 모양을 본떠 글자를 만든 독창적 음성학적 설계입니다.' }], fun_facts: ['창제 원리를 설명한 기록이 남은 거의 유일한 문자입니다.'], glossary: [{ term: '해례본', meaning: '훈민정음의 창제 원리를 풀어 설명한 책' }], visit_tips: ['국립한글박물관에서 관련 전시를 함께 보세요.'] },
};

function fallbackDocent(name: string, era: string): Docent {
  const key = Object.keys(DB).find((k) => name.includes(k));
  if (key) return DB[key];
  return {
    title: name.trim() || '문화재', era,
    summary: `${name.trim() || '이 문화재'}에 대한 해설입니다. (API 키를 입력하면 더 풍부한 AI 해설을 받을 수 있어요.)`,
    sections: [{ heading: '개요', body: '시대적 배경과 제작 의도를 중심으로 살펴보면 의미가 더 깊어집니다.' }, { heading: '감상 포인트', body: '형태·재료·용도를 함께 보면 당대의 기술과 미의식을 읽을 수 있습니다.' }],
    fun_facts: ['문화재는 당대 사람들의 삶과 가치를 담은 시간의 기록입니다.'],
    glossary: [{ term: '문화재', meaning: '역사·예술·학술적으로 가치가 큰 유산' }],
    visit_tips: ['안내판과 함께 천천히 둘러보며 이야기를 상상해 보세요.'],
  };
}

async function getDocent(name: string, cat: string, era: string, level: typeof LEVELS[number]): Promise<Docent> {
  if (!hasKey()) return fallbackDocent(name, era);
  try {
    const out = await ask(
      `너는 한국 문화재 전문 도슨트야. ${level.rule} 사실에 근거하고 불확실하면 단정하지 않는다. ` +
        '반드시 JSON만: {"title":"","era":"","summary":"2~3문장","sections":[{"heading":"","body":""}],"fun_facts":["흥미로운 사실"],"glossary":[{"term":"","meaning":""}],"visit_tips":["관람 팁"]}',
      `문화재: ${name.trim() || '추천'} / 분류: ${cat} / 시대: ${era} / 청중: ${level.label}. 섹션 2~3, 용어 2~3, 관람팁 2개, 한국어.`,
      { json: true, temperature: 0.6, max_tokens: 1300 },
    );
    const p = JSON.parse(out);
    if (!p.summary) return fallbackDocent(name, era);
    return {
      title: String(p.title || name), era: String(p.era || era), summary: String(p.summary),
      sections: (p.sections || []).map((s: Section) => ({ heading: String(s.heading || ''), body: String(s.body || '') })),
      fun_facts: (p.fun_facts || []).map(String),
      glossary: (p.glossary || []).map((g: Glossary) => ({ term: String(g.term || ''), meaning: String(g.meaning || '') })),
      visit_tips: (p.visit_tips || []).map(String),
    };
  } catch {
    return fallbackDocent(name, era);
  }
}

function Feature() {
  const [name, setName] = useState('');
  const [cat, setCat] = useState(CATS[0]);
  const [era, setEra] = useState(ERAS[2]);
  const [level, setLevel] = useState(LEVELS[1]);
  const [doc, setDoc] = useState<Docent | null>(null);
  const [loading, setLoading] = useState(false);
  const [visited, setVisited] = useLocalStorage<string[]>('heritage.visited', []);
  const tts = useReadAloud();

  const parts = useMemo(() => doc ? [doc.summary, ...doc.sections.map((s) => `${s.heading}. ${s.body}`)] : [], [doc]);
  const run = async (lv = level) => { setLoading(true); setDoc(await getDocent(name, cat, era, lv)); setLoading(false); requestAnimationFrame(() => document.getElementById('doc-top')?.scrollIntoView({ behavior: 'smooth' })); };
  const visit = () => { if (doc && !visited.includes(doc.title)) setVisited([doc.title, ...visited].slice(0, 30)); };

  return (
    <Stack>
      <div className="studio">
        <Field label="문화재 이름" hint="비우면 추천"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 경복궁, 석굴암, 훈민정음" onKeyDown={(e) => e.key === 'Enter' && run()} /></Field>
        <div className="studio-row">
          <Field label="분류"><select value={cat} onChange={(e) => setCat(e.target.value)}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="시대"><select value={era} onChange={(e) => setEra(e.target.value)}>{ERAS.map((x) => <option key={x}>{x}</option>)}</select></Field>
        </div>
        <Field label="청중 수준"><div className="chips">{LEVELS.map((l) => <Chip key={l.key} active={level.key === l.key} color={M.color} onClick={() => { setLevel(l); if (doc) run(l); }}>{l.label}</Chip>)}</div></Field>
        <button className="btn" style={{ background: M.color }} disabled={loading} onClick={() => run()}>{loading ? '🏯 해설 준비 중…' : '🏯 해설 듣기'}</button>
      </div>

      <div id="doc-top" />
      {loading && <div className="spinner" />}
      {doc && !loading && (
        <Stack gap={16}>
          <div className="docent-head" style={{ borderColor: `${M.color}40` }}>
            <div style={{ flex: 1 }}>
              <span className="tag" style={{ background: M.color }}>{doc.era}</span>
              <h2 style={{ margin: '6px 0 6px', fontSize: 22 }}>{doc.title}</h2>
              <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.8, color: 'var(--sub)' }}>{doc.summary}</p>
            </div>
            {tts.supported && (
              <button className="btn" style={{ background: M.color, alignSelf: 'flex-start' }} onClick={() => (tts.speaking ? tts.stop() : tts.play(parts))}>{tts.speaking ? '⏹️ 멈춤' : '🔊 오디오 가이드'}</button>
            )}
          </div>

          <Stack gap={10}>
            {doc.sections.map((s, i) => (
              <div key={i} className={`rcard ${tts.speaking && tts.current === i + 1 ? 'reading' : ''}`}>
                <h4 style={{ color: M.color }}>{s.heading}</h4>
                <p style={{ marginTop: 4, fontSize: 14.5, color: 'var(--text)', lineHeight: 1.8 }}>{s.body}</p>
              </div>
            ))}
          </Stack>

          {doc.fun_facts.length > 0 && (
            <div className="callout-soft" style={{ background: `${M.color}10`, border: `1px solid ${M.color}30` }}>
              <span style={{ fontSize: 20 }}>✨</span>
              <div><b>흥미로운 사실</b><ul style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: 13.5 }}>{doc.fun_facts.map((f, i) => <li key={i}>{f}</li>)}</ul></div>
            </div>
          )}

          {doc.glossary.length > 0 && (
            <div className="learn">
              <h3 className="learn-h" style={{ color: M.color }}>📖 용어 풀이</h3>
              <div className="result-grid">{doc.glossary.map((g, i) => <div key={i} className="rcard"><strong>{g.term}</strong><p style={{ marginTop: 4 }}>{g.meaning}</p></div>)}</div>
            </div>
          )}

          {doc.visit_tips.length > 0 && (
            <div className="learn">
              <h3 className="learn-h" style={{ color: M.color }}>🧭 관람 팁</h3>
              <Stack gap={8}>{doc.visit_tips.map((t, i) => <div key={i} className="qrow"><span className="qno" style={{ background: M.color }}>{i + 1}</span><span>{t}</span></div>)}</Stack>
            </div>
          )}

          <button className="btn btn-ghost" onClick={visit}>🔖 관람 기록에 저장</button>
        </Stack>
      )}

      {visited.length > 0 && (
        <div className="learn">
          <h3 className="learn-h" style={{ color: M.color }}>🗂️ 나의 관람 도록 ({visited.length})</h3>
          <div className="chips">{visited.map((v) => <span key={v} className="tag" style={{ background: M.color, fontSize: 12.5, padding: '5px 12px' }}>{v}</span>)}</div>
          <button className="btn btn-ghost" style={{ alignSelf: 'flex-start', marginTop: 8, padding: '6px 12px', fontSize: 12.5 }} onClick={() => setVisited([])}>기록 비우기</button>
        </div>
      )}
    </Stack>
  );
}

export default function App() { return <AppLayout m={M} feature={<Feature />} />; }
