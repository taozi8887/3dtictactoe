import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffdcd9);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Enable shadows
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

// Enable damping for smoother controls
controls.enablePan = false;
controls.enableZoom = false; 
controls.enableDamping = true;
controls.minPolarAngle = 0.8;
controls.maxPolarAngle = 2.4;
controls.dampingFactor = 0.07;
controls.rotateSpeed = 0.4;
controls.zoomSpeed = .9;

document.body.style.margin = '0';
document.body.style.overflow = 'hidden';

// Lighting setup
const light = new THREE.DirectionalLight(0xffdc14, 4); // Reduce light intensity to avoid overexposure
light.position.set(5, 10, 5);
light.castShadow = true; // Enable shadow casting
scene.add(light);

// Ambient light provides a fill to make the scene less dark
const ambientLight = new THREE.AmbientLight(0xffffff, 3); // Brighter ambient light to fill in shadows
scene.add(ambientLight);

// Create the grid for 3D Tic Tac Toe
const gridSize = 4;
const cellSize = 4;
const gridGroup = new THREE.Group();
const cells = {}; // Store grid cells for state tracking


// Find the center of the grid and adjust grid positioning
const centerX = Math.floor(gridSize / 2);
const centerY = Math.floor(gridSize / 2);
const centerZ = Math.floor(gridSize / 2);

// Adjust the grid position to center it around the middle cube
for (let x = 0; x < gridSize; x++) {
  for (let y = 0; y < gridSize; y++) {
    for (let z = 0; z < gridSize; z++) {
      const geometry = new THREE.BoxGeometry(1.3, 1.3, 1.3);
      const material = new THREE.MeshStandardMaterial({
        color: 0xffcd59, 
        metalness: 0.1, 
        roughness: 0,
      });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(
        (x - centerX) * cellSize, // Center the grid along the X axis
        (y - centerY) * cellSize, // Center the grid along the Y axis
        (z - centerZ) * cellSize  // Center the grid along the Z axis
      );
      cube.castShadow = true; 
      cube.receiveShadow = true;
      gridGroup.add(cube);

      cells[`${x}-${y}-${z}`] = { mesh: cube, state: null }; // Track cell state
    }
  }
}
scene.add(gridGroup);

// Add ground plane to receive shadows
const groundGeometry = new THREE.PlaneGeometry(20, 20);
const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.5;
ground.receiveShadow = true;

// Camera setup
camera.position.set(10,10,10);
controls.update();

