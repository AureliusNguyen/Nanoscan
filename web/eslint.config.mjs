import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Allow "//" prefix as a deliberate text marker in JSX (e.g.
      // `<p>// classification targets</p>` for the design system labels).
      "react/jsx-no-comment-textnodes": "off",
    },
  },
];

export default eslintConfig;
