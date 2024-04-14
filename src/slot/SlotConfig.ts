/** List of all valid game modes */
export const slotValidModes = ['normal', 'free_spins'] as const;

/** The game mode type */
export type SlotMode = (typeof slotValidModes)[number];


/** Default match3 configuration */
const defaultConfig = {
    /** Number of rows in the game */
    rows: 12,
    /** Number of columns in the game */
    columns: 5,
    /** The size (width & height, in pixels) of each cell in the grid */
    tileSize: 250,
    /** Validate all moves, regardless if they create a match or not */
    canSpin: false,
    /** Gameplay mode - affects the number of piece types in the grid */
    mode: <SlotMode>'normal',
};

/**
 * Map of all available blocks for the game, ordered by game mode.
 * Each item in these lists should have a corresponding pixi texture with the same name
 */
const blocks: Record<SlotMode | 'normal', string[]> = {
    normal: ['piece-dragon', 'piece-frog', 'piece-newt', 'piece-snake', 'piece-spider'], // Set all the available assets
    /** Special types that will be added to the game regardless the mode */
    free_spins: ['special-blast', 'special-row', 'special-column', 'special-colour'], // Set all the available assets
};


/** Match3 configuration */
export type SlotConfig = typeof defaultConfig;

/** Build a config object overriding default values if suitable */
export function slotGetConfig(customConfig: Partial<SlotConfig> = {}): SlotConfig {
    return { ...defaultConfig, ...customConfig };
}

/** Mount a list of blocks available for given game mode */
export function slotGetBlocks(mode: SlotMode): string[] {
    return [...blocks[mode], ...blocks.normal];
}


