import { Vector2 } from "three";

import { map } from "../../math/index";
import { DIRECTIONS, Entity, height, world } from "./index";
import { hasInventory, HasInventory, Inventory } from "./inventory";

export const CELL_ENERGY_MAX = 2000;
export const ENERGY_TO_SUGAR_RATIO = 2000;
export const CELL_SUGAR_BUILD_COST = CELL_ENERGY_MAX / ENERGY_TO_SUGAR_RATIO;

const SOIL_MAX_WATER = 20;

export interface HasEnergy {
    energy: number;
}

export function hasEnergy(e: any): e is HasEnergy {
    return typeof e.energy === "number";
}

export abstract class Tile {
    static displayName = "Tile";
    public darkness = Infinity;
    public constructor(public pos: Vector2) {}

    public lightAmount() {
        return Math.sqrt(Math.min(Math.max(map(1 - this.darkness, 0, 1, 0, 1), 0), 1));
    }

    // test tiles diffusing water around on same-type tiles
    public step() {
        const neighbors = world.tileNeighbors(this.pos);
        if (this instanceof Cell) {
            this.darkness = 0;
        } else {
            const minDarkness = Array.from(neighbors.values()).reduce((d, t) => {
                const contrib = Math.max(0.2, map(this.pos.y, height / 2, height, 0.2, 1));
                const darknessFromNeighbor = t instanceof Rock ? Infinity : t.darkness + contrib;
                if (t instanceof Cell) {
                    return 0;
                } else {
                    return Math.min(d, darknessFromNeighbor);
                }
            }, this.darkness);
            this.darkness = minDarkness;
        }
        if (hasInventory(this)) {
            const self = this;
            const neighborsWithMore =
                Array.from(neighbors.values()).filter((tile) => {
                    return hasInventory(tile) && tile.constructor === this.constructor && tile.inventory.water > self.inventory.water;
                }) as any as HasInventory[];

            // let avgWater = this.inventory.water;
            // neighborsWithInventory.forEach((tile) => {
            //     avgWater += tile.inventory.water;
            // });
            // avgWater /= (neighborsWithInventory.length + 1);

            for (const tile of neighborsWithMore) {
                // // give water to neighbors that you're less than
                // if (tile.inventory.water < avgWater) {
                //     const diff = Math.floor((avgWater - tile.inventory.water) / (neighborsWithInventory.length + 1));
                //     this.inventory.give(tile.inventory, diff, 0);
                // }
                // take water from neighbors that you're bigger than
                if (tile.inventory.water > this.inventory.water) {
                    // const diff = Math.floor((tile.inventory.water - this.inventory.water) / (neighborsWithMore.length + 1));
                    // const diff = Math.round((tile.inventory.water - this.inventory.water) / (neighborsWithMore.length + 1));
                    const diff = Math.floor((tile.inventory.water - this.inventory.water) / 2);
                    tile.inventory.give(this.inventory, diff, 0);
                }
            }
        }
    }
}

export class Air extends Tile {
    static displayName = "Air";
    public sunlightCached: number = 1;
    public constructor(public pos: Vector2) {
        super(pos);
        this.darkness = 0;
    }

    public lightAmount() {
        return this.sunlight();
    }

    step() {
        // don't compute dark/light or water diffusion
    }

    public co2() {
        return map(this.pos.y, height / 2, 0, 0.5, 1);
    }

    public sunlight() {
        return this.sunlightCached;
    }
}

export class Soil extends Tile implements HasInventory {
    static displayName = "Soil";
    public inventory = new Inventory(SOIL_MAX_WATER);
    constructor(pos: Vector2, water: number = 0) {
        super(pos);
        this.inventory.change(water, 0);
    }
}

export class Rock extends Tile {
    static displayName = "Rock";
}

export class DeadCell extends Tile {
    static displayName = "Dead Cell";
}

