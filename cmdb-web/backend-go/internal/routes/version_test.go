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

func setupVersionsTestDB(t *testing.T) *gorm.DB {
	db := setupTestDB()

	db.AutoMigrate(&models.CI{}, &models.CIVersion{})

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

func TestGetCIVersions(t *testing.T) {
	db := setupVersionsTestDB(t)

	ci := models.CI{ID: "version-ci-1", Name: "测试CI", Type: "server", Status: "active"}
	db.Create(&ci)

	version := models.CIVersion{
		ID:        "version-1",
		CIID:      "version-ci-1",
		Version:   1,
		Changes:   "Initial version",
		ChangedBy: "admin",
	}
	db.Create(&version)

	router := setupTestRouter()
	router.GET("/api/versions/ci/:ciId", middleware.AuthMiddleware(), GetCIVersions)

	token := getTestToken()

	t.Run("获取CI版本历史_成功", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/versions/ci/version-ci-1", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("获取CI版本历史_无数据", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/versions/ci/non-existent-ci", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})
}

func TestGetCIVersionDetail(t *testing.T) {
	db := setupVersionsTestDB(t)

	ci := models.CI{ID: "version-detail-ci-1", Name: "测试CI", Type: "server", Status: "active"}
	db.Create(&ci)

	version := models.CIVersion{
		ID:        "version-detail-1",
		CIID:      "version-detail-ci-1",
		Version:   1,
		Changes:   "Initial version",
		ChangedBy: "admin",
		Snapshot:  `{"name":"test"}`,
	}
	db.Create(&version)

	router := setupTestRouter()
	router.GET("/api/versions/ci/:ciId/:version", middleware.AuthMiddleware(), GetCIVersionDetail)

	token := getTestToken()

	t.Run("获取CI版本详情_成功", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/versions/ci/version-detail-ci-1/1", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("获取CI版本详情_版本不存在", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/versions/ci/version-detail-ci-1/999", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}

func TestRollbackCIVersion(t *testing.T) {
	db := setupVersionsTestDB(t)

	ci := models.CI{ID: "rollback-ci-1", Name: "待回滚CI", Type: "server", Status: "active"}
	db.Create(&ci)

	version := models.CIVersion{
		ID:        "rollback-version-1",
		CIID:      "rollback-ci-1",
		Version:   1,
		Changes:   "Initial",
		ChangedBy: "admin",
		Snapshot:  `{"name":"待回滚CI","type":"server","status":"active"}`,
	}
	db.Create(&version)

	router := setupTestRouter()
	router.POST("/api/versions/ci/:ciId/rollback/:version", middleware.AuthMiddleware(), RollbackCIVersion)

	token := getTestToken()

	t.Run("回滚CI版本_成功", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/versions/ci/rollback-ci-1/rollback/1", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		assert.Contains(t, w.Body.String(), "回滚成功")
	})

	t.Run("回滚CI版本_版本不存在", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/versions/ci/rollback-ci-1/rollback/999", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})

	t.Run("回滚CI版本_CI不存在", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/versions/ci/non-existent/rollback/1", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}
