// ==========================================
// 1. HERO PARALLAX & 3D MOUSE TILT
// ==========================================
const heroContainer = document.querySelector(".hero-container");
const heroContent = document.getElementById("heroContent");
const heroBg = document.getElementById("heroBg");

if (heroContainer && heroContent) {
  heroContainer.addEventListener("mousemove", (e) => {
    const rect = heroContainer.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    heroContent.style.transform = `perspective(1000px) rotateX(${y * -10}deg) rotateY(${x * 10}deg) translateZ(20px)`;
  });

  heroContainer.addEventListener("mouseleave", () => {
    heroContent.style.transform =
      "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
  });
}

window.addEventListener("scroll", () => {
  const scroll = window.scrollY;
  if (heroBg) {
    heroBg.style.transform = `scale(1.18) translate3d(0, ${scroll * 0.35}px, -60px)`;
  }
});

// ==========================================
// 2. HERO PARTICLE ATMOSPHERE CANVAS
// ==========================================
(function initHeroParticles() {
  const canvas = document.getElementById("heroParticlesCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let width = (canvas.width = canvas.offsetWidth);
  let height = (canvas.height = canvas.offsetHeight);

  window.addEventListener("resize", () => {
    if (!canvas) return;
    width = canvas.width = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;
  });

  const particles = Array.from({ length: 45 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 3 + 1,
    speedY: -(Math.random() * 0.4 + 0.1),
    speedX: (Math.random() - 0.5) * 0.2,
    opacity: Math.random() * 0.6 + 0.2,
  }));

  function render() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach((p) => {
      p.y += p.speedY;
      p.x += p.speedX;
      if (p.y < 0) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(243, 173, 56, ${p.opacity})`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#f3ad38";
      ctx.fill();
    });
    requestAnimationFrame(render);
  }
  render();
})();

// ==========================================
// 3. TILT & SPECULAR GLARE CARDS
// ==========================================
const cards = document.querySelectorAll(".tilt-card");
cards.forEach((card) => {
  const glare = card.querySelector(".card-glare");
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
    if (glare) {
      glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 70%)`;
    }
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform =
      "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
  });
});

// ==========================================
// 4. THREE.JS 3D TENT VISUALIZER ENGINE
// ==========================================
let scene, camera, renderer, controls;
let tentGroup, furnitureGroup, environmentGroup, lightGroup;
let dirLight, ambientLight;
let stringLights = [];

let currentTentStyle = "high-peak";
let currentGuests = 60;
let currentLighting = "sunset";

