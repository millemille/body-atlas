import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode; resetKey?: number }
type State = { failed: boolean }

export class SceneErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidUpdate(prev: Props) {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) {
      this.setState({ failed: false })
    }
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="flex h-full items-center justify-center bg-void text-sm text-muted-ink">
          The 3D view hit a recoverable error. Use Reset or refresh.
        </div>
      )
    }
    return this.props.children
  }
}
