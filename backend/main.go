package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"resource-sharing/handlers"
	"resource-sharing/middleware"
	"resource-sharing/models"
)

func main() {
	// Load environment variables
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found")
	}

	// Database connection
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=postgres password=postgres dbname=resource_sharing port=5432 sslmode=disable"
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Auto migrate the schema
	db.AutoMigrate(&models.User{}, &models.Item{}, &models.BorrowRequest{})

	// Initialize router
	r := mux.NewRouter()

	// Auth routes
	r.HandleFunc("/api/register", handlers.Register(db)).Methods("POST")
	r.HandleFunc("/api/login", handlers.Login(db)).Methods("POST")

	// Item routes
	r.HandleFunc("/api/items", handlers.GetItems(db)).Methods("GET")
	r.HandleFunc("/api/my-items", middleware.AuthMiddleware(handlers.GetMyItems(db))).Methods("GET") 
	r.HandleFunc("/api/items/{id}", handlers.GetItem(db)).Methods("GET")
	r.HandleFunc("/api/items", middleware.AuthMiddleware(handlers.CreateItem(db))).Methods("POST")
	r.HandleFunc("/api/items/{id}", middleware.AuthMiddleware(handlers.UpdateItem(db))).Methods("PUT")
	r.HandleFunc("/api/items/{id}", middleware.AuthMiddleware(handlers.DeleteItem(db))).Methods("DELETE")

	// Borrow request routes
	r.HandleFunc("/api/borrow-requests", middleware.AuthMiddleware(handlers.CreateBorrowRequest(db))).Methods("POST")
	r.HandleFunc("/api/borrow-requests/{id}/approve", middleware.AuthMiddleware(handlers.ApproveBorrowRequest(db))).Methods("PUT")
	r.HandleFunc("/api/borrow-requests/{id}/deny", middleware.AuthMiddleware(handlers.DenyBorrowRequest(db))).Methods("PUT")
	r.HandleFunc("/api/my-requests", middleware.AuthMiddleware(handlers.GetMyBorrowRequests(db))).Methods("GET")
	r.HandleFunc("/api/my-items/requests", middleware.AuthMiddleware(handlers.GetRequestsForMyItems(db))).Methods("GET")
	
// User routes
	r.HandleFunc("/api/me", middleware.AuthMiddleware(handlers.GetCurrentUser(db))).Methods("GET")

	// Configure CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
		Debug: true,
	})

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, c.Handler(r)))
}