export class Fountain extends Soil {
    static displayName = "Fountain";
    private cooldown = 0;
    constructor(pos: Vector2, water: number = 0, public turnsPerWater = 10) {
        super(pos, water);
    }
    step() {
        super.step();
        if (this.cooldown > 0) {
            this.cooldown--;
        }
        if (this.inventory.space() > 1 && this.cooldown <= 0) {
            // just constantly give yourself water
            this.inventory.change(1, 0);
            this.cooldown = this.turnsPerWater;
        }
    }
}

interface MetabolismState {
    type: "eating" | "not-eating";
    duration: number;
}
export class Cell extends Tile implements HasEnergy {
    static displayName = "Cell";
    public energy: number = CELL_ENERGY_MAX;
    public darkness = 0;
    // public metabolism: MetabolismState = {
    //     type: "not-eating",
    //     duration: 0,
    // };
    // offset [-0.5, 0.5] means you're still "inside" this cell, going out of it will break you
    // public offset = new Vector2();
    public droopY = 0;

    // private stepMetabolism() {
    //     // transition from not eating to eating
    //     if (this.metabolism.type === "not-eating") {
    //         // const shouldEat = this.energy < CELL_ENERGY_MAX / 2 && this.metabolism.duration > 25;
    //         const shouldEat = this.energy < CELL_ENERGY_MAX / 2;
    //         if (shouldEat) {
    //             this.metabolism = {
    //                 type: "eating",
    //                 duration: 0,
    //             };
    //         }
    //     } else {
    //         const shouldStopEating = this.metabolism.duration > 30;
    //         if (shouldStopEating) {
    //             this.metabolism = {
    //                 type: "not-eating",
    //                 duration: 0,
    //             };
    //         }
    //     }
    //     this.metabolism.duration++;
    // }

    step() {
        super.step();
        this.energy -= 1;
        const tileNeighbors = world.tileNeighbors(this.pos);
        const neighbors = Array.from(tileNeighbors.values());
        const neighborsAndSelf = [ ...neighbors, this ];
        // this.stepMetabolism();
        // if (this.metabolism.type === "eating") {
        if (true) {
            for (const tile of neighborsAndSelf) {
                if (hasInventory(tile)) {
                    if (this.energy < CELL_ENERGY_MAX) {
                        const wantedEnergy = CELL_ENERGY_MAX - this.energy;
                        const wantedSugar = Math.min(
                            wantedEnergy / ENERGY_TO_SUGAR_RATIO,
                            tile.inventory.sugar,
                        );
                        tile.inventory.change(0, -wantedSugar);
                        const gotEnergy = wantedSugar * ENERGY_TO_SUGAR_RATIO;
                        this.energy += gotEnergy;
                        // if (gotEnergy > 0) {
                        //     console.log(`got ${gotEnergy}, now at ${this.energy}`);
                        // }
                    } else {
                        break; // we're all full, eat no more
                    }
                }
            }
            if (this.energy < CELL_ENERGY_MAX) {
                const energeticNeighbors = neighborsAndSelf.filter((t) => hasEnergy(t)) as any as HasEnergy[];
                const averageEnergy = energeticNeighbors.reduce((energy, neighbor) => energy + neighbor.energy, 0) / energeticNeighbors.length;
                for (const neighbor of energeticNeighbors) {
                    if (this.energy < CELL_ENERGY_MAX) {
                        let energyTransfer = 0;
                        // // take energy from neighbors who have more than you - this might be unstable w/o double buffering
                        // const targetEnergy = averageEnergy;
                        if (neighbor.energy > this.energy) {
                            // energyTransfer = Math.floor((neighbor.energy - this.energy) / energeticNeighbors.length);
                            energyTransfer = Math.floor((neighbor.energy - this.energy) / 2);
                            // if (neighbor.energy - energyTransfer < this.energy + energyTransfer) {
                            //     throw new Error("cell energy diffusion: result of transfer gives me more than target");
                            // }
                            if (neighbor.energy - energyTransfer < 0) {
                                throw new Error("cell energy diffusion: taking more energy than available");
                            }
                            if (this.energy + energyTransfer > CELL_ENERGY_MAX) {
                                throw new Error("cell energy diffusion: taking more energy than i can carry");
                            }
                            // const boundedEnergy = Math.min(wantedEnergy, (neighbor.energy + this.energy) / 2);
                            this.energy += energyTransfer;
                            neighbor.energy -= energyTransfer;
                            // console.log(`transfering ${-energyTransfer} from ${this.energy} to ${neighbor.energy}`);
                        }
                    } else {
                        break; // we're all full, eat no more
                    }
                }
            }
        }

        // this.stepStress(tileNeighbors);
        this.stepDroop(tileNeighbors);
        if (this.droopY > 0.5) {
            world.setTileAt(this.pos, new Air(this.pos.clone()));
            this.pos.y += 1;
            this.droopY -= 1;
            // lol whatever lets just test it out
            world.setTileAt(this.pos, this);
        }

        if (this.energy <= 0) {
            // die
            world.setTileAt(this.pos, new DeadCell(this.pos));
        }
    }

