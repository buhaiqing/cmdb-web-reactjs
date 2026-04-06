package routes

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"cmdb-go/internal/database"
	"cmdb-go/internal/models"
	"cmdb-go/internal/schemas"
)

// ListRelations 获取关系列表
func ListRelations(c *gin.Context) {
	ciID := c.Query("ci_id")
	relationType := c.Query("relation_type")

	db := database.GetDB()
	query := db.Model(&models.Relation{})

	if ciID != "" {
		query = query.Where("source_ci_id = ? OR target_ci_id = ?", ciID, ciID)
	}
	if relationType != "" {
		query = query.Where("relation_type = ?", relationType)
	}

	var relations []models.Relation
	query.Order("created_at DESC").Find(&relations)

	relationList := make([]gin.H, len(relations))
	for i, r := range relations {
		relationList[i] = gin.H{
			"id":           r.ID,
			"sourceCI":     r.SourceCIID,
			"targetCI":     r.TargetCIID,
			"relationType": r.RelationType,
			"description":  r.Description,
			"createdAt":    r.CreatedAt.Format("2006-01-02 15:04:05"),
			"updatedAt":    r.UpdatedAt.Format("2006-01-02 15:04:05"),
		}
	}

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "ok",
		Data:    relationList,
	})
}

// CreateRelation 创建关系
func CreateRelation(c *gin.Context) {
	var req schemas.RelationCreate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schemas.BaseResponse{
			Success: false,
			Message: "请求参数错误",
		})
		return
	}

	// 获取当前用户
	userID, _ := c.Get("user_id")
	username, _ := c.Get("username")

	db := database.GetDB()

	// 检查源 CI 是否存在
	var sourceCI models.CI
	if err := db.First(&sourceCI, "id = ?", req.SourceCIID).Error; err != nil {
		c.JSON(http.StatusBadRequest, schemas.BaseResponse{
			Success: false,
			Message: "源配置项不存在",
		})
		return
	}

	// 检查目标 CI 是否存在
	var targetCI models.CI
	if err := db.First(&targetCI, "id = ?", req.TargetCIID).Error; err != nil {
		c.JSON(http.StatusBadRequest, schemas.BaseResponse{
			Success: false,
			Message: "目标配置项不存在",
		})
		return
	}

	relation := models.Relation{
		ID:           uuid.New().String(),
		SourceCIID:   req.SourceCIID,
		TargetCIID:   req.TargetCIID,
		RelationType: req.RelationType,
		Description:  req.Description,
	}

	tx := db.Begin()
	if err := tx.Create(&relation).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "创建关系失败",
		})
		return
	}

	// 记录审计日志
	audit := models.AuditLog{
		ID:           uuid.New().String(),
		UserID:       userID.(string),
		Username:     username.(string),
		Action:       "create",
		ResourceType: "relation",
		ResourceID:   relation.ID,
		ResourceName: relation.RelationType,
		NewValue:     toJSON(req),
	}
	tx.Create(&audit)
	tx.Commit()

	c.JSON(http.StatusCreated, schemas.BaseResponse{
		Success: true,
		Message: "关系创建成功",
		Data:    gin.H{"id": relation.ID},
	})
}

// GetRelation 获取关系详情
func GetRelation(c *gin.Context) {
	relationID := c.Param("id")

	db := database.GetDB()
	var relation models.Relation
	if err := db.First(&relation, "id = ?", relationID).Error; err != nil {
		c.JSON(http.StatusNotFound, schemas.BaseResponse{
			Success: false,
			Message: "关系不存在",
		})
		return
	}

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "ok",
		Data: gin.H{
			"id":           relation.ID,
			"sourceCI":     relation.SourceCIID,
			"targetCI":     relation.TargetCIID,
			"relationType": relation.RelationType,
			"description":  relation.Description,
			"createdAt":    relation.CreatedAt.Format("2006-01-02 15:04:05"),
			"updatedAt":    relation.UpdatedAt.Format("2006-01-02 15:04:05"),
		},
	})
}

