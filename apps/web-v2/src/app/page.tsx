import Link from 'next/link';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPin, Calendar, DollarSign } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <div className="container px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Find the perfect{' '}
              <span className="text-primary">advertising space</span> for your
              brand
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Connect with local businesses and discover in-store advertising
              opportunities. Book spaces, reach customers, grow your brand.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/spaces">
                  Browse Spaces <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/register">List Your Space</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose SPACE?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Local Reach</h3>
              <p className="text-muted-foreground">
                Target customers in specific neighborhoods and communities with
                strategically placed ads.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Flexible Booking</h3>
              <p className="text-muted-foreground">
                Book advertising spaces for days, weeks, or months. Complete
                flexibility for your campaign needs.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Transparent Pricing</h3>
              <p className="text-muted-foreground">
                Clear pricing with no hidden fees. Know exactly what you'll pay
                before you book.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to get started?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of businesses already using SPACE to connect
              advertisers with local audiences.
            </p>
            <Button size="lg" asChild>
              <Link href="/register">Create Free Account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} SPACE-App. All rights reserved.
            </p>
            <nav className="flex gap-6">
              <Link
                href="/about"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                About
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Terms
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
