export default async function handler(req, res) {
  // 1. POST 요청만 허용
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "POST 요청만 허용됩니다." });
  }

  // 2. Vercel 환경 변수에서 API 키 읽기
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: "GEMINI_API_KEY 환경 변수가 설정되지 않았습니다." });
  }

  // 3. 요청 바디에서 데이터 파싱
  const { studentAlias, gradeSummary, learningTraits, teacherConcern } = req.body;
  if (!studentAlias || !gradeSummary || !learningTraits || !teacherConcern) {
    return res.status(400).json({ success: false, error: "필수 데이터(studentAlias, gradeSummary, learningTraits, teacherConcern)가 누락되었습니다." });
  }

  // Gemini 전송용 프롬프트 구성 (요구사항 반영)
  const prompt = `
당신은 학생들의 성장을 돕는 따뜻하고 전문적인 학교 선생님입니다.
다음 학생의 데이터를 바탕으로, 교사의 고민에 대한 효과적인 상담 전략을 제안해주세요.

[학생 데이터]
- 학생: ${studentAlias}
- 성적 요약: ${gradeSummary}
- 학습 특성 요약: ${learningTraits}

[교사의 고민]
${teacherConcern}

[응답 작성 원칙]
1. 학생을 단정적으로 판단하거나 진단하지 마세요. (예: "의지가 부족하다", "주의력 문제가 있다" 등의 표현 금지)
2. 교사가 학생을 이해하고 대화할 수 있도록 돕는 방향으로 작성해주세요.

[반드시 아래 형식에 맞춰 작성해주세요]
1. 현재 상황 요약:
2. 학생 데이터 기반 해석:
3. 상담 접근 전략:
4. 교사가 던질 수 있는 질문 3개:
5. 피해야 할 말 또는 주의점:
6. 다음 수업에서 해볼 수 있는 작은 지원:
`;

  try {
    // 내장 fetch를 사용해 Gemini REST API 호출 (SDK 미사용)
    // 보안: API 키는 서버리스 환경 변수로만 접근되므로 프론트엔드에 노출되지 않음
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Gemini API 호출 실패");
    }

    const aiText = data.candidates[0].content.parts[0].text;

    // 7. 성공 시 결과 반환
    return res.status(200).json({ success: true, result: aiText });
  } catch (error) {
    // 8. 실패 시 에러 반환
    return res.status(500).json({ success: false, error: error.message });
  }
}