// UpdateRelation 更新关系
func UpdateRelation(c *gin.Context) {
	relationID := c.Param("id")

	var req schemas.RelationUpdate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schemas.BaseResponse{
			Success: false,
			Message: "请求参数错误",
		})
		return
	}

	// 获取当前用户
	userID, _ := c.Get("user_id")
	username, _ := c.Get("username")

	db := database.GetDB()
	var relation models.Relation
	if err := db.First(&relation, "id = ?", relationID).Error; err != nil {
		c.JSON(http.StatusNotFound, schemas.BaseResponse{
			Success: false,
			Message: "关系不存在",
		})
		return
	}

	// 保存旧值
	oldValue := gin.H{
		"sourceCI":     relation.SourceCIID,
		"targetCI":     relation.TargetCIID,
		"relationType": relation.RelationType,
		"description":  relation.Description,
	}

	// 更新字段
	if req.RelationType != nil {
		relation.RelationType = *req.RelationType
	}
	if req.Description != nil {
		relation.Description = req.Description
	}

	tx := db.Begin()
	if err := tx.Save(&relation).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "更新关系失败",
		})
		return
	}

	// 记录审计日志
	audit := models.AuditLog{
		ID:           uuid.New().String(),
		UserID:       userID.(string),
		Username:     username.(string),
		Action:       "update",
		ResourceType: "relation",
		ResourceID:   relation.ID,
		ResourceName: relation.RelationType,
		OldValue:     toJSON(oldValue),
		NewValue:     toJSON(req),
	}
	tx.Create(&audit)
	tx.Commit()

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "关系更新成功",
	})
}

// DeleteRelation 删除关系
func DeleteRelation(c *gin.Context) {
	relationID := c.Param("id")

	// 获取当前用户
	userID, _ := c.Get("user_id")
	username, _ := c.Get("username")

	db := database.GetDB()
	var relation models.Relation
	if err := db.First(&relation, "id = ?", relationID).Error; err != nil {
		c.JSON(http.StatusNotFound, schemas.BaseResponse{
			Success: false,
			Message: "关系不存在",
		})
		return
	}

	tx := db.Begin()

	// 记录审计日志
	audit := models.AuditLog{
		ID:           uuid.New().String(),
		UserID:       userID.(string),
		Username:     username.(string),
		Action:       "delete",
		ResourceType: "relation",
		ResourceID:   relation.ID,
		ResourceName: relation.RelationType,
	}
	tx.Create(&audit)

	if err := tx.Delete(&relation).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "删除关系失败",
		})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "关系删除成功",
	})
}

// GetRelationGraph 获取关系图数据（节点 + 边）
func GetRelationGraph(c *gin.Context) {
	ciID := c.Query("ciId")
	ciTypesStr := c.Query("ciTypes")
	relationTypesStr := c.Query("relationTypes")
	search := c.Query("search")

	db := database.GetDB()

	// 构建关系查询
	query := db.Model(&models.Relation{})

	// 如果指定了 ciId，只返回与该 CI 相关的关系
	if ciID != "" {
		query = query.Where("source_ci_id = ? OR target_ci_id = ?", ciID, ciID)
	}

	// 按关系类型过滤
	if relationTypesStr != "" {
		relationTypes := strings.Split(relationTypesStr, ",")
		var types []string
		for _, t := range relationTypes {
			t = strings.TrimSpace(t)
			if t != "" {
				types = append(types, t)
			}
		}
		if len(types) > 0 {
			query = query.Where("relation_type IN ?", types)
		}
	}

	var relations []models.Relation
	query.Find(&relations)

	// 收集所有涉及到的 CI ID
	ciIDSet := make(map[string]bool)
	for _, r := range relations {
		ciIDSet[r.SourceCIID] = true
		ciIDSet[r.TargetCIID] = true
	}

	// 如果指定了 ciId 但没有关系，至少包含该 CI 自身作为节点
	if ciID != "" && len(ciIDSet) == 0 {
		ciIDSet[ciID] = true
	}

	// 如果没有指定 ciId 且没有关系，返回空图
	if ciID == "" && len(ciIDSet) == 0 {
		c.JSON(http.StatusOK, schemas.BaseResponse{
			Success: true,
			Message: "ok",
			Data: gin.H{
				"nodes": []gin.H{},
				"edges": []gin.H{},
			},
		})
		return
	}

	// 批量查询所有相关的 CI
	var ciIDs []string
	for id := range ciIDSet {
		ciIDs = append(ciIDs, id)
	}

	ciQuery := db.Model(&models.CI{}).Where("id IN ?", ciIDs)

	// 按 CI 类型过滤
	if ciTypesStr != "" {
		ciTypes := strings.Split(ciTypesStr, ",")
		var types []string
		for _, t := range ciTypes {
			t = strings.TrimSpace(t)
			if t != "" {
				types = append(types, t)
			}
		}
		if len(types) > 0 {
			ciQuery = ciQuery.Where("type IN ?", types)
		}
	}

	// 按名称搜索
	if search != "" {
		ciQuery = ciQuery.Where("name LIKE ?", "%"+search+"%")
	}

	var cis []models.CI
	ciQuery.Find(&cis)

	// 构建 CI map 用于快速查找
	ciMap := make(map[string]models.CI)
	for _, ci := range cis {
		ciMap[ci.ID] = ci
	}

	// 构建节点
	nodes := make([]gin.H, 0, len(cis))
	for _, ci := range cis {
		node := gin.H{
			"id":          ci.ID,
			"name":        ci.Name,
			"type":        ci.Type,
			"status":      ci.Status,
		}
		if ci.IP != nil {
			node["ip"] = *ci.IP
		}
		if ci.Project != nil {
			node["project"] = *ci.Project
		}
		if ci.Environment != nil {
			node["environment"] = *ci.Environment
		}
		if ci.Description != nil {
			node["description"] = *ci.Description
		}
		nodes = append(nodes, node)
	}

	// 构建边（只包含源和目标 CI 都存在的边）
	edges := make([]gin.H, 0, len(relations))
	for _, r := range relations {
		// 如果指定了 ciTypes 或 search 过滤，需要确保边的两端 CI 都通过过滤
		if ciTypesStr != "" || search != "" {
			if _, ok := ciMap[r.SourceCIID]; !ok {
				continue
			}
			if _, ok := ciMap[r.TargetCIID]; !ok {
				continue
			}
		}

		edge := gin.H{
			"id":           r.ID,
			"source":       r.SourceCIID,
			"target":       r.TargetCIID,
			"relationType": r.RelationType,
		}
		if r.Description != nil {
			edge["description"] = *r.Description
		}
		edges = append(edges, edge)
	}

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "ok",
		Data: gin.H{
			"nodes": nodes,
			"edges": edges,
		},
	})
}

