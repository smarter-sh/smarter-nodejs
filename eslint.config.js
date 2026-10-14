// ESLint's configuration: typescript-eslint's strict, type-checked rules, and TSDoc syntax.
// See skills/smarter-code-quality.
import js from "@eslint/js";
import tsdoc from "eslint-plugin-tsdoc";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/", "build/", "coverage/", "node_modules/", "src/models/sam/"] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: { allowDefaultProject: ["*.js"] }, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { tsdoc },
    rules: {
      "tsdoc/syntax": "warn",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
      // an empty string from the platform falls back like a missing one: "a || b" is meant.
      "@typescript-eslint/prefer-nullish-coalescing": ["error", { ignorePrimitives: { string: true } }],
      // Zod schemas and their inferred types share a name, by design (ADR-004).
      "@typescript-eslint/no-redeclare": "off",
    },
  },
  {
    files: ["test/**/*.ts"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
    },
  },
  { files: ["*.js"], ...tseslint.configs.disableTypeChecked },
);
