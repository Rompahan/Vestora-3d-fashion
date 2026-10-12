import React, { Suspense, useState, useEffect, useLayoutEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import * as THREE from 'three'
import Landing from './Landing'

function StandardAvatarModel({
  modelPath,
  position,
  scale,
  rotation,
  customTexture,
  normalize = true
}: any) {
  const gltf = useGLTF(modelPath) as any
  const clonedScene = React.useMemo(() => (gltf.scene ? gltf.scene.clone() : null), [gltf, modelPath])

  // Task 1: Bounding box normalization & centering (Giant models fix)
  useLayoutEffect(() => {
    if (!clonedScene) return

    // Reset transforms before measuring
    clonedScene.scale.set(1, 1, 1)
    clonedScene.position.set(0, 0, 0)

    if (!normalize) {
    return
  }

    const box = new THREE.Box3().setFromObject(clonedScene)
    const size = new THREE.Vector3()
    box.getSize(size)
    const center = new THREE.Vector3()
    box.getCenter(center)

    if (size.y > 0) {
      const targetHeight = 1.6 // Human height units (~1.5 - 1.8)
      const scaleFactor = targetHeight / size.y

      clonedScene.scale.set(scaleFactor, scaleFactor, scaleFactor)
      clonedScene.position.set(
        -center.x * scaleFactor,
        -center.y * scaleFactor,
        -center.z * scaleFactor
      )
    }
  }, [clonedScene])

  // Task 2: AI Photo to 3D texture loading & mapping
  useEffect(() => {
    if (!clonedScene || !customTexture) return

    const loader = new THREE.TextureLoader()
    loader.load(customTexture, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.needsUpdate = true

      clonedScene.traverse((child: any) => {
        if (child.isMesh) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat: any) => {
              mat.map = texture
              mat.needsUpdate = true
            })
          } else if (child.material) {
            child.material.map = texture
            child.material.needsUpdate = true
          }
        }
      })
    })
  }, [clonedScene, customTexture])

  if (!clonedScene) return null
  return (
    <group position={position} scale={scale} rotation={rotation}>
      <primitive object={clonedScene} />
    </group>
  )
}
function GeneratedBodyModel({ modelPath }: { modelPath: string }) {
  const gltf = useGLTF(modelPath) as any

  const scene = React.useMemo(
    () => gltf.scene.clone(true),
    [gltf.scene, modelPath]
  )

  useLayoutEffect(() => {
    if (!scene) return

    scene.scale.set(1, 1, 1)
    scene.position.set(0, 0, 0)

    // Find actual bounds of generated MPFB body
    const box = new THREE.Box3().setFromObject(scene)

    const center = new THREE.Vector3()
    box.getCenter(center)

    // Center body around X/Z.
    // Put feet approximately at Y = -0.9.
    scene.position.set(
      -center.x,
      -center.y,
      -center.z
    )
  }, [scene])

  return <primitive object={scene} />
}

function Loader() {
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#666666" wireframe />
    </mesh>
  )
}

function DressingRoom() {
  const [activeGarment, setActiveGarment] = useState('/ShirtModel.glb')
  const [name, setName] = useState('')
  const [height, setHeight] = useState('175')
  const [chest, setChest] = useState('100')
  const [waist, setWaist] = useState('85')
  const [bodyModelUrl, setBodyModelUrl] = useState('/avatar.glb')
const [isBodyGenerating, setIsBodyGenerating] = useState(false)
const [bodyError, setBodyError] = useState<string | null>(null)

  // AI Garment Generator states
  const [customTexture, setCustomTexture] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)

  const catalog = [
    { id: 'shirt', name: 'T-shirt', path: '/ShirtModel.glb', pos: [0, -1.5, 0], scale: 1.0 },
    { id: 'hoodie', name: 'Hoodie', path: '/HoodieModel.glb', pos: [0, -1.5, 0], scale: 1.0 },
    { id: 'jacket', name: 'Jacket', path: '/JacketModel.glb', pos: [0, -1.5, 0], scale: 1.0 }
  ]

  const currentGarment = catalog.find(i => i.path === activeGarment) || catalog[0]

