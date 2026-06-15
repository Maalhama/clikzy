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
      // eslint-config-next@16 active la NOUVELLE suite react-hooks (ère React
      // Compiler). Le projet N'UTILISE PAS React Compiler -> ces règles
      // forward-looking signalent des patterns légitimes (reset de state sur
      // changement de prop, refs en effet, etc.), pas des bugs. On les désactive
      // jusqu'à une éventuelle adoption de React Compiler. Les règles VRAIMENT
      // utiles (rules-of-hooks, exhaustive-deps) restent actives via
      // next/core-web-vitals.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
      "react-hooks/static-components": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/use-memo": "off",
    },
  },
];

export default eslintConfig;
