import { Link } from "react-router-dom";
import styled from "styled-components";
import LanguageSelector from "../components/LanguageSelector";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../hooks/useTranslation";
import logo from "../assets/fit-plan-icon.svg";

const Page = styled.main`
  width: 100%;
  padding: var(--section-gap) var(--page-padding);
  color: var(--color-text);
  background: var(--color-background);
`;

const Container = styled.div`
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
`;

const Hero = styled.section`
  padding: 32px 0;
  text-align: center;
`;

const Logo = styled.img`
  display: block;
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  object-fit: contain;
`;

const BrandName = styled.p`
  margin: 0 0 24px;
  font-size: 32px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.035em;
`;

const Title = styled.h1`
  margin: 0 0 16px;
  font-size: var(--font-page-title);
  font-weight: 700;
  line-height: 1.4;
  overflow-wrap: anywhere;
`;

const Description = styled.p`
  margin: 0;
  color: var(--color-text-muted);
  font-size: 15px;
  line-height: 1.8;
  overflow-wrap: anywhere;
`;

const FeatureList = styled.div`
  display: grid;
  gap: 12px;
  margin: 8px 0 24px;
`;

const FeatureCard = styled.section`
  min-width: 0;
  padding: var(--card-padding);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
`;

const FeatureTitle = styled.h2`
  margin: 0 0 8px;
  font-size: var(--font-section-title);
  font-weight: 700;
  line-height: 1.5;
`;

const Note = styled.p`
  margin: 0;
  color: var(--color-text-muted);
  font-size: 13px;
  line-height: 1.7;
  text-align: center;
  overflow-wrap: anywhere;
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 28px;
`;

const PrimaryLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: var(--control-min-height);
  padding: 12px 16px;
  color: var(--color-on-primary);
  background: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-control);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.5;
  text-align: center;

  &:hover {
    background: var(--color-primary-hover);
    border-color: var(--color-primary-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 3px;
  }
`;

const SecondaryLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 8px 16px;
  color: var(--color-text-muted);
  border-radius: var(--radius-control);
  font-size: 14px;
  line-height: 1.5;

  &:hover {
    color: var(--color-text);
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 3px;
  }
`;

const messages = {
  ko: {
    title: "운동 계획부터 기록까지",
    description:
      "Fit Plan은 AI 루틴 추천과 운동 기록을 한곳에서 관리하는 서비스입니다.",
    features: [
      {
        title: "나에게 맞는 루틴",
        description:
          "목표, 운동 경험, 장소와 사용 장비를 바탕으로 AI 루틴을 추천받거나 직접 만들어보세요.",
      },
      {
        title: "수행한 운동 기록",
        description:
          "세트별 반복 횟수와 중량을 기록하고, 캘린더에서 운동한 날을 확인하세요.",
      },
      {
        title: "기록으로 확인하는 변화",
        description:
          "종목별 수행 기록을 비교하고, 운동 기록을 바탕으로 AI 피드백을 받아보세요.",
      },
    ],
    languages: "한국어 · 日本語 · English 지원",
    notice:
      "AI 제안은 참고용입니다. 자신의 몸 상태와 운동 경험에 맞게 조정해주세요.",
    start: "회원가입하고 시작하기",
    login: "이미 계정이 있으신가요? 로그인",
    home: "운동 캘린더로 이동",
  },
  ja: {
    title: "トレーニングの計画から記録まで",
    description:
      "Fit Planは、AIによるルーティン提案とトレーニング記録をまとめて管理できるサービスです。",
    features: [
      {
        title: "自分に合うルーティン",
        description:
          "目標、経験、場所、使用器具に合わせたAI提案を受けたり、自分でルーティンを作成したりできます。",
      },
      {
        title: "トレーニングを記録",
        description:
          "セットごとの回数と重量を記録し、カレンダーでトレーニングした日を確認できます。",
      },
      {
        title: "記録から変化を確認",
        description:
          "種目ごとの記録を比較し、トレーニング履歴に基づくAIフィードバックを受けられます。",
      },
    ],
    languages: "한국어 · 日本語 · English 対応",
    notice:
      "AIの提案は参考情報です。体調やトレーニング経験に合わせて調整してください。",
    start: "新規登録して始める",
    login: "アカウントをお持ちの方はログイン",
    home: "トレーニングカレンダーへ",
  },
  en: {
    title: "From workout plans to progress",
    description:
      "Fit Plan brings AI routine suggestions and workout tracking together in one place.",
    features: [
      {
        title: "A routine that fits you",
        description:
          "Get AI suggestions based on your goals, experience, location, and equipment, or build your own routine.",
      },
      {
        title: "Track your training",
        description:
          "Log reps and weights for each set and view your training days on the calendar.",
      },
      {
        title: "See your progress",
        description:
          "Compare your exercise records and get AI feedback based on your workout history.",
      },
    ],
    languages: "Available in Korean, Japanese, and English",
    notice:
      "AI suggestions are for reference. Adjust them to your condition and training experience.",
    start: "Sign up and get started",
    login: "Already have an account? Log in",
    home: "Go to workout calendar",
  },
};

function AboutPage() {
  const { user } = useAuth();
  const { language } = useTranslation();
  const copy = messages[language];

  return (
    <Page>
      <Container>
        <LanguageSelector />

        <Hero>
          <Logo src={logo} alt="" width={80} height={80} />
          <BrandName>Fit Plan</BrandName>
          <Title>{copy.title}</Title>
          <Description>{copy.description}</Description>
        </Hero>

        <FeatureList>
          {copy.features.map((feature) => (
            <FeatureCard key={feature.title}>
              <FeatureTitle>{feature.title}</FeatureTitle>
              <Description>{feature.description}</Description>
            </FeatureCard>
          ))}
        </FeatureList>

        <Note>{copy.languages}</Note>

        <Actions>
          <PrimaryLink to={user ? "/calendar" : "/signup"}>
            {user ? copy.home : copy.start}
          </PrimaryLink>

          {!user && <SecondaryLink to="/login">{copy.login}</SecondaryLink>}
        </Actions>

        <Note>{copy.notice}</Note>
      </Container>
    </Page>
  );
}

export default AboutPage;
