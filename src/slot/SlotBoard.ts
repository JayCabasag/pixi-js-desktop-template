import { Container, Graphics } from "pixi.js";
import { Slot } from "./Slot";
import { SlotGrid, SlotPosition, SlotType, match3CreateGrid, slotForEach, slotGetPieceType } from "./SlotUtility";
import { SlotPiece } from "./SlotPiece";
import { SlotConfig, slotGetBlocks } from "./SlotConfig";
import { pool } from "../utils/pool";

export class SlotBoard{
    /** The Slot instance */
    public slot: Slot;
     /** The grid state, with only numbers */
    public grid: SlotGrid = [];
    /** All piece sprites currently being used in the grid */
    public pieces: SlotPiece[] = [];
    /** Mask all pieces inside board dimensions */
    public piecesMask: Graphics;
    /** A container for the pieces sprites */
    public piecesContainer: Container;
    /** Number of rows in the boaard */
    public rows = 0;
    /** Number of columns in the boaard */
    public columns = 0;
    /** The size (width & height) of each board slot */
    public tileSize = 0;
    /** List of common types available for the game */
    public commonTypes: SlotType[] = [];
    /** Map piece types to piece names */
    public typesMap!: Record<number, string>;
    
    constructor(slot: Slot) {
        this.slot = slot;

        this.piecesContainer = new Container();
        this.slot.addChild(this.piecesContainer);

        this.piecesMask = new Graphics().rect(-2, -2, 4, 4).fill({ color: 0xff0000, alpha: 0.5 });
        this.slot.addChild(this.piecesMask);
        this.piecesContainer.mask = this.piecesMask;
    }
    /**
     * Setup the initial grid state and fill up the view with pieces
     * @param config Match3 config params
     */
    public setup(config: SlotConfig) {
        this.rows = config.rows;
        this.columns = config.columns;
        this.tileSize = config.tileSize;
        this.piecesMask.width = this.getWidth();
        this.piecesMask.height = this.getHeight();
        this.piecesContainer.visible = true;

        // The list of blocks (including specials) that will be used in the game
        const blocks = slotGetBlocks(config.mode);

        this.typesMap = {};

        // Organise types and set up special handlers
        // Piece types will be defined according to their positions in the string array of blocks
        // Example: If 'piece-dragon' is the 2nd in the blocks list (blocks[1]), its type will be 2
        for (let i = 0; i < blocks.length; i++) {
            const name = blocks[i];
            const type = i + 1;
            // Add a special handler the block refers to a special piece, otherwise make it a common type
            this.commonTypes.push(type);
            this.typesMap[type] = name;
        }

        // Create the initial grid state
        this.grid = match3CreateGrid(this.rows, this.columns, this.commonTypes);

        // Fill up the visual board with piece sprites
        slotForEach(this.grid, (gridPosition: SlotPosition, type: SlotType) => {
            this.createPiece(gridPosition, type);
        });
    }

    /** Get the visual width of the board */
    public getWidth() {
        return this.tileSize * this.columns;
    }

    /** Get the visual height of the board */
    public getHeight() {
        return this.tileSize * this.rows;
    }
    /**
     * Create a new piece in an specific grid position
     * @param position The grid position where the new piece will be attached
     * @param type The type of the nre piece
     */
    public createPiece(position: SlotPosition, pieceType: SlotType) {
        const name = this.typesMap[pieceType];
        const piece = pool.get(SlotPiece);
        const viewPosition = this.getViewPositionByGridPosition(position);
        piece.setup({
            name,
            type: pieceType,
            size: this.slot.config.tileSize,
            interactive: true
        });
        piece.row = position.row;
        piece.column = position.column;
        piece.x = viewPosition.x;
        piece.y = viewPosition.y;
        this.pieces.push(piece);
        this.piecesContainer.addChild(piece);
        return piece;
    }


    /**
     * Conver grid position (row & column) to view position (x & y)
     * @param position The grid position to be converted
     * @returns The equivalet x & y position in the board
     */
    public getViewPositionByGridPosition(position: SlotPosition) {
        const offsetX = ((this.columns - 1) * this.tileSize) / 2;
        const offsetY = ((this.rows - 1) * this.tileSize) / 2;
        const x = position.column * this.tileSize - offsetX;
        const y = position.row * this.tileSize - offsetY;
        return { x, y };
    }

    /**
     * Find a piece sprite by grid position
     * @param position The grid position to look for
     * @returns
     */
    public getPieceByPosition(position: SlotPosition) {
        for (const piece of this.pieces) {
            if (piece.row === position.row && piece.column === position.column) {
                return piece;
            }
        }
        return null;
    }

    /**
     * Find out the piece type in a grid position
     * @param position
     * @returns The type of the piece
     */
    public getTypeByPosition(position: SlotPosition) {
        return slotGetPieceType(this.grid, position);
    }


    /**
     * Pop a piece out of the board, triggering its effects if it is a special piece
     * @param position The grid position of the piece to be popped out
     * @param causedBySpecial If the pop was caused by special effect
     */
    public async jumpPiece(position: SlotPosition, causedBySpecial = false) {
        const piece = this.getPieceByPosition(position);
        const type = slotGetPieceType(this.grid, position);
        if (!type || !piece) return;

        await piece.animateJump();
        this.disposePiece(piece);
    }

    /**
     * Dispose a piece, removing it from the board
     * @param piece Piece to be removed
     */
    public disposePiece(piece: SlotPiece) {
        if (this.pieces.includes(piece)) {
            this.pieces.splice(this.pieces.indexOf(piece), 1);
        }
        if (piece.parent) {
            piece.parent.removeChild(piece);
        }
        pool.giveBack(piece);
    }



     /**
     * Pop a list of pieces all together
     * @param positions List of positions to be popped out
     * @param causedBySpecial If this was caused by special effects
     */
     public async jumpPieces(positions: SlotPosition[], causedBySpecial = false) {
        const animPromises = [];
        for (const position of positions) {
            animPromises.push(this.jumpPiece(position, causedBySpecial));
        }
        await Promise.all(animPromises);
    }
}