// AnalyzeImpact 分析配置项影响（上游和下游依赖）
func AnalyzeImpact(c *gin.Context) {
	ciID := c.Param("ciId")

	db := database.GetDB()

	// 检查 CI 是否存在
	var ci models.CI
	if err := db.First(&ci, "id = ?", ciID).Error; err != nil {
		c.JSON(http.StatusNotFound, schemas.BaseResponse{
			Success: false,
			Message: "配置项不存在",
		})
		return
	}

	// 查找所有与该 CI 相关的关系
	var relations []models.Relation
	db.Preload("SourceCI").Preload("TargetCI").
		Where("source_ci_id = ? OR target_ci_id = ?", ciID, ciID).
		Find(&relations)

	// 构建上游（以该 CI 为目标的关系，即依赖该 CI 的节点）
	upstreamNodes := make([]gin.H, 0)
	// 构建下游（以该 CI 为源的关系，即该 CI 依赖的节点）
	downstreamNodes := make([]gin.H, 0)
	// 直接关系列表
	directRelations := make([]gin.H, 0, len(relations))

	for _, r := range relations {
		// 直接关系
		directRel := gin.H{
			"id":           r.ID,
			"sourceCI": gin.H{
				"id":     r.SourceCI.ID,
				"name":   r.SourceCI.Name,
				"type":   r.SourceCI.Type,
				"status": r.SourceCI.Status,
			},
			"targetCI": gin.H{
				"id":     r.TargetCI.ID,
				"name":   r.TargetCI.Name,
				"type":   r.TargetCI.Type,
				"status": r.TargetCI.Status,
			},
			"relationType": r.RelationType,
		}
		if r.Description != nil {
			directRel["description"] = *r.Description
		}
		directRel["createdAt"] = r.CreatedAt.Format("2006-01-02 15:04:05")
		directRel["updatedAt"] = r.UpdatedAt.Format("2006-01-02 15:04:05")
		directRelations = append(directRelations, directRel)

		// 上游：target 是当前 CI，source 是依赖方
		if r.TargetCIID == ciID {
			upstreamNodes = append(upstreamNodes, gin.H{
				"id":     r.SourceCI.ID,
				"name":   r.SourceCI.Name,
				"type":   r.SourceCI.Type,
				"status": r.SourceCI.Status,
			})
		}

		// 下游：source 是当前 CI，target 是被依赖方
		if r.SourceCIID == ciID {
			downstreamNodes = append(downstreamNodes, gin.H{
				"id":     r.TargetCI.ID,
				"name":   r.TargetCI.Name,
				"type":   r.TargetCI.Type,
				"status": r.TargetCI.Status,
			})
		}
	}

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "ok",
		Data: gin.H{
			"upstream":        upstreamNodes,
			"downstream":      downstreamNodes,
			"directRelations": directRelations,
		},
	})
}
