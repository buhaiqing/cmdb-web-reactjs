package utils
package utils

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestStringToJSON(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected []string
	}{
		{
			name:     "有效JSON数组",
			input:    `["tag1","tag2","tag3"]`,
			expected: []string{"tag1", "tag2", "tag3"},
		},
		{
			name:     "空数组",
			input:    `[]`,
			expected: []string{},
		},
		{
			name:     "无效JSON返回空数组",
			input:    `invalid`,
			expected: []string{},
		},
		{
			name:     "空字符串",
			input:    "",
			expected: []string{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := StringToJSON(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestTagsToJSON(t *testing.T) {
	tests := []struct {
		name     string
		input    []string
		expected string
	}{
		{
			name:     "多个标签",
			input:    []string{"tag1", "tag2", "tag3"},
			expected: `["tag1","tag2","tag3"]`,
		},
		{
			name:     "空数组",
			input:    []string{},
			expected: `[]`,
		},
		{
			name:     "单个标签",
			input:    []string{"single"},
			expected: `["single"]`,
		},
		{
			name:     "nil数组",
			input:    nil,
			expected: `[]`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := TagsToJSON(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestStringToJSONAndBack(t *testing.T) {
	// 测试往返转换
	original := []string{"tag1", "tag2", "tag3"}
	jsonStr := TagsToJSON(original)
	result := StringToJSON(jsonStr)
	
	assert.Equal(t, original, result)
}
