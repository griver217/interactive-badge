function Band({ maxSpeed = 50, minSpeed = 10 }) {
  const band = useRef()
  const fixed = useRef()
  const j1 = useRef()
  const j2 = useRef()
  const j3 = useRef()
  const j4 = useRef()
  const j5 = useRef()
  const card = useRef()

  const vec = new THREE.Vector3()
  const ang = new THREE.Vector3()
  const rot = new THREE.Vector3()
  const dir = new THREE.Vector3()

  const segmentProps = { type: 'dynamic', canSleep: true, colliders: false, angularDamping: 5, linearDamping: 5 }
  const { nodes, materials } = useGLTF('https://griver217.github.io/perfection-host/perfection.glb')
  const texture = useTexture('https://griver217.github.io/perfection-host/band_red.png')
  const { width, height } = useThree((state) => state.size)
  const [curve] = useState(() => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]))
  const [dragged, drag] = useState(false)
  const [hovered, hover] = useState(false)

  useRopeJoint(fixed, j5, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j5, j4, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j4, j3, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j3, j2, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j2, j1, [[0, 0, 0], [0, 0, 0], 1])
  useSphericalJoint(j1, card, [[0, 0, 0], [0, 1.45, 0]])

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab'
      return () => (document.body.style.cursor = 'auto')
    }
  }, [hovered, dragged])

  useFrame((state) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera)
      dir.copy(vec).sub(state.camera.position).normalize()
      vec.add(dir.multiplyScalar(state.camera.position.length()))
      card.current.setNextKinematicTranslation({ x: vec.x - dragged.x, y: vec.y - dragged.y, z: vec.z - dragged.z })
    }

    // Update Catmull curve
    curve.points[0].copy(card.current.translation())
    curve.points[1].copy(j1.current.translation())
    curve.points[2].copy(j2.current.translation())
    curve.points[3].copy(j3.current.translation())
    curve.points[4].copy(j4.current.translation())
    curve.points[5].copy(j5.current.translation())
    band.current.geometry.setPoints(curve.getPoints(64))

    // Tilt the card back towards the screen
    ang.copy(card.current.angvel())
    rot.copy(card.current.rotation())
    card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z })
  })

  curve.curveType = 'chordal'
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.4, 0, 0]} ref={j5} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[0.8, 0, 0]} ref={j4} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.2, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.6, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[2.0, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[2.4, 0, 0]} ref={card} {...segmentProps} type={dragged ? 'kinematicPosition' : 'dynamic'}>
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e) => (e.target.releasePointerCapture(e.pointerId), drag(false))}
            onPointerDown={(e) => (e.target.setPointerCapture(e.pointerId), drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation()))))}>
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial map={materials.base.map} map-anisotropy={16} clearcoat={1} clearcoatRoughness={0.15} roughness={0.3} metalness={0.5} />
            </mesh>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>

      {/* The dynamic rope */}
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial 
          color="white" 
          depthTest={false} 
          resolution={[width, height]} 
          useMap 
          map={texture} 
          repeat={[-3, 1]} 
          lineWidth={1} 
        />
      </mesh>
    </>
  )
}
