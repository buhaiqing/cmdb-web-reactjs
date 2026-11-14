export interface Change {
  id: string
  title: string
  ciId: string
  ciName?: string
  changeType: string
  description: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  createdBy?: string
  approvedBy?: string
  approvedAt?: string
  createdAt: string
  updatedAt?: string
}