    // stepStress(tileNeighbors: Map<Vector2, Tile>) {
    //     // start with +y down for gravity
    //     const totalForce = new Vector2(0, 1);
    //     // pretend like you're spring connected to nearby cells,
    //     // and find the equilibrium position as your offset
    //     for (const [dir, neighbor] of tileNeighbors) {
    //         let springTightness = 0;
    //         // neighbor's world position
    //         let neighborX = neighbor.pos.x,
    //             neighborY = neighbor.pos.y;
    //         if (neighbor instanceof Cell) {
    //             neighborX += neighbor.offset.x;
    //             neighborY += neighbor.offset.y;
    //             springTightness = 0.1;
    //         } else if (neighbor instanceof Rock || neighbor instanceof Soil) {
    //             springTightness = 1;
    //         }
    //         const offX = this.pos.x + this.offset.x - neighborX;
    //         const offY = this.pos.y + this.offset.y - neighborY;
    //         // world offset
    //         const offset = new Vector2(offX, offY);
    //         totalForce.x += offX * springTightness;
    //         totalForce.y += offY * springTightness;
    //     }

    //     this.offset.x += totalForce.x * 0.01;
    //     this.offset.y += totalForce.y * 0.01;
    // }

    stepDroop(tileNeighbors: Map<Vector2, Tile>) {
        const below = tileNeighbors.get(DIRECTIONS.s)!;
        const belowLeft = tileNeighbors.get(DIRECTIONS.sw)!;
        const belowRight = tileNeighbors.get(DIRECTIONS.se)!;

        const left = tileNeighbors.get(DIRECTIONS.w)!;
        const right = tileNeighbors.get(DIRECTIONS.e)!;

        const above = tileNeighbors.get(DIRECTIONS.n)!;
        const aboveLeft = tileNeighbors.get(DIRECTIONS.nw)!;
        const aboveRight = tileNeighbors.get(DIRECTIONS.ne)!;

        this.droopY += 0.04;
        if (this.energy < CELL_ENERGY_MAX / 2) {
            this.droopY += 0.02;
        }

        let hasSupportBelow = false;
        for (const cell of [below, belowLeft, belowRight]) {
            if (cell instanceof Rock || cell instanceof Soil) {
                this.droopY = 0;
                return;
            } else if (cell instanceof Cell) {
                this.droopY = cell.droopY;
                hasSupportBelow = true;
            }
        }

        const springNeighborCells = [aboveLeft, above, aboveRight, left, right, this].filter((n) => n instanceof Cell) as Cell[];

        // special case - if there's no support and nothing below me, just start freefalling
        if (!hasSupportBelow && springNeighborCells.length === 1) {
            this.droopY += 0.5;
        } else {
            this.droopY = springNeighborCells.reduce((sum, n) => sum + n.droopY, 0) / springNeighborCells.length;
        }
    }
}

