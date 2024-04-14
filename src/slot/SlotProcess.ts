import { AsyncQueue } from "../utils/asyncUtils";
import { Slot } from "./Slot";
import { slotApplyGravity, slotFillUp, slotGetEmptyPositions, slotGetMatches, slotGetPieceType, slotGridToString } from "./SlotUtility";

export class SlotProcess {
    /** The Slot instance */
    private slot: Slot;
    /** Tells if it is currently processing or not */
    private processing = false;
    /** The subsequent process round, resets when process starts */
    private round = 0;
    /** The list of queued actions that the grid processing will take */
    private queue: AsyncQueue;

    constructor(slot: Slot){
        this.slot = slot;
        this.queue = new AsyncQueue();
    }

    /** Check if is processing */
    public isProcessing() {
        return this.processing;
    }

    /** Get current process round */
    public getProcessRound() {
        return this.round;
    }

    /** Interrupt processing and cleanup process queue */
    public reset() {
        this.processing = false;
        this.round = 0;
        this.queue.clear();
    }

    /** Pause processing */
    public pause() {
        this.queue.pause();
    }

    /** Resume processing */
    public resume() {
        this.queue.resume();
    }


    /** Start processing the grid until there are no new matches or empty spaces left */
    public async start() {
        if (this.processing || !this.slot.isPlaying()) return;
        this.processing = true;
        this.round = 0;
        this.slot.onProcessStart?.();
        console.log('[Slot] ======= PROCESSING START ==========');
        this.runProcessRound();
    }

    /** Update gameplay stats with new matches found in the grid */
    private async updateStats() {
        const matches = slotGetMatches(this.slot.board.grid);
        if (!matches.length) return;
        console.log('[Slot] Update stats');
        const matchData = { matches, combo: this.getProcessRound() };
        this.slot.stats.registerMatch(matchData);
        this.slot.onMatch?.(matchData);
    }

        
    /**
     * Sequence of logical steps to evolve the board, added to the async queue. Each step can
     * be awaited/delayed as needed in oder to create a nice gameplay progress flow.
     */
    private async runProcessRound() {
        // Step #1 - Bump sequence number and update stats with new matches found
        this.queue.add(async () => {
            this.round += 1;
            console.log(`[Slot] -- SEQUENCE ROUND #${this.round} START`);
            this.updateStats();
        });

        // Step #3 - Process and clear remaining common matches
        this.queue.add(async () => {
            await this.processRegularMatches();
        });

        // Step #4 - Move down remaining pieces in the grid if there are empty spaces in their columns
        this.queue.add(async () => {
            // No await here, to make it run simultaneously with grid refill
            this.applyGravity();
        });

        // Step #5 - Create new pieces that falls from the to to fill up remaining empty spaces
        this.queue.add(async () => {
            await this.refillGrid();
        });

        // Step #6 - Finish up this sequence round and check if it needs a re-run, otherwise stop processing
        this.queue.add(async () => {
            console.log(`[Slot] -- SEQUENCE ROUND #${this.round} FINISH`);
            this.processCheckpoint();
        });
    }

    /** Check the grid if there are empty spaces and/or matches remaining, and run another process round if needed */
    private async processCheckpoint() {
        // Check if there are any remaining matches or empty spots
        const newMatches = slotGetMatches(this.slot.board.grid);
        const emptySpaces = slotGetEmptyPositions(this.slot.board.grid);
        console.log('[Slot] Checkpoint - New matches:', newMatches.length);
        console.log('[Slot] Checkpoint - Empty spaces:', emptySpaces.length);
        if (newMatches.length || emptySpaces.length) {
            console.log('[Slot] Checkpoint - Another sequence run is needed');
            // Run it again if there are any new matches or empty spaces in the grid
            this.runProcessRound();
        } else {
            console.log('[Slot] Checkpoint - Nothing left to do, all good');
            // Otherwise, finish the grid processing
            this.stop();
        }
    }

      /** Clear process query and stop processing the grid */
      public async stop() {
        if (!this.processing) return;
        this.processing = false;
        this.queue.clear();
        console.log('[Slot] Sequence rounds:', this.round);
        console.log('[Slot] Board pieces:', this.slot.board.pieces.length);
        console.log('[Slot] Grid:\n' + slotGridToString(this.slot.board.grid));
        console.log('[Slot] ======= PROCESSING COMPLETE =======');
        this.slot.onProcessComplete?.();
    }


    /** Make existing pieces fall in the grid if there are empty spaces below them */
    private async applyGravity() {
        const changes = slotApplyGravity(this.slot.board.grid);
        console.log('[Slot] Apply gravity - moved pieces:', changes.length);
        const animPromises = [];

        for (const change of changes) {
            const from = change[0];
            const to = change[1];
            const piece = this.slot.board.getPieceByPosition(from);
            if (!piece) continue;
            piece.row = to.row;
            piece.column = to.column;
            const newPosition = this.slot.board.getViewPositionByGridPosition(to);
            animPromises.push(piece.animateFall(newPosition.x, newPosition.y));
        }

        await Promise.all(animPromises);
    }

    /** Clear all matches in the grid */
    private async processRegularMatches() {
        console.log('[Slot] Process regular matches');
        const matches = slotGetMatches(this.slot.board.grid);
        const animPromises = [];
        for (const match of matches) {
            animPromises.push(this.slot.board.jumpPieces(match));
        }
        await Promise.all(animPromises);
    }

        /** Fill up empty spaces in the grid with new pieces falling from the top */
        private async refillGrid() {
            const newPieces = slotFillUp(this.slot.board.grid, this.slot.board.commonTypes);
            console.log('[Slot] Refill grid - new pieces:', newPieces.length);
            const animPromises = [];
            const piecesPerColumn: Record<number, number> = {};
    
            for (const position of newPieces) {
                const pieceType = slotGetPieceType(this.slot.board.grid, position);
                const piece = this.slot.board.createPiece(position, pieceType);
    
                // Count pieces per column so new pieces can be stacked up accordingly
                if (!piecesPerColumn[piece.column]) piecesPerColumn[piece.column] = 0;
                piecesPerColumn[piece.column] += 1;
    
                const x = piece.x;
                const y = piece.y;
                const columnCount = piecesPerColumn[piece.column];
                const height = this.slot.board.getHeight();
                piece.y = -height * 0.5 - columnCount * this.slot.config.tileSize;
                animPromises.push(piece.animateFall(x, y));
            }
    
            await Promise.all(animPromises);
        }
    
}