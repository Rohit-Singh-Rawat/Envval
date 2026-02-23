import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {},

  /**
   * The prefix that client-side variables must have. This is enforced both at
   * a type-level and at runtime.
   */
  clientPrefix: "VITE_",

  client: {
    VITE_APP_TITLE: z.string().min(1).optional(),
    VITE_API_BASE_URL: z.string().url(),
    VITE_APP_URL: z.string().url().default("https://envval.com"),
    VITE_APP_DESCRIPTION: z
      .string()
      .min(1)
      .default(
        "Securely manage and sync your environment variables across your team and devices.",
      ),
    VITE_OG_IMAGE: z
      .string()
      .url()
      .default("https://envval.com/images/open-graph.png"),
    VITE_EXTENSION_URL: z
      .url()
      .default(
        "https://marketplace.visualstudio.com/items?itemName=Envval-ext.Envval-ext",
      ),
  },

  /**
   * What object holds the environment variables at runtime. This is usually
   * `process.env` or `import.meta.env`.
   */
  runtimeEnv: import.meta.env,

  /**
   * By default, this library will feed the environment variables directly to
   * the Zod validator.
   *
   * This means that if you have an empty string for a value that is supposed
   * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
   * it as a type mismatch violation. Additionally, if you have an empty string
   * for a value that is supposed to be a string with a default value (e.g.
   * `DOMAIN=` in an ".env" file), the default value will never be applied.
   *
   * In order to solve these issues, we recommend that all new projects
   * explicitly specify this option as true.
   */
  emptyStringAsUndefined: true,
});
