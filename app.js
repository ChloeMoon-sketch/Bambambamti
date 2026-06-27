const USERS = [
  { id: "admin", password: "2026", role: "admin", name: "관리자" },
  { id: "10101", password: "1234", role: "student", studentId: "10101" },
  { id: "10102", password: "1234", role: "student", studentId: "10102" },
  { id: "10103", password: "1234", role: "student", studentId: "10103" },
];

const STUDENTS = [
  {
    id: "10101",
    name: "김코딩",
    photo: "assets/10101_김코딩.jpg",
    grades: {
      "정보 수행평가": "A",
      "웹앱 프로젝트": "92점",
      "디지털 윤리 퀴즈": "88점",
      "수업 참여도": "상",
    },
    traits: [
      "문제 해결 과정을 차분히 설명합니다.",
      "새 도구를 시도할 때 기록을 꼼꼼히 남깁니다.",
      "제출 전 확인 습관을 더 연습하면 좋습니다.",
    ],
    teacherMemo: "프론트엔드 구조 이해가 빠르며, 팀원 질문에 답하는 태도가 좋습니다.",
  },
  {
    id: "10102",
    name: "박개발",
    photo: "assets/10102_박개발.jpg",
    grades: {
      "정보 수행평가": "B+",
      "웹앱 프로젝트": "86점",
      "디지털 윤리 퀴즈": "91점",
      "수업 참여도": "중상",
    },
    traits: [
      "협업 중 역할 분담을 잘 지킵니다.",
      "UI 수정 아이디어를 자주 제안합니다.",
      "프로젝트 범위를 작게 나누는 연습이 필요합니다.",
    ],
    teacherMemo: "기능 구현 의욕이 높고, 오류가 날 때 원인을 함께 추적하려는 태도가 좋습니다.",
  },
  {
    id: "10103",
    name: "이교사",
    photo: "assets/10103_이교사.jpg",
    grades: {
      "정보 수행평가": "A-",
      "웹앱 프로젝트": "89점",
      "디지털 윤리 퀴즈": "95점",
      "수업 참여도": "상",
    },
    traits: [
      "학습 내용을 자기 언어로 정리합니다.",
      "개선할 지점을 발견하면 근거를 함께 제시합니다.",
      "코드 주석을 더 구체적으로 쓰면 좋습니다.",
    ],
    teacherMemo: "질문의 초점이 좋고, 개선 방향을 토의하는 데 적극적입니다.",
  },
];

const loginForm = document.querySelector("#loginForm");
const userIdInput = document.querySelector("#userId");
const passwordInput = document.querySelector("#password");
const loginMessage = document.querySelector("#loginMessage");
const logoutButton = document.querySelector("#logoutButton");
const loginView = document.querySelector("#loginView");
const studentView = document.querySelector("#studentView");
const adminView = document.querySelector("#adminView");

const aiModal = document.querySelector("#aiModal");
const closeAiModalBtn = document.querySelector("#closeAiModalBtn");
const aiModalBackdrop = document.querySelector("#aiModalBackdrop");
const aiModalTitle = document.querySelector("#aiModalTitle");
const aiModalBody = document.querySelector("#aiModalBody");

let currentUser = null;
let geminiApiKey = "";

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const id = userIdInput.value.trim();
  const password = passwordInput.value;
  const user = USERS.find((item) => item.id === id && item.password === password);

  if (!user) {
    loginMessage.textContent = "아이디 또는 비밀번호가 올바르지 않습니다.";
    passwordInput.value = "";
    passwordInput.focus();
    return;
  }

  currentUser = user;
  loginMessage.textContent = "";
  loginForm.reset();

  if (user.role === "admin") {
    renderAdminDashboard();
  } else {
    const student = STUDENTS.find((item) => item.id === user.studentId);
    renderStudentPage(student);
  }
});

logoutButton.addEventListener("click", () => {
  currentUser = null;
  showOnly(loginView);
  logoutButton.classList.add("hidden");
  userIdInput.focus();
});

function showOnly(targetView) {
  [loginView, studentView, adminView].forEach((view) => view.classList.add("hidden"));
  targetView.classList.remove("hidden");
}

function renderStudentPage(student) {
  if (!student) {
    loginMessage.textContent = "학생 정보를 찾을 수 없습니다.";
    showOnly(loginView);
    return;
  }

  studentView.innerHTML = `
    <div class="view-header">
      <div class="view-title">
        <p class="eyebrow">Student</p>
        <h2>${student.name} 학생 페이지</h2>
        <p>로그인한 학생의 학습 현황을 확인합니다.</p>
      </div>
    </div>

    <div class="student-layout">
      <article class="student-profile">
        <img class="student-photo" src="${student.photo}" alt="${student.name} 학생 사진" />
        <div class="profile-body">
          <h3>${student.name}</h3>
          <p class="student-number">학번 ${student.id}</p>
          <div class="tag-row" aria-label="학습 키워드">
            <span class="tag">정보</span>
            <span class="tag">프로젝트</span>
          </div>
        </div>
      </article>

      <div class="content-stack">
        ${renderGrades(student.grades, false, `gradesTitle-${student.id}`)}
        ${renderTraits(student)}
      </div>
    </div>
  `;

  showOnly(studentView);
  logoutButton.classList.remove("hidden");
}

