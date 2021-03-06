import * as THREE from "three";

// HACK monkeypatch the old features that requires THREE on the global namespace
(window as any).THREE = THREE;
// tslint:disable

import "three/examples/js/postprocessing/EffectComposer";

import "three/examples/js/controls/OrbitControls";

import "three/examples/js/libs/stats.min";
// import * as dat from "three/examples/js/libs/dat.gui.min";
// (window as any).dat = dat;

import "three/examples/js/postprocessing/BokehPass";
import "three/examples/js/postprocessing/MaskPass";
import "three/examples/js/postprocessing/RenderPass";
import "three/examples/js/postprocessing/ShaderPass";
import "three/examples/js/shaders/BokehShader";
import "three/examples/js/shaders/CopyShader";
import "three/examples/js/shaders/DotScreenShader";