function init3DVisualizer() {
  const container = document.getElementById("webgl-canvas");
  if (!container) return;

  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a1418);
  scene.fog = new THREE.FogExp2(0x0a1418, 0.02);

  // Camera
  camera = new THREE.PerspectiveCamera(
    45,
    container.offsetWidth / container.offsetHeight,
    0.1,
    1000,
  );
  camera.position.set(16, 12, 22);

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: container,
    antialias: true,
  });
  renderer.setSize(container.offsetWidth, container.offsetHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2 - 0.02; // don't go under floor
  controls.minDistance = 6;
  controls.maxDistance = 45;
  controls.target.set(0, 2.5, 0);

  // Parent Groups
  environmentGroup = new THREE.Group();
  tentGroup = new THREE.Group();
  furnitureGroup = new THREE.Group();
  lightGroup = new THREE.Group();

  scene.add(environmentGroup);
  scene.add(tentGroup);
  scene.add(furnitureGroup);
  scene.add(lightGroup);

  // Build Base World
  buildEnvironment();
  buildLights();

  // Build Initial Tent & Furniture
  rebuildSceneObjects();

  // Animation Loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();

    // Subtle string light flicker / twinkle in sunset mode
    if (currentLighting === "sunset" && stringLights.length > 0) {
      const time = Date.now() * 0.003;
      stringLights.forEach((light, idx) => {
        light.intensity = 0.8 + Math.sin(time + idx) * 0.3;
      });
    }

    renderer.render(scene, camera);
  }
  animate();

  // Window Resize Listener
  window.addEventListener("resize", () => {
    if (!container) return;
    const w = container.offsetWidth;
    const h = container.offsetHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}

// --- ENVIRONMENT (Ground plane, Palm Trees) ---
function buildEnvironment() {
  // Lush Hawaiian Lawn Plane
  const groundGeo = new THREE.PlaneGeometry(80, 80);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x244d32,
    roughness: 0.85,
    metalness: 0.1,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  environmentGroup.add(ground);

  // Grid lines helper (subtle ground floor design)
  const grid = new THREE.GridHelper(80, 40, 0x2f6979, 0x19323a);
  grid.position.y = 0.01;
  environmentGroup.add(grid);

  // Add Decorative Palm Trees around perimeter
  const palmPositions = [
    [-18, -14],
    [18, -16],
    [-16, 16],
    [20, 14],
  ];
  palmPositions.forEach(([px, pz]) => {
    const palm = createPalmTree();
    palm.position.set(px, 0, pz);
    environmentGroup.add(palm);
  });
}

function createPalmTree() {
  const palmGroup = new THREE.Group();

  // Trunk
  const trunkGeo = new THREE.CylinderGeometry(0.3, 0.45, 9, 8);
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x5a4228,
    roughness: 0.9,
  });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 4.5;
  trunk.rotation.z = (Math.random() - 0.5) * 0.15;
  trunk.castShadow = true;
  palmGroup.add(trunk);

  // Leaves (Fronds)
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x1e6936,
    side: THREE.DoubleSide,
    roughness: 0.6,
  });

  for (let i = 0; i < 7; i++) {
    const leafGeo = new THREE.ConeGeometry(1.2, 5, 4);
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(0, 8.8, 0);
    leaf.rotation.x = Math.PI / 2.3;
    leaf.rotation.y = (i * Math.PI) / 3.5;
    leaf.scale.set(1, 0.1, 1);
    leaf.castShadow = true;
    palmGroup.add(leaf);
  }

  return palmGroup;
}

// --- LIGHTS & SKY ATMOSPHERE ---
function buildLights() {
  ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  lightGroup.add(ambientLight);

  dirLight = new THREE.DirectionalLight(0xfff3d1, 1.2);
  dirLight.position.set(20, 30, 15);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 80;
  dirLight.shadow.camera.left = -25;
  dirLight.shadow.camera.right = 25;
  dirLight.shadow.camera.top = 25;
  dirLight.shadow.camera.bottom = -25;
  lightGroup.add(dirLight);

  updateLightingState();
}

function updateLightingState() {
  if (!scene) return;
  if (currentLighting === "sunset") {
    scene.background = new THREE.Color(0x0f1a20);
    scene.fog.color.setHex(0x0f1a20);
    ambientLight.color.setHex(0xd48759);
    ambientLight.intensity = 0.45;

    dirLight.color.setHex(0xf3ad38);
    dirLight.intensity = 0.9;
    dirLight.position.set(-25, 12, -15);
  } else {
    // Daylight
    scene.background = new THREE.Color(0x739bb0);
    scene.fog.color.setHex(0x739bb0);
    ambientLight.color.setHex(0xffffff);
    ambientLight.intensity = 0.7;

    dirLight.color.setHex(0xfffaed);
    dirLight.intensity = 1.3;
    dirLight.position.set(20, 35, 20);
  }
}

