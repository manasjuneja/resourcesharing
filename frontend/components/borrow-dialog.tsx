"use client"

import type React from "react"

import { useState, useEffect } from "react" 
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { api } from "@/lib/api"
import type { Item } from "@/lib/types"
import { format, addDays } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface BorrowDialogProps {
  item: Item
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BorrowDialog({ item, open, onOpenChange }: BorrowDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), item.duration || 7))
  const [message, setMessage] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log("BorrowDialog received item:", JSON.stringify(item, null, 2))
  }, [item])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Debug the item object to ensure it has an id
    console.log("Item object:", item);
    
    if (!item || !item.id) {
      setError("Invalid item data. Missing item ID.");
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Invalid item data. Missing item ID.",
        variant: "destructive",
      });
      return;
    }

    try {
      const requestData = {
        itemId: item.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        message: message || "",
      };
      
      console.log("Submitting borrow request:", requestData);

      const response = await api.post("/api/borrow-requests", requestData);
      
      console.log("Borrow request response:", response.data);

      toast({
        title: "Success",
        description: "Your borrow request has been submitted",
      });

      onOpenChange(false);
      router.push("/dashboard/my-requests");
    } catch (error: any) {
      console.error("Borrow request error:", error);
      
      const errorMessage = error.response?.data || error.message || "Failed to submit borrow request";
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Request to Borrow: {item.title}</DialogTitle>
            <DialogDescription>Fill out the details to request borrowing this item.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button id="start-date" variant="outline" className="justify-start text-left font-normal">
                    {format(startDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-date">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button id="end-date" variant="outline" className="justify-start text-left font-normal">
                    {format(endDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Message to Owner (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Tell the owner why you need this item..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            {error && (
              <div className="text-sm text-red-500">
                Error: {error}
              </div>
            )}
            {/* Add a hidden debug field to show the item ID */}
            <div className="text-xs text-gray-500">
              Item ID: {item.id || 'Not available'}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading || !item.id}>
              {isLoading ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}