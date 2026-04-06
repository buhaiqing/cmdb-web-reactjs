package utils

import (
	"encoding/json"
	"errors"
)

// StringToJSON 将字符串转换为 JSON
func StringToJSON(str string) ([]string, error) {
	if str == "" {
		return nil, nil
	}

	var tags []string
	err := json.Unmarshal([]byte(str), &tags)
	if err != nil {
		return nil, err
	}
	return tags, nil
}

// TagsToJSON 将标签数组转换为 JSON 字符串
func TagsToJSON(tags []string) (string, error) {
	if len(tags) == 0 {
		return "", nil
	}

	data, err := json.Marshal(tags)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// InterfaceToStringSlice 将 interface{} 转换为字符串数组
func InterfaceToStringSlice(v interface{}) ([]string, error) {
	if v == nil {
		return nil, nil
	}

	switch val := v.(type) {
	case []string:
		return val, nil
	case []interface{}:
		result := make([]string, len(val))
		for i, item := range val {
			if str, ok := item.(string); ok {
				result[i] = str
			} else {
				return nil, errors.New("invalid type in slice")
			}
		}
		return result, nil
	default:
		return nil, errors.New("unsupported type")
	}
}
