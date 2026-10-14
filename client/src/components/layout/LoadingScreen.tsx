import styled, { keyframes } from "styled-components";
import logo from "../../assets/fit-plan-icon.svg";
import { useTranslation } from "../../hooks/useTranslation";

const rotate = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const Screen = styled.div<{ $splash: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  width: 100%;
  min-height: ${({ $splash }) => ($splash ? "100vh" : "240px")};
  min-height: ${({ $splash }) => ($splash ? "100dvh" : "240px")};
  padding: var(--page-padding);
  color: var(--color-text);
  background: var(--color-background);
  text-align: center;
`;

const Logo = styled.img`
  width: clamp(80px, 22vw, 104px);
  height: clamp(80px, 22vw, 104px);
  object-fit: contain;
`;

const BrandName = styled.p`
  font-size: clamp(26px, 7vw, 32px);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
`;

const Spinner = styled.span`
  width: 28px;
  height: 28px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: ${rotate} 0.8s linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Message = styled.p`
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 1.6;
  overflow-wrap: anywhere;
`;

const animateDot = keyframes`
  0%, 15% {
    opacity: 0;
    transform: scale(0.4);
  }

  35%, 65% {
    opacity: 1;
    transform: scale(1);
  }

  85%, 100% {
    opacity: 0;
    transform: scale(0.4);
  }
`;

const SplashLoading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 12px;
  color: var(--color-text-muted);
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.04em;
`;

const LoadingDots = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  height: 12px;

  > span {
    display: block;
    width: 7px;
    height: 7px;
    background: var(--color-primary);
    border-radius: 50%;
    opacity: 0;
    animation: ${animateDot} 1.8s ease-in-out infinite;
  }

  > span:nth-child(2) {
    animation-delay: 0.2s;
  }

  > span:nth-child(3) {
    animation-delay: 0.4s;
  }

  @media (prefers-reduced-motion: reduce) {
    > span {
      animation: none;
      opacity: 1;
      transform: none;
    }
  }
`;

interface LoadingScreenProps {
  splash?: boolean;
  message?: string;
}

function LoadingScreen({ splash = false, message }: LoadingScreenProps) {
  const { t } = useTranslation();
  const loadingMessage = message ?? t("authChecking");

  return (
    <Screen $splash={splash} role="status" aria-label={loadingMessage}>
      {splash ? (
        <>
          <Logo src={logo} alt="" />
          <BrandName>Fit Plan</BrandName>

          <SplashLoading aria-hidden="true">
            <span>Loading</span>

            <LoadingDots>
              <span />
              <span />
              <span />
            </LoadingDots>
          </SplashLoading>
        </>
      ) : (
        <>
          <Spinner aria-hidden="true" />
          <Message>{loadingMessage}</Message>
        </>
      )}
    </Screen>
  );
}
export default LoadingScreen;
