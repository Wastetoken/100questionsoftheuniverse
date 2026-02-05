
import React, { useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { motion, AnimatePresence } from 'framer-motion';
import { askTheCosmos, getThemeNodes } from './services/geminiService';
import { HoveredData, CosmicNode } from './types';
import { Loader2, Send, X, Radio, Maximize, Layers, Volume2, VolumeX, MousePointer2 } from 'lucide-react';

const STAR_COUNT = 60000;
const NEBULA_COUNT = 150000;
const BG_STAR_COUNT = 200000; 
const GALAXY_COUNT = 10;
const AUDIO_URL = "https://pub-6738c828bef548d69b3f13bdd680b5b0.r2.dev/space.wav";

const GALAXY_DATA = [
  { pos: new THREE.Vector3(0, 0, 0), rot: new THREE.Euler(0, 0, 0), color: { core: "#ffffff", fringe: "#4477ff" } },
  { pos: new THREE.Vector3(1200, 400, -800), rot: new THREE.Euler(-0.2, -0.4, -0.2), color: { core: "#aaffff", fringe: "#0044ff" } },
  { pos: new THREE.Vector3(-1500, -600, -1200), rot: new THREE.Euler(-0.7, -0.5, -0.6), color: { core: "#ccffcc", fringe: "#006622" } },
  { pos: new THREE.Vector3(600, -1500, -600), rot: new THREE.Euler(-0.4, -0.4, -0.3), color: { core: "#ff99ff", fringe: "#882288" } },
  { pos: new THREE.Vector3(-800, 1200, 900), rot: new THREE.Euler(-0.4, -0.9, -0.1), color: { core: "#99ffff", fringe: "#005555" } },
  { pos: new THREE.Vector3(1800, -500, 1500), rot: new THREE.Euler(-0.3, -0.1, -0.7), color: { core: "#ffdd88", fringe: "#aa5500" } },
  { pos: new THREE.Vector3(-700, 1600, -1400), rot: new THREE.Euler(-0.2, -0.2, -0.4), color: { core: "#ddddff", fringe: "#333399" } },
  { pos: new THREE.Vector3(1100, 1300, 1100), rot: new THREE.Euler(-0.6, -0.4, -0.4), color: { core: "#ff8855", fringe: "#662200" } },
  { pos: new THREE.Vector3(-2000, -1200, 600), rot: new THREE.Euler(-0.9, -0.2, -0.7), color: { core: "#ff55bb", fringe: "#550033" } },
  { pos: new THREE.Vector3(500, -1800, -2000), rot: new THREE.Euler(-0.1, -0.3, -0.5), color: { core: "#aa88ff", fringe: "#330077" } },
];

const GALAXY_THEMES = [
  "The Big Bang", "Artificial Intelligence", "Alien Life", "Mind Uploading", "Simulation Theory",
  "Space Travel", "Megastructures", "Mars Colonization", "Neural Links", "The End of the Universe"
];

const vertexShader = `
  uniform float uTime;
  uniform vec3 uCenters[10];
  uniform vec3 uCoreColors[10];
  uniform vec3 uFringeColors[10];
  uniform mat4 uRotations[10];
  
  attribute float aRadius;
  attribute float aAngle;
  attribute float aHeight;
  attribute float aGalaxyId;
  attribute float aPhase;
  attribute float aSize;
  attribute float aType; 

  varying vec3 vColor;
  varying float vOpacity;
  varying float vType;

  void main() {
    vType = aType;
    vec3 worldPos;

    if (aType > 1.5) {
      worldPos = vec3(aRadius * cos(aAngle), aHeight, aRadius * sin(aAngle));
    } else {
      int gid = int(aGalaxyId);
      vec3 center = uCenters[gid - 1];
      float spin = uTime * (0.01 + (3.0 / (aRadius + 30.0)));
      float angle = aAngle + spin;
      float bulge = exp(-pow(aRadius / 45.0, 2.0)) * 40.0 + (aType > 0.5 ? 20.0 : 6.0);
      
      vec4 localPos = vec4(aRadius * cos(angle), aHeight * bulge, aRadius * sin(angle), 1.0);
      worldPos = center + (uRotations[gid - 1] * localPos).xyz;
      worldPos += vec3(sin(uTime * 0.5 + aPhase * 20.0), cos(uTime * 0.4 + aPhase * 15.0), sin(uTime * 0.3)) * 0.8;
    }

    vec4 mvPosition = modelViewMatrix * vec4(worldPos, 1.0);
    float dist = length(mvPosition.xyz);
    float baseSize = aType > 1.5 ? (aSize * 0.8) : (aType > 0.5 ? aSize * 15.0 : aSize * 2.0);
    gl_PointSize = (baseSize * 700.0) / dist;
    gl_Position = projectionMatrix * mvPosition;
    
    if (aType > 1.5) {
      vColor = mix(vec3(0.5, 0.6, 1.0), vec3(1.0, 1.0, 1.0), aPhase);
      vOpacity = (0.2 + 0.3 * sin(uTime * 0.4 + aPhase * 10.0)) * aPhase;
    } else {
      float t = clamp(aRadius / 180.0, 0.0, 1.0);
      vColor = mix(uCoreColors[int(aGalaxyId)-1], uFringeColors[int(aGalaxyId)-1], t);
      vOpacity = (aType > 0.5 ? 0.15 : 0.9) * (1.0 - t * 0.55) * (0.7 + 0.3 * sin(uTime + aPhase * 12.0));
    }
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vOpacity;
  varying float vType;

  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    if (d > 0.5) discard;
    if (vType > 1.5) {
      gl_FragColor = vec4(vColor, smoothstep(0.5, 0.0, d) * vOpacity);
    } else if (vType > 0.5) {
      gl_FragColor = vec4(vColor, pow(1.0 - d * 2.0, 6.0) * vOpacity * 0.3);
    } else {
      float core = smoothstep(0.15, 0.08, d);
      float glow = exp(-d * 1.0);
      gl_FragColor = vec4(vColor, (core + glow * 0.1) * vOpacity);
    }
  }
`;

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeGalaxy, setActiveGalaxy] = useState<number | null>(0);
  const [hovered, setHovered] = useState<HoveredData | null>(null);
  const [clicked, setClicked] = useState<{ question: string; answer: string; x: number; y: number } | null>(null);
  const [universeNodes, setUniverseNodes] = useState<Record<number, CosmicNode[]>>({});
  const [userQuestion, setUserQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [volume, setVolume] = useState(0.4);
  const [isMuted, setIsMuted] = useState(false);
  const [showHint, setShowHint] = useState(true);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const coreObjects = useRef<THREE.Object3D[]>([]);
  const nodeObjects = useRef<Record<number, THREE.Object3D[]>>({});
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  const targetCamPos = useRef(new THREE.Vector3(0, 1200, 45000));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const isTransitioning = useRef(false);

  const galaxyMatrices = useMemo(() => GALAXY_DATA.map(g => new THREE.Matrix4().makeRotationFromEuler(g.rot)), []);

  // Audio setup
  useEffect(() => {
    const audio = new Audio(AUDIO_URL);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    const playAudio = () => {
      audio.play().catch(() => {});
      window.removeEventListener('click', playAudio);
      window.removeEventListener('wheel', playAudio);
    };

    window.addEventListener('click', playAudio);
    window.addEventListener('wheel', playAudio);

    return () => {
      audio.pause();
      window.removeEventListener('click', playAudio);
      window.removeEventListener('wheel', playAudio);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const loadUniverseData = async () => {
      const allNodes: Record<number, CosmicNode[]> = {};
      for (let i = 1; i <= 10; i++) {
        const nodes = await getThemeNodes(i);
        allNodes[i] = nodes.map((n, idx) => ({ ...n, id: idx }));
        setLoadingProgress((i / 10) * 100);
      }
      setUniverseNodes(allNodes);
    };
    loadUniverseData();
  }, []);

  useEffect(() => {
    if (!containerRef.current || Object.keys(universeNodes).length === 0) return;
    const container = containerRef.current;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 500000);
    cameraRef.current = camera;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.02;
    controlsRef.current = controls;

    controls.addEventListener('start', () => {
      isTransitioning.current = false;
      if (showHint) setShowHint(false);
    });

    camera.position.set(0, 1200, 450000);

    const totalLocal = STAR_COUNT + NEBULA_COUNT;
    const totalParticles = totalLocal + BG_STAR_COUNT;
    
    const radiusArr = new Float32Array(totalParticles);
    const angleArr = new Float32Array(totalParticles);
    const heightArr = new Float32Array(totalParticles);
    const gIdArr = new Float32Array(totalParticles);
    const phaseArr = new Float32Array(totalParticles);
    const sizeArr = new Float32Array(totalParticles);
    const typeArr = new Float32Array(totalParticles);

    for (let i = 0; i < totalParticles; i++) {
      if (i < totalLocal) {
        const isNebula = i >= STAR_COUNT;
        const gIdx = Math.floor(i / (totalLocal / GALAXY_COUNT));
        radiusArr[i] = isNebula ? Math.pow(Math.random(), 1.1) * 220 : Math.pow(Math.random(), 1.6) * 180;
        angleArr[i] = Math.random() * Math.PI * 2;
        heightArr[i] = (Math.random() - 0.5) * 2.0;
        gIdArr[i] = gIdx + 1;
        phaseArr[i] = Math.random();
        sizeArr[i] = isNebula ? 18.0 + Math.random() * 12.0 : 0.2 + Math.random() * 0.5;
        typeArr[i] = isNebula ? 1.0 : 0.0;
      } else {
        const phi = Math.random() * Math.PI * 2;
        const costheta = Math.random() * 2 - 1;
        const theta = Math.acos(costheta);
        const r = 30000 + Math.random() * 10000;
        radiusArr[i] = r * Math.sin(theta);
        angleArr[i] = phi;
        heightArr[i] = r * Math.cos(theta);
        gIdArr[i] = 0;
        phaseArr[i] = Math.random();
        sizeArr[i] = 0.5 + Math.random() * 1.5;
        typeArr[i] = 2.0;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('aRadius', new THREE.BufferAttribute(radiusArr, 1));
    geometry.setAttribute('aAngle', new THREE.BufferAttribute(angleArr, 1));
    geometry.setAttribute('aHeight', new THREE.BufferAttribute(heightArr, 1));
    geometry.setAttribute('aGalaxyId', new THREE.BufferAttribute(gIdArr, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phaseArr, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizeArr, 1));
    geometry.setAttribute('aType', new THREE.BufferAttribute(typeArr, 1));
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(totalParticles * 3), 3));
    geometry.computeBoundingSphere();
    if (geometry.boundingSphere) geometry.boundingSphere.radius = 1000000;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCenters: { value: GALAXY_DATA.map(g => g.pos) },
        uCoreColors: { value: GALAXY_DATA.map(g => new THREE.Color(g.color.core)) },
        uFringeColors: { value: GALAXY_DATA.map(g => new THREE.Color(g.color.fringe)) },
        uRotations: { value: galaxyMatrices }
      },
      vertexShader, fragmentShader,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true
    });

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    scene.add(points);

    const tempCoreList: THREE.Object3D[] = [];
    const tempNodeMap: Record<number, THREE.Object3D[]> = {};

    GALAXY_DATA.forEach((g, idx) => {
      const gId = idx + 1;
      const nodes = universeNodes[gId] || [];
      const coreColor = new THREE.Color(g.color.core);
      
      const volHit = new THREE.Mesh(new THREE.SphereGeometry(180, 8, 8), new THREE.MeshBasicMaterial({ visible: false }));
      volHit.position.copy(g.pos);
      volHit.userData = { galaxyId: gId, isCore: true };
      scene.add(volHit);
      tempCoreList.push(volHit);

      const galaxyNodeList: THREE.Object3D[] = [];
      nodes.forEach((node, i) => {
        const phi = Math.PI * (3 - Math.sqrt(5));
        const y = 1 - (i / (nodes.length - 1)) * 2;
        const rAtY = Math.sqrt(1 - y * y);
        const theta = phi * i;
        const orbitR = 200;
        const worldPos = new THREE.Vector3(Math.cos(theta) * rAtY * orbitR, y * rAtY * orbitR, Math.sin(theta) * rAtY * orbitR).applyEuler(g.rot).add(g.pos);
        
        const nodeMesh = new THREE.Mesh(new THREE.SphereGeometry(8, 12, 12), new THREE.MeshStandardMaterial({ 
          color: 0xf1f1f1, emissive: coreColor, emissiveIntensity: 5 
        }));
        nodeMesh.position.copy(worldPos);
        nodeMesh.userData = { galaxyId: gId, question: node.question, answer: node.answer, isNode: true, initialY: worldPos.y };
        scene.add(nodeMesh);
        galaxyNodeList.push(nodeMesh);
      });
      tempNodeMap[gId] = galaxyNodeList;
    });

    coreObjects.current = tempCoreList;
    nodeObjects.current = tempNodeMap;
    scene.add(new THREE.AmbientLight(0xffffff, 2.0));

    const animate = (t: number) => {
      requestAnimationFrame(animate);
      const time = t * 0.001;
      
      if (cameraRef.current && controlsRef.current) {
        if (isTransitioning.current) {
          cameraRef.current.position.lerp(targetCamPos.current, 0.05);
          controlsRef.current.target.lerp(targetLookAt.current, 0.05);
          if (cameraRef.current.position.distanceTo(targetCamPos.current) < 0.5) {
            isTransitioning.current = false;
          }
        }
        controlsRef.current.update();
      }

      Object.values(nodeObjects.current).flat().forEach((n: any) => {
        const mat = n.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 4 + Math.sin(time * 3 + n.position.x) * 2;
        n.scale.setScalar(0.9 + Math.sin(time * 2 + n.position.z) * 0.1);
      });

      material.uniforms.uTime.value = time;
      renderer.render(scene, camera);
      
      if (!clicked) {
        raycasterRef.current.setFromCamera(mouseRef.current, camera);
        const activeIdx = (activeGalaxy as number);
        const targets = activeIdx === 0 ? coreObjects.current : nodeObjects.current[activeIdx] || [];
        
        const hit = raycasterRef.current.intersectObjects(targets, false);
        if (hit.length > 0) {
          const obj = hit[0].object;
          setHovered({ 
            question: obj.userData.question || `${GALAXY_THEMES[obj.userData.galaxyId - 1]}`, 
            answer: obj.userData.answer || "", 
            mesh: obj as THREE.Mesh, 
            x: ((mouseRef.current.x + 1) / 2) * window.innerWidth, 
            y: ((-mouseRef.current.y + 1) / 2) * window.innerHeight 
          });
          renderer.domElement.style.cursor = "pointer";
        } else {
          setHovered(null);
          renderer.domElement.style.cursor = "default";
        }
      }
    };

    const onMove = (e: any) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const cx = e.clientX || (e.touches ? e.touches[0].clientX : 0);
      const cy = e.clientY || (e.touches ? e.touches[0].clientY : 0);
      mouseRef.current.x = ((cx - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((cy - rect.top) / rect.height) * 2 + 1;
    };

    const onClick = () => {
      if (clicked) return;
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const activeIdx = (activeGalaxy as number);
      const targets = activeIdx === 0 ? coreObjects.current : nodeObjects.current[activeIdx] || [];
      const hit = raycasterRef.current.intersectObjects(targets, false);
      
      if (hit.length > 0) {
        const obj = hit[0].object;
        if (obj.userData.galaxyId) {
          if (activeGalaxy === 0) setActiveGalaxy(obj.userData.galaxyId);
          else if (obj.userData.question) {
             const r = renderer.domElement.getBoundingClientRect();
             setClicked({ question: obj.userData.question, answer: obj.userData.answer, x: ((mouseRef.current.x + 1)/2)*r.width, y: ((-mouseRef.current.y + 1)/2)*r.height });
          }
        }
      }
    };

    renderer.domElement.addEventListener("mousemove", onMove);
    renderer.domElement.addEventListener("pointerup", onClick);
    renderer.domElement.addEventListener("touchstart", onMove, { passive: true });
    animate(0);
    return () => { renderer.dispose(); container.removeChild(renderer.domElement); };
  }, [universeNodes, activeGalaxy]);

  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const isM = activeGalaxy === 0;
    const center = isM ? new THREE.Vector3(0, 0, 0) : GALAXY_DATA[activeGalaxy! - 1].pos;
    targetLookAt.current = center;
    targetCamPos.current = isM ? new THREE.Vector3(0, 1200, 4000) : center.clone().add(new THREE.Vector3(0, 300, 600));
    isTransitioning.current = true;
    controlsRef.current.autoRotate = isM;
  }, [activeGalaxy]);

  const onAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuestion.trim() || isAsking || activeGalaxy === 0) return;
    setIsAsking(true);
    const ans = await askTheCosmos(userQuestion, GALAXY_THEMES[activeGalaxy! - 1]);
    setClicked({ question: userQuestion, answer: ans, x: window.innerWidth/2, y: window.innerHeight/2 });
    setUserQuestion('');
    setIsAsking(false);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-display selection:bg-white/10">
      <AnimatePresence>
        {loadingProgress < 100 && (
          <motion.div exit={{ opacity: 0 }} className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center space-y-12">
            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} className="text-white text-[10px] tracking-[1.5em] font-light uppercase">Inaugurating Multiverse</motion.div>
            <div className="w-96 h-[1px] bg-white/10 relative">
              <motion.div initial={{ width: 0 }} animate={{ width: `${loadingProgress}%` }} className="h-full bg-white shadow-[0_0_30px_rgba(255,255,255,1)]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={containerRef} className={`absolute inset-0 z-10 transition-all duration-[1000ms] ease-out ${clicked ? 'opacity-0 scale-150 blur-[100px]' : 'opacity-100'}`} />

      {/* HUD - High Text Brightness */}
      <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-12">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-10 pointer-events-auto">
            <div className="w-10 h-10 flex items-center justify-center rounded-full border border-white/20 bg-white/[0.05] backdrop-blur-3xl">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] font-black tracking-[1em] text-white uppercase">100 Questions Of The</span>
              <h2 className="text-xl tracking-[0.4em] text-white font-thin uppercase mt-1">
                {activeGalaxy === 0 ? "U N I V E R S E" : GALAXY_THEMES[activeGalaxy! - 1]}
              </h2>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2 text-right pointer-events-auto">
             <div className="text-[8px] tracking-[0.6em] text-white uppercase flex items-center gap-4">
               <Radio className="w-3 h-3 text-emerald-400" /> {activeGalaxy === 0 ? 'READY' : 'FOCUSED'}
             </div>
             <div className="flex items-center gap-4 mt-4">
               <div className="flex items-center gap-4 px-5 py-2.5 border border-white/20 rounded-full bg-white/[0.08] backdrop-blur-3xl shadow-xl">
                 <button onClick={() => setIsMuted(!isMuted)} className="text-white hover:text-white transition-colors">
                   {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                 </button>
                 <input 
                   type="range" 
                   min="0" 
                   max="1" 
                   step="0.01" 
                   value={volume} 
                   onChange={(e) => setVolume(parseFloat(e.target.value))} 
                   className="w-20 h-1"
                 />
               </div>
               
               {activeGalaxy !== 0 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="relative p-[1px] rounded-full group/reset">
                    {/* RESET GLOW BEAM */}
                    <div className="absolute inset-0 pointer-events-none opacity-100">
                       <div className="border-beam-mask">
                          <div className="border-beam-light" />
                       </div>
                       <div className="border-beam-mask border-beam-glow">
                          <div className="border-beam-light" />
                       </div>
                    </div>
                    <button onClick={() => setActiveGalaxy(0)} className="relative z-10 flex items-center gap-3 px-6 py-2.5 rounded-full bg-black/90 text-[10px] uppercase tracking-[0.4em] text-white font-bold hover:bg-white hover:text-black transition-all group backdrop-blur-3xl border border-white/30">
                      <Maximize className="w-3.5 h-3.5 group-hover/reset:rotate-90 transition-transform" /> RESET
                    </button>
                  </motion.div>
               )}
             </div>
          </div>
        </div>

        <div className="flex justify-between items-end">
          <div className="max-w-xs space-y-3">
             <div className="h-[1px] w-32 bg-gradient-to-r from-white to-transparent" />
             <p className="text-[10px] leading-relaxed text-white uppercase tracking-[0.2em] font-medium">
               Query the infinite. Access node data.
             </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[8px] tracking-[1.2em] text-white uppercase font-black">SYSTEM ACCESS:Granted</span>
          </div>
        </div>
      </div>

      {/* STARTUP HINT */}
      <AnimatePresence>
        {showHint && loadingProgress === 100 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, scale: 0.9 }} 
            className="absolute bottom-32 right-12 z-40 flex flex-col items-center gap-4 pointer-events-none"
          >
            <div className="flex items-center gap-6 px-10 py-5 bg-white/10 border border-white/30 rounded-full backdrop-blur-xl shadow-2xl">
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>
                <MousePointer2 className="w-6 h-6 text-white" />
              </motion.div>
              <span className="text-[12px] tracking-[1em] font-bold text-white uppercase whitespace-nowrap">Scroll in</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INPUT INTERFACE */}
      <AnimatePresence>
        {activeGalaxy !== 0 && !clicked && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 w-full max-w-2xl px-12 group">
            
            <div className="text-center mb-6">
              <motion.span 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-[11px] uppercase tracking-[0.8em] font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
              >
                Have a question you're not seeing?
              </motion.span>
            </div>

            <div className="relative p-[1px] rounded-full">
              <div className="absolute inset-0 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity duration-700">
                 <div className="border-beam-mask">
                    <div className="border-beam-light" />
                 </div>
                 <div className="border-beam-mask border-beam-glow">
                    <div className="border-beam-light" />
                 </div>
              </div>

              <form onSubmit={onAsk} className="relative z-10 flex items-center bg-black/95 backdrop-blur-[120px] rounded-full p-2 ring-1 ring-white/50 focus-within:ring-white transition-all duration-700 shadow-2xl">
                <input type="text" value={userQuestion} onChange={(e) => setUserQuestion(e.target.value)} placeholder="QUERY VOID..." className="flex-1 bg-transparent px-8 py-5 text-white focus:outline-none text-[14px] tracking-[0.4em] placeholder:text-zinc-500 uppercase font-medium" />
                <button type="submit" disabled={isAsking || !userQuestion.trim()} className="p-5 bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-20 shadow-[0_0_50px_rgba(255,255,255,1)]">
                  {isAsking ? <Loader2 className="w-7 h-7 animate-spin" /> : <Send className="w-7 h-7" />}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RESPONSE MODAL */}
      <AnimatePresence>
        {clicked && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[60] flex flex-col items-center justify-center p-20 bg-black/98 backdrop-blur-[200px]">
            <motion.button whileHover={{ rotate: -90, scale: 1.1 }} onClick={() => setClicked(null)} className="fixed top-20 right-20 p-6 bg-white/10 border border-white/40 rounded-full text-white hover:bg-white hover:text-black transition-all z-[70] shadow-[0_0_40px_rgba(255,255,255,0.2)]"><X className="w-10 h-10" /></motion.button>
            <div className="w-full max-w-4xl space-y-16 text-center">
              <h2 className="text-3xl md:text-6xl font-thin text-white leading-tight italic opacity-100 tracking-tighter px-10">"{clicked.question}"</h2>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-8 max-w-3xl mx-auto">
                {clicked.answer.split(' ').map((word, i) => (
                  <motion.span key={i} initial={{ opacity: 0, filter: 'blur(30px)', y: 40 }} animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }} transition={{ duration: 0.8, delay: 0.2 + i * 0.015 }} className="text-2xl md:text-4xl text-white font-thin tracking-widest leading-normal">{word}</motion.span>
                ))}
              </div>
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} onClick={() => setClicked(null)} className="px-20 py-6 bg-white text-black text-[14px] uppercase tracking-[1.5em] font-black rounded-full hover:scale-110 transition-all shadow-[0_0_60px_rgba(255,255,255,0.6)]">DISCONNECT</motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NODE TOOLTIP */}
      <AnimatePresence>
        {hovered && !clicked && (
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 5 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="fixed z-50 pointer-events-none" style={{ left: hovered.x, top: hovered.y - 45, transform: "translateX(-50%)" }}>
            <div className="bg-white backdrop-blur-3xl border border-white px-6 py-3 rounded shadow-[0_20px_80px_rgba(255,255,255,0.5)] flex flex-col items-center gap-0 min-w-[140px]">
              <span className="text-[12px] font-black text-black tracking-[0.1em] uppercase whitespace-nowrap">{hovered.question}</span>
            </div>
            <div className="w-[1px] h-12 mx-auto bg-gradient-to-b from-white to-transparent mt-0" />
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] opacity-95" />
    </div>
  );
}
export default App;
