import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface ItemCardProps {
  id: string
  title: string
  category: string
  location: string
  imageUrl: string
  status: string
  duration: number
  sellerName: string
}

export function ItemCard({ id, title, category, location, imageUrl, status, duration, sellerName }: ItemCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="line-clamp-1">{title}</CardTitle>
        <Badge>{status === "available" ? "Available" : "Borrowed"}</Badge>
      </CardHeader>
      <CardContent>
        <div className="aspect-square overflow-hidden rounded-md">
          <img src={imageUrl || "/placeholder.svg"} alt={title} className="h-full w-full object-cover" />
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-sm text-muted-foreground">Category: {category}</p>
          <p className="text-sm text-muted-foreground">Location: {location}</p>
          <p className="text-sm text-muted-foreground">Duration: {duration} days</p>
          <p className="text-sm text-muted-foreground">Owner: {sellerName}</p>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/browse?itemId=${id}`} className="w-full">
          <Button className="w-full">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
