import { routing } from "./routing";

export const locales = routing.locales;

export type Locale = (typeof locales)[number];

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof locales)[number];
    Messages: typeof import("./messages/en.json");
  }
}
