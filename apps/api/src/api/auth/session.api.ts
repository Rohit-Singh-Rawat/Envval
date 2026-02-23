import { honoFactory } from "@/shared/utils/factory";

export const sessionApi = honoFactory.createApp().get("/", (c) => {
  const session = c.get("session");
  const user = c.get("user");

  if (!user) {
    return c.body(null, 401);
  }

  return c.json({
    session,
    user,
  });
});
