import { publicProcedure, router } from "../../trpc";
import { z } from "zod";
import { getUserId } from "../../pkg/middleware/clerk-auth";
import { Context } from "hono";
import { createAccessToken } from "./socket_auth";

export const authRouter = router({
  // Get access token for SSE subscription
  getAccessToken: publicProcedure
    .output(z.object({ accessJwt: z.string() }))
    .query(async ({ ctx }) => {
      const userId = getUserId(ctx as Context);
      const accessJwt = await createAccessToken().withUserId(userId).build();
      return { accessJwt };
    }),
}); 