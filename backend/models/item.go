package models

import (

	"gorm.io/gorm"
)

type ItemStatus string

const (
	StatusAvailable ItemStatus = "available"
	StatusBorrowed  ItemStatus = "borrowed"
)

type Item struct {
    gorm.Model
    Title       string     `gorm:"not null" json:"title"`
    Description string     `json:"description"`
    Category    string     `gorm:"not null" json:"category"`
    ImageURL    string     `json:"imageUrl"`
    Status      ItemStatus `gorm:"not null;default:'available'" json:"status"`
    Location    string     `json:"location"`
    Duration    int        `gorm:"not null" json:"duration"` // Duration in days
    SellerID    uint       `gorm:"not null" json:"sellerId"`
    Seller      User       `json:"seller,omitempty"`
    Requests    []BorrowRequest `json:"requests,omitempty"`
}