import * as THREE from "./node_modules/three/build/three.module.min.js";
//import * as THREE from 'three';
import { GUI } from "./node_modules/lil-gui/dist/lil-gui.esm.js";
//import { GUI } from 'lil-gui';
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
    asymmetry: 0,
    bulge: 0,
    indentations: 0,
    color: '#fcc2ec'  // Default color
};

const shapePresets = {
    sphere: { roundness: 2, stretch: 2, bulge: 0, randomness: 0, spikiness: 0, asymmetry: 0 },
    cube: { roundness: 10, stretch: 10, bulge: 0, randomness: 0, spikiness: 0, asymmetry: 0 },
    cylinder: { roundness: 2, stretch: 10, bulge: 0, randomness: 0, spikiness: 0, asymmetry: 0 },
    octahedron: { roundness: 1, stretch: 1, bulge: 0, randomness: 0, spikiness: 0, asymmetry: 0 },
    //torus: { roundness: 1, stretch: 0.8 },
    //pyramid: { roundness: 1.5, stretch: 0.5 }
};

init();
animate();

function init() {
    // Scene & Camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(20, 20, 50);
    //scene.position.y = -5;  // Moves everything in the scene down
    


    
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
    gui.add(params, 'roundness', 1, 10, 0.1).onChange(updateSuperquadric);
    gui.add(params, 'stretch', 1, 10, 1).onChange(updateSuperquadric);
    gui.add(params, 'spikiness', 0, 2, 0.1).onChange(updateSuperquadric);
    gui.add(params, 'asymmetry', 0, 1, 0.1).onChange(updateSuperquadric);
    gui.add(params, 'bulge', 0, 10, 0.1).onChange(updateSuperquadric);
    //gui.add(params, 'indentations', 0, 2, 0.1).onChange(updateSuperquadric);

    
    
    //gui.add({ exportSettings }, 'exportSettings').name('Save Settings'); // called in exportSTL
    
    gui.addColor(params, 'color').onChange(updateColor);

    gui.add(params, 'wireframe').onChange(updateSuperquadric);
    gui.add({ exportSTL }, 'exportSTL').name('Export Friendshape');

    // Window Resize Handling
    window.addEventListener('resize', onWindowResize);

    // Add Title & Subtitle
    addTitleText();
}

function addTitleText() {
    const title = document.createElement('div');
    title.innerHTML = `
        <h1 style="text-align: left; font-size: 2rem; font-family: Inter, sans-serif; color: #333; margin-bottom: 0;">Friend Shapes</h1>
        <p style="text-align: left; font-size: 1.0rem; font-family: Inter, sans-serif; color: #666;margin-top: 0; margin-bottom: 0;">Use the sliders to create a safe and trustworthy shape</p>
        <div id="colorPicker" style="display: flex; justify-content: left; gap: 10px; margin-top: 20px;"></div>
    `; 
    title.style.position = 'absolute';
    title.style.top = '20px';
    title.style.left = '20%';
    title.style.transform = 'translateX(-50%)';
    title.style.pointerEvents = 'none';
    document.body.appendChild(title);

    //addColorPicker();
}

function updateShape() {
    const preset = shapePresets[params.shape];
    params.roundness = preset.roundness;
    params.stretch = preset.stretch;
    params.bulge = preset.bulge; 
    params.spikiness = preset.bulge; 
    params.asymmetry = preset.bulge; 
    
    updateSuperquadric();
}

function updateColor() {
    mesh.material.color.set(params.color);
}


function addColorPicker() {
    const colors = ['#FFFFFF', '#A0A0A0', '#A7C7E7', '#F4A7B9', '#B4E197', '#FFE599'];
    const colorPicker = document.getElementById('colorPicker');
    
    colorPicker.style.marginTop = '10px'; // Move circles down

    /*
    colors.forEach(color => {
        let colorCircle = document.createElement('div');
        colorCircle.style.width = '30px';
        colorCircle.style.height = '30px';
        colorCircle.style.borderRadius = '50%';
        colorCircle.style.backgroundColor = color;
        colorCircle.style.cursor = 'pointer';
        colorCircle.style.border = '2px solid #ccc';

        colorCircle.addEventListener('click', () => {
            params.color = color;
            if (mesh) mesh.material.color.set(color); // Fix: Update the correct mesh
        });

        colorPicker.appendChild(colorCircle);
    });
    */
}



function generateSuperquadricGeometry(roundness, stretch, size, randomness, spikiness) {
    const segments = 50;
    const positions = [];
    const indices = [];
    
    for (let i = 0; i <= segments; i++) {
        let theta = (i / segments) * Math.PI - Math.PI / 2;
        for (let j = 0; j <= segments; j++) {
            let phi = (j / segments) * 2 * Math.PI;
            
            // SUPERQUADRIC FUNCTION
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
            
            // Bulge and Indentation
            let bulgeFactor = 1 + (params.bulge * 0.2) * Math.sin(3 * theta) * Math.cos(3 * phi);
            let indentationFactor = 1 - (params.indentations * 0.2) * Math.sin(4 * theta) * Math.cos(4 * phi);

            
            x *= bulgeFactor * indentationFactor;
            y *= bulgeFactor * indentationFactor;
            z *= bulgeFactor * indentationFactor;
            

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
  const material = new THREE.MeshStandardMaterial({ color: params.color, wireframe: params.wireframe });
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = params.size + 1; // Move it up by its size
  scene.add(mesh);
}

function exportSTL() {
    exportSettings(); // Save slider values before exporting STL

    const exporter = new STLExporter();
    const stlString = exporter.parse(mesh);
    const blob = new Blob([stlString], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'friendshape.stl';
    link.click();
}

function exportSettings() {
  const data = JSON.stringify(params, null, 2);
  const blob = new Blob([data], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'friendshape_parameters.txt';
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
