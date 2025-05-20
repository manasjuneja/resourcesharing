import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ItemCard } from "@/components/item-card"
import { SearchFilters } from "@/components/search-filters"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
              <span>Resource Share</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Register</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Share Resources, Build Community
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Borrow what you need, lend what you don't. Join our community of sharers today.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/register?role=buyer">
                  <Button size="lg">I want to borrow</Button>
                </Link>
                <Link href="/register?role=seller">
                  <Button size="lg" variant="outline">
                    I want to lend
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="container px-4 py-12 md:px-6">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Available Items</h2>
                <p className="text-muted-foreground">Browse items available for borrowing in your community</p>
              </div>
              <SearchFilters />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <ItemCard
                id="1"
                title="Power Drill"
                category="Tools"
                location="Downtown"
                imageUrl="/placeholder.svg?height=200&width=200"
                status="available"
                duration={7}
                sellerName="John Doe"
              />
              <ItemCard
                id="2"
                title="Camping Tent"
                category="Outdoor"
                location="Westside"
                imageUrl="/placeholder.svg?height=200&width=200"
                status="available"
                duration={14}
                sellerName="Jane Smith"
              />
              <ItemCard
                id="3"
                title="Digital Camera"
                category="Electronics"
                location="Eastside"
                imageUrl="/placeholder.svg?height=200&width=200"
                status="available"
                duration={3}
                sellerName="Mike Johnson"
              />
              <ItemCard
                id="4"
                title="Mountain Bike"
                category="Sports"
                location="Northside"
                imageUrl="/placeholder.svg?height=200&width=200"
                status="available"
                duration={5}
                sellerName="Sarah Williams"
              />
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>For Borrowers</CardTitle>
                  <CardDescription>Access what you need without buying</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Save money by borrowing items you only need temporarily. Browse our extensive catalog of available
                    resources.
                  </p>
                </CardContent>
                <CardFooter>
                  <Link href="/register?role=buyer">
                    <Button>Start Borrowing</Button>
                  </Link>
                </CardFooter>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>For Lenders</CardTitle>
                  <CardDescription>Share your unused items</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Put your unused items to good use by lending them to others in your community. Manage your inventory
                    easily.
                  </p>
                </CardContent>
                <CardFooter>
                  <Link href="/register?role=seller">
                    <Button>Start Lending</Button>
                  </Link>
                </CardFooter>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>How It Works</CardTitle>
                  <CardDescription>Simple and secure sharing</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Our platform connects borrowers with lenders safely and efficiently. Request items, approve loans,
                    and track everything.
                  </p>
                </CardContent>
                <CardFooter>
                  <Link href="/about">
                    <Button variant="outline">Learn More</Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © 2023 Resource Share. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="text-sm text-muted-foreground underline underline-offset-4">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground underline underline-offset-4">
              Privacy
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground underline underline-offset-4">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
