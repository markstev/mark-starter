import { z } from "zod";
import { publicProcedure, router } from "../../trpc";

export const sseExampleRouter = router({
  sse: publicProcedure.input(z.object({
    signal: z.any(),
  })).
  subscription(async function* (opts) {
    let count = 0;
    while (true) {
      yield `hello, world ${count}`;
      count++;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }),
});