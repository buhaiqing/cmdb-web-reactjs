package routes

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"cmdb-go/internal/database"
	"cmdb-go/internal/models"
	"cmdb-go/internal/schemas"
)

func ListNotifications(c *gin.Context) {
	userID, _ := c.Get("user_id")
	page := 1
	pageSize := 20

	if p := c.Query("page"); p != "" {
		page = parseInt(p)
	}
	if ps := c.Query("pageSize"); ps != "" {
		pageSize = parseInt(ps)
	}

	isRead := c.Query("is_read")
	notifType := c.Query("type")

	db := database.GetDB()
	query := db.Model(&models.Notification{}).Where("user_id = ?", userID)

	if isRead != "" {
		if isRead == "true" {
			query = query.Where("is_read = ?", true)
		} else {
			query = query.Where("is_read = ?", false)
		}
	}
	if notifType != "" {
		query = query.Where("type = ?", notifType)
	}

	var total int64
	query.Count(&total)

	var notifications []models.Notification
	query.Offset((page - 1) * pageSize).Limit(pageSize).Order("created_at DESC").Find(&notifications)

	notifList := make([]gin.H, len(notifications))
	for i, n := range notifications {
		notifList[i] = gin.H{
			"id":           n.ID,
			"user_id":      n.UserID,
			"type":         n.Type,
			"title":        n.Title,
			"content":      n.Content,
			"related_id":   n.RelatedID,
			"related_type": n.RelatedType,
			"is_read":      n.IsRead,
			"read_at":      n.ReadAt,
			"created_at":   n.CreatedAt.Format("2006-01-02 15:04:05"),
		}
	}

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "ok",
		Data: gin.H{
			"items": notifList,
			"total": total,
		},
	})
}

func GetUnreadCount(c *gin.Context) {
	userID, _ := c.Get("user_id")

	db := database.GetDB()
	var count int64
	db.Model(&models.Notification{}).Where("user_id = ? AND is_read = ?", userID, false).Count(&count)

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "ok",
		Data: gin.H{
			"unread_count": count,
		},
	})
}

func MarkAsRead(c *gin.Context) {
	notifID := c.Param("id")
	userID, _ := c.Get("user_id")

	db := database.GetDB()
	var notification models.Notification
	if err := db.Where("id = ? AND user_id = ?", notifID, userID).First(&notification).Error; err != nil {
		c.JSON(http.StatusNotFound, schemas.BaseResponse{
			Success: false,
			Message: "通知不存在",
		})
		return
	}

	now := time.Now()
	notification.IsRead = true
	notification.ReadAt = &now

	if err := db.Save(&notification).Error; err != nil {
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "标记已读失败",
		})
		return
	}

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "标记已读成功",
	})
}

func MarkAllAsRead(c *gin.Context) {
	userID, _ := c.Get("user_id")

	db := database.GetDB()
	now := time.Now()

	if err := db.Model(&models.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Updates(map[string]interface{}{"is_read": true, "read_at": now}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "标记全部已读失败",
		})
		return
	}

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "标记全部已读成功",
	})
}

func DeleteNotification(c *gin.Context) {
	notifID := c.Param("id")
	userID, _ := c.Get("user_id")

	db := database.GetDB()
	var notification models.Notification
	if err := db.Where("id = ? AND user_id = ?", notifID, userID).First(&notification).Error; err != nil {
		c.JSON(http.StatusNotFound, schemas.BaseResponse{
			Success: false,
			Message: "通知不存在",
		})
		return
	}

	if err := db.Delete(&notification).Error; err != nil {
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "删除通知失败",
		})
		return
	}

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "删除通知成功",
	})
}

func CreateNotification(userId string, notifType string, title string, content string, relatedId string, relatedType string) error {
	db := database.GetDB()
	notification := models.Notification{
		ID:          uuid.New().String(),
		UserID:      userId,
		Type:        notifType,
		Title:       title,
		Content:     content,
		RelatedID:   &relatedId,
		RelatedType: &relatedType,
		IsRead:      false,
	}
	return db.Create(&notification).Error
}

func parseInt(s string) int {
	result := 0
	for _, c := range s {
		if c >= '0' && c <= '9' {
			result = result*10 + int(c-'0')
		}
	}
	return result
}
