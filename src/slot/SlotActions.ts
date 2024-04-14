import { Slot } from "./Slot";
import { SlotPiece } from "./SlotPiece";
import { SlotPosition } from "./SlotUtility";

/** Interface for actions configuration */
interface SlotActionsConfig {
    canSpin: boolean;
}

export class SlotActions {
    /** The slot instance */
    private slot: Slot;
    /** Can spin, meaning that they will always be valid regardles of matching results */
    private canSpin = false;
    
    constructor(slot: Slot){
        this.slot = slot
    }

    /**
     * Set up actions with given configuration
     * @param config Actions config params
     */
    public setup(config: SlotActionsConfig) {
        this.canSpin = config.canSpin;
    }

    /**
     * Basic move action that swap two pieces in the grid. Can be disallowed and reverted if
     * the move does not involve special pieces neither create any new matches, unless free moves
     * is enabled.
     * @param from The origin grid position of the move
     * @param to The destination grid position of the move
     */
    public async actionSpin(from: SlotPosition, to: SlotPosition) {
        if (!this.slot.isPlaying()) return;

        // Check if there are pieces on each of the 2 positions, and if they are not locked
        const pieceA = this.slot.board.getPieceByPosition(from);
        if (!pieceA || pieceA.isLocked()) return;

        // Check the grid types currently involved in the move
        const typeA = this.slot.board.getTypeByPosition(from);
        if (!typeA) return;

        // Execute the pieces swap - might be reverted if invalid
        console.log('[Match3] ACTION! Move:', from, 'to:', to);
        await this.dropPiece(pieceA);
        this.slot.process.start();
    }

    /** Attempt to swap two pieces positions in the board, and revert the movement if disallowed */
    private async dropPiece(pieceA: SlotPiece) {
        console.log("Dropping Piece", pieceA)
    }

}