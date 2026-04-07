package routes

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"cmdb-go/internal/database"
	"cmdb-go/internal/models"
	"cmdb-go/internal/schemas"
)

func GetCIVersions(c *gin.Context) {
	ciId := c.Param("ciId")

	db := database.GetDB()

	var versions []models.CIVersion
	db.Where("ci_id = ?", ciId).Order("version DESC").Find(&versions)

	versionList := make([]gin.H, len(versions))
	for i, v := range versions {
		versionList[i] = gin.H{
			"id":          v.ID,
			"ci_id":       v.CIID,
			"version":     v.Version,
			"changes":     v.Changes,
			"changed_by":  v.ChangedBy,
			"change_desc": v.ChangeDesc,
			"created_at":  v.CreatedAt.Format("2006-01-02 15:04:05"),
		}
	}

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "ok",
		Data:    versionList,
	})
}

func GetCIVersionDetail(c *gin.Context) {
	ciId := c.Param("ciId")
	versionNum := c.Param("version")

	db := database.GetDB()

	var version models.CIVersion
	if err := db.Where("ci_id = ? AND version = ?", ciId, versionNum).First(&version).Error; err != nil {
		c.JSON(http.StatusNotFound, schemas.BaseResponse{
			Success: false,
			Message: "版本不存在",
		})
		return
	}

	var snapshot map[string]interface{}
	if version.Snapshot != "" {
		json.Unmarshal([]byte(version.Snapshot), &snapshot)
	}

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "ok",
		Data: gin.H{
			"id":          version.ID,
			"ci_id":       version.CIID,
			"version":     version.Version,
			"changes":     version.Changes,
			"changed_by":  version.ChangedBy,
			"change_desc": version.ChangeDesc,
			"snapshot":    snapshot,
			"created_at":  version.CreatedAt.Format("2006-01-02 15:04:05"),
		},
	})
}

func RollbackCIVersion(c *gin.Context) {
	ciId := c.Param("ciId")
	versionNum := c.Param("version")

	db := database.GetDB()

	var version models.CIVersion
	if err := db.Where("ci_id = ? AND version = ?", ciId, versionNum).First(&version).Error; err != nil {
		c.JSON(http.StatusNotFound, schemas.BaseResponse{
			Success: false,
			Message: "版本不存在",
		})
		return
	}

	userID, _ := c.Get("user_id")
	username, _ := c.Get("username")

	var currentCI models.CI
	if err := db.First(&currentCI, "id = ?", ciId).Error; err != nil {
		c.JSON(http.StatusNotFound, schemas.BaseResponse{
			Success: false,
			Message: "配置项不存在",
		})
		return
	}

	oldValue := toJSON(currentCI)

	var snapshot models.CI
	if version.Snapshot != "" {
		json.Unmarshal([]byte(version.Snapshot), &snapshot)
	}

	tx := db.Begin()

	currentCI.Name = snapshot.Name
	currentCI.Type = snapshot.Type
	currentCI.Status = snapshot.Status
	if snapshot.IP != nil {
		currentCI.IP = snapshot.IP
	}
	if snapshot.CPU != nil {
		currentCI.CPU = snapshot.CPU
	}
	if snapshot.Memory != nil {
		currentCI.Memory = snapshot.Memory
	}
	if snapshot.Disk != nil {
		currentCI.Disk = snapshot.Disk
	}
	if snapshot.OS != nil {
		currentCI.OS = snapshot.OS
	}
	if snapshot.Project != nil {
		currentCI.Project = snapshot.Project
	}
	if snapshot.Environment != nil {
		currentCI.Environment = snapshot.Environment
	}
	if snapshot.Tags != nil {
		currentCI.Tags = snapshot.Tags
	}
	if snapshot.Description != nil {
		currentCI.Description = snapshot.Description
	}

	if err := tx.Save(&currentCI).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "回滚失败",
		})
		return
	}

	newMaxVersion := 0
	var maxVersion models.CIVersion
	if err := tx.Where("ci_id = ?", ciId).Order("version DESC").First(&maxVersion).Error; err == nil {
		newMaxVersion = maxVersion.Version
	}
	newVersion := newMaxVersion + 1

	snapshotJSON, _ := json.Marshal(currentCI)
	changes := "rollback to version " + versionNum
	ciVersion := models.CIVersion{
		ID:        uuid.New().String(),
		CIID:      ciId,
		Version:   newVersion,
		Changes:   changes,
		ChangedBy: username.(string),
		Snapshot:  string(snapshotJSON),
	}
	tx.Create(&ciVersion)

	audit := models.AuditLog{
		ID:           uuid.New().String(),
		UserID:       userID.(string),
		Username:     username.(string),
		Action:       "rollback",
		ResourceType: "ci_version",
		ResourceID:   currentCI.ID,
		ResourceName: currentCI.Name,
		OldValue:     oldValue,
		NewValue:     toJSON(currentCI),
	}
	tx.Create(&audit)

	tx.Commit()

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "回滚成功",
		Data: gin.H{
			"version": newVersion,
		},
	})
}

func CreateCIVersion(ciId string, changes string, changeDesc string, changedBy string, ci models.CI, db interface{}) error {
	return nil
}

func RecordCIVersion(db interface{}, ciId string, changes string, changeDesc string, changedBy string, ci models.CI) error {
	return nil
}
