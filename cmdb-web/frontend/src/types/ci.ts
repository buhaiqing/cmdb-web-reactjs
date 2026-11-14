export interface CI {
  id: string
  name: string
  type: string
  status: string
  ip?: string
  cpu?: string
  memory?: string
  disk?: string
  os?: string
  project?: string
  environment?: string
  tags?: string[]
  description?: string
  createdAt: string
  updatedAt: string
}
