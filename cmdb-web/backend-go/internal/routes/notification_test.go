package routes

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"

	"cmdb-go/internal/database"
	"cmdb-go/internal/middleware"
	"cmdb-go/internal/models"
)

func setupNotificationsTestDB(t *testing.T) *gorm.DB {
	db := setupTestDB()

	db.AutoMigrate(&models.Notification{})

	seedTestUsersForDB(db)

	testDBMutex.Lock()
	originalDB := database.GetDB()
	database.DB = db
	testDBMutex.Unlock()

	t.Cleanup(func() {
		testDBMutex.Lock()
		database.DB = originalDB
		testDBMutex.Unlock()
		sqlDB, _ := db.DB()
		sqlDB.Close()
	})

	return db
}

func TestListNotifications(t *testing.T) {
	db := setupNotificationsTestDB(t)
	_ = db

	router := setupTestRouter()
	router.GET("/api/notifications", middleware.AuthMiddleware(), ListNotifications)

	token := getTestToken()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/notifications", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "items")
}

func TestGetUnreadCount(t *testing.T) {
	db := setupNotificationsTestDB(t)
	_ = db

	router := setupTestRouter()
	router.GET("/api/notifications/unread-count", middleware.AuthMiddleware(), GetUnreadCount)

	token := getTestToken()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/notifications/unread-count", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "unread_count")
}

func TestMarkAsRead(t *testing.T) {
	db := setupNotificationsTestDB(t)
	_ = db

	router := setupTestRouter()
	router.POST("/api/notifications/:id/read", middleware.AuthMiddleware(), MarkAsRead)

	token := getTestToken()

	t.Run("标记已读_不存在", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/notifications/non-existent/read", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}

func TestMarkAllAsRead(t *testing.T) {
	db := setupNotificationsTestDB(t)
	_ = db

	router := setupTestRouter()
	router.POST("/api/notifications/read-all", middleware.AuthMiddleware(), MarkAllAsRead)

	token := getTestToken()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/notifications/read-all", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "标记全部已读成功")
}

func TestDeleteNotification(t *testing.T) {
	db := setupNotificationsTestDB(t)
	_ = db

	router := setupTestRouter()
	router.DELETE("/api/notifications/:id", middleware.AuthMiddleware(), DeleteNotification)

	token := getTestToken()

	t.Run("删除通知_不存在", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("DELETE", "/api/notifications/non-existent", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}
