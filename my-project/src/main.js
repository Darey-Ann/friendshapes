import * as THREE from 'three';
import { GUI } from 'lil-gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';

console.log("Vite is running!");

let scene, camera, renderer, mesh, controls;
let params = {
    shape: 'sphere', 
    roundness: 2, 
    stretch: 2, 
    size: 10, 
    wireframe: false, 
    randomness: 0.5, 
    spikiness: 0,    
    asymmetry: 0
};

const shapePresets = {
    sphere: { roundness: 2, stretch: 2 },
    cube: { roundness: 10, stretch: 10 },
    cylinder: { roundness: 2, stretch: 10 },
    cone: { roundness: 1, stretch: 0.2 },
    torus: { roundness: 1, stretch: 0.8 },
    pyramid: { roundness: 1.5, stretch: 0.5 }
};

init();
animate();

function init() {
    // Scene & Camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 15, 50);
    
    // Renderer with White Background
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xffffff); // White background
    document.body.appendChild(renderer.domElement);

    // Orbit Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    
    // Add Grid Helper (Light Grey Grid)
    const gridHelper = new THREE.GridHelper(50, 50, 0xcccccc, 0xeeeeee);
    scene.add(gridHelper);
    
    // Add Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(3, 3, 3).normalize();
    scene.add(light);

    // Create Superquadric
    updateSuperquadric();
    
    // GUI Controls
    const gui = new GUI();
    gui.add(params, 'shape', Object.keys(shapePresets)).onChange(updateShape);
    gui.add(params, 'roundness', 1, 10, 1).onChange(updateSuperquadric);
    gui.add(params, 'stretch', 1, 10, 1).onChange(updateSuperquadric);
    gui.add(params, 'spikiness', 0, 2, 0.1).onChange(updateSuperquadric);
    gui.add(params, 'asymmetry', 0, 1, 0.1).onChange(updateSuperquadric);

    gui.add(params, 'wireframe').onChange(updateSuperquadric);
    gui.add({ exportSTL }, 'exportSTL').name('Export STL');
    gui.add({ exportSettings }, 'exportSettings').name('Save Settings');

    // Window Resize Handling
    window.addEventListener('resize', onWindowResize);

    // Add Title & Subtitle
    addTitleText();
}

function addTitleText() {
    const title = document.createElement('div');
    title.innerHTML = `
        <h1 style="text-align: center; font-size: 2rem; font-family: Inter, sans-serif; color: #333; margin-bottom: 0;">Friend Shapes</h1>
        <p style="text-align: center; font-size: 1.2rem; font-family: Inter, sans-serif; color: #666;">Create a shape that feels safe and trustworthy to you</p>
    `;
    title.style.position = 'absolute';
    title.style.top = '20px';
    title.style.left = '50%';
    title.style.transform = 'translateX(-50%)';
    title.style.pointerEvents = 'none';
    document.body.appendChild(title);
}

function updateShape() {
    const preset = shapePresets[params.shape];
    params.roundness = preset.roundness;
    params.stretch = preset.stretch;
    updateSuperquadric();
}

function generateSuperquadricGeometry(roundness, stretch, size, randomness, spikiness) {
    const segments = 50;
    const positions = [];
    const indices = [];
    
    for (let i = 0; i <= segments; i++) {
        let theta = (i / segments) * Math.PI - Math.PI / 2;
        for (let j = 0; j <= segments; j++) {
            let phi = (j / segments) * 2 * Math.PI;
            
            // roundness = epsilon1, stretch = epsilon2
            let x = size * Math.sign(Math.cos(theta)) * Math.pow(Math.abs(Math.cos(theta)), 2 / stretch) * Math.sign(Math.cos(phi)) * Math.pow(Math.abs(Math.cos(phi)), 2 / roundness);
            let y = size * Math.sign(Math.cos(theta)) * Math.pow(Math.abs(Math.cos(theta)), 2 / stretch) * Math.sign(Math.sin(phi)) * Math.pow(Math.abs(Math.sin(phi)), 2 / roundness);
            let z = size * Math.sign(Math.sin(theta)) * Math.pow(Math.abs(Math.sin(theta)), 2 / stretch);

            // Apply randomness and spikiness
            let noise = (Math.random() - 0.5) * randomness;
            let spikeFactor = 1 + spikiness * noise;
            x *= spikeFactor;
            y *= spikeFactor;
            z *= spikeFactor;

            // Twist proportional to height
            let twist = params.asymmetry * Math.PI * (z / size); 
            let newX = x * Math.cos(twist) - y * Math.sin(twist);
            let newY = x * Math.sin(twist) + y * Math.cos(twist);
            x = newX;
            y = newY;
            

            positions.push(x, y, z);
        }
    }
    
    for (let i = 0; i < segments; i++) {
        for (let j = 0; j < segments; j++) { 
            let a = i * (segments + 1) + j;
            let b = a + 1;
            let c = (i + 1) * (segments + 1) + j;
            let d = c + 1;
    
            if (j === segments - 1) { 
                b -= segments;  
                d -= segments;
            }
    
            indices.push(a, b, c);
            indices.push(b, d, c);
        }
    }
  
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
}

function updateSuperquadric() {
  if (mesh) scene.remove(mesh);
  const geometry = generateSuperquadricGeometry(params.roundness, params.stretch, params.size, params.randomness, params.spikiness);
  const material = new THREE.MeshStandardMaterial({ color: 0xfcc2ec, wireframe: params.wireframe });
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = params.size; // Move it up by its size
  scene.add(mesh);
}

function exportSTL() {
    const exporter = new STLExporter();
    const stlString = exporter.parse(mesh);
    const blob = new Blob([stlString], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'superquadric.stl';
    link.click();
}

function exportSettings() {
  const data = JSON.stringify(params, null, 2);
  const blob = new Blob([data], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'shape_parameters.txt';
  link.click();
}



function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
