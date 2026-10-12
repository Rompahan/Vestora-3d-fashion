import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

function GenerativeCore() {
    const coreRef = useRef<THREE.Mesh>(null);
    const wireRef = useRef<THREE.Mesh>(null);
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();

        // Вращение за курсором для всей группы
        if (groupRef.current) {
            const mouseX = state.mouse.x;
            const mouseY = state.mouse.y;
            groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, mouseX * 0.5, 0.05);
            groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -mouseY * 0.5, 0.05);
        }

        // Пульсация и вращение самого шара
        if (coreRef.current) {
            coreRef.current.rotation.y = time * 0.2;
            coreRef.current.rotation.x = time * 0.1;
            const scale = 1 + Math.sin(time * 2) * 0.03;
            coreRef.current.scale.set(scale, scale, scale);
        }

        // Вращение внешней сетки
        if (wireRef.current) {
            wireRef.current.rotation.y = -time * 0.15;
            wireRef.current.rotation.z = time * 0.1;
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
            <group ref={groupRef}>

                {/* ВНУТРЕННЕЕ ЯДРО: Идеальная гладкая сфера */}
                <mesh ref={coreRef}>
                    {/* args: [радиус, сегменты по ширине, сегменты по высоте] */}
                    <sphereGeometry args={[1.5, 256, 256]} />
                    <meshPhysicalMaterial
                        color="#000"
                        metalness={0.9}
                        roughness={0.05}
                        clearcoat={1.0}
                        clearcoatRoughness={0.1}
                    />
                </mesh>

                {/* ВНЕШНЯЯ ОБОЛОЧКА: Сферическая сетка */}
                <mesh ref={wireRef} scale={1.05}>
                    {/* Меньше сегментов (24x24), чтобы получился красивый каркас, а не сплошное пятно */}
                    <sphereGeometry args={[1.5, 24, 24]} />
                    <meshBasicMaterial
                        color="#a855f7"
                        wireframe={true}
                        transparent={true}
                        opacity={0.4}
                    />
                </mesh>

            </group>
        </Float>
    );
}

export default function CyberFashion() {
    return (
        <div className="w-full h-full relative">
            <Canvas
                className="w-full h-full"
                camera={{ position: [0, 0, 6.5], fov: 45 }}
                gl={{ antialias: true, alpha: true }}
                dpr={[1, 2]}
            >
                {/* Базовый тусклый свет, чтобы тени не были абсолютно черными */}
                <ambientLight intensity={0.77} />

                {/* Главный "Рисующий" свет (сверху-справа) - создает основной яркий белый блик */}
                <directionalLight
                    position={[300, 8, 5]}
                    intensity={10000}
                    color="#ffffff"
                />

                {/* "Заполняющий" свет (слева) - фиолетовый оттенок, подсвечивает левый бок */}
                <directionalLight
                    position={[-300, 0, 5]}
                    intensity={10000}
                    color="#c9c9c9"
                />

                {/* "Контровой" свет (сзади-снизу) - отделяет сферу от фона */}
                <pointLight
                    position={[0, -5, -5]}
                    intensity={10}
                    color="#97939b"
                />

                {/* МЫ УДАЛИЛИ <Environment preset="studio" /> */}

                <GenerativeCore />
            </Canvas>
        </div>
    );
}