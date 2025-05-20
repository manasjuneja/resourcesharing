package models

import (
	"time"
)

type Item struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Title       string    `json:"title" gorm:"not null"`
	Description string    `json:"description"`
	Category    string    `json:"category"`
	ImageURL    string    `json:"imageUrl"`
	Status      Status    `json:"status" gorm:"not null"`
	Location    string    `json:"location"`
	Duration    int       `json:"duration" gorm:"default:7"`
	SellerID    uint      `json:"sellerId" gorm:"not null"`
	Seller      User      `json:"seller" gorm:"foreignKey:SellerID"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}