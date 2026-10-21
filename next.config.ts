import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

import "@/infra/env.client";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  typedRoutes: true,
  agentRules: false,
  reactCompiler: true,
  experimental: {
    turbopackRustReactCompiler: true,
  },
};

export default withNextIntl(nextConfig);
