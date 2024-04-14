import { Container, Sprite, Texture } from "pixi.js";
import { SlotPosition } from "./SlotUtility";
import { app } from '../main';
import { registerCustomEase, resolveAndKillTweens } from "../utils/animation";

/** Custom ease curve for y animation of falling pieces */
const easeSingleBounce = registerCustomEase(
    'M0,0,C0.14,0,0.27,0.191,0.352,0.33,0.43,0.462,0.53,0.963,0.538,1,0.546,0.985,0.672,0.83,0.778,0.83,0.888,0.83,0.993,0.983,1,1',
);

/** Default piece options */
const defaultSlotPieceOptions = {
    /** Piece name, must match one of the textures available */
    name: '',
    /** Attributed piece type in the grid */
    type: 0,
    /** Piece size - width & height - in pixel */
    size: 50,
    /** Set if the piece should be highlighted, like special types */
    highlight: false,
    /** Enable or disable its interactivity */
    interactive: false,
};

/** Piece configuration parameters */
export type Match3PieceOptions = typeof defaultSlotPieceOptions;

export class SlotPiece extends Container {
    /** The interactive area of the piece */
    private readonly area: Sprite;
    /** The actual image of the piece */
    private readonly image: Sprite;
    /** The highlight sprite that can be enabled or disabled */
    private readonly highlight: Sprite;
    /** True if animations are paused */
    private paused = false;
    /** The row index of the piece */
    public row = 0;
    /** The column index of the piece */
    public column = 0;
    /** The piece type in the grid */
    public type = 0;
    /** The name of the piece - must match one of the available textures */
    public name = '';
    /** Callback that fires when the player drags the piece for a move */
    public onMove?: (from: SlotPosition, to: SlotPosition) => void;
    constructor(){
        super();
        this.highlight = Sprite.from('highlight');
        this.highlight.anchor.set(0.5);
        this.addChild(this.highlight);

        this.image = new Sprite();
        this.image.anchor.set(0.5);
        this.addChild(this.image);

        this.area = new Sprite(Texture.WHITE);
        this.area.anchor.set(0.5);
        this.area.alpha = 0;
        this.addChild(this.area);

        this.onRender = () => this.renderUpdate();
    }

    private renderUpdate(){
        if (this.paused) return;
        if (this.highlight.visible) {
            this.highlight.rotation += app.ticker.deltaTime * 0.03;
            this.image.rotation = Math.sin(app.ticker.lastTime * 0.01) * 0.1;
        } else {
            this.image.rotation = 0;
        }
    }

     /**
     * Set up the visuals. Pieces can be resused and set up with different params freely.
     * @param options The setup options
     */
     public setup(options: Partial<Match3PieceOptions> = {}) {
        const opts = { ...defaultSlotPieceOptions, ...options };
        this.killTweens();
        this.paused = false;
        this.visible = true;
        this.alpha = 1;
        this.type = opts.type;
        this.name = opts.name;
        this.image.alpha = 1;
        this.scale.set(1);
        this.image.texture = Texture.from(opts.name);
        this.image.width = opts.size - (opts.highlight ? 2 : 8);
        this.image.height = this.image.width;
        this.highlight.visible = opts.highlight;
        this.highlight.width = opts.size;
        this.highlight.height = opts.size;
        this.highlight.alpha = 0.3;
        this.area.width = opts.size;
        this.area.height = opts.size;
        this.area.interactive = opts.interactive;
        this.area.cursor = 'pointer';
        this.unlock();
    }

    /** Resolve and kill all current tweens */
    private killTweens() {
        resolveAndKillTweens(this);
        resolveAndKillTweens(this.position);
        resolveAndKillTweens(this.scale);
        resolveAndKillTweens(this.image);
    }
    
    /** Lock piece interactivity, preventing mouse/touch events */
    public lock() {
        this.interactiveChildren = false;
    }

    /** Unlock piece interactivity, preventing mouse/touch events */
    public unlock() {
        this.interactiveChildren = true;
    }

    /** CHeck if piece is locked */
    public isLocked() {
        return !this.interactiveChildren;
    }
    
    /** Pop out animation */
    public async animateJump() {
        this.lock();
        resolveAndKillTweens(this.image);
        const duration = 0.1;
        await gsap.to(this.image, { alpha: 0, duration, ease: 'sine.out' });
        this.visible = false;
    }

        /** Fall to position animation */
        public async animateFall(x: number, y: number) {
            this.lock();
            resolveAndKillTweens(this.position);
            const duration = 0.5;
            await gsap.to(this.position, { x, y, duration, ease: easeSingleBounce });
            this.unlock();
        }
    
}