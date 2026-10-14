import js from "@eslint/js";

export default [
  {
    ignores: ["dist/**", "build/**", "node_modules/**", "public/sw.js"],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        window: "readonly", document: "readonly", navigator: "readonly",
        localStorage: "readonly", sessionStorage: "readonly", location: "readonly",
        history: "readonly", fetch: "readonly", crypto: "readonly",
        addEventListener: "readonly", removeEventListener: "readonly",
        setTimeout: "readonly", clearTimeout: "readonly", setInterval: "readonly", clearInterval: "readonly",
        confirm: "readonly", alert: "readonly", prompt: "readonly",
        console: "readonly", URL: "readonly", URLSearchParams: "readonly",
        FormData: "readonly", Blob: "readonly", FileReader: "readonly",
        indexedDB: "readonly", caches: "readonly", self: "readonly",
        CustomEvent: "readonly", Event: "readonly", KeyboardEvent: "readonly",
        Image: "readonly", Worker: "readonly", BroadcastChannel: "readonly",
        requestAnimationFrame: "readonly", cancelAnimationFrame: "readonly",
        Intl: "readonly", process: "readonly", globalThis: "readonly",
        Buffer: "readonly", structuredClone: "readonly", Response: "readonly",
        Request: "readonly", setImmediate: "readonly", MutationObserver: "readonly",
        VERSION: "readonly", performance: "readonly",
        innerWidth: "readonly", AbortSignal: "readonly", matchMedia: "readonly",
        File: "readonly", Notification: "readonly", __FIREBASE_PUSH_CONFIG__: "readonly",
      },
    },
    rules: {
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-unused-vars": ["error", { args: "none", caughtErrors: "none", varsIgnorePattern: "^(_|React$)" }],
    },
  },
];
