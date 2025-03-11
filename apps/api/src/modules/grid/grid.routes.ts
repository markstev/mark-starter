import { Hono } from "hono";
import { gridService } from "./grid.service";

const gridRoutes = new Hono()
  .get("/", async (c) => {
    const rows = await gridService.getGridData();
    return c.json(rows);
  });

export { gridRoutes }; 