import { Link } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../hooks/useTranslation";

const Page = styled.main`
  padding: var(--section-gap) var(--page-padding);
  color: var(--color-text);
  background: var(--color-background);
`;

const Card = styled.section`
  min-width: 0;
  padding: 48px var(--card-padding);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  text-align: center;
`;

const ErrorCode = styled.p`
  margin: 0 0 12px;
  color: var(--color-primary);
  font-size: clamp(64px, 18vw, 88px);
  font-weight: 700;
  line-height: 1;
`;

const Title = styled.h1`
  margin: 0 0 12px;
  font-size: var(--font-page-title);
  font-weight: 700;
  line-height: 1.4;
  overflow-wrap: anywhere;
`;

const Description = styled.p`
  margin: 0;
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 1.7;
  overflow-wrap: anywhere;
`;

const HomeLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--control-min-height);
  margin-top: 28px;
  padding: 12px 24px;

  color: var(--color-on-primary);
  background: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-control);

  font-size: 14px;
  font-weight: 700;
  line-height: 1.5;

  &:hover {
    background: var(--color-primary-hover);
    border-color: var(--color-primary-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 3px;
  }
`;

const messages = {
  ko: {
    title: "페이지를 찾을 수 없습니다",
    description: "주소가 올바른지 확인해주세요.",
    home: "홈으로 이동",
    login: "로그인 화면으로 이동",
  },
  ja: {
    title: "ページが見つかりません",
    description: "URLが正しいかご確認ください。",
    home: "ホームへ",
    login: "ログイン画面へ",
  },
  en: {
    title: "Page not found",
    description: "Please check that the URL is correct.",
    home: "Go to home",
    login: "Go to login",
  },
};

function NotFoundPage() {
  const { user } = useAuth();
  const { language } = useTranslation();
  const copy = messages[language];

  return (
    <Page>
      <Card>
        <ErrorCode aria-hidden="true">404</ErrorCode>

        <Title>{copy.title}</Title>

        <Description>{copy.description}</Description>

        <HomeLink to={user ? "/calendar" : "/login"} replace>
          {user ? copy.home : copy.login}
        </HomeLink>
      </Card>
    </Page>
  );
}

export default NotFoundPage;
