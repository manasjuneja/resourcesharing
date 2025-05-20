package models

import (
	"time"
)

type BorrowRequest struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	ItemID    uint      `json:"itemId" gorm:"not null"`
	Item      Item      `json:"item" gorm:"foreignKey:ItemID"`
	BuyerID   uint      `json:"buyerId" gorm:"not null"`
	Buyer     User      `json:"buyer" gorm:"foreignKey:BuyerID"`
	Status    Status    `json:"status" gorm:"not null"`
	StartDate time.Time `json:"startDate" gorm:"not null"`
	EndDate   time.Time `json:"endDate" gorm:"not null"`
	Message   string    `json:"message"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}