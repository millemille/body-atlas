import { L } from '@/atlas/layout'
import { Tube } from '../primitives'
import { StructureGroup } from '../StructureGroup'

export function NerveLayer() {
  return (
    <group>
      <StructureGroup id="spinal-cord">
        <Tube
          points={[
            [0, 1.5, -0.04],
            [0, 1.36, -0.05],
            [0, 1.18, -0.05],
            [0, 1.0, -0.04],
            [0, 0.9, -0.03],
          ]}
          radius={0.0038}
          system="nerve"
          tubular={64}
        />
      </StructureGroup>

      <StructureGroup id="brachial-plexus">
        <Tube
          points={[
            [0, 1.44, -0.02],
            [-0.08, 1.4, 0.01],
            [-0.18, 1.34, 0.01],
            [-0.24, 1.2, 0.02],
            [-0.27, 1.08, 0.03],
          ]}
          radius={0.0028}
          system="nerve"
        />
        <Tube
          points={[
            [0, 1.44, -0.02],
            [0.08, 1.4, 0.01],
            [0.18, 1.34, 0.01],
            [0.24, 1.2, 0.02],
            [0.27, 1.08, 0.03],
          ]}
          radius={0.0028}
          system="nerve"
        />
      </StructureGroup>

      <StructureGroup id="sciatic-nerves">
        <Tube
          points={[
            [-0.04, 0.9, -0.04],
            [-0.09, 0.78, -0.02],
            [-0.1, 0.62, 0],
            [-0.11, 0.48, 0.02],
            [-0.1, 0.28, 0.01],
          ]}
          radius={0.0032}
          system="nerve"
        />
        <Tube
          points={[
            [0.04, 0.9, -0.04],
            [0.09, 0.78, -0.02],
            [0.1, 0.62, 0],
            [0.11, 0.48, 0.02],
            [0.1, 0.28, 0.01],
          ]}
          radius={0.0032}
          system="nerve"
        />
      </StructureGroup>

      <StructureGroup id="median-nerves">
        <Tube
          points={[
            [-0.27, 1.08, 0.03],
            [-0.28, 0.96, 0.04],
            [-0.3, 0.8, 0.05],
          ]}
          radius={0.0022}
          system="nerve"
        />
        <Tube
          points={[
            [0.27, 1.08, 0.03],
            [0.28, 0.96, 0.04],
            [0.3, 0.8, 0.05],
          ]}
          radius={0.0022}
          system="nerve"
        />
      </StructureGroup>

      <StructureGroup id="femoral-nerves">
        <Tube
          points={[
            [-0.04, 0.9, 0.04],
            L.hipL,
            [-0.1, 0.66, 0.05],
            [-0.11, 0.5, 0.04],
          ]}
          radius={0.0026}
          system="nerve"
        />
        <Tube
          points={[
            [0.04, 0.9, 0.04],
            L.hipR,
            [0.1, 0.66, 0.05],
            [0.11, 0.5, 0.04],
          ]}
          radius={0.0026}
          system="nerve"
        />
      </StructureGroup>
    </group>
  )
}
