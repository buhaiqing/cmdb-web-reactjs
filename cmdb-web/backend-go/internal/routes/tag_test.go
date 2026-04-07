package routes

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"

	"cmdb-go/internal/database"
	"cmdb-go/internal/middleware"
	"cmdb-go/internal/models"
)

func setupTagsTestDB(t *testing.T) *gorm.DB {
	db := setupTestDB()

	db.AutoMigrate(&models.Tag{})

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

func TestListTags(t *testing.T) {
	db := setupTagsTestDB(t)
	_ = db

	router := setupTestRouter()
	router.GET("/api/tags", middleware.AuthMiddleware(), ListTags)

	token := getTestToken()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/tags", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCreateTag(t *testing.T) {
	db := setupTagsTestDB(t)
	_ = db

	router := setupTestRouter()
	router.POST("/api/tags", middleware.AuthMiddleware(), CreateTag)

	token := getTestToken()

	t.Run("创建标签_成功", func(t *testing.T) {
		tagData := `{"name":"重要","color":"red"}`
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/tags", bytes.NewBufferString(tagData))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)
		assert.Contains(t, w.Body.String(), "标签创建成功")
	})

	t.Run("创建标签_缺少必填字段", func(t *testing.T) {
		invalidData := `{"color":"blue"}`
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/tags", bytes.NewBufferString(invalidData))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestGetTag(t *testing.T) {
	db := setupTagsTestDB(t)

	tag := models.Tag{ID: "tag-1", Name: "测试标签", Color: "blue"}
	db.Create(&tag)

	router := setupTestRouter()
	router.GET("/api/tags/:id", middleware.AuthMiddleware(), GetTag)

	token := getTestToken()

	t.Run("获取标签_存在", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/tags/tag-1", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("获取标签_不存在", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/tags/non-existent", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}

func TestUpdateTag(t *testing.T) {
	db := setupTagsTestDB(t)

	tag := models.Tag{ID: "tag-update-1", Name: "旧标签", Color: "blue"}
	db.Create(&tag)

	router := setupTestRouter()
	router.PUT("/api/tags/:id", middleware.AuthMiddleware(), UpdateTag)

	token := getTestToken()

	t.Run("更新标签_成功", func(t *testing.T) {
		updateData := `{"name":"新标签","color":"green"}`
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("PUT", "/api/tags/tag-update-1", bytes.NewBufferString(updateData))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("更新标签_不存在", func(t *testing.T) {
		updateData := `{"name":"测试"}`
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("PUT", "/api/tags/non-existent", bytes.NewBufferString(updateData))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}

func TestDeleteTag(t *testing.T) {
	db := setupTagsTestDB(t)

	tag := models.Tag{ID: "tag-delete-1", Name: "待删除标签"}
	db.Create(&tag)

	router := setupTestRouter()
	router.DELETE("/api/tags/:id", middleware.AuthMiddleware(), DeleteTag)

	token := getTestToken()

	t.Run("删除标签_成功", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("DELETE", "/api/tags/tag-delete-1", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("删除标签_不存在", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("DELETE", "/api/tags/non-existent", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}
