package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"cmdb-go/internal/schemas"
)

// builtInPermissions 系统内置权限列表
var builtInPermissions = []gin.H{
	{"id": "perm-ci-read", "name": "查看配置项", "code": "ci:read", "description": "查看配置项列表和详情"},
	{"id": "perm-ci-write", "name": "管理配置项", "code": "ci:write", "description": "创建、编辑和删除配置项"},
	{"id": "perm-change-read", "name": "查看变更请求", "code": "change:read", "description": "查看变更请求列表和详情"},
	{"id": "perm-change-write", "name": "创建变更请求", "code": "change:write", "description": "创建和编辑变更请求"},
	{"id": "perm-change-approve", "name": "审批变更请求", "code": "change:approve", "description": "审批或拒绝变更请求"},
	{"id": "perm-user-read", "name": "查看用户", "code": "user:read", "description": "查看用户列表和详情"},
	{"id": "perm-user-write", "name": "管理用户", "code": "user:write", "description": "创建、编辑和删除用户"},
	{"id": "perm-role-read", "name": "查看角色", "code": "role:read", "description": "查看角色列表和详情"},
	{"id": "perm-role-write", "name": "管理角色", "code": "role:write", "description": "创建、编辑和删除角色"},
	{"id": "perm-relation-read", "name": "查看关系", "code": "relation:read", "description": "查看配置项关系和拓扑图"},
	{"id": "perm-relation-write", "name": "管理关系", "code": "relation:write", "description": "创建、编辑和删除配置项关系"},
	{"id": "perm-audit-read", "name": "查看审计日志", "code": "audit:read", "description": "查看系统审计日志"},
	{"id": "perm-dashboard-read", "name": "查看仪表盘", "code": "dashboard:read", "description": "查看系统仪表盘和统计信息"},
}

// ListPermissions 获取所有权限列表
func ListPermissions(c *gin.Context) {
	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "ok",
		Data:    builtInPermissions,
	})
}