// --- REBUILD TENT & FURNITURE ---
function rebuildSceneObjects() {
  // Clear previous
  while (tentGroup.children.length > 0) {
    tentGroup.remove(tentGroup.children[0]);
  }
  while (furnitureGroup.children.length > 0) {
    furnitureGroup.remove(furnitureGroup.children[0]);
  }
  stringLights = [];

  // 1. Build Tent Mesh
  const tentMat = new THREE.MeshStandardMaterial({
    color: 0xfbf9f5,
    roughness: 0.4,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  const poleMat = new THREE.MeshStandardMaterial({
    color: 0x99aab0,
    metalness: 0.8,
    roughness: 0.2,
  });

  if (currentTentStyle === "high-peak") {
    // Large High Peak Tent (28x28 scale)
    const width = 12;
    const poleH = 4.0;
    const peakH = 7.5;

    // Roof Canopy Peak (4 facets high-peak)
    const canopyGeo = new THREE.ConeGeometry(width * 0.75, peakH - poleH, 4);
    const canopy = new THREE.Mesh(canopyGeo, tentMat);
    canopy.position.y = poleH + (peakH - poleH) / 2;
    canopy.rotation.y = Math.PI / 4;
    canopy.castShadow = true;
    canopy.receiveShadow = true;
    tentGroup.add(canopy);

    // Valance skirt
    const skirtGeo = new THREE.BoxGeometry(width, 0.4, width);
    const skirt = new THREE.Mesh(skirtGeo, tentMat);
    skirt.position.y = poleH;
    tentGroup.add(skirt);

    // 4 Corner Poles
    const corners = [
      [-width / 2, -width / 2],
      [width / 2, -width / 2],
      [-width / 2, width / 2],
      [width / 2, width / 2],
    ];
    corners.forEach(([cx, cz]) => {
      const poleGeo = new THREE.CylinderGeometry(0.12, 0.12, poleH, 12);
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(cx, poleH / 2, cz);
      pole.castShadow = true;
      tentGroup.add(pole);
    });

    // Center Mast Pole
    const centerPoleGeo = new THREE.CylinderGeometry(0.15, 0.15, peakH, 12);
    const centerPole = new THREE.Mesh(centerPoleGeo, poleMat);
    centerPole.position.set(0, peakH / 2, 0);
    centerPole.castShadow = true;
    tentGroup.add(centerPole);

    // Warm Glowing String Lights under canopy
    corners.forEach(([cx, cz], i) => {
      const light = new THREE.PointLight(0xffcb6b, 1.2, 10);
      light.position.set(cx * 0.7, poleH + 0.5, cz * 0.7);
      tentGroup.add(light);
      stringLights.push(light);

      // Light bulb mesh
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffe29a }),
      );
      bulb.position.copy(light.position);
      tentGroup.add(bulb);
    });
  } else if (currentTentStyle === "frame-canopy") {
    // Frame Canopy (Gable roof)
    const width = 10;
    const length = 12;
    const poleH = 3.5;

    const roofGeo = new THREE.ConeGeometry(width * 0.7, 3, 4);
    const roof = new THREE.Mesh(roofGeo, tentMat);
    roof.position.y = poleH + 1.5;
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1, 1, 1.2);
    roof.castShadow = true;
    tentGroup.add(roof);

    // 6 Support Legs
    const legs = [
      [-width / 2, -length / 2],
      [width / 2, -length / 2],
      [-width / 2, 0],
      [width / 2, 0],
      [-width / 2, length / 2],
      [width / 2, length / 2],
    ];
    legs.forEach(([lx, lz]) => {
      const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, poleH, 12);
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(lx, poleH / 2, lz);
      pole.castShadow = true;
      tentGroup.add(pole);
    });
  } else {
    // Beach Pop-Up 10x10
    const size = 5;
    const poleH = 3.0;

    const roofGeo = new THREE.ConeGeometry(size * 0.7, 1.8, 4);
    const roof = new THREE.Mesh(roofGeo, tentMat);
    roof.position.y = poleH + 0.9;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    tentGroup.add(roof);

    const legs = [
      [-size / 2, -size / 2],
      [size / 2, -size / 2],
      [-size / 2, size / 2],
      [size / 2, size / 2],
    ];
    legs.forEach(([lx, lz]) => {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, poleH, 8),
        poleMat,
      );
      pole.position.set(lx, poleH / 2, lz);
      pole.castShadow = true;
      tentGroup.add(pole);
    });
  }

  // 2. Build Tables & Seating Layout based on guest count
  buildSeatingLayout();
}

