"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { api } from "@/lib/api"
import type { Item } from "@/lib/types"
import { SearchFilters } from "@/components/search-filters"
import { BorrowDialog } from "@/components/borrow-dialog"

export default function BrowsePage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()

  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const category = searchParams.get("category")
  const location = searchParams.get("location")
  const status = searchParams.get("status") || "available"

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true)
      try {
        let url = "/api/items?status=available"

        if (category) {
          url += `&category=${category}`
        }

        if (location) {
          url += `&location=${location}`
        }

        const response = await api.get(url)
        console.log("Fetched items response:", response)
        
        // Check if the response data is an array and has items
        if (Array.isArray(response.data) && response.data.length > 0) {
          console.log("First item from API:", response.data[0])
          
          // Transform the items to ensure they have the correct structure
          const transformedItems = response.data.map((item: any) => ({
            id: item.id || item.ID, // Try both formats
            title: item.title || "",
            description: item.description || "",
            category: item.category || "",
            imageUrl: item.imageUrl || item.ImageURL || "",
            status: item.status || "available",
            location: item.location || "",
            duration: item.duration || 7,
            sellerId: item.sellerId || item.SellerID || 0,
            seller: item.seller || { name: "Unknown" }
          }))
          
          console.log("Transformed items:", transformedItems[0])
          setItems(transformedItems)
        } else {
          console.warn("No items returned from API or invalid format:", response.data)
          setItems([])
        }
      } catch (error) {
        console.error("Error fetching items:", error)
        toast({
          title: "Error",
          description: "Failed to fetch items",
          variant: "destructive",
        })
        setItems([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchItems()
  }, [category, location, status])

  const handleBorrowClick = (item: Item) => {
    console.log("Selected item for borrowing:", item)
    
    // Make sure the item has an ID before opening the dialog
    if (!item || !item.id) {
      console.error("Item is missing ID:", item)
      toast({
        title: "Error",
        description: "Cannot borrow this item: missing item ID",
        variant: "destructive",
      })
      return
    }
    
    setSelectedItem(item)
    setDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="flex h-full items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Browse Items</h1>
            <p className="text-muted-foreground">Find items available for borrowing</p>
          </div>
          <SearchFilters />
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-10 w-10 text-muted-foreground"
                >
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" x2="12" y1="9" y2="13" />
                  <line x1="12" x2="12.01" y1="17" y2="17" />
                </svg>
              </div>
              <h2 className="mt-4 text-xl font-semibold">No items found</h2>
              <p className="mt-2 text-center text-muted-foreground">
                No items match your current filters. Try changing your search criteria.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <Card key={item.id || Math.random()}>
                <CardHeader>
                  <CardTitle className="line-clamp-1">{item.title}</CardTitle>
                  <Badge>Available</Badge>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square overflow-hidden rounded-md">
                    <img
                      src={item.imageUrl || "/placeholder.svg?height=200&width=200"}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-muted-foreground">Category: {item.category}</p>
                    <p className="text-sm text-muted-foreground">Location: {item.location}</p>
                    <p className="text-sm text-muted-foreground">Duration: {item.duration} days</p>
                    <p className="text-sm text-muted-foreground">Owner: {item.seller?.name || "Unknown"}</p>
                    {/* Debug info */}
                    <p className="text-xs text-gray-400">Item ID: {item.id || "Not available"}</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => handleBorrowClick(item)}
                    disabled={!user || user.role !== "buyer" || !item.id}
                  >
                    Request to Borrow
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedItem && (
        <BorrowDialog 
          item={selectedItem} 
          open={dialogOpen} 
          onOpenChange={setDialogOpen} 
        />
      )}
    </div>
  )
}