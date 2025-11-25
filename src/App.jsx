import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

const BOT = "bot";
const USER = "user";

const initialMessages = [
  {
    id: 1,
    from: BOT,
    text: "안녕하세요, 금융전문비서입니다.\n질문 남겨주시면 친절히 답변해드릴게요!",
  },
];

function App() {
  const [messages, setMessages] = useState(initialMessages);
  const [mode, setMode] = useState(null); // "advice" | "product" | "credit_check" | "user_profile" | null
  const [input, setInput] = useState("");
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null); // 사용자 정보 저장

  const addMessage = (msg) => {
    setMessages((prev) => [...prev, { id: Date.now(), ...msg }]);
  };

  const handleBack = () => {
    setMode(null);
    setMessages(initialMessages);
    setInput("");
  };

  // 📈 투자 조언 버튼
  const handleClickAdvice = () => {
    setMode("advice");
    addMessage({ from: USER, text: "지금 투자하기 괜찮을까요?" });
    addMessage({
      from: BOT,
      text: "현재 시장 상황을 간단히 정리해 드릴게요.\n\n(이 영역은 RAG 연동 예정입니다.)",
    });
  };

  // 💳 금융상품 추천 버튼
  const handleClickProduct = () => {
    setMode("product");
    addMessage({ from: USER, text: "어떤 금융상품이 좋을까요?" });
    addMessage({
      from: BOT,
      text: "사용자 정보에 맞는 금융상품을 추천해 드릴게요.\n\n(이 영역은 RAG + 추천 로직 연동 예정입니다.)",
    });
  };

  // 📊 신용점수 조회 버튼
  const handleClickCreditCheck = () => {
    setMode("credit_check");
    addMessage({
      from: USER,
      text: "신용점수는 어떻게 조회하나요?",
    });
    addMessage({
      from: BOT,
      text: "카카오페이에서 신용점수를 조회하는 방법을 알려드릴게요.",
    });
  };

  // ⭐ 내 정보 입력 버튼
  const handleClickUserProfile = () => {
    setMode("user_profile");
    addMessage({
      from: USER,
      text: "내 자산 정보를 입력하고 싶어요.",
    });
    addMessage({
      from: BOT,
      text: "신용점수와 자산 정보를 입력해 주시면 맞춤 금융 추천에 활용할게요.",
    });
  };

  const handleSuggestedQuestion = (question) => {
    setInput(question);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    addMessage({ from: USER, text: trimmed });
    setInput("");
    setSuggestedQuestions([]); // 이전 추천 질문 초기화
    setIsLoading(true); // 로딩 시작

    try {
      // 답변과 추천 질문을 동시에 요청
      const [answerResponse, suggestResponse] = await Promise.all([
        fetch("http://127.0.0.1:8000/answer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            selected_question: trimmed,
            user_profile: userProfile, // 사용자 정보 함께 전송
          }),
        }),
        fetch("http://127.0.0.1:8000/suggest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_message: trimmed,
            user_profile: userProfile, // 사용자 정보 함께 전송
          }),
        }),
      ]);

      if (!answerResponse.ok) {
        throw new Error("답변 API 요청 실패");
      }

      const answerData = await answerResponse.json();
      addMessage({
        from: BOT,
        text: answerData.answer || "응답을 받지 못했습니다.",
      });

      // 추천 질문 처리
      if (suggestResponse.ok) {
        const suggestData = await suggestResponse.json();
        // suggested_questions 배열에서 "1. ", "2. ", "3. " 등의 번호를 제거하고 순수 질문만 추출
        const questions = (suggestData.suggested_questions || []).map((q) =>
          q.replace(/^\d+\.\s*/, "").trim()
        );
        setSuggestedQuestions(questions);
      }
    } catch (error) {
      console.error("API 에러:", error);
      addMessage({
        from: BOT,
        text: "죄송합니다. 서버 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.",
      });
    } finally {
      setIsLoading(false); // 로딩 종료
    }
  };

  return (
    <div className="app">
      {/* 사이드바 버튼 영역 */}
      {mode === null && (
        <aside className="sidebar">
          <button className="sidebar-btn" onClick={handleClickAdvice}>
            📈
            <br />
            투자
            <br />
            조언
          </button>
          <button className="sidebar-btn" onClick={handleClickProduct}>
            💳
            <br />
            금융상품
            <br />
            추천
          </button>
          <button className="sidebar-btn" onClick={handleClickUserProfile}>
            ⭐<br />내 정보
            <br />
            입력
          </button>
          <button className="sidebar-btn" onClick={handleClickCreditCheck}>
            📊
            <br />
            신용점수
            <br />
            조회
          </button>
        </aside>
      )}

      <div className="chat-container">
        {/* 상단 헤더 */}
        <header className="chat-header">
          {mode && (
            <button className="back-btn" onClick={handleBack}>
              ←
            </button>
          )}
          <div className="chat-header-left">
            <div className="chat-avatar">금</div>
            <div>
              <div className="chat-title">금융 AI</div>
              <div className="chat-subtitle">투자 조언 · 상품 추천</div>
            </div>
          </div>
          <span className="chat-status">● online</span>
        </header>

        {/* 채팅 내용 */}
        <main className="chat-main">
          <div className="message-list">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={
                  msg.from === USER
                    ? "message-row message-row-user"
                    : "message-row message-row-bot"
                }
              >
                {msg.from === BOT && <div className="bubble-avatar">AI</div>}
                <div
                  className={
                    msg.from === USER
                      ? "message-bubble bubble-user"
                      : "message-bubble bubble-bot"
                  }
                >
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            ))}

            {/* 로딩 표시 */}
            {isLoading && (
              <div className="message-row message-row-bot">
                <div className="bubble-avatar">AI</div>
                <div className="message-bubble bubble-bot loading-message">
                  <span className="loading-dots">
                    <span>.</span>
                    <span>.</span>
                    <span>.</span>
                  </span>
                </div>
              </div>
            )}

            {/* 📈 투자 조언 카드 */}
            {mode === "advice" && (
              <section className="section-block">
                <p className="section-label">시장 뉴스 (RAG 연동 예정)</p>
                <article className="info-card">
                  <div className="info-card-title">
                    금리 동결 시사, 증시 상승 전망
                  </div>
                  <div className="info-card-body">
                    연준 의장이 금리 인상 종료 가능성을 언급하며 시장에 긍정적
                    신호를 보냈습니다.
                  </div>
                </article>
              </section>
            )}

            {/* 💳 금융상품 추천 카드 */}
            {mode === "product" && (
              <section className="section-block">
                <p className="section-label">
                  추천 금융상품 (RAG + 추천 로직 연동 예정)
                </p>
                <article className="info-card">
                  <div className="info-card-title">청년 혜택 카드</div>
                  <div className="info-card-body">
                    편의점 10% 할인, 교통 5% 할인, 연회비 1만 원대.
                  </div>
                </article>
                <article className="info-card">
                  <div className="info-card-title">목돈 마련 적금</div>
                  <div className="info-card-body">
                    월 30만 원 자동이체, 최대 연 4.0% 금리 제공.
                  </div>
                </article>
              </section>
            )}

            {/* 📊 신용점수 조회 카드 */}
            {mode === "credit_check" && (
              <section className="section-block">
                <p className="section-label">📊 신용점수 조회 방법</p>
                <article className="info-card">
                  <div className="info-card-body">
                    신용점수는 카카오페이에서 다음 순서로 조회할 수 있어요{" "}
                    {"\n\n"}
                    <div className="bullet-step">1️⃣ 카카오톡 앱 실행</div>
                    <div className="bullet-step">
                      2️⃣ 화면 하단 ‘더보기(… 기호)’ 탭 선택
                    </div>
                    <div className="bullet-step">
                      3️⃣ 상단 ‘Pay(카카오페이)’ 버튼 클릭
                    </div>
                    <div className="bullet-step">
                      4️⃣ ‘신용관리’ 또는 ‘신용점수 확인해보기’ 메뉴 선택
                    </div>
                    <div className="bullet-step">
                      5️⃣ 최초 이용 시 본인 인증 후 즉시 조회 가능
                    </div>
                    {"\n"}
                    <div className="tip-box">
                      💡 TIP: 신용점수는 맞춤 금융 추천 기능에 활용됩니다.
                    </div>
                  </div>
                </article>
              </section>
            )}

            {/* ⭐ 내 정보 입력 카드 + 폼 */}
            {mode === "user_profile" && (
              <section className="section-block">
                <p className="section-label">⭐ 내 정보 입력</p>

                <article className="info-card">
                  <div className="info-card-body">
                    신용점수와 자산 정보를 입력하시면
                    {"\n"}더 정교한 맞춤 금융 추천을 받을 수 있어요
                  </div>
                </article>

                <form
                  className="profile-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = {};

                    // 다중 선택 값 처리 (checkbox, select multiple)
                    const multiSelectKeys = [
                      "job",
                      "financial_goals",
                      "investment_experience",
                    ];

                    // 폼 데이터 순회하며 객체 생성
                    for (let [key, value] of formData.entries()) {
                      if (multiSelectKeys.includes(key)) {
                        if (!data[key]) data[key] = [];
                        data[key].push(value);
                      } else {
                        data[key] = value;
                      }
                    }

                    // select multiple 요소 별도 처리 (FormData에서 누락될 수 있음)
                    const jobSelect =
                      e.target.querySelector('select[name="job"]');
                    if (jobSelect) {
                      data["job"] = Array.from(jobSelect.selectedOptions).map(
                        (option) => option.value
                      );
                    }

                    setUserProfile(data);

                    addMessage({
                      from: BOT,
                      text: "정보 입력이 완료되었습니다.\n지금부터 맞춤 추천 기능이 활성화 됩니다.",
                    });
                    setMode(null); // 폼 닫고 기본 화면으로
                  }}
                >
                  {/* 기본 정보 */}
                  <h4 className="form-section-title">기본 정보</h4>
                  <label>나이</label>
                  <input
                    type="number"
                    name="age"
                    placeholder="예: 30"
                    required
                  />

                  <label>직업 (다중 선택 가능)</label>
                  <select name="job" multiple className="multi-select">
                    <option value="student">학생</option>
                    <option value="employee">직장인</option>
                    <option value="self_employed">자영업자</option>
                    <option value="freelancer">프리랜서</option>
                    <option value="unemployed">무직</option>
                    <option value="other">기타</option>
                  </select>
                  <p className="form-help-text">
                    Ctrl(Cmd) 키를 누르고 클릭하여 여러 개 선택 가능
                  </p>

                  <label>세전 연소득 (만원)</label>
                  <input
                    type="number"
                    name="income"
                    placeholder="예: 5000"
                    required
                  />

                  <label>사는 지역</label>
                  <select name="region" required>
                    <option value="">선택해주세요</option>
                    <option value="seoul">서울</option>
                    <option value="gyeonggi">경기</option>
                    <option value="incheon">인천</option>
                    <option value="busan">부산</option>
                    <option value="daegu">대구</option>
                    <option value="gwangju">광주</option>
                    <option value="daejeon">대전</option>
                    <option value="ulsan">울산</option>
                    <option value="sejong">세종</option>
                    <option value="gangwon">강원</option>
                    <option value="chungbuk">충북</option>
                    <option value="chungnam">충남</option>
                    <option value="jeonbuk">전북</option>
                    <option value="jeonnam">전남</option>
                    <option value="gyeongbuk">경북</option>
                    <option value="gyeongnam">경남</option>
                    <option value="jeju">제주</option>
                  </select>

                  <label>결혼 여부</label>
                  <div className="radio-group">
                    <label>
                      <input type="radio" name="marital" value="single" /> 미혼
                    </label>
                    <label>
                      <input type="radio" name="marital" value="married" /> 기혼
                    </label>
                  </div>

                  <label>자녀 여부</label>
                  <div className="radio-group">
                    <label>
                      <input type="radio" name="children" value="yes" /> 있음
                    </label>
                    <label>
                      <input type="radio" name="children" value="no" /> 없음
                    </label>
                  </div>

                  {/* 금융 정보 */}
                  <h4 className="form-section-title">금융 정보</h4>
                  <label>주거래 은행</label>
                  <select name="main_bank" required>
                    <option value="">선택해주세요</option>
                    <option value="kb">KB국민</option>
                    <option value="shinhan">신한</option>
                    <option value="hana">하나</option>
                    <option value="woori">우리</option>
                    <option value="nh">NH농협</option>
                    <option value="kakao">카카오뱅크</option>
                    <option value="toss">토스뱅크</option>
                    <option value="kbank">케이뱅크</option>
                    <option value="other">기타</option>
                  </select>

                  <label>신용점수</label>
                  <input
                    type="number"
                    name="credit_score"
                    placeholder="예: 700"
                    required
                  />

                  <label>금융 지식 수준</label>
                  <select name="financial_knowledge" required>
                    <option value="high">상 (전문가 수준)</option>
                    <option value="mid">중 (기본적인 이해)</option>
                    <option value="low">하 (잘 모름)</option>
                  </select>

                  <label>금융 목표 (다중 선택)</label>
                  <div className="checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="financial_goals"
                        value="growth"
                      />{" "}
                      자산 증식
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        name="financial_goals"
                        value="retirement"
                      />{" "}
                      노후 대비
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        name="financial_goals"
                        value="housing"
                      />{" "}
                      내 집 마련
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        name="financial_goals"
                        value="car"
                      />{" "}
                      자동차 구매
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        name="financial_goals"
                        value="debt"
                      />{" "}
                      부채 상환
                    </label>
                  </div>

                  <label>투자 상품 경험 및 보유 현황 (다중 선택)</label>
                  <div className="checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="investment_experience"
                        value="deposit"
                      />{" "}
                      예/적금
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        name="investment_experience"
                        value="stock"
                      />{" "}
                      주식
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        name="investment_experience"
                        value="bond"
                      />{" "}
                      채권
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        name="investment_experience"
                        value="fund"
                      />{" "}
                      펀드/ETF
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        name="investment_experience"
                        value="crypto"
                      />{" "}
                      가상화폐
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        name="investment_experience"
                        value="none"
                      />{" "}
                      없음
                    </label>
                  </div>

                  {/* 자산 정보 */}
                  <h4 className="form-section-title">총자산</h4>

                  <label>부동산 보유 여부</label>
                  <div className="radio-group">
                    <label>
                      <input
                        type="radio"
                        name="real_estate_owned"
                        value="yes"
                      />{" "}
                      보유
                    </label>
                    <label>
                      <input type="radio" name="real_estate_owned" value="no" />{" "}
                      미보유
                    </label>
                  </div>

                  <label>부동산 자산 (만원)</label>
                  <input
                    type="number"
                    name="real_estate_assets"
                    placeholder="예: 30000"
                  />

                  <label>자동차 자산 (만원)</label>
                  <input
                    type="number"
                    name="car_assets"
                    placeholder="예: 2000"
                  />

                  <label>기타 자산 (만원)</label>
                  <input
                    type="number"
                    name="other_assets"
                    placeholder="예: 1500"
                  />

                  <button className="submit-btn" type="submit">
                    저장하기
                  </button>
                </form>
              </section>
            )}
          </div>
        </main>

        {/* 하단: 입력창 */}
        <footer className="chat-footer">
          {/* 추천 질문 */}
          {suggestedQuestions.length > 0 && (
            <div className="suggested-questions">
              <p className="suggested-label">추천 질문</p>
              <div className="suggested-row">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    className="suggested-btn"
                    onClick={() => handleSuggestedQuestion(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form className="chat-input-bar" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="궁금한 점을 물어보세요."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit">전송</button>
          </form>
        </footer>
      </div>
    </div>
  );
}

export default App;
