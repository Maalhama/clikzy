import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "off",
      "prefer-const": "warn",
      // eslint-config-next@16 active la nouvelle suite react-hooks (ère React
      // Compiler) en `error` : ces règles signalent un backlog pré-existant dans
      // tout le code (mini-jeux, lobby, hooks…). On les conserve en `warn` pour
      // garder le signal sans transformer le bump de version en régression
      // bloquante. À résorber progressivement.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/use-memo": "warn",
    },
  },
];

export default eslintConfig;
