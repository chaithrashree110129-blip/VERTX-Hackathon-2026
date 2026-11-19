export interface Finding {
  title: string
  detail: string
  basis: string
  severity: 'info' | 'warning' | 'critical'
}

export interface UnavailableCapability {
  name: string
  reason: string
}

export interface ArtifactFile {
  name: string
  label: string
  mime: string
  path?: string
}

export interface AnalysisPayload {
  module: string
  status: string
  engine: string
  limitations: string[]
  unavailable: UnavailableCapability[]
  measurements: Record<string, any>
  findings: Finding[]
  artifacts: ArtifactFile[]
}

export interface EvidenceItem {
  id: string
  investigation_id: string
  kind: 'image' | 'video' | 'audio' | 'document'
  filename: string
  stored_name: string
  sha256: string
  size_bytes: number
  mime?: string
  created_at: string
  analysis?: AnalysisPayload | null
}

export interface GraphNode {
  id: string
  kind: string
  label: string
  sha256?: string
  derived?: boolean
}

export interface GraphEdge {
  source: string
  target: string
  relation: string
  note?: string
}

export interface CorrelationPayload {
  nodes: GraphNode[]
  edges: GraphEdge[]
  findings: Array<{
    title: string
    detail: string
    kind?: string
  }>
  limitations: string[]
}

export interface Investigation {
  id: string
  title: string
  created_at: string
  modules: string[]
  investigator_name: string
  evidence: EvidenceItem[]
  correlation?: CorrelationPayload | null
}

export interface SystemCapabilities {
  api: { available: boolean; detail: string }
  opencv: { available: boolean; detail: string }
  pillow: { available: boolean; detail: string }
  ffmpeg: { available: boolean; detail: string }
  deepfake_classifier: { available: boolean; detail: string }
  whisper: { available: boolean; detail: string }
  mediapipe: { available: boolean; detail: string }
}
