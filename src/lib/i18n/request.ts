import { hasLocale, type Locale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import * as rootParams from "next/root-params";
import { routing } from "./routing";

const LOCALE_HEADER = "x-next-intl-locale";

export async function localeOfRequest(): Promise<Locale> {
  const localeHeaderValue = (await headers()).get(LOCALE_HEADER);
  return hasLocale(routing.locales, localeHeaderValue) ? localeHeaderValue : routing.defaultLocale;
}

async function readLocaleRootParam() {
  try {
    return { isReadable: true, value: await rootParams.locale() };
  } catch {
    return { isReadable: false, value: undefined };
  }
}

export default getRequestConfig(async ({ locale }) => {
  if (!locale) {
    const localeRootParam = await readLocaleRootParam();
    if (hasLocale(routing.locales, localeRootParam.value)) locale = localeRootParam.value;
    else if (localeRootParam.isReadable) notFound();
    else locale = await localeOfRequest();
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
