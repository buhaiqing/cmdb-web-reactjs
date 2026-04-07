package routes

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"cmdb-go/internal/database"
	"cmdb-go/internal/models"
	"cmdb-go/internal/schemas"
)

func GetResourceTrend(c *gin.Context) {
	db := database.GetDB()

	period := c.DefaultQuery("period", "7")

	var days int
	switch period {
	case "30":
		days = 30
	case "90":
		days = 90
	default:
		days = 7
	}

	type TrendPoint struct {
		Date       string `json:"date"`
		Server     int64  `json:"server"`
		Database   int64  `json:"database"`
		Middleware int64  `json:"middleware"`
		Container  int64  `json:"container"`
		Total      int64  `json:"total"`
	}

	trendData := make([]TrendPoint, days)

	for i := days - 1; i >= 0; i-- {
		date := getDateDaysAgo(i)

		var serverCount, databaseCount, middlewareCount, containerCount int64
		db.Model(&models.CI{}).Where("type = ? AND DATE(created_at) <= ?", "server", date).Count(&serverCount)
		db.Model(&models.CI{}).Where("type = ? AND DATE(created_at) <= ?", "database", date).Count(&databaseCount)
		db.Model(&models.CI{}).Where("type = ? AND DATE(created_at) <= ?", "middleware", date).Count(&middlewareCount)
		db.Model(&models.CI{}).Where("type = ? AND DATE(created_at) <= ?", "container", date).Count(&containerCount)

		trendData[days-1-i] = TrendPoint{
			Date:       date,
			Server:     serverCount,
			Database:   databaseCount,
			Middleware: middlewareCount,
			Container:  containerCount,
			Total:      serverCount + databaseCount + middlewareCount + containerCount,
		}
	}

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "ok",
		Data: gin.H{
			"period": period,
			"trend":  trendData,
		},
	})
}

func GetDashboardSummary(c *gin.Context) {
	db := database.GetDB()

	var ciTotal, ciActive, ciInactive int64
	db.Model(&models.CI{}).Count(&ciTotal)
	db.Model(&models.CI{}).Where("status = ?", "active").Count(&ciActive)
	db.Model(&models.CI{}).Where("status = ?", "inactive").Count(&ciInactive)

	var changeTotal, changePending, changeApproved, changeRejected, changeCompleted int64
	db.Model(&models.ChangeRequest{}).Count(&changeTotal)
	db.Model(&models.ChangeRequest{}).Where("status = ?", "pending").Count(&changePending)
	db.Model(&models.ChangeRequest{}).Where("status = ?", "approved").Count(&changeApproved)
	db.Model(&models.ChangeRequest{}).Where("status = ?", "rejected").Count(&changeRejected)
	db.Model(&models.ChangeRequest{}).Where("status = ?", "completed").Count(&changeCompleted)

	var relationTotal int64
	db.Model(&models.Relation{}).Count(&relationTotal)

	var userTotal int64
	db.Model(&models.User{}).Where("is_active = ?", true).Count(&userTotal)

	var tagTotal int64
	db.Model(&models.Tag{}).Count(&tagTotal)

	var ciTypeTotal int64
	db.Model(&models.CIType{}).Count(&ciTypeTotal)

	type EnvCount struct {
		Environment string `json:"environment"`
		Count       int64  `json:"count"`
	}
	var envCounts []EnvCount
	db.Model(&models.CI{}).Select("environment, count(*) as count").Group("environment").Scan(&envCounts)

	type ProjectCount struct {
		Project string `json:"project"`
		Count   int64  `json:"count"`
	}
	var projectCounts []ProjectCount
	db.Model(&models.CI{}).Select("project, count(*) as count").Group("project").Scan(&projectCounts)

	type TypeCount struct {
		Type  string `json:"type"`
		Count int64  `json:"count"`
	}
	var typeCounts []TypeCount
	db.Model(&models.CI{}).Select("type, count(*) as count").Group("type").Scan(&typeCounts)

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "ok",
		Data: gin.H{
			"ci": gin.H{
				"total":      ciTotal,
				"active":     ciActive,
				"inactive":   ciInactive,
				"by_type":    typeCounts,
				"by_env":     envCounts,
				"by_project": projectCounts,
			},
			"change": gin.H{
				"total":     changeTotal,
				"pending":   changePending,
				"approved":  changeApproved,
				"rejected":  changeRejected,
				"completed": changeCompleted,
			},
			"relation": relationTotal,
			"user":     userTotal,
			"tag":      tagTotal,
			"ci_type":  ciTypeTotal,
		},
	})
}

func getDateDaysAgo(days int) string {
	return time.Now().AddDate(0, 0, -days).Format("2006-01-02")
}
