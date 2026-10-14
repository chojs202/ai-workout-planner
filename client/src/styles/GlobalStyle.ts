import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  :root {
    /* 색상 */
    --color-background: #0c0e10;
    --color-surface: #171b1e;
    --color-input: #111517;

    --color-text: #f5f7f8;
    --color-text-muted: #a0a8b0;

    --color-primary: #79e2be;
    --color-primary-hover: #9aebcf;
    --color-on-primary: #0c0e10;

    --color-border: #2b3238;
    --color-error: #ff8585;

    /* 화면 폭과 여백 */
    --app-max-width: 480px;
    --page-padding: clamp(12px, 4vw, 20px);
    --card-padding: clamp(14px, 4vw, 20px);
    --section-gap: clamp(16px, 5vw, 24px);

    /* 글자 크기 */
    --font-page-title: clamp(24px, 6vw, 28px);
    --font-section-title: clamp(18px, 5vw, 20px);
    --font-body: 16px;
    --font-caption: 14px;

    /* 모서리와 조작 영역 */
    --radius-card: 16px;
    --radius-control: 12px;
    --control-min-height: 48px;
  }
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    font-size: 16px;
  }

  html,
  body,
  #root {
    min-width: 320px;
    min-height: 100%;
  }
  #root {
  width: 100%;
  max-width: var(--app-max-width);
  min-height: 100vh;
  min-height: 100dvh;
  margin: 0 auto;
  background: var(--color-background);
}

  body {
    font-family:
  "Pretendard",
  "Pretendard JP",
  sans-serif;
    color: #1f2937;
    line-height: 1.5;
    background: #e5e7eb;
    -webkit-font-smoothing: antialiased;
  }
  html:lang(ja) body {
  font-family:
    "Pretendard JP",
    "Pretendard",
    sans-serif;
}

  button,
  input,
  textarea,
  select {
    font: inherit;
    color: inherit;
  }

  button {
    background: none;
    border: 0;
    cursor: pointer;
  }

  button:disabled {
    cursor: not-allowed;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  ul,
  ol {
    list-style: none;
  }

  img,
  picture,
  svg,
  canvas {
    display: block;
    max-width: 100%;
  }

  table {
    border-collapse: collapse;
    border-spacing: 0;
  }
`;