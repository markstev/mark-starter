import { publicProcedure, router } from "../../trpc";
import { gridService, GridRowSchema } from "./grid.service";
import { z } from "zod";

export const gridRouter = router({
  list: publicProcedure
    .output(z.array(GridRowSchema))
    .query(() => gridService.getGridData()),
}); 