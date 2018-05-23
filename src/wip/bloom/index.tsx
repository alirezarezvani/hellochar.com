import * as React from "react";
import * as THREE from "three";

import { LineBasicMaterial } from "three";
import { map } from "../../math";
import { ISketch, SketchAudioContext } from "../../sketch";
import { Branch } from "./branch";
import { Component, ComponentClass } from "./component";
import dna, { randomizeDna } from "./dna";
import { Flower } from "./flower";
import Petal from "./flower/petal";
import { Leaf } from "./leaf";
import { mouse } from "./mouse";
import { OpenPoseManager } from "./openPoseManager";
import scene from "./scene";
import { Whorl } from "./whorl";

class Bloom extends ISketch {
    public events = {
        mousemove: (e: JQuery.Event) => {
            mouse.x = THREE.Math.mapLinear(e.offsetX!, 0, this.canvas.width, -1, 1);
            mouse.y = THREE.Math.mapLinear(e.offsetY!, 0, this.canvas.height, 1, -1);
        },
        mousedrag: (e: JQuery.Event) => {
            mouse.x = THREE.Math.mapLinear(e.offsetX!, 0, this.canvas.width, -1, 1);
            mouse.y = THREE.Math.mapLinear(e.offsetY!, 0, this.canvas.height, 1, -1);
        },
    };

    public scene = scene;
    public camera!: THREE.PerspectiveCamera;
    public orbitControls!: THREE.OrbitControls;
    public composer!: THREE.EffectComposer;

    // public component!: THREE.Object3D;
    public component!: Branch;

    private componentBoundingBox: THREE.Box3 = new THREE.Box3();

    public person: THREE.Mesh = new THREE.Mesh(new THREE.BoxBufferGeometry(0.1, 0.1, 0.1));

    public openPoseManager!: OpenPoseManager;

    public init() {
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // this.renderer.setClearColor(new THREE.Color("rgb(193, 255, 251)"));

        this.camera = new THREE.PerspectiveCamera(60, 1 / this.aspectRatio, 0.1, 50);
        this.camera.position.y = 1;
        this.camera.position.z = 1;

        this.orbitControls = new THREE.OrbitControls(this.camera);
        this.orbitControls.autoRotate = true;
        this.orbitControls.autoRotateSpeed = 0.6;

        this.openPoseManager = new OpenPoseManager();

        // do this before adding the flowers or anything
        this.initCubeTexture();

        randomizeDna(this.envMap);

        this.initComponent();
        this.scene.add(this.component);

        // // console.log(leaf.skeleton);
        this.initPostprocessing();

        scene.add(this.person);

        // const bhelper = new THREE.Box3Helper(this.componentBoundingBox);
        // scene.add(bhelper);

    }

    public envMap!: THREE.CubeTexture;
    public initCubeTexture() {
        const cubeCamera = new THREE.CubeCamera(1, 100, 1024);
        cubeCamera.position.set(0, 1, 0);
        scene.add(cubeCamera);
        cubeCamera.update(this.renderer, scene);

        this.envMap = cubeCamera.renderTarget.texture as THREE.CubeTexture;
    }