function buildSeatingLayout() {
  const tableMat = new THREE.MeshStandardMaterial({
    color: 0xdfd8c8,
    roughness: 0.5,
  });
  const chairMat = new THREE.MeshStandardMaterial({
    color: 0x2f6979,
    roughness: 0.6,
  });

  let tableCount = 4;
  if (currentGuests >= 100) tableCount = 10;
  else if (currentGuests >= 60) tableCount = 7;
  else tableCount = 4;

  // Arrange round banquet tables inside tent floor
  const rows = Math.ceil(Math.sqrt(tableCount));
  const cols = Math.ceil(tableCount / rows);
  const spacingX = 3.2;
  const spacingZ = 3.4;

  let placed = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (placed >= tableCount) break;

      const tx = (c - (cols - 1) / 2) * spacingX;
      const tz = (r - (rows - 1) / 2) * spacingZ;

      // Round Table Top
      const tableGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.1, 24);
      const table = new THREE.Mesh(tableGeo, tableMat);
      table.position.set(tx, 1.1, tz);
      table.castShadow = true;
      table.receiveShadow = true;
      furnitureGroup.add(table);

      // Table Base
      const baseGeo = new THREE.CylinderGeometry(0.12, 0.3, 1.1, 12);
      const base = new THREE.Mesh(baseGeo, tableMat);
      base.position.set(tx, 0.55, tz);
      base.castShadow = true;
      furnitureGroup.add(base);

      // 6 Chairs per Table
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const cx = tx + Math.cos(angle) * 1.6;
        const cz = tz + Math.sin(angle) * 1.6;

        const chairSeat = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.35, 0.08, 12),
          chairMat,
        );
        chairSeat.position.set(cx, 0.6, cz);
        chairSeat.castShadow = true;
        furnitureGroup.add(chairSeat);

        const chairLeg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8),
          chairMat,
        );
        chairLeg.position.set(cx, 0.3, cz);
        furnitureGroup.add(chairLeg);
      }

      placed++;
    }
  }
}

// ==========================================
// 5. 3D VISUALIZER USER INTERACTION API
// ==========================================
function setTentStyle(style) {
  currentTentStyle = style;
  document
    .querySelectorAll('[id^="btnTent"]')
    .forEach((b) => b.classList.remove("active"));
  if (style === "high-peak") {
    document.getElementById("btnTentHighPeak").classList.add("active");
    document.getElementById("statTentName").innerText = "Waimea Grand Canyon";
  } else if (style === "frame-canopy") {
    document.getElementById("btnTentFrame").classList.add("active");
    document.getElementById("statTentName").innerText = "Poipu Frame Canopy";
  } else {
    document.getElementById("btnTentPopup").classList.add("active");
    document.getElementById("statTentName").innerText = "Lihue Pop-Up Canopy";
  }
  rebuildSceneObjects();
}

function setGuestLayout(count) {
  currentGuests = count;
  document
    .querySelectorAll('[id^="btnLayout"]')
    .forEach((b) => b.classList.remove("active"));
  document.getElementById(`btnLayout${count}`).classList.add("active");

  if (count >= 100) {
    document.getElementById("statCapacity").innerText = "90 - 110 Guests";
    document.getElementById("statTables").innerText = "10 Tables / 60 Chairs";
  } else if (count >= 60) {
    document.getElementById("statCapacity").innerText = "50 - 70 Guests";
    document.getElementById("statTables").innerText = "7 Tables / 42 Chairs";
  } else {
    document.getElementById("statCapacity").innerText = "25 - 35 Guests";
    document.getElementById("statTables").innerText = "4 Tables / 24 Chairs";
  }
  rebuildSceneObjects();
}

function setLighting(mode) {
  currentLighting = mode;
  document
    .getElementById("btnTimeSunset")
    .classList.toggle("active", mode === "sunset");
  document
    .getElementById("btnTimeDay")
    .classList.toggle("active", mode === "day");
  updateLightingState();
}

function setCameraAngle(preset) {
  if (!camera || !controls) return;
  if (preset === "overview") {
    camera.position.set(16, 12, 22);
    controls.target.set(0, 2.5, 0);
  } else if (preset === "inside") {
    camera.position.set(0, 2.2, 6);
    controls.target.set(0, 2.0, -2);
  } else if (preset === "topdown") {
    camera.position.set(0, 26, 0.1);
    controls.target.set(0, 0, 0);
  }
  controls.update();
}

function loadPresetIn3D(preset) {
  const visualizerSec = document.getElementById("3d-builder");
  if (visualizerSec) visualizerSec.scrollIntoView({ behavior: "smooth" });

  if (preset === "high-peak") {
    setTentStyle("high-peak");
    setGuestLayout(60);
  } else if (preset === "frame-canopy") {
    setTentStyle("frame-canopy");
    setGuestLayout(60);
  } else if (preset === "popup") {
    setTentStyle("popup");
    setGuestLayout(30);
  } else if (preset === "package-30") {
    setTentStyle("high-peak");
    setGuestLayout(30);
  } else if (preset === "package-60") {
    setTentStyle("high-peak");
    setGuestLayout(60);
  }
}