export class Tissue extends Cell implements HasInventory {
    static displayName = "Tissue";
    public inventory = new Inventory(5);
}

export const LEAF_MAX_CHANCE = 0.01;
export class Leaf extends Cell {
    static displayName = "Leaf";
    public averageEfficiency = 0;
    public averageSpeed = 0;
    public step() {
        super.step();
        const neighbors = world.tileNeighbors(this.pos);
        this.averageEfficiency = 0;
        this.averageSpeed = 0;
        let numAir = 0;

        for (const [dir, tile] of neighbors.entries()) {
            const oppositeTile = world.tileAt(this.pos.x - dir.x, this.pos.y - dir.y);
            if (tile instanceof Air &&
                oppositeTile instanceof Tissue) {
                const air = tile;
                const tissue = oppositeTile;
                // 0 to 1
                const speed = air.sunlight();
                const efficiency = air.co2();
                this.averageEfficiency += efficiency;
                this.averageSpeed += speed;
                numAir += 1;
                if (Math.random() < speed * LEAF_MAX_CHANCE) {
                    // transform 1 sugar this turn
                    const wantedSugar = efficiency;
                    // const neededWater = Math.round(1 / efficiency);
                    const neededWaterFract = 1 / efficiency;
                    const waterLow = Math.floor(neededWaterFract);
                    const waterHigh = Math.ceil(neededWaterFract);
                    const chance = neededWaterFract - waterLow;
                    const neededWater = Math.random() < chance ? waterLow : waterHigh;
                    const tissueWater = tissue.inventory.water;
                    if (tissueWater >= neededWater) {
                        tissue.inventory.change(-neededWater, 1);
                        break; // give max one sugar per turn
                    }
                }
            }
        }
        if (numAir > 0) {
            this.averageEfficiency /= numAir;
            // this.averageSpeed /= numAir;
        }
    }
}

export class Root extends Cell {
    static displayName = "Root";
    public step() {
        super.step();
        const neighbors = world.tileNeighbors(this.pos);
        for (const [dir, tile] of neighbors.entries()) {
            const oppositeTile = world.tileAt(this.pos.x - dir.x, this.pos.y - dir.y);
            if (tile instanceof Soil &&
                oppositeTile instanceof Tissue) {
                    const soilWater = tile.inventory.water;
                    const tissueWater = oppositeTile.inventory.water;
                    // const transferAmount = Math.ceil(Math.max(0, soilWater - tissueWater) / 2);
                    const transferAmount = 1;
                    tile.inventory.give(oppositeTile.inventory, transferAmount, 0);
            }
        }
        // const tissueNeighbors = Array.from(neighbors.values()).filter((e) => e instanceof Tissue) as Tissue[];
        // const soilNeighbors = Array.from(neighbors.values()).filter((e) => e instanceof Soil) as Soil[];
        // for (const soil of soilNeighbors) {

        // }
    }
}

export class Fruit extends Cell {
    static displayName = "Fruit";
    public inventory = new Inventory(1000);

    // seeds aggressively take the inventory from neighbors
    step() {
        super.step();
        const neighbors = world.tileNeighbors(this.pos);
        for (const [dir, neighbor] of neighbors) {
            if (hasInventory(neighbor)) {
                // LMAO
                neighbor.inventory.give(this.inventory, 0, neighbor.inventory.sugar);
            }
        }
    }
}

export class Transport extends Tissue {
    static displayName = "Transport";
    public dir: Vector2 = DIRECTIONS.n;

    step() {
        super.step();
        const targetTile = world.tileAt(this.pos.x + this.dir.x, this.pos.y + this.dir.y);
        if (targetTile instanceof Cell && hasInventory(targetTile)) {
            this.inventory.give(targetTile.inventory, 1, 1);
        }
    }
}

// export class Vacuole extends Tissue {
//     static displayName = "Vacuole";
//     public invnetory = new Inventory()

//     step() {
//         super.step();

//     }
// }
