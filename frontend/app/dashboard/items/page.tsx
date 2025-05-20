"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { api } from "@/lib/api"
import type { Item } from "@/lib/types"

export default function ItemsPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<Item[]>([])
  const [allItems, setAllItems] = useState<Item[]>([]) // Store all items for debugging
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchItems = async () => {
      try {
        console.log("Fetching items for seller ID:", user?.id)
        const response = await api.get("/api/my-items") // Use the new endpoint
        console.log("My items received:", response.data)
        setItems(response.data)
      } catch (error: any) {
        console.error("Error fetching items:", error)
        setError(error.response?.data || error.message || "Failed to fetch items")
        toast({
          title: "Error",
          description: "Failed to fetch items",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
  
    if (user && user.role === "seller") {
      fetchItems()
    } else {
      setIsLoading(false)
    }
  }, [user])

  const handleDeleteItem = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await api.delete(`/api/items/${id}`)
        setItems(items.filter((item) => item.id !== id))
        toast({
          title: "Success",
          description: "Item deleted successfully",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete item",
          variant: "destructive",
        })
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Items</h1>
        <Link href="/dashboard/items/new">
          <Button>Add New Item</Button>
        </Link>
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
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M12 8v8" />
                <path d="M8 12h8" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold">No items yet</h2>
            <p className="mb-4 mt-2 text-center text-muted-foreground">
              You haven't added any items for lending yet. Add your first item to get started.
            </p>
            <Link href="/dashboard/items/new">
              <Button>Add Your First Item</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="line-clamp-1">{item.title}</CardTitle>
                <Badge variant={item.status === "available" ? "default" : "secondary"}>
                  {item.status === "available" ? "Available" : "Borrowed"}
                </Badge>
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
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Link href={`/dashboard/items/${item.id}/edit`}>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </Link>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteItem(item.id)}>
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
  
}
