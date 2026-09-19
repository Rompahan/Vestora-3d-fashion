import React, { Suspense, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { supabase } from './supabaseClient'
import { GoogleGenAI } from '@google/genai'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './Landing';

// ==========================================
// 1. КОМПОНЕНТ АВАТАРА (ТЕЛО)
// ==========================================
function AvatarModel({ scale }: { scale: [number, number, number] }) {
  const { scene } = useGLTF('/avatar.glb')
  const clonedScene = React.useMemo(() => scene.clone(), [scene])

  return <primitive object={clonedScene} scale={scale} position={[0, -2, 0]} />
}

// ==========================================
// 2. КОМПОНЕНТ ОДЕЖДЫ (С АВТО-ВЫРАВНИВАНИЕМ)
// ==========================================
function GarmentModel({ color, scale, textureType, modelPath, devY, devZ, devScale }: any) {
  const { scene } = useGLTF(modelPath) as any
  const clonedScene = React.useMemo(() => scene.clone(), [scene, modelPath])

  useEffect(() => {
    const applyMaterial = (texture: THREE.Texture | null) => {
      clonedScene.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material]
          materials.forEach((mat) => {
            if (mat && 'color' in mat && mat.color instanceof THREE.Color) {
              mat.color.set(color)
              mat.map = texture
              mat.needsUpdate = true
            }
          })
        }
      })
    }

    if (textureType === 'none') {
      applyMaterial(null)
    } else {
      const loader = new THREE.TextureLoader()
      loader.load(`/${textureType}.jpg`, (texture) => {
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.repeat.set(4, 4)
        applyMaterial(texture)
      }, undefined, () => applyMaterial(null))
    }
  }, [color, clonedScene, textureType])

  return (
    // Применяем масштаб юзера (scale) + ползунки разраба (devScale, devY)
    <primitive
      object={clonedScene}
      position={[0, devY, devZ]}
      scale={[
        scale[0] * devScale,
        scale[1] * devScale,
        scale[2] * devScale
      ]}
    />
  )
}

function Loader() {
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#666666" wireframe />
    </mesh>
  )
}

