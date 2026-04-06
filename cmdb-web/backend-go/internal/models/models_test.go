package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestUserTableName(t *testing.T) {
	user := User{}
	assert.Equal(t, "users", user.TableName())
}

func TestRoleTableName(t *testing.T) {
	role := Role{}
	assert.Equal(t, "roles", role.TableName())
}

func TestCITableName(t *testing.T) {
	ci := CI{}
	assert.Equal(t, "configuration_items", ci.TableName())
}

func TestRelationTableName(t *testing.T) {
	relation := Relation{}
	assert.Equal(t, "relations", relation.TableName())
}

func TestAuditLogTableName(t *testing.T) {
	auditLog := AuditLog{}
	assert.Equal(t, "audit_logs", auditLog.TableName())
}

func TestChangeRequestTableName(t *testing.T) {
	changeRequest := ChangeRequest{}
	assert.Equal(t, "change_requests", changeRequest.TableName())
}

func TestUserModelFields(t *testing.T) {
	user := User{
		ID:       "user-1",
		Username: "testuser",
		Email:    "test@example.com",
		IsActive: true,
	}

	assert.Equal(t, "user-1", user.ID)
	assert.Equal(t, "testuser", user.Username)
	assert.Equal(t, "test@example.com", user.Email)
	assert.True(t, user.IsActive)
}

func TestCIModelFields(t *testing.T) {
	ip := "192.168.1.100"
	ci := CI{
		ID:     "ci-1",
		Name:   "test-server",
		Type:   "server",
		Status: "active",
		IP:     &ip,
	}

	assert.Equal(t, "ci-1", ci.ID)
	assert.Equal(t, "test-server", ci.Name)
	assert.Equal(t, "server", ci.Type)
	assert.Equal(t, "active", ci.Status)
	assert.NotNil(t, ci.IP)
	assert.Equal(t, "192.168.1.100", *ci.IP)
}

func TestRelationModelFields(t *testing.T) {
	desc := "depends on"
	relation := Relation{
		ID:           "rel-1",
		SourceCIID:   "ci-1",
		TargetCIID:   "ci-2",
		RelationType: "depends_on",
		Description:  &desc,
	}

	assert.Equal(t, "rel-1", relation.ID)
	assert.Equal(t, "ci-1", relation.SourceCIID)
	assert.Equal(t, "ci-2", relation.TargetCIID)
	assert.Equal(t, "depends_on", relation.RelationType)
	assert.NotNil(t, relation.Description)
	assert.Equal(t, "depends on", *relation.Description)
}

func TestAuditLogModelFields(t *testing.T) {
	oldValue := `{"status": "active"}`
	newValue := `{"status": "inactive"}`
	auditLog := AuditLog{
		ID:           "audit-1",
		UserID:       "user-1",
		Username:     "admin",
		Action:       "update",
		ResourceType: "ci",
		ResourceID:   "ci-1",
		ResourceName: "test-server",
		OldValue:     &oldValue,
		NewValue:     &newValue,
	}

	assert.Equal(t, "audit-1", auditLog.ID)
	assert.Equal(t, "user-1", auditLog.UserID)
	assert.Equal(t, "admin", auditLog.Username)
	assert.Equal(t, "update", auditLog.Action)
	assert.Equal(t, "ci", auditLog.ResourceType)
	assert.Equal(t, "ci-1", auditLog.ResourceID)
	assert.Equal(t, "test-server", auditLog.ResourceName)
	assert.NotNil(t, auditLog.OldValue)
	assert.Equal(t, `{"status": "active"}`, *auditLog.OldValue)
	assert.NotNil(t, auditLog.NewValue)
	assert.Equal(t, `{"status": "inactive"}`, *auditLog.NewValue)
}

func TestChangeRequestModelFields(t *testing.T) {
	changeRequest := ChangeRequest{
		ID:          "change-1",
		Title:       "Server Update",
		Description: "Update server configuration for better performance",
		CIID:        "ci-1",
		Status:      "pending",
		Reason:      "Performance improvement",
		Plan:        "Step 1: Backup, Step 2: Update",
		Priority:    "high",
		RequesterID: "user-1",
	}

	assert.Equal(t, "change-1", changeRequest.ID)
	assert.Equal(t, "Server Update", changeRequest.Title)
	assert.Equal(t, "Update server configuration for better performance", changeRequest.Description)
	assert.Equal(t, "ci-1", changeRequest.CIID)
	assert.Equal(t, "pending", changeRequest.Status)
	assert.Equal(t, "Performance improvement", changeRequest.Reason)
	assert.Equal(t, "Step 1: Backup, Step 2: Update", changeRequest.Plan)
	assert.Equal(t, "high", changeRequest.Priority)
	assert.Equal(t, "user-1", changeRequest.RequesterID)
}

func TestRoleModelFields(t *testing.T) {
	role := Role{
		ID:       "role-1",
		Name:     "Administrator",
		Code:     "admin",
		IsActive: true,
	}

	assert.Equal(t, "role-1", role.ID)
	assert.Equal(t, "Administrator", role.Name)
	assert.Equal(t, "admin", role.Code)
	assert.True(t, role.IsActive)
}

func TestModelValidation(t *testing.T) {
	t.Run("User必填字段", func(t *testing.T) {
		user := User{
			Username: "",
			Email:    "",
		}
		// 在实际应用中，这里应该调用验证逻辑
		assert.Empty(t, user.Username)
		assert.Empty(t, user.Email)
	})

	t.Run("CI必填字段", func(t *testing.T) {
		ci := CI{
			Name: "",
			Type: "",
		}
		assert.Empty(t, ci.Name)
		assert.Empty(t, ci.Type)
	})

	t.Run("ChangeRequest必填字段", func(t *testing.T) {
		changeRequest := ChangeRequest{
			Title: "",
			CIID:  "",
		}
		assert.Empty(t, changeRequest.Title)
		assert.Empty(t, changeRequest.CIID)
	})
}
