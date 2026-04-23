import OpenAI from 'openai';
import type { GeneratedStudyMaterial, GeneratedStudySection, GeneratedQuiz, QuestionSetId } from '../types/session';

/** .env 파일에서 VITE_OPENAI_API_KEY 읽기 */
function getApiKey(): string {
  const key = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  if (!key || key === 'sk-여기에_실제_키_입력') {
    throw new Error('.env 파일에 VITE_OPENAI_API_KEY를 설정해주세요.');
  }
  return key;
}

function createClient(): OpenAI {
  return new OpenAI({ apiKey: getApiKey(), dangerouslyAllowBrowser: true });
}

const STUDY_MATERIAL_PROMPT = `당신은 문서 정리 전문가 역할을 수행합니다. 사용자가 업로드한 PDF 파일의 내용을 빠짐없이, 명확하고 체계적으로 정리해 주세요. 아래 지침을 엄격히 따르십시오.

1) 역할과 목적
- 역할: 문서 정리·정보 구조화 전문가.
- 목적: PDF의 핵심 내용과 세부 정보를 누락 없이 추출·정리하여, 독자가 원문을 읽지 않아도 전체 내용을 이해할 수 있도록 제공.

2) 출력 형식
다음 JSON 형식으로 정확히 출력하세요. 다른 텍스트는 포함하지 마세요:
{
  "title": "문서 제목",
  "subtitle": "문서 부제목 또는 간단한 설명",
  "sections": [
    {
      "heading": "섹션 제목 (페이지)",
      "content": "요점과 요점별 내용 (빠짐없이). 중요 인용문을 포함. 관련 수치/도표 포함."
    }
  ],
  "terms": [
    { "term": "용어명", "definition": "누구나 이해할 수 있는 정의" }
  ],
  "analysis": [
    "비판적 분석 항목 1",
    "비판적 분석 항목 2",
    "비판적 분석 항목 3"
  ]
}

3) 정리 스타일 제약
- 한국어로 작성.
- 전문용어 및 영어사용이 적절한 용어는 영어로 작성
- 문장은 간결하고 비전문가도 이해 가능한 수준으로 설명.
- 주석으로 전문 용어에 대한 자세한 설명 포함
- 문단은 1–8문장 이내로 유지.
- 표, 목록을 적절히 사용하여 가독성 확보.

4) 중요 규칙
- 반드시 유효한 JSON만 출력하세요.
- sections는 최소 5개 이상 포함하세요.
- terms는 최소 5개 이상 포함하세요.
- analysis는 2-3개 포함하세요.`;

const QUIZ_GENERATION_PROMPT = `당신은 교육 평가 전문가입니다. 주어진 학습 내용을 기반으로 퀴즈 문제를 생성하세요.

출력 형식 (반드시 유효한 JSON만 출력):
{
  "questions": [
    {
      "id": "q1",
      "type": "choice",
      "text": "문제 텍스트",
      "options": ["A) 선택지1", "B) 선택지2", "C) 선택지3", "D) 선택지4"],
      "correctAnswer": "A) 선택지1"
    },
    {
      "id": "q8",
      "type": "short_answer",
      "text": "서술형 문제 텍스트",
      "correctAnswer": "모범 답안"
    }
  ]
}

규칙:
- 총 10문항 생성 (객관식 7문항 + 서술형 3문항)
- 객관식은 4지선다
- 서술형은 1~3문장으로 답할 수 있는 수준
- 문제 난이도: 중간 (학습 자료를 읽었다면 답할 수 있는 수준)
- id는 q1, q2, ... q10 형식
- 한국어로 작성
- 전문용어는 영어 병기
- 반드시 유효한 JSON만 출력하세요.`;

/**
 * OpenAI API로 학습자료 생성
 */
export async function generateStudyMaterial(
  pdfText: string,
  pdfFilename: string,
): Promise<GeneratedStudyMaterial> {
  const client = createClient();

  // 텍스트가 너무 길면 잘라서 전송 (GPT-4o context limit 고려)
  const truncatedText = pdfText.length > 80000 ? pdfText.slice(0, 80000) + '\n\n[... 이하 생략]' : pdfText;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: STUDY_MATERIAL_PROMPT },
      { role: 'user', content: `다음은 "${pdfFilename}" PDF 파일에서 추출한 텍스트입니다. 이 내용을 정리해주세요:\n\n${truncatedText}` },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('AI 응답이 비어있습니다.');

  const parsed = JSON.parse(content) as {
    title: string;
    subtitle: string;
    sections: { heading: string; content: string }[];
    terms: { term: string; definition: string }[];
    analysis: string[];
  };

  // sections를 GeneratedStudySection으로 변환
  const sections: GeneratedStudySection[] = parsed.sections.map(s => ({
    heading: s.heading,
    content: s.content,
  }));

  // rawMarkdown 생성
  const rawMarkdown = generateMarkdown(parsed);

  return {
    title: parsed.title,
    subtitle: parsed.subtitle,
    sections,
    terms: parsed.terms,
    analysis: parsed.analysis,
    rawMarkdown,
  };
}

/**
 * OpenAI API로 퀴즈 생성
 */
export async function generateQuiz(
  pdfText: string,
  setId: QuestionSetId,
): Promise<GeneratedQuiz> {
  const client = createClient();

  const truncatedText = pdfText.length > 80000 ? pdfText.slice(0, 80000) + '\n\n[... 이하 생략]' : pdfText;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: QUIZ_GENERATION_PROMPT },
      { role: 'user', content: `다음 학습 내용을 기반으로 퀴즈 10문항을 생성하세요:\n\n${truncatedText}` },
    ],
    temperature: 0.5,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('AI 응답이 비어있습니다.');

  const parsed = JSON.parse(content) as {
    questions: {
      id: string;
      type: 'choice' | 'short_answer';
      text: string;
      options?: string[];
      correctAnswer: string;
    }[];
  };

  return {
    setId,
    questions: parsed.questions,
  };
}

/**
 * 파싱된 데이터 → Markdown 문자열
 */
function generateMarkdown(data: {
  title: string;
  subtitle: string;
  sections: { heading: string; content: string }[];
  terms: { term: string; definition: string }[];
  analysis: string[];
}): string {
  let md = `# ${data.title}\n\n> ${data.subtitle}\n\n---\n\n`;
  md += `## 1. 섹션별 정리\n\n`;

  for (const section of data.sections) {
    md += `### ${section.heading}\n\n${section.content}\n\n`;
  }

  md += `---\n\n## 2. 용어 및 개념 정리\n\n`;
  md += `| 용어 | 정의 |\n|------|------|\n`;
  for (const { term, definition } of data.terms) {
    md += `| **${term}** | ${definition} |\n`;
  }

  md += `\n---\n\n## 3. 내용 분석 (비판적 평가)\n\n`;
  for (let i = 0; i < data.analysis.length; i++) {
    md += `${i + 1}. ${data.analysis[i]}\n\n`;
  }

  return md;
}
