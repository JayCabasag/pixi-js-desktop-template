import { Container } from "pixi.js";
import { SlotConfig, slotGetConfig } from "./SlotConfig";
import { SlotStats } from "./SlotStats";

export class Slot extends Container {
    public config: SlotConfig;
    public stats: SlotStats;
    public board: 

    
    constructor(){
        super();

        // Game sub-systems
        this.config = slotGetConfig();
        this.stats = new SlotStats(this);



    }
}