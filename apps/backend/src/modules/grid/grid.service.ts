interface GridRow {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
}

export const gridService = {
  async getGridData(): Promise<GridRow[]> {
    // This could be replaced with actual database calls later
    return [
      { id: 1, lastName: 'Snow', firstName: 'Jon', age: 35 },
      { id: 2, lastName: 'Lannister', firstName: 'Cersei', age: 42 },
      { id: 3, lastName: 'Lannister', firstName: 'Jaime', age: 45 },
      { id: 4, lastName: 'Stark', firstName: 'Arya', age: 16 },
    ];
  }
};

export { type GridRow }; 