export interface AuditLog {
  id: string
  user: string
  userId: string
  action: string
  actionName: string
  resource: string
  resourceType: string
  resourceId: string
  ip: string
  userAgent: string
  createdAt: string
  status: 'success' | 'failed'
  details?: string
  oldValue?: string
  newValue?: string
}