function renderAdminDashboard() {
  adminView.innerHTML = `
    <div class="view-header">
      <div class="view-title">
        <p class="eyebrow">Admin</p>
        <h2>관리자 대시보드</h2>
        <p>학생 3명의 학습 현황을 한 화면에서 비교합니다.</p>
      </div>
    </div>

    <div class="api-key-panel">
      <label for="geminiApiKeyInput">Gemini API Key</label>
      <input type="password" id="geminiApiKeyInput" placeholder="AI 기능 사용을 위한 API 키를 입력하세요" />
      <span id="apiKeyStatus" class="api-key-status"></span>
    </div>

    <section class="admin-grid" aria-label="전체 학생 정보">
      ${STUDENTS.map(renderStudentCard).join("")}
    </section>
  `;

  const apiKeyInput = adminView.querySelector("#geminiApiKeyInput");
  const apiKeyStatus = adminView.querySelector("#apiKeyStatus");
  if (geminiApiKey) apiKeyInput.value = geminiApiKey;
  if (geminiApiKey) apiKeyStatus.textContent = "✓ 입력됨";

  apiKeyInput.addEventListener("change", (e) => {
    geminiApiKey = e.target.value.trim();
    if (geminiApiKey) {
      apiKeyStatus.textContent = "✓ 입력됨";
    } else {
      apiKeyStatus.textContent = "";
    }
  });

  showOnly(adminView);
  logoutButton.classList.remove("hidden");
}

function renderStudentCard(student) {
  return `
    <article class="student-card">
      <img class="student-photo" src="${student.photo}" alt="${student.name} 학생 사진" />
      <div class="student-card-body">
        <h3>${student.name}</h3>
        <p class="student-number">학번 ${student.id}</p>
        ${renderGrades(student.grades, true, `gradesTitle-${student.id}`)}
        ${renderTraits(student)}
        <button class="ai-button" onclick="generateAiCounseling('${student.id}')">
          ✨ AI 상담 전략 생성
        </button>
      </div>
    </article>
  `;
}

function renderGrades(grades, compact = false, headingId = "gradesTitle") {
  const rows = Object.entries(grades)
    .map(([label, value]) => `<tr><th scope="row">${label}</th><td>${value}</td></tr>`)
    .join("");

  return `
    <section aria-labelledby="${headingId}">
      <div class="section-title">
        <h3 id="${headingId}">성적 정보</h3>
      </div>
      <table class="grade-table ${compact ? "compact-table" : ""}">
        <tbody>${rows}</tbody>
      </table>
    </section>
  `;
}

function renderTraits(student) {
  return `
    <section aria-labelledby="traitsTitle-${student.id}">
      <div class="section-title">
        <h3 id="traitsTitle-${student.id}">학습 특성 및 교사 메모</h3>
      </div>
      <ul class="memo-list">
        ${student.traits.map((trait) => `<li>${trait}</li>`).join("")}
        <li>${student.teacherMemo}</li>
      </ul>
    </section>
  `;
}

// --- AI 기능 관련 로직 ---
function closeAiModal() {
  aiModal.classList.add("hidden");
}

if (closeAiModalBtn) closeAiModalBtn.addEventListener("click", closeAiModal);
if (aiModalBackdrop) aiModalBackdrop.addEventListener("click", closeAiModal);

async function generateAiCounseling(studentId) {
  if (!geminiApiKey) {
    alert("상단 입력란에 Gemini API Key를 먼저 입력해주세요.");
    return;
  }

  const student = STUDENTS.find((s) => s.id === studentId);
  if (!student) return;

  aiModalTitle.textContent = `${student.name} 학생 맞춤 상담 전략`;
  aiModalBody.innerHTML = `
    <div class="loader-container">
      <div class="loader"></div>
      <p>AI가 맞춤형 상담 전략을 분석하고 있습니다...</p>
    </div>
  `;
  aiModal.classList.remove("hidden");

  const prompt = `
당신은 학생들의 성장을 돕는 따뜻하고 전문적인 학교 선생님입니다.
다음 학생의 정보를 바탕으로 효과적인 상담 전략과 대화 시작 멘트를 제안해주세요.

[학생 정보]
- 이름: ${student.name}
- 학번: ${student.id}
- 성적: ${JSON.stringify(student.grades)}
- 학습 특성: ${student.traits.join(", ")}
- 교사 메모: ${student.teacherMemo}

[출력 양식]
1. 칭찬할 점 (학생의 강점)
2. 개선을 위한 조언 (부드러운 접근법)
3. 추천 대화 시작 멘트 (실제 학생에게 건넬 따뜻한 멘트)
`;

  try {
    const response = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=\${geminiApiKey}\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "API 호출 실패");
    }

    const aiText = data.candidates[0].content.parts[0].text;
    
    // 간단한 마크다운 처리 (bold 및 개행)
    const formattedText = aiText
      .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
      .replace(/\\n/g, '<br/>');

    aiModalBody.innerHTML = \`<div class="ai-result">\${formattedText}</div>\`;
  } catch (error) {
    aiModalBody.innerHTML = \`
      <div style="color: var(--danger);">
        <h3>오류가 발생했습니다.</h3>
        <p>\${error.message}</p>
        <p>API 키가 올바른지 다시 확인해주세요.</p>
      </div>
    \`;
  }
}

// 초기 화면 설정
showOnly(loginView);
