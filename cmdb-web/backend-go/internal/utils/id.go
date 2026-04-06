package utils

import (
	"crypto/rand"
	"encoding/hex"
)

// GenerateID 生成 UUID
func GenerateID() string {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return ""
	}
	return hex.EncodeToString(bytes)
}