// Create a flat plane for the ground
const planeGeometry = new THREE.PlaneGeometry(500, 500); // You can adjust the width and height
const planeMaterial = new THREE.MeshStandardMaterial({
  color: 0x1e3f94,  // Set a ground color (gray)
  roughness: 0,   // You can adjust the roughness if you'd like
  metalness: 0.1      // Set metalness to 0 to keep the ground looking natural
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2; // Rotate the plane to be flat (horizontal)
plane.position.y = -100; // Position it slightly below the cubes so it is visible as the ground
scene.add(plane);

// Add player indicator scene
const indicatorScene = new THREE.Scene();
indicatorScene.background = null;
const indicatorCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
indicatorCamera.position.z = 2;

// Create the rotating cube for the player indicator
const indicatorGeometry = new THREE.BoxGeometry(1, 1, 1);
let indicatorMaterial = new THREE.MeshStandardMaterial({ 
  color: 0xff9696, // Start with red for player X
  metalness: 0.5,
  roughness: 0.2
});
const indicatorCube = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
indicatorScene.add(indicatorCube);

const light2 = new THREE.DirectionalLight(0xffdc14, 4); // Reduce light intensity to avoid overexposure
light2.position.set(5, 10, 5);
light2.castShadow = true; // Enable shadow casting
indicatorScene.add(light2);

// Lighting for the indicator scene
const indicatorLight = new THREE.AmbientLight(0xffffff, 5);
indicatorScene.add(indicatorLight);

// Function to update the indicator's color based on the current player
function updateIndicatorColor(player) {
  indicatorMaterial.color.set(player === 'X' ? 0xff9696 : 0xa8cfff); // Red for X, Blue for O
}

// Add player turn tracking
let currentPlayer = 'X'; // Start with player X

function togglePlayer() {
  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  updateIndicatorColor(currentPlayer);
}

function renderIndicator() {
  const indicatorSize = Math.min(window.innerWidth, window.innerHeight) * 0.15; // Cube size relative to screen
  renderer.setViewport(
    10, // X position (padding from left)
    window.innerHeight - indicatorSize - 7, // Y position (padding from top)
    indicatorSize, // Width
    indicatorSize // Height
  );
  renderer.setScissor(
    10, // Match the viewport
    window.innerHeight - indicatorSize - 7,
    indicatorSize,
    indicatorSize
  );
  renderer.setScissorTest(true); // Enable scissor test to prevent rendering outside the viewport
  renderer.render(indicatorScene, indicatorCamera);
  renderer.setScissorTest(false); // Disable scissor test after rendering the indicator
}

// Render loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  // Rotate the indicator cube
  indicatorCube.rotation.x += 0.01;
  indicatorCube.rotation.y += 0.01;

  renderer.setViewport(0, 0, window.innerWidth, window.innerHeight); // Reset viewport
  renderer.setScissor(0, 0, window.innerWidth, window.innerHeight); // Reset scissor area
  renderer.setScissorTest(false); // Ensure scissor test is disabled for main rendering
  renderer.render(scene, camera);

  // Render the indicator cube
  renderIndicator();
}
animate();


// Communicate with backend
async function sendMoveToBackend(x, y, z) {
  const response = await fetch('/move', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ x, y, z }),
  });
  const result = await response.json();
  if (result.success) {
    if (result.winner) {
      console.log(`Player ${result.winner} wins!`);
      updateCell(x, y, z, result.winner);
      document.getElementById('win').innerText = result.winner;
      document.getElementsByClassName('overlay')[0].style.visibility = 'visible';
      
    } else {
      updateCell(x, y, z, result.player);
      togglePlayer();
    }
  } else {
    
  }
}

// Update the grid cell with the player's move
function updateCell(x, y, z, player) {
  const cellKey = `${x}-${y}-${z}`;
  if (cells[cellKey] && !cells[cellKey].state) {
    cells[cellKey].state = player;
    const material = new THREE.MeshStandardMaterial({ color: player === 'X' ? 0xff9696 : 0xa8cfff, metalness: 0.1, roughness: 0 });
    cells[cellKey].mesh.material = material;
  }
}

// Detect clicks on the grid
renderer.domElement.addEventListener('click', (event) => {
  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(gridGroup.children);
  if (intersects.length > 0) {
    const intersected = intersects[0].object;
    
    // Adjust the coordinates based on the grid's offset
    const x = Math.round((intersected.position.x + centerX * cellSize) / cellSize);
    const y = Math.round((intersected.position.y + centerY * cellSize) / cellSize);
    const z = Math.round((intersected.position.z + centerZ * cellSize) / cellSize);

    sendMoveToBackend(x, y, z);
  }
});

// Reset the game
function resetGame() {
  for (let key in cells) {
    cells[key].state = null;
    // Reset the material to the original "neutral" state
    const originalMaterial = new THREE.MeshStandardMaterial({
      color: 0xffcd59, // Light color for unoccupied cells
      metalness: 0.1, 
      roughness: 0, // Default roughness for less shiny appearance
      wireframe: false, // No wireframe on reset
    });
    cells[key].mesh.material = originalMaterial;
  }
  // Make a request to reset the backend state
  fetch('/reset', { // Update URL based on your backend
    method: 'POST', // Using POST for reset action
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({}) // Empty object since no parameters are required for a reset
  })
  .then(response => response.json())
  .then(data => {
    console.log('Game reset on backend:', data); // Confirm reset on backend
  })
  .catch(error => {
    console.error('Error resetting game on backend:', error);
  });
}

window.onload = function() {
  resetGame()
};