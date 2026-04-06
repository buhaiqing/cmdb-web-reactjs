package models

import (
	"time"
)

// TimestampMixin 时间戳混合
type TimestampMixin struct {
	CreatedAt time.Time `gorm:"autoCreateTime"`
	UpdatedAt time.Time `gorm:"autoUpdateTime"`
}

// Role 角色模型
type Role struct {
	ID          string  `gorm:"type:varchar(36);primaryKey" json:"id"`
	Name        string  `gorm:"type:varchar(50);uniqueIndex;not null" json:"name"`
	Code        string  `gorm:"type:varchar(50);uniqueIndex;not null" json:"code"`
	Description *string `gorm:"type:varchar(200)" json:"description"`
	Permissions *string `gorm:"type:text" json:"permissions"`
	IsActive    bool    `gorm:"default:true" json:"is_active"`
	Users       []User  `gorm:"foreignKey:RoleID" json:"users"`
	TimestampMixin
}

// User 用户模型
type User struct {
	ID             string     `gorm:"type:varchar(36);primaryKey" json:"id"`
	Username       string     `gorm:"type:varchar(50);uniqueIndex;not null" json:"username"`
	Email          string     `gorm:"type:varchar(100);uniqueIndex;not null" json:"email"`
	HashedPassword string     `gorm:"type:varchar(255);not null" json:"-"`
	RoleID         *string    `gorm:"type:varchar(36);index" json:"role_id"`
	IsActive       bool       `gorm:"default:true" json:"is_active"`
	LastLoginAt    *time.Time `json:"last_login_at"`
	Role           *Role      `gorm:"foreignKey:RoleID" json:"role"`
	TimestampMixin
}

// CI 配置项模型
type CI struct {
	ID          string  `gorm:"type:varchar(36);primaryKey" json:"id"`
	Name        string  `gorm:"type:varchar(200);not null;index" json:"name"`
	Type        string  `gorm:"type:varchar(50);not null;index" json:"type"`
	Status      string  `gorm:"type:varchar(20);default:'active';index" json:"status"`
	IP          *string `gorm:"type:varchar(45)" json:"ip"`
	CPU         *string `gorm:"type:varchar(50)" json:"cpu"`
	Memory      *string `gorm:"type:varchar(50)" json:"memory"`
	Disk        *string `gorm:"type:varchar(50)" json:"disk"`
	OS          *string `gorm:"type:varchar(100)" json:"os"`
	Project     *string `gorm:"type:varchar(100);index" json:"project"`
	Environment *string `gorm:"type:varchar(50);index" json:"environment"`
	Tags        *string `gorm:"type:text" json:"tags"`
	Description *string `gorm:"type:text" json:"description"`
	TimestampMixin
}

// Relation 关系模型
type Relation struct {
	ID           string  `gorm:"type:varchar(36);primaryKey" json:"id"`
	SourceCIID   string  `gorm:"type:varchar(36);not null;index" json:"source_ci_id"`
	TargetCIID   string  `gorm:"type:varchar(36);not null;index" json:"target_ci_id"`
	RelationType string  `gorm:"type:varchar(50);not null;index" json:"relation_type"`
	Description  *string `gorm:"type:text" json:"description"`
	SourceCI     CI      `gorm:"foreignKey:SourceCIID" json:"source_ci"`
	TargetCI     CI      `gorm:"foreignKey:TargetCIID" json:"target_ci"`
	TimestampMixin
}

// AuditLog 审计日志模型
type AuditLog struct {
	ID           string  `gorm:"type:varchar(36);primaryKey" json:"id"`
	UserID       string  `gorm:"type:varchar(36);not null;index" json:"user_id"`
	Username     string  `gorm:"type:varchar(100);not null" json:"username"`
	Action       string  `gorm:"type:varchar(50);not null;index" json:"action"`
	ResourceType string  `gorm:"type:varchar(50);not null;index" json:"resource_type"`
	ResourceID   string  `gorm:"type:varchar(36);index" json:"resource_id"`
	ResourceName string  `gorm:"type:varchar(200)" json:"resource_name"`
	OldValue     *string `gorm:"type:text" json:"old_value"`
	NewValue     *string `gorm:"type:text" json:"new_value"`
	TimestampMixin
}

// ChangeRequest 变更请求模型
type ChangeRequest struct {
	ID            string     `gorm:"type:varchar(36);primaryKey" json:"id"`
	Title         string     `gorm:"type:varchar(200);not null" json:"title"`
	Description   string     `gorm:"type:text" json:"description"`
	CIID          string     `gorm:"type:varchar(36);not null;index" json:"ci_id"`
	Reason        string     `gorm:"type:text" json:"reason"`
	Plan          string     `gorm:"type:text" json:"plan"`
	Status        string     `gorm:"type:varchar(50);default:'pending';index" json:"status"`
	Priority      string     `gorm:"type:varchar(20);default:'medium'" json:"priority"`
	RequesterID   string     `gorm:"type:varchar(36);not null" json:"requester_id"`
	ApproverID    *string    `gorm:"type:varchar(36)" json:"approver_id"`
	ApprovedAt    *time.Time `json:"approved_at"`
	ImplementedAt *time.Time `json:"implemented_at"`
	CI            CI         `gorm:"foreignKey:CIID" json:"ci"`
	TimestampMixin
}

func (Role) TableName() string {
	return "roles"
}

func (User) TableName() string {
	return "users"
}

func (CI) TableName() string {
	return "configuration_items"
}

func (Relation) TableName() string {
	return "relations"
}

func (AuditLog) TableName() string {
	return "audit_logs"
}

func (ChangeRequest) TableName() string {
	return "change_requests"
}
