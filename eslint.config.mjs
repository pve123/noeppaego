import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// 컨텍스트 밖에서는 공개 API(src/contexts/<컨텍스트>/index.ts)만 import 한다.
const contextInternals = {
  regex: "^@/contexts/[^/]+/.+",
  message: "컨텍스트 내부가 아니라 공개 API(@/contexts/<컨텍스트>)를 import 하세요.",
};
const frameworks = {
  group: ["next", "next/*", "react", "react-dom", "server-only"],
  message: "도메인·애플리케이션 레이어는 프레임워크를 모릅니다.",
};

// 공유 커널(@/shared/kernel — 컨텍스트들이 같이 쓰는 순수 값 객체) 밖의 @/ 경로
const outsideKernel = (message) => ({ regex: "^@/(?!shared/kernel/)", message });

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": ["error", { patterns: [contextInternals] }] },
  },
  {
    // 도메인: 순수 — 프레임워크·바깥 레이어·다른 컨텍스트를 모른다.
    files: ["src/contexts/*/domain/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            frameworks,
            {
              group: ["**/application/**", "**/infrastructure/**"],
              message: "도메인은 같은 컨텍스트의 domain 과 공유 커널만 import 합니다.",
            },
            outsideKernel("도메인은 같은 컨텍스트의 domain 과 공유 커널만 import 합니다."),
          ],
        },
      ],
    },
  },
  {
    // 애플리케이션: 도메인 포트로만 바깥을 본다. 구현(infrastructure)은 index.ts 가 조립한다.
    files: ["src/contexts/*/application/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            frameworks,
            {
              group: ["**/infrastructure/**"],
              message: "애플리케이션은 domain 포트와 공유 커널로만 바깥을 봅니다.",
            },
            outsideKernel("애플리케이션은 domain 포트와 공유 커널로만 바깥을 봅니다."),
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
