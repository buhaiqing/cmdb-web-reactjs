package security

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"cmdb-go/internal/config"
)

// VerifyPassword 验证密码
func VerifyPassword(plainPassword, hashedPassword string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(plainPassword))
	return err == nil
}

// HashPassword 对密码进行哈希
func HashPassword(password string) (string, error) {
	// 测试环境下使用较低的cost以加速测试
	cost := bcrypt.DefaultCost
	if isTestEnv() {
		cost = 4 // 测试环境使用cost=4，生产环境使用DefaultCost(10)
	}
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), cost)
	return string(bytes), err
}

// isTestEnv 检查是否在测试环境
func isTestEnv() bool {
	return config.GetConfig().DatabaseURL == ":memory:"
}

// CreateAccessToken 创建 JWT Token
func CreateAccessToken(claims jwt.MapClaims) (string, error) {
	cfg := config.GetConfig()
	expireTime := time.Now().Add(config.GetAccessTokenExpireDuration())
	claims["exp"] = expireTime.Unix()

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(cfg.SecretKey))
}

// DecodeAccessToken 解码 JWT Token
func DecodeAccessToken(tokenString string) (jwt.MapClaims, error) {
	cfg := config.GetConfig()

	token, err := jwt.ParseWithClaims(tokenString, jwt.MapClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(cfg.SecretKey), nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return nil, jwt.ErrSignatureInvalid
	}

	return claims, nil
}