// ==========================================
// 3. ОСНОВНОЕ ПРИЛОЖЕНИЕ (ИНТЕРФЕЙС И ЛОГИКА)
// ==========================================
function DressingRoom() {
  const [modelColor, setModelColor] = useState('#ffffff')
  // Добавь это туда, где у тебя useState
  const [devY, setDevY] = useState(-2.25) // Ползунок высоты
  const [devScale, setDevScale] = useState(0.75) // Ползунок размера
  const [devZ, setDevZ] = useState(0)
  const [modelScale, setModelScale] = useState<[number, number, number]>([1, 1, 1])
  const [modelTexture, setModelTexture] = useState('none')
  const [activeGarment, setActiveGarment] = useState('/ShirtModel.glb')

  const [name, setName] = useState('')
  const [height, setHeight] = useState('')
  const [chest, setChest] = useState('')
  const [waist, setWaist] = useState('')
  const [status, setStatus] = useState('Save profile')

  const [aiPrompt, setAiPrompt] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const catalog = [
    { id: 'shirt', name: 'T-shirt', path: '/ShirtModel.glb', defaultY: -2.25, defaultZ: 0, defaultScale: 0.75 },
    { id: 'hoodie', name: 'hoodie', path: '/HoodieModel.glb', defaultY: -2, defaultZ: -0.05, defaultScale: 0.55 },
    { id: 'jacket', name: 'Jacket', path: '/JacketModel.glb', defaultY: -2.2, defaultZ: 0, defaultScale: 0.15 }
  ]

  // Умная посадка
  useEffect(() => {
    if (height || chest || waist) {
      const baseHeight = 175;
      const baseChest = 100;
      const baseWaist = 85;

      const currentHeight = parseInt(height) || baseHeight;
      const currentChest = parseInt(chest) || baseChest;
      const currentWaist = parseInt(waist) || baseWaist;

      const scaleY = currentHeight / baseHeight;
      const scaleX = currentChest / baseChest;
      const scaleZ = currentWaist / baseWaist;

      setModelScale([scaleX, scaleY, scaleZ]);
    }
  }, [height, chest, waist]);

  const saveToDatabase = async () => {
    if (!name) return setStatus('Введите имя!')
    setStatus('Сохранение...')

    const { error } = await supabase.from('measurements').insert([
      { user_name: name, height: parseInt(height) || 0, chest: parseInt(chest) || 0, waist: parseInt(waist) || 0 }
    ])

    if (error) {
      console.error(error)
      setStatus('Ошибка базы')
    } else {
      setStatus('Успешно!')
      setName(''); setHeight(''); setChest(''); setWaist('')
      setTimeout(() => setStatus('Save Profile'), 3000)
    }
  }

  const askAI = async () => {
    if (!aiPrompt) return
    setIsThinking(true)

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (!apiKey) throw new Error("Ключ API не найден.")

      const ai = new GoogleGenAI({ apiKey: apiKey });

      const prompt = `Ты — AI-ассистент VESTORA. Твоя задача переводить пожелания по дизайну в JSON. 
      Формат СТРОГО JSON: {"color": "#HEX", "scaleX": 1.0, "scaleY": 1.0, "texture": "none"}.
      Размеры по умолчанию 1.0. Меняй их, если просят длиннее/короче или шире/уже.
      В поле texture укажи "camo" (если просят милитари/камуфляж), "denim" (если просят джинсу), иначе "none".
      Никакого дополнительного текста.
      Запрос пользователя: ${aiPrompt}`

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      if (!response.text) throw new Error("Нейросеть вернула пустой ответ");

      const parsed = JSON.parse(response.text)

      if (parsed.color) setModelColor(parsed.color)

      if (parsed.scaleX || parsed.scaleY) {
        setModelScale([
          modelScale[0] * (parsed.scaleX || 1),
          modelScale[1] * (parsed.scaleY || 1),
          modelScale[2] * (parsed.scaleX || 1)
        ])
      }

      if (parsed.texture) setModelTexture(parsed.texture)

    } catch (error: any) {
      if (error.message.includes('503')) {
        alert("Нейросеть сейчас перегружена. Подожди минутку.")
      } else {
        alert(`Ошибка: ${error.message}`)
      }
    } finally {
      setIsThinking(false)
      setAiPrompt('')
    }
  }
  const generateAtelierSpec = () => {
    // Находим название текущей вещи из каталога
    const garmentName = catalog.find(item => item.path === activeGarment)?.name || 'Одежда'

    // Формируем текст спецификации
    const specText = `=== VESTORA: ТЕХНИЧЕСКОЕ ЗАДАНИЕ ДЛЯ АТЕЛЬЕ ===

1. ПРОФИЛЬ КЛИЕНТА
Имя: ${name || 'Без имени'}
Рост: ${height || 'Стандарт'} см
Грудь: ${chest || 'Стандарт'} см
Талия: ${waist || 'Стандарт'} см

2. СПЕЦИФИКАЦИЯ ИЗДЕЛИЯ
Базовая модель: ${garmentName}
Цвет ткани (HEX-код): ${modelColor}
Текстура/Принт: ${modelTexture === 'none' ? 'Отсутствует (базовая ткань)' : modelTexture}

3. МОДИФИКАЦИИ ЛЕКАЛА (Смещение масштаба от базы)
Ширина (по груди/плечам): x${modelScale[0].toFixed(2)}
Длина изделия: x${modelScale[1].toFixed(2)}
Объем (по талии): x${modelScale[2].toFixed(2)}

(Коэффициент > 1.0 означает увеличение выкройки, < 1.0 — уменьшение)

Сгенерировано автоматически прототипом Vestora MVP.`;

    // Создаем текстовый файл в памяти браузера и скачиваем его
    const blob = new Blob([specText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Vestora_Spec_${name || 'Client'}.txt`;
    link.click();
  }

  return (
    <div className="w-screen h-screen flex overflow-hidden font-['Plus_Jakarta_Sans'] selection:bg-[#D8B4FE]/20">

      {/* LEFT PANEL (Premium Dark UI) */}
      <div className="w-96 bg-[#0a0a0c] h-full flex flex-col border-r border-white/5 shadow-2xl z-10 text-white relative">

        {/* Декоративное лавандовое свечение */}
        <div className="absolute top-0 left-0 w-full h-32 bg-[#D8B4FE]/5 blur-[60px] pointer-events-none"></div>

        {/* Header */}
        <div className="px-6 py-6 border-b border-white/5 relative z-10">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            Workspace <span className="w-1.5 h-1.5 rounded-full bg-[#D8B4FE] animate-pulse"></span>
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 space-y-8 relative z-10">

          {/* SECTION: Avatar Profile */}
          <div>
            <h3 className="text-[11px] font-bold text-gray-500 mb-4 uppercase tracking-widest">Avatar Dimensions</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Client Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 focus:border-[#D8B4FE] focus:bg-white/10 outline-none px-4 py-3 rounded-2xl text-sm transition-all placeholder:text-gray-600 font-medium" />
              <div className="flex gap-2">
                <input type="number" placeholder="Height" value={height} onChange={(e) => setHeight(e.target.value)} className="w-1/3 bg-white/5 border border-white/10 focus:border-[#D8B4FE] focus:bg-white/10 outline-none px-4 py-3 rounded-2xl text-sm text-center transition-all placeholder:text-gray-600 font-medium" />
                <input type="number" placeholder="Chest" value={chest} onChange={(e) => setChest(e.target.value)} className="w-1/3 bg-white/5 border border-white/10 focus:border-[#D8B4FE] focus:bg-white/10 outline-none px-4 py-3 rounded-2xl text-sm text-center transition-all placeholder:text-gray-600 font-medium" />
                <input type="number" placeholder="Waist" value={waist} onChange={(e) => setWaist(e.target.value)} className="w-1/3 bg-white/5 border border-white/10 focus:border-[#D8B4FE] focus:bg-white/10 outline-none px-4 py-3 rounded-2xl text-sm text-center transition-all placeholder:text-gray-600 font-medium" />
              </div>
              <button onClick={saveToDatabase} className="w-full mt-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 py-3 rounded-2xl transition-all text-sm font-semibold">
                {status || 'Save Profile'}
              </button>
            </div>
          </div>

          {/* SECTION: Catalog */}
          <div>
            <h3 className="text-[11px] font-bold text-gray-500 mb-4 uppercase tracking-widest">Garment Library</h3>
            <div className="flex flex-col gap-2">
              {catalog.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveGarment(item.path)
                    setDevY(item.defaultY)
                    setDevZ(item.defaultZ)
                    setDevScale(item.defaultScale)
                  }}
                  className={`text-left px-5 py-4 rounded-2xl transition-all duration-300 flex justify-between items-center text-sm font-semibold ${activeGarment === item.path
                    ? 'bg-[#D8B4FE] text-[#1a1a1a] shadow-[0_4px_20px_rgba(216,180,254,0.15)]'
                    : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5'
                    }`}
                >
                  <span>{item.name}</span>
                  {activeGarment === item.path && <span className="w-1.5 h-1.5 bg-[#1a1a1a] rounded-full"></span>}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION: AI Assistant */}
          <div>
            <h3 className="text-[11px] font-bold text-gray-500 mb-4 uppercase tracking-widest">AI Design Assistant</h3>
            <div className="flex flex-col gap-3">
              <textarea
                placeholder="Prompt: e.g., Make the jacket cropped..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="w-full bg-white/5 border border-white/10 focus:border-[#D8B4FE] focus:bg-white/10 outline-none px-4 py-4 rounded-2xl text-sm transition-all placeholder:text-gray-600 resize-none h-24 custom-scrollbar font-medium"
              />
              <button
                onClick={askAI}
                disabled={isThinking}
                className={`w-full py-4 rounded-2xl transition-all duration-300 text-sm font-bold flex justify-center items-center ${isThinking
                  ? 'bg-white/10 text-gray-500 cursor-wait'
                  : 'bg-[#D8B4FE] hover:bg-[#F4EBFF] text-[#1a1a1a] shadow-[0_4px_20px_rgba(216,180,254,0.15)]'
                  }`}
              >
                {isThinking ? 'Processing...' : 'Apply AI Prompt'}
              </button>
            </div>
          </div>

        </div>

        {/* SECTION: Export Tech Pack */}
        <div className="p-6 border-t border-white/5 bg-[#0a0a0c]/90 backdrop-blur-md z-20">
          <button
            onClick={generateAtelierSpec}
            className="w-full bg-white text-[#1a1a1a] hover:bg-gray-200 py-4 rounded-2xl transition-transform hover:scale-[1.02] text-sm font-bold shadow-[0_4px_20px_rgba(255,255,255,0.1)]"
          >
            Export Tech Pack
          </button>
        </div>
      </div>

      {/* RIGHT PANEL (3D VIEWPORT - BLENDER STYLE) */}
      <div className="flex-1 relative bg-[#1c1c1c]">

        {/* Info overlay */}
        <div className="absolute top-6 left-6 z-10 text-xs text-gray-500 font-mono">
          <p>Perspective View</p>
          <p className="mt-1 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#D8B4FE] opacity-70"></span> Render: Active</p>
        </div>

        <Canvas camera={{ position: [0, -0.5, 4.5] }}>
          <gridHelper args={[20, 20, '#404040', '#282828']} position={[0, -2, 0]} />

          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 10, 5]} intensity={1.5} />

          <Suspense fallback={<Loader />}>
            <AvatarModel scale={modelScale} />
            <GarmentModel
              color={modelColor}
              scale={modelScale}
              textureType={modelTexture}
              modelPath={activeGarment}
              devY={devY}
              devZ={devZ}
              devScale={devScale}
            />
          </Suspense>

          <OrbitControls makeDefault target={[0, -1, 0]} />
        </Canvas>
      </div>
    </div>
  )
}
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<DressingRoom />} />
      </Routes>
    </Router>
  );
}

export default App