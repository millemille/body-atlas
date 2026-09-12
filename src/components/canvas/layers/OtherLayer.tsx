import { L } from '@/atlas/layout'
import { AtlasMesh } from '../AtlasMesh'
import { SystemMaterial } from '../materials'
import { StructureGroup } from '../StructureGroup'

export function OtherLayer() {
  return (
    <group>
      <StructureGroup id="brain">
        <AtlasMesh position={L.brain}>
          <sphereGeometry args={[0.082, 24, 18]} />
          <SystemMaterial kind="other" />
        </AtlasMesh>
        <AtlasMesh position={[0.03, 1.63, 0.01]}>
          <sphereGeometry args={[0.058, 18, 14]} />
          <SystemMaterial kind="other" />
        </AtlasMesh>
      </StructureGroup>

      <StructureGroup id="heart">
        <AtlasMesh position={L.heart} rotation={[0.2, 0.4, 0.15]} scale={[1, 1.15, 0.85]}>
          <sphereGeometry args={[0.052, 20, 16]} />
          <SystemMaterial kind="other" />
        </AtlasMesh>
      </StructureGroup>

      <StructureGroup id="lungs">
        <AtlasMesh position={L.lungL} scale={[0.82, 1.12, 0.68]}>
          <sphereGeometry args={[0.1, 22, 16]} />
          <SystemMaterial kind="other" />
        </AtlasMesh>
        <AtlasMesh position={L.lungR} scale={[0.82, 1.12, 0.68]}>
          <sphereGeometry args={[0.1, 22, 16]} />
          <SystemMaterial kind="other" />
        </AtlasMesh>
      </StructureGroup>

      <StructureGroup id="liver">
        <AtlasMesh position={L.liver} scale={[1.15, 0.68, 0.75]} rotation={[0.1, 0.3, 0.1]}>
          <sphereGeometry args={[0.09, 20, 16]} />
          <SystemMaterial kind="other" />
        </AtlasMesh>
      </StructureGroup>

      <StructureGroup id="stomach">
        <AtlasMesh position={L.stomach} scale={[0.9, 0.68, 0.62]} rotation={[0.2, -0.4, 0.2]}>
          <sphereGeometry args={[0.068, 18, 14]} />
          <SystemMaterial kind="other" />
        </AtlasMesh>
      </StructureGroup>

      <StructureGroup id="kidneys">
        <AtlasMesh position={L.kidneyL} rotation={[0.2, 0.2, 0.4]}>
          <sphereGeometry args={[0.036, 16, 12]} />
          <SystemMaterial kind="other" />
        </AtlasMesh>
        <AtlasMesh position={L.kidneyR} rotation={[0.2, -0.2, -0.4]}>
          <sphereGeometry args={[0.036, 16, 12]} />
          <SystemMaterial kind="other" />
        </AtlasMesh>
      </StructureGroup>
    </group>
  )
}
