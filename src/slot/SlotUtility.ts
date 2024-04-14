/** Pair of row & column representing grid coordinates */
export type SlotPosition = { row: number; column: number };

/** Piece type on each position in the grid */
export type SlotType = number;

/** Two-dimensional array represeinting the game board */
export type SlotGrid = SlotType[][];

/** Orientation for match checks */
export type SlotOrientation = 'horizontal' | 'vertical';

/**
 * Get a random type from the type list
 * @param types List of types available to return
 * @param exclude List of types to be excluded from the result
 * @returns A random type picked from the given list
 */
export function slotGetRandomType(types: SlotType[], exclude?: SlotType[]) {
    let list = [...types];

    if (exclude) {
        // If exclude list is provided, exclude them from the available list
        list = types.filter((type) => !exclude.includes(type));
    }

    const index = Math.floor(Math.random() * list.length);

    return list[index];
}

/**
 * Loop through every position in the grid
 * @param grid The grid in context
 * @param fn Callback for each position in the grid
 */
export function slotForEach(grid: SlotGrid, fn: (position: SlotPosition, type: SlotType) => void) {
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            fn({ row: r, column: c }, grid[r][c]);
        }
    }
}

/**
 * Create a 2D grid matrix filled up with given types
 * Example:
 * [[1, 1, 2, 3]
 *  [3, 1, 1, 3]
 *  [1, 2, 3, 2]
 *  [2, 3, 1, 3]]
 * @param rows Number of rows
 * @param columns Number of columns
 * @param types List of types avaliable to fill up slots
 * @returns A 2D array filled up with types
 */
export function match3CreateGrid(rows = 6, columns = 6, types: SlotType[]) {
    const grid: SlotGrid = [];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            let type = slotGetRandomType(types);

            // Create the new row if not exists
            if (!grid[r]) grid[r] = [];

            // Set type for the grid position
            grid[r][c] = type;
        }
    }

    return grid as SlotGrid;
}

/**
 * Retrieve the piece type from a grid, by position
 * @param grid The grid to be looked up
 * @param position The position in the grid
 * @returns The piece type from given position, undefined if position is invalid
 */
export function slotGetPieceType(grid: SlotGrid, position: SlotPosition) {
    return grid?.[position.row]?.[position.column];
}

/**
 * Check if two positions are the same
 * @param a First position to compare
 * @param b Second position to compare
 * @returns True if position A row & column are the same of position B
 */
export function match3ComparePositions(a: SlotPosition, b: SlotPosition) {
    return a.row === b.row && a.column == b.column;
}


/**
 * Get all matches in the grid, optionally filtering results that involves given positions
 * Example:
 * [[{row: 1, column: 1}, {row: 1, column: 2}, {row: 1, column: 3}]
 *  [{row: 1, column: 1}, {row: 2, column: 1}, {row: 2, column: 1}]]
 * @param grid The grid to be analysed
 * @param filter Optional list of positions that every match should have
 * @param matchSize The length of the match, defaults to 3
 * @returns A list of positions grouped by match, excluding ones not involving filter positions if provided
 */
export function slotGetMatches(grid: SlotGrid, filter?: SlotPosition[], matchSize = 3) {
    const allMatches = [
        ...slotGetMatchesByOrientation(grid, matchSize, 'horizontal'),
    ];

    if (!filter) {
        // Return all matches found if filter is not provided
        return allMatches;
    }

    // List of matches that involves positions in the provided filter
    const filteredMatches = [];

    for (const match of allMatches) {
        let valid = false;
        for (const position of match) {
            // Compare each position of the match to see if includes one of the filter positions
            for (const filterPosition of filter) {
                const same = match3ComparePositions(position, filterPosition);
                if (same) valid = true;
            }
        }

        if (valid) {
            // If match is valid (contains one of the filter positions), append that to the filtered list
            filteredMatches.push(match);
        }
    }

    return filteredMatches;
}

/**
 * Retrieve a list of matches found in a singe orientation (horizontal or vertical)
 * @param grid The grid to be searched
 * @param matchSize The size of the match (usually 3)
 * @param orientation If the search is horizontal or vertical
 * @returns
 */
function slotGetMatchesByOrientation(grid: SlotGrid, matchSize: number, orientation: SlotOrientation) {
    const matches = [];
    const rows = grid.length;
    const columns = grid[0].length;
    let lastType = undefined;
    let currentMatch: SlotPosition[] = [];

    // Define primary and secondary orientations for the loop
    const primary = orientation === 'horizontal' ? rows : columns;
    const secondary = orientation === 'horizontal' ? columns : rows;

    for (let p = 0; p < primary; p++) {
        for (let s = 0; s < secondary; s++) {
            // On horizontal 'p' is row and 's' is column, vertical is opposite
            const row = orientation === 'horizontal' ? p : s;
            const column = orientation === 'horizontal' ? s : p;
            const type = grid[row][column];

            if (type && type === lastType) {
                // Type is the same as the last type, append to the match list
                currentMatch.push({ row, column });
            } else {
                // Type is different from last - check current match length and append it to the results if suitable
                if (currentMatch.length >= matchSize) {
                    matches.push(currentMatch);
                }
                // Start a new match
                currentMatch = [{ row, column }];
                // Save last type to check in the next pass
                lastType = type;
            }
        }

        // Row (or column) finished. Append current match if suitable
        if (currentMatch.length >= matchSize) {
            matches.push(currentMatch);
        }

        // Cleanup before mmoving to the next row (or column)
        lastType = undefined;
        currentMatch = [];
    }

    return matches;
}

