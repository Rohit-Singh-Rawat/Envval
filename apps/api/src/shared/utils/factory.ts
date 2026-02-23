import type { AppEnv } from "@/shared/types/context";
import { createFactory } from "hono/factory";

export const honoFactory = createFactory<AppEnv>();
