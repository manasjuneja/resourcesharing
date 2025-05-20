package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"gorm.io/gorm"

	"resource-sharing/middleware"
	"resource-sharing/models"
)

type ItemRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Category    string `json:"category"`
	ImageURL    string `json:"imageUrl"`
	Location    string `json:"location"`
	Duration    int    `json:"duration"`
}

func GetItems(db *gorm.DB) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        // Parse query parameters
        category := r.URL.Query().Get("category")
        status := r.URL.Query().Get("status")
        location := r.URL.Query().Get("location")

        // Build the query
        query := db.Model(&models.Item{}).Preload("Seller")

        if category != "" {
            query = query.Where("category = ?", category)
        }

        if status != "" {
            query = query.Where("status = ?", status)
        }

        if location != "" {
            query = query.Where("location LIKE ?", "%"+location+"%")
        }

        // Execute the query
        var items []models.Item
        if result := query.Find(&items); result.Error != nil {
            log.Printf("Error fetching items: %v", result.Error)
            http.Error(w, "Failed to fetch items: "+result.Error.Error(), http.StatusInternalServerError)
            return
        }
        
        log.Printf("Found %d items", len(items))
        
        // Log the first few items for debugging
        if len(items) > 0 {
            for i, item := range items {
                if i < 3 { // Log only the first 3 items to avoid flooding the logs
                    log.Printf("Item %d: ID=%d, Title=%s, SellerID=%d", i, item.ID, item.Title, item.SellerID)
                }
            }
        }

        // Return the items
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(items)
    }
}

func GetItem(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get the item ID from the URL
		vars := mux.Vars(r)
		id, err := strconv.Atoi(vars["id"])
		if err != nil {
			http.Error(w, "Invalid item ID", http.StatusBadRequest)
			return
		}

		// Find the item
		var item models.Item
		if result := db.Preload("Seller").First(&item, id); result.Error != nil {
			http.Error(w, "Item not found", http.StatusNotFound)
			return
		}

		// Return the item
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(item)
	}
}

func CreateItem(db *gorm.DB) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        // Get the user ID from the context
        userID, ok := middleware.GetUserIDFromContext(r)
        if !ok {
            log.Println("User ID not found in context")
            http.Error(w, "User ID not found in context", http.StatusUnauthorized)
            return
        }
        
        log.Printf("Creating item for user ID: %d", userID)

        // Check if the user is a seller
        var user models.User
        if result := db.First(&user, userID); result.Error != nil {
            log.Printf("User not found: %v", result.Error)
            http.Error(w, "User not found", http.StatusNotFound)
            return
        }

        if user.Role != models.RoleSeller {
            log.Printf("User role is %s, not seller", user.Role)
            http.Error(w, "Only sellers can create items", http.StatusForbidden)
            return
        }

        // Parse the request body
        var req ItemRequest
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            log.Printf("Failed to decode request body: %v", err)
            http.Error(w, err.Error(), http.StatusBadRequest)
            return
        }
        
        log.Printf("Item request: %+v", req)

        // Validate input
        if req.Title == "" || req.Category == "" || req.Duration <= 0 {
            log.Println("Invalid request: missing required fields")
            http.Error(w, "Title, category, and duration are required", http.StatusBadRequest)
            return
        }

        // Create the item
        item := models.Item{
            Title:       req.Title,
            Description: req.Description,
            Category:    req.Category,
            ImageURL:    req.ImageURL,
            Status:      models.StatusAvailable,
            Location:    req.Location,
            Duration:    req.Duration,
            SellerID:    userID,
        }
        
        log.Printf("Creating item with SellerID: %d", userID)

        if result := db.Create(&item); result.Error != nil {
            log.Printf("Failed to create item: %v", result.Error)
            http.Error(w, "Failed to create item: "+result.Error.Error(), http.StatusInternalServerError)
            return
        }
        
        log.Printf("Item created successfully: ID=%d, SellerID=%d", item.ID, item.SellerID)

        // Return the created item
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(item)
    }
}

func UpdateItem(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get the user ID from the context
		userID, ok := middleware.GetUserIDFromContext(r)
		if !ok {
			http.Error(w, "User ID not found in context", http.StatusUnauthorized)
			return
		}

		// Get the item ID from the URL
		vars := mux.Vars(r)
		id, err := strconv.Atoi(vars["id"])
		if err != nil {
			http.Error(w, "Invalid item ID", http.StatusBadRequest)
			return
		}

		// Find the item
		var item models.Item
		if result := db.First(&item, id); result.Error != nil {
			http.Error(w, "Item not found", http.StatusNotFound)
			return
		}

		// Check if the user is the seller of the item
		if item.SellerID != userID {
			http.Error(w, "You can only update your own items", http.StatusForbidden)
			return
		}

		// Parse the request body
		var req ItemRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Update the item
		item.Title = req.Title
		item.Description = req.Description
		item.Category = req.Category
		item.ImageURL = req.ImageURL
		item.Location = req.Location
		item.Duration = req.Duration

		if result := db.Save(&item); result.Error != nil {
			http.Error(w, "Failed to update item: "+result.Error.Error(), http.StatusInternalServerError)
			return
		}

		// Return the updated item
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(item)
	}
}

func DeleteItem(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get the user ID from the context
		userID, ok := middleware.GetUserIDFromContext(r)
		if !ok {
			http.Error(w, "User ID not found in context", http.StatusUnauthorized)
			return
		}

		// Get the item ID from the URL
		vars := mux.Vars(r)
		id, err := strconv.Atoi(vars["id"])
		if err != nil {
			http.Error(w, "Invalid item ID", http.StatusBadRequest)
			return
		}

		// Find the item
		var item models.Item
		if result := db.First(&item, id); result.Error != nil {
			http.Error(w, "Item not found", http.StatusNotFound)
			return
		}

		// Check if the user is the seller of the item
		if item.SellerID != userID {
			http.Error(w, "You can only delete your own items", http.StatusForbidden)
			return
		}

		// Delete the item
		if result := db.Delete(&item); result.Error != nil {
			http.Error(w, "Failed to delete item: "+result.Error.Error(), http.StatusInternalServerError)
			return
		}

		// Return success
		w.WriteHeader(http.StatusNoContent)
	}
}

func GetMyItems(db *gorm.DB) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        // Get the user ID from the context
        userID, ok := middleware.GetUserIDFromContext(r)
        if !ok {
            log.Println("User ID not found in context")
            http.Error(w, "User ID not found in context", http.StatusUnauthorized)
            return
        }
        
        log.Printf("Fetching items for user ID: %d", userID)

        // Check if the user is a seller
        var user models.User
        if result := db.First(&user, userID); result.Error != nil {
            log.Printf("User not found: %v", result.Error)
            http.Error(w, "User not found", http.StatusNotFound)
            return
        }

        if user.Role != models.RoleSeller {
            log.Printf("User role is %s, not seller", user.Role)
            http.Error(w, "Only sellers can view their items", http.StatusForbidden)
            return
        }

        // Fetch the user's items
        var items []models.Item
        if result := db.Where("seller_id = ?", userID).Find(&items); result.Error != nil {
            log.Printf("Error fetching items: %v", result.Error)
            http.Error(w, "Failed to fetch items: "+result.Error.Error(), http.StatusInternalServerError)
            return
        }
        
        log.Printf("Found %d items for user ID %d", len(items), userID)

        // Return the items
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(items)
    }
}