function quoteCurrent3DSetup() {
  const itemSelect = document.getElementById("itemSelect");
  const notesArea = document.getElementById("eventNotes");

  let tentTitle = "Custom 3D Configured Setup";
  if (currentTentStyle === "high-peak") tentTitle = "The Waimea Grand Canyon";
  else if (currentTentStyle === "frame-canopy")
    tentTitle = "The Poipu Backyard";
  else if (currentTentStyle === "popup") tentTitle = "The Lihue Pop-Up";

  if (itemSelect) {
    // Select closest matching option or custom
    const matchingOption = Array.from(itemSelect.options).find((o) =>
      o.value.includes(tentTitle),
    );
    if (matchingOption) itemSelect.value = matchingOption.value;
    else itemSelect.value = "Custom 3D Configured Setup";
  }

  if (notesArea) {
    notesArea.value = `[3D Builder Configuration]\nTent Model: ${document.getElementById("statTentName").innerText}\nGuest Count: ${currentGuests} Guests\nLayout: ${document.getElementById("statTables").innerText}\nAtmosphere Lighting: ${currentLighting.toUpperCase()}`;
  }

  openQuoteModal();
}

// Initialize 3D Visualizer when DOM ready
document.addEventListener("DOMContentLoaded", () => {
  init3DVisualizer();
});

// ==========================================
// 6. MODAL & WEB3FORMS HANDLERS
// ==========================================
function openQuoteModal() {
  document.getElementById("quoteModal").classList.add("active");
}

function closeQuoteModal() {
  document.getElementById("quoteModal").classList.remove("active");
}

function selectRentalItem(itemName) {
  const select = document.getElementById("itemSelect");
  if (select) select.value = itemName;
  openQuoteModal();
}

document.getElementById("quoteModal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("quoteModal")) closeQuoteModal();
});

async function handleWeb3Form(e) {
  e.preventDefault();
  const form = e.target;
  const btn = document.getElementById("submitBtn");
  btn.innerText = "Submitting...";
  btn.disabled = true;

  const formData = new FormData(form);

  // INSERT YOUR WEB3FORMS ACCESS KEY HERE
  formData.append("access_key", "YOUR_WEB3FORMS_ACCESS_KEY_HERE");
  formData.append("subject", "New Kauai Tent Rental Inquiry - GIER");
  formData.append("from_name", "GIER Website");

  const payload = Object.fromEntries(formData.entries());

  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();

    if (json.success) {
      alert(
        "Mahalo! Your quote request has been sent. We will review your event date and contact you shortly.",
      );
      form.reset();
      closeQuoteModal();
    } else {
      alert("Error: " + (json.message || "Failed to submit request."));
    }
  } catch (err) {
    alert("Network error. Please try again or reach out to us directly.");
  } finally {
    btn.innerText = "Send Quote Request";
    btn.disabled = false;
  }
}

// ==========================================
// 7. PHOTO GALLERY & LIGHTBOX HANDLERS
// ==========================================
function filterGallery(category) {
  const buttons = document.querySelectorAll(".gallery-filter-btn");
  buttons.forEach((btn) => btn.classList.remove("active"));

  event.target.classList.add("active");

  const items = document.querySelectorAll(".gallery-item");
  items.forEach((item) => {
    const itemCat = item.getAttribute("data-category");
    if (category === "all" || itemCat === category) {
      item.style.display = "block";
    } else {
      item.style.display = "none";
    }
  });
}

function openLightbox(imgSrc, title) {
  const modal = document.getElementById("lightboxModal");
  const img = document.getElementById("lightboxImg");
  const titleEl = document.getElementById("lightboxTitle");
  if (modal && img && titleEl) {
    img.src = imgSrc;
    titleEl.textContent = title || "Tent Photo Preview";
    modal.classList.add("active");
  }
}

function closeLightbox(e) {
  const modal = document.getElementById("lightboxModal");
  if (modal) {
    modal.classList.remove("active");
  }
}
