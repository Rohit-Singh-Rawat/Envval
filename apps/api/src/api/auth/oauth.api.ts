import { honoFactory } from "@/shared/utils/factory";
import { auth } from "@/modules/auth/auth.service";

export const oauthApi = honoFactory
  .createApp()
  .on(["POST", "GET"], "/*", (c) => auth.handler(c.req.raw))
  .get("/", (c) => c.json({ message: "Hello, world!" }));
