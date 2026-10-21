import { defineRouting } from "next-intl/routing";

const oneYearInSeconds = 60 * 60 * 24 * 365;

export const routing = defineRouting({
  locales: ["en"],
  defaultLocale: "en",
  localePrefix: "never",
  localeCookie: { name: "locale", maxAge: oneYearInSeconds },
});