/**
 * Set the piece type in the grid, by position
 * @param grid The grid to be changed
 * @param position The position to be changed
 * @param type The new type for given position
 */
export function slotSetPieceType(grid: SlotGrid, position: SlotPosition, type: number) {
    grid[position.row][position.column] = type;
}


/**
 * Swap two pieces in the grid, based on their positions
 * @param grid The grid to be changed
 * @param positionA The first piece to swap
 * @param positionB The second piece to swap
 */
export function match3SwapPieces(grid:SlotGrid, positionA: SlotPosition, positionB: SlotPosition) {
    const typeA = slotGetPieceType(grid, positionA);
    const typeB = slotGetPieceType(grid, positionB);

    // Only swap pieces if both types are valid (not undefined)
    if (typeA !== undefined && typeB !== undefined) {
        slotSetPieceType(grid, positionA, typeB);
        slotSetPieceType(grid, positionB, typeA);
    }
}


/**
 * Check if a position is valid in the grid
 * @param grid The grid in context
 * @param position The position to be validated
 * @returns True if position exists in the grid, false if out-of-bounds
 */
export function slotIsValidPosition(grid: SlotGrid, position: SlotPosition) {
    const rows = grid.length;
    const cols = grid[0].length;
    return position.row >= 0 && position.row < rows && position.column >= 0 && position.column < cols;
}

/**
 * Loop through the grid and fill up all empty positions with random types
 * @param grid The grid to be changed
 * @param types List of types available to randomise
 * @returns A list with all positions that have their types changed from empty (0) to something
 */
export function slotFillUp(grid: SlotGrid, types: SlotType[]) {
    // Create a temp grid that will provide pieces to fill up corresponding slots
    // using the same grid creation algorithm to avoid pre-made combinations
    const tempGrid = match3CreateGrid(grid.length, grid[0].length, types);

    const rows = grid.length;
    const columns = grid[0].length;
    const newPositions: SlotPosition[] = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            if (!grid[r][c]) {
                grid[r][c] = tempGrid[r][c];
                newPositions.push({ row: r, column: c });
            }
        }
    }

    return newPositions.reverse();
}

/**
 * Move all pieces in the grid to their next empty position, vertically
 * @param grid The grid to be changed
 * @returns All position that have been changed.
 * Ex.: [[{row: 1, column: 1}, {row: 2, column: 1}]] - That piece moved 1 row down
 */
export function slotApplyGravity(grid: SlotGrid) {
    const rows = grid.length;
    const columns = grid[0].length;
    const changes: SlotPosition[][] = [];
    for (let r = rows - 1; r >= 0; r--) {
        for (let c = 0; c < columns; c++) {
            let position = { row: r, column: c };
            const belowPosition = { row: r + 1, column: c };
            let hasChanged = false;

            // Skip this one if position below is out of bounds
            if (!slotIsValidPosition(grid, belowPosition)) continue;

            // Retrive ethe type of the position below
            let belowType = slotGetPieceType(grid, belowPosition);

            // Keep moving the piece down if position below is valid and empty
            while (slotIsValidPosition(grid, belowPosition) && belowType === 0) {
                hasChanged = true;
                match3SwapPieces(grid, position, belowPosition);
                position = { ...belowPosition };
                belowPosition.row += 1;
                belowType = slotGetPieceType(grid, belowPosition);
            }

            if (hasChanged) {
                // Append a new change if position has changed [<from>, <to>]
                changes.push([{ row: r, column: c }, position]);
            }
        }
    }

    return changes;
}

/**
 * Convert grid to a visual string representation, useful for debugging
 * @param grid The grid to be converted
 * @returns String representing the grid
 */
export function slotGridToString(grid: SlotGrid) {
    const lines: string[] = [];
    for (const row of grid) {
        const list = row.map((type) => String(type).padStart(2, '0'));
        lines.push('|' + list.join('|') + '|');
    }
    return lines.join('\n');
}

/**
 * Find out all empty spaces (type=0) in the grid
 * @param grid The grid to be verified
 * @returns A list of empty positions
 */
export function slotGetEmptyPositions(grid: SlotGrid) {
    const positions: SlotPosition[] = [];
    const rows = grid.length;
    const columns = grid[0].length;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            if (!grid[r][c]) {
                positions.push({ row: r, column: c });
            }
        }
    }
    return positions;
}
