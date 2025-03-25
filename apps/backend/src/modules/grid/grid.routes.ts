import { publicProcedure, router } from "../../trpc";
import { gridService, GridRow } from "./grid.service";

export const gridRouter = router({
  list: publicProcedure.query(async (): Promise<GridRow[]> => {
    return gridService.getGridData();
  }),
}); 