const handleGenerateBody = async () => {
  setIsBodyGenerating(true)
  setBodyError(null)

  try {
    const response = await fetch(
      'http://127.0.0.1:8000/api/body/generate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          height: Number(height),
          chest: Number(chest),
          waist: Number(waist),

          // Временно, пока этих inputs ещё нет в UI
          hips: 98,
          shoulders: 46,
          neck: 39,
          arm_length: 62,
          inseam: 84,
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data?.detail?.message ||
        data?.detail ||
        'Body generation failed'
      )
    }

    const fullModelUrl =
      `http://127.0.0.1:8000${data.model_url}`

    setBodyModelUrl(fullModelUrl)

    console.log(
      'VESTORA body generated:',
      data
    )
  } catch (error) {
    console.error(error)

    setBodyError(
      error instanceof Error
        ? error.message
        : 'Body generation failed'
    )
  } finally {
    setIsBodyGenerating(false)
  }
}

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsGenerating(true)
    setProgress(0)

    // Simulate 2-3 seconds AI generation & analysis
    const startTime = Date.now()
    const duration = 2500 // 2.5 seconds
    const intervalTime = 50

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const currentProgress = Math.min(Math.floor((elapsed / duration) * 100), 100)
      setProgress(currentProgress)

      if (elapsed >= duration) {
        clearInterval(timer)
        const imageUrl = URL.createObjectURL(file)
        setCustomTexture(imageUrl)
        setIsGenerating(false)
      }
    }, intervalTime)
  }

  return (
    <div className="w-screen h-screen flex overflow-hidden font-['Plus_Jakarta_Sans','Inter',sans-serif] selection:bg-[#D8B4FE]/20">
      <div className="w-96 bg-[#0a0a0c] h-full flex flex-col border-r border-white/5 shadow-2xl z-10 text-white relative">
        <div className="absolute top-0 left-0 w-full h-32 bg-[#D8B4FE]/5 blur-[60px] pointer-events-none"></div>
        <div className="px-6 py-6 border-b border-white/5 relative z-10 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            Workspace v2.0 <span className="w-1.5 h-1.5 rounded-full bg-[#D8B4FE] animate-pulse"></span>
          </h2>
          <a href="/" className="text-xs text-gray-400 hover:text-white transition-colors">Home</a>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 space-y-8 relative z-10">
          <div>
            <h3 className="text-[11px] font-bold text-gray-500 mb-4 uppercase tracking-widest">Avatar Dimensions</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Client Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-2xl text-sm focus:outline-none focus:border-[#D8B4FE] transition-colors" />
              <div className="flex gap-2">
                <input type="number" placeholder="Height" value={height} onChange={(e) => setHeight(e.target.value)} className="w-1/3 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl text-sm text-center focus:outline-none focus:border-[#D8B4FE] transition-colors" />
                <input type="number" placeholder="Chest" value={chest} onChange={(e) => setChest(e.target.value)} className="w-1/3 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl text-sm text-center focus:outline-none focus:border-[#D8B4FE] transition-colors" />
                <input type="number" placeholder="Waist" value={waist} onChange={(e) => setWaist(e.target.value)} className="w-1/3 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl text-sm text-center focus:outline-none focus:border-[#D8B4FE] transition-colors" />
              </div>
              <button
  onClick={handleGenerateBody}
  disabled={isBodyGenerating}
  className="
    w-full
    mt-3
    bg-[#D8B4FE]
    text-[#1a1a1a]
    px-4
    py-3
    rounded-2xl
    text-sm
    font-bold
    transition-all
    hover:bg-[#e4c8ff]
    disabled:opacity-50
    disabled:cursor-not-allowed
  "
>
  {isBodyGenerating
    ? 'Generating Body...'
    : 'Generate Body'}
</button>

{bodyError && (
  <p className="text-xs text-red-400 mt-2">
    {bodyError}
  </p>
)}
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-bold text-gray-500 mb-4 uppercase tracking-widest">Garment Library</h3>
            <div className="flex flex-col gap-2">
              {catalog.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveGarment(item.path)}
                  className={`text-left px-5 py-4 rounded-2xl transition-all cursor-pointer font-medium text-sm flex items-center justify-between ${activeGarment === item.path ? 'bg-[#D8B4FE] text-[#1a1a1a] shadow-lg shadow-[#D8B4FE]/10' : 'bg-white/5 text-white hover:bg-white/10'}`}
                >
                  <span>{item.name}</span>
                  {activeGarment === item.path && <span className="w-2 h-2 rounded-full bg-[#1a1a1a]"></span>}
                </button>
              ))}
            </div>
          </div>

          {/* AI Garment Generator Killer Feature Section */}
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-bold text-[#D8B4FE] uppercase tracking-widest flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-[#D8B4FE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                AI Garment Generator
              </h3>
            </div>

            {isGenerating ? (
              <div className="space-y-3 py-2">
                <div className="flex items-center justify-between text-xs text-purple-300">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
                    AI Analyzing & Generating...
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-gray-400 text-center">Mapping fabric pattern & geometry to 3D model...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="border-2 border-dashed border-white/20 hover:border-[#D8B4FE] rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors group bg-black/20">
                  <svg className="w-8 h-8 text-gray-400 group-hover:text-[#D8B4FE] mb-2 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-semibold text-gray-300 group-hover:text-white">Upload Zara / Garment Photo</span>
                  <span className="text-[10px] text-gray-500 mt-1">PNG, JPG up to 10MB</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>

                {customTexture && (
                  <div className="flex items-center justify-between bg-white/5 p-2 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2">
                      <img src={customTexture} alt="Custom Texture" className="w-10 h-10 object-cover rounded-lg border border-white/20" />
                      <div>
                        <p className="text-xs font-semibold text-white">AI Texture Applied</p>
                        <p className="text-[10px] text-gray-400">Custom garment material active</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setCustomTexture(null)}
                      className="text-[11px] text-red-400 hover:text-red-300 px-2 py-1 rounded bg-red-500/10 transition-colors cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 relative bg-[#1c1c1c]">
        <Canvas
  camera={{
    position: [0, 0.05, 3.2],
    fov: 35
  }}
>
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 5, 5]} intensity={1.5} />
          <Suspense fallback={<Loader />}>
           <GeneratedBodyModel
  modelPath={bodyModelUrl}
/>
            {/* <StandardAvatarModel
  modelPath={activeGarment}
  position={currentGarment.pos}
  scale={[
    currentGarment.scale,
    currentGarment.scale,
    currentGarment.scale
  ]}
  customTexture={customTexture}
/> */}
          </Suspense>
          <OrbitControls
  makeDefault
  target={[0, 0, 0]}
  enablePan={false}
  minDistance={1.8}
  maxDistance={6}
/>
        </Canvas>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<DressingRoom />} />
      </Routes>
    </Router>
  )
}
