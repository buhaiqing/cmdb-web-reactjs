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

func setupCITypesTestDB(t *testing.T) *gorm.DB {
	db := setupTestDB()

	db.AutoMigrate(&models.CIType{})

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

func TestListCITypes(t *testing.T) {
	db := setupCITypesTestDB(t)
	_ = db

	router := setupTestRouter()
	router.GET("/api/ci-types", middleware.AuthMiddleware(), ListCITypes)

	token := getTestToken()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/ci-types", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCreateCIType(t *testing.T) {
	db := setupCITypesTestDB(t)
	_ = db

	router := setupTestRouter()
	router.POST("/api/ci-types", middleware.AuthMiddleware(), CreateCIType)

	token := getTestToken()

	t.Run("创建CI类型_成功", func(t *testing.T) {
		ciTypeData := `{"name":"服务器","code":"server","icon":"desktop"}`
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/ci-types", bytes.NewBufferString(ciTypeData))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)
		assert.Contains(t, w.Body.String(), "类型创建成功")
	})

	t.Run("创建CI类型_缺少必填字段", func(t *testing.T) {
		invalidData := `{"name":"测试"}`
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/ci-types", bytes.NewBufferString(invalidData))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestGetCIType(t *testing.T) {
	db := setupCITypesTestDB(t)

	ciType := models.CIType{ID: "ci-type-1", Name: "服务器", Code: "server", IsActive: true}
	db.Create(&ciType)

	router := setupTestRouter()
	router.GET("/api/ci-types/:id", middleware.AuthMiddleware(), GetCIType)

	token := getTestToken()

	t.Run("获取CI类型_存在", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/ci-types/ci-type-1", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		assert.Contains(t, w.Body.String(), "服务器")
	})

	t.Run("获取CI类型_不存在", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/ci-types/non-existent", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}

func TestUpdateCIType(t *testing.T) {
	db := setupCITypesTestDB(t)

	ciType := models.CIType{ID: "ci-type-update-1", Name: "服务器", Code: "server", IsActive: true}
	db.Create(&ciType)

	router := setupTestRouter()
	router.PUT("/api/ci-types/:id", middleware.AuthMiddleware(), UpdateCIType)

	token := getTestToken()

	t.Run("更新CI类型_成功", func(t *testing.T) {
		name := "更新后的服务器"
		updateData := `{"name":"更新后的服务器","description":"更新描述"}`
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("PUT", "/api/ci-types/ci-type-update-1", bytes.NewBufferString(updateData))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var updated models.CIType
		db.First(&updated, "id = ?", "ci-type-update-1")
		assert.Equal(t, name, updated.Name)
	})

	t.Run("更新CI类型_不存在", func(t *testing.T) {
		updateData := `{"name":"测试"}`
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("PUT", "/api/ci-types/non-existent", bytes.NewBufferString(updateData))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}

func TestDeleteCIType(t *testing.T) {
	db := setupCITypesTestDB(t)

	ciType := models.CIType{ID: "ci-type-delete-1", Name: "服务器", Code: "server", IsActive: true}
	db.Create(&ciType)

	router := setupTestRouter()
	router.DELETE("/api/ci-types/:id", middleware.AuthMiddleware(), DeleteCIType)

	token := getTestToken()

	t.Run("删除CI类型_成功", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("DELETE", "/api/ci-types/ci-type-delete-1", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("删除CI类型_不存在", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("DELETE", "/api/ci-types/non-existent", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}
