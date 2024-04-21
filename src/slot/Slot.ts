import { Container } from "pixi.js";
import { SlotConfig, slotGetConfig } from "./SlotConfig";
import { SlotOnMatchData, SlotStats } from "./SlotStats";
import { SlotBoard } from "./SlotBoard";
import { SlotActions } from "./SlotActions";
import { SlotProcess } from "./SlotProcess";

export class Slot extends Container {
    /** Slot game basic configuration */
    public config: SlotConfig;
    /** Compute balance, grade, number of matches */
    public stats: SlotStats;
    /** Holds the grid state and display */
    public board: SlotBoard;
    /** Sort out actions that the player can take */
    public actions: SlotActions;
    /** Process matches and fills up the grid */
    public process: SlotProcess;

    /** Fires when the game start auto-processing the grid */
    public onProcessStart?: () => void;
    /** Fires when a match is detected */
    public onMatch?: (data: SlotOnMatchData) => void;
    /** Fires when the game finishes auto-processing the grid */
    public onProcessComplete?: () => void;
    
    constructor(){
        super();

        // Game sub-systems
        this.config = slotGetConfig();
        this.stats = new SlotStats(this);
        this.board = new SlotBoard(this);
        this.actions = new SlotActions(this);
        this.process = new SlotProcess(this);
    }

    /** Check if the game is still playing */
    public isPlaying() {
        return this.interactiveChildren;
    }
}