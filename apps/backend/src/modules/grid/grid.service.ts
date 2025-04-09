import { z } from "zod";

export const GridRowSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  age: z.number(),
});

export type GridRow = z.infer<typeof GridRowSchema>;

export const gridService = {
  getGridData(): Promise<GridRow[]> {
    return Promise.resolve([
      { id: "1", firstName: "John", lastName: "Doe", age: 25 },
      { id: "2", firstName: "Jane", lastName: "Smith", age: 30 },
    ]);
  }
}; 