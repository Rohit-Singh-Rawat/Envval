import { Hono } from "hono";
import type { AppEnv } from "@/shared/types/context";
import { v1Routes } from "./v1";
import { authRoutes } from "./auth/auth.routes";

export const apiRoutes = new Hono<AppEnv>()
  .route("/auth", authRoutes)
  .route("/v1", v1Routes);