    public initPostprocessing() {
        this.composer = new THREE.EffectComposer(this.renderer);
        this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));

        // this doesn't work too well
        // const bokehPass = new THREE.BokehPass(this.scene, this.camera, {
        //     focus: 1,
        //     aperture: 0.00025,
        //     maxblur: 0.05,
        //     // width: this.canvas.width,
        //     // height: this.canvas.height,
        // });
        // this.composer.addPass(bokehPass);

        // const ssaoPass = new THREE.SSAOPass( this.scene, this.camera, this.canvas.width, this.canvas.height );
        // // ssaoPass.onlyAO = true;
        // ssaoPass.radius = 8;
        // ssaoPass.aoClamp = 0.2;
        // ssaoPass.lumInfluence = 0.6;
        // this.composer.addPass(ssaoPass);

        // this.renderer.setClearColor(new THREE.Color("rgb("))

        // const saoPass = new THREE.SAOPass( this.scene, this.camera, false, true );
        // saoPass.params.saoBias = 2.6;
        // saoPass.params.saoIntensity = 0.30;
        // saoPass.params.saoScale = 6;
        // saoPass.params.saoKernelRadius = 4;
        // saoPass.params.saoMinResolution = 0;
        // saoPass.params.saoBlur = true;
        // saoPass.params.saoBlurRadius = 16;
        // saoPass.params.saoBlurStdDev = 4;
        // saoPass.params.saoBlurDepthCutoff = 0.05;
        // saoPass.params.output = THREE.SAOPass.OUTPUT.Default;
        // this.composer.addPass(saoPass);

        this.composer.passes[this.composer.passes.length - 1].renderToScreen = true;
    }

    public initComponent() {
        const branch = new Branch(12);
        // const helper = new THREE.SkeletonHelper(branch.meshManager.skeleton.bones[0]);
        // scene.add(helper);
        this.component = branch;

        // const flower = Flower.generate();
        // // flower.rotation.z = -Math.PI / 4;
        // this.component = flower;

        // const petal = Petal.generate(dna.petalTemplate);
        // petal.position.y = 0.3;
        // petal.rotation.z = Math.PI / 3;
        // this.component = petal;
        // const skeletonHelper = new THREE.SkeletonHelper(petal.mesh.skeleton.bones[0]);
        // scene.add(skeletonHelper);

        // const leaf = new Leaf(dna.leafTemplate);
        // leaf.position.x = 0;
        // leaf.position.y = 0.2;
        // leaf.position.z = 0;
        // this.component = leaf;
        // const skeletonHelper = new THREE.SkeletonHelper(leaf.lamina.skeleton.bones[0]);
        // scene.add(skeletonHelper);

        // this.component = new THREE.Object3D();
        // for (let x = -5; x <= 5; x++) {
        //     for (let z = -5; z <= 5; z++) {
        //         randomizeDna();
        //         const leaf = new Leaf(dna.leafTemplate);
        //         leaf.position.x = x;
        //         leaf.position.y = 0.2;
        //         leaf.position.z = z;
        //         this.component.add(leaf);
        //         // leaf.scale.set(0.01, 0.01, 0.01);
        //         // leaf.skeleton.bones[0].scale.set(0.01, 0.01, 0.01);
        //         // const helper = new THREE.SkeletonHelper(leaf.skeleton.bones[0]);
        //         // this.scene.add(helper);
        //     }
        // }

        // const flower = Flower.generate();
        // this.component = flower;

    }

    private r1: HTMLDivElement | null = null;
    private r2: HTMLPreElement | null = null;

    public elements = [
        <div style={{ textAlign: "left" }}>
            <div ref={(r) => this.r1 = r} />
            <pre ref={(r) => this.r2 = r} />
        </div>,
    ];

    public animate(ms: number) {
        this.updateComponentAndComputeBoundingBox();
        this.updateCamera();
        this.updatePeoplePositions();
        if (this.r1 != null) {
            this.r1.textContent = `Maturity: ${this.component.computeMaturityAmount().toFixed(3)}\nEstimated time: ${this.component.getEstimatedSecondsToMaturity()}\nCurrent time: ${((this.timeElapsed - this.component.timeBorn) / 1000).toFixed(3)}`;
        }
        this.updateObjectCounts();

        this.orbitControls.update();
        // this.renderer.render(this.scene, this.camera);
        this.composer.render();
    }

    private updatePeoplePositions() {
        const people = this.openPoseManager.getPeople();
        for (const person of people) {
            const [headX, headY] = person.pose_keypoints_2d;
            const worldX = THREE.Math.mapLinear(headX, 0, 640, -1, 1);
            const worldY = THREE.Math.mapLinear(headY, 0, 640, 0, 2);
            this.person.position.x = worldX;
            this.person.position.y = worldY;
        }
    }

    private updateComponentAndComputeBoundingBox() {
        this.componentBoundingBox.min.set(-0.5, 0, -0.5);
        this.componentBoundingBox.max.set(0.5, 0.5, 0.5);
        const pos = new THREE.Vector3();
        this.component.traverse((obj) => {
            if (obj instanceof Component) {
                const newBorn = obj.timeBorn == null;
                if (newBorn) {
                    obj.timeBorn = this.timeElapsed;
                }
                if (obj.updateSelf) {
                    obj.updateSelf(this.timeElapsed);
                }
                if (!newBorn) {
                    // this is a cheaper way of doing obj.getWorldPosition() - the difference is that it
                    // lags by like 1 frame. This is why we only use non-newborns, so that they have
                    // one frame to initialize their scales and positions
                    pos.setFromMatrixPosition(obj.matrixWorld);

                    // the obj.rotation.y is nan sometimes, idk why
                    if (!Number.isNaN(pos.x)) {
                        this.componentBoundingBox.expandByPoint(pos);
                    }
                }
            }
        });
    }

    private updateCamera() {
        const minXZDist = Math.min(this.componentBoundingBox.max.z - this.componentBoundingBox.min.z, this.componentBoundingBox.max.x - this.componentBoundingBox.min.x);

        const targetDist = minXZDist * 0.8;
        const targetY = this.componentBoundingBox.max.y - 0.6;

        const xz = new THREE.Vector2(this.camera.position.x, this.camera.position.z);
        xz.setLength(targetDist);
        this.camera.position.x = xz.x;
        this.camera.position.z = xz.y;

        this.orbitControls.target.set(0, targetY, 0);
        this.camera.position.y = targetY + 1;

        console.log(targetY);
    }

    private updateObjectCounts() {
        const counts = new Map<string, number>();
        scene.traverse((obj) => {
            const name = obj.constructor.name;
            counts.set(name, (counts.get(name) || 0) + 1);
        });
        if (this.r2 != null) {
            const entries = Array.from(counts.entries());
            entries.sort(([_, countA], [__, countB]) => countB - countA);
            this.r2.textContent = entries.map( ([name, count]) => `${name}: ${count}` ).join("\n");
        }
    }

    public resize(width: number, height: number) {
        this.camera.aspect = 1 / this.aspectRatio;
        this.camera.updateProjectionMatrix();
    }
}

export default Bloom;
