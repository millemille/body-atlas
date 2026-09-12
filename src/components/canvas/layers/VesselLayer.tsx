import { L } from '@/atlas/layout'
import { Tube } from '../primitives'
import { StructureGroup } from '../StructureGroup'

export function VesselLayer() {
  return (
    <group>
      <StructureGroup id="aorta">
        <Tube
          points={[
            [-0.02, 1.26, 0.05],
            [0.01, 1.32, 0.04],
            [0.05, 1.3, 0.03],
            [0.03, 1.18, 0.03],
            [0.015, 1.04, 0.02],
            [0.0, 0.92, 0.01],
          ]}
          radius={0.011}
          system="vessel"
          tubular={64}
          core
        />
        <Tube
          points={[
            [0.0, 0.92, 0.01],
            [-0.05, 0.86, 0.02],
            [-0.09, 0.8, 0.02],
          ]}
          radius={0.009}
          system="vessel"
        />
        <Tube
          points={[
            [0.0, 0.92, 0.01],
            [0.05, 0.86, 0.02],
            [0.09, 0.8, 0.02],
          ]}
          radius={0.009}
          system="vessel"
        />
        {[1.28, 1.2, 1.12, 1.04].map((y, i) => (
          <group key={y}>
            <Tube
              points={[
                [0.02, y, 0.03],
                [-0.08 - i * 0.01, y - 0.01, 0.05],
                [-0.14 - i * 0.01, y - 0.02, 0.02],
              ]}
              radius={0.0045}
              system="vessel"
            />
            <Tube
              points={[
                [0.02, y, 0.03],
                [0.08 + i * 0.01, y - 0.01, 0.05],
                [0.14 + i * 0.01, y - 0.02, 0.02],
              ]}
              radius={0.0045}
              system="vessel"
            />
          </group>
        ))}
      </StructureGroup>

      <StructureGroup id="carotid-arteries">
        <Tube
          points={[
            [-0.02, 1.32, 0.04],
            [-0.035, 1.44, 0.045],
            [-0.032, 1.54, 0.03],
            [-0.028, 1.6, 0.02],
          ]}
          radius={0.0075}
          system="vessel"
          core
        />
        <Tube
          points={[
            [0.02, 1.32, 0.04],
            [0.035, 1.44, 0.045],
            [0.032, 1.54, 0.03],
            [0.028, 1.6, 0.02],
          ]}
          radius={0.0075}
          system="vessel"
          core
        />
        <Tube
          points={[
            [-0.032, 1.54, 0.03],
            [-0.06, 1.58, 0.04],
            [-0.08, 1.62, 0.01],
          ]}
          radius={0.004}
          system="vessel"
        />
        <Tube
          points={[
            [0.032, 1.54, 0.03],
            [0.06, 1.58, 0.04],
            [0.08, 1.62, 0.01],
          ]}
          radius={0.004}
          system="vessel"
        />
      </StructureGroup>

      <StructureGroup id="vena-cava">
        <Tube
          points={[
            [0.055, 1.38, 0.015],
            [0.06, 1.22, 0.018],
            [0.052, 1.06, 0.012],
            [0.045, 0.92, 0.0],
          ]}
          radius={0.01}
          system="vessel"
          slate
          tubular={48}
        />
        <Tube
          points={[
            [0.055, 1.2, 0.018],
            [0.1, 1.16, 0.03],
            [0.13, 1.1, 0.01],
          ]}
          radius={0.005}
          system="vessel"
          slate
        />
        <Tube
          points={[
            [0.05, 1.08, 0.012],
            [-0.02, 1.04, 0.04],
            [-0.08, 1.0, 0.02],
          ]}
          radius={0.005}
          system="vessel"
          slate
        />
      </StructureGroup>

      <StructureGroup id="femoral-arteries">
        <Tube
          points={[
            [-0.04, 0.88, 0.02],
            L.hipL,
            [-0.1, 0.64, 0.04],
            [-0.11, 0.48, 0.03],
            [-0.1, 0.28, 0.02],
            [-0.1, 0.12, 0.01],
          ]}
          radius={0.008}
          system="vessel"
          core
        />
        <Tube
          points={[
            [0.04, 0.88, 0.02],
            L.hipR,
            [0.1, 0.64, 0.04],
            [0.11, 0.48, 0.03],
            [0.1, 0.28, 0.02],
            [0.1, 0.12, 0.01],
          ]}
          radius={0.008}
          system="vessel"
          core
        />
        <Tube
          points={[
            [-0.1, 0.64, 0.04],
            [-0.14, 0.58, 0.06],
            [-0.12, 0.5, 0.02],
          ]}
          radius={0.004}
          system="vessel"
        />
        <Tube
          points={[
            [0.1, 0.64, 0.04],
            [0.14, 0.58, 0.06],
            [0.12, 0.5, 0.02],
          ]}
          radius={0.004}
          system="vessel"
        />
      </StructureGroup>

      <StructureGroup id="subclavian-arteries">
        <Tube
          points={[
            [-0.02, 1.33, 0.04],
            [-0.12, 1.38, 0.03],
            [-0.22, 1.36, 0.01],
            [-0.26, 1.2, 0.02],
            [-0.28, 1.04, 0.03],
            [-0.3, 0.84, 0.05],
          ]}
          radius={0.007}
          system="vessel"
        />
        <Tube
          points={[
            [0.02, 1.33, 0.04],
            [0.12, 1.38, 0.03],
            [0.22, 1.36, 0.01],
            [0.26, 1.2, 0.02],
            [0.28, 1.04, 0.03],
            [0.3, 0.84, 0.05],
          ]}
          radius={0.007}
          system="vessel"
        />
        <Tube
          points={[
            [-0.22, 1.36, 0.01],
            [-0.2, 1.3, -0.06],
            [-0.16, 1.24, -0.08],
          ]}
          radius={0.004}
          system="vessel"
        />
        <Tube
          points={[
            [0.22, 1.36, 0.01],
            [0.2, 1.3, -0.06],
            [0.16, 1.24, -0.08],
          ]}
          radius={0.004}
          system="vessel"
        />
      </StructureGroup>
    </group>
  )
}
