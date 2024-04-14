import { Slot } from "./Slot";
import { SlotPosition } from "./SlotUtility";

/** Default gameplay stats data */
const defaultStatsData = {
    bet: 0,
    balance: 0
};

export type SlotStatsData = typeof defaultStatsData;

/** Interface for onMatch event data */
export interface SlotOnMatchData {
    /** List of all matches detected in the grid */
    matches: SlotPosition[][];
}

export class SlotStats {
    private slot: Slot;
    private data: SlotStatsData;
    
    constructor(slot: Slot){
        this.slot = slot;
        this.data = { ...defaultStatsData }
    }

    /**
     * Reset all stats
     */
    public reset() {
        this.data = { ...defaultStatsData };
    }

    /**
     * Update stats params based on given match data
     * @param data The match data
     */
    public registerMatch(_data: SlotOnMatchData) {
        this.data.balance += 100
    }

    public getBet() {
        return this.data.bet;
    }

    public getBalance() {
        return this.data.balance;
    }

    public getSlot() {
        return this.slot
    }
}