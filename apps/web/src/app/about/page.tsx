import Link from 'next/link';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Target, Shield, Zap } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us - SPACE-App',
  description:
    'Learn about SPACE-App, the marketplace connecting advertisers with in-store advertising spaces in local businesses.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              About SPACE-App
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              We're building the bridge between local businesses and advertisers,
              creating opportunities for meaningful connections in physical spaces.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
                <p className="text-muted-foreground mb-4">
                  SPACE-App was founded with a simple idea: local businesses have
                  valuable physical spaces that can benefit both advertisers and
                  the community.
                </p>
                <p className="text-muted-foreground mb-4">
                  We connect brands seeking authentic local engagement with
                  businesses looking to monetize their spaces. Our platform makes
                  it easy to discover, book, and manage in-store advertising
                  opportunities.
                </p>
                <p className="text-muted-foreground">
                  Whether you're a small business owner looking to generate
                  additional revenue or an advertiser wanting to reach local
                  audiences, SPACE-App provides the tools you need to succeed.
                </p>
              </div>
              <div className="bg-muted/30 rounded-lg p-8">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Targeted Reach</h3>
                      <p className="text-sm text-muted-foreground">
                        Connect with customers in specific neighborhoods and
                        communities.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Community First</h3>
                      <p className="text-sm text-muted-foreground">
                        Supporting local businesses while enabling brand growth.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Trust & Safety</h3>
                      <p className="text-sm text-muted-foreground">
                        Verified listings and secure transactions for peace of
                        mind.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Easy to Use</h3>
                      <p className="text-sm text-muted-foreground">
                        Simple booking process from discovery to confirmation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-xl font-semibold mb-4">For Advertisers</h3>
                <ol className="space-y-4">
                  <li className="flex gap-4">
                    <span className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                      1
                    </span>
                    <div>
                      <p className="font-medium">Browse Available Spaces</p>
                      <p className="text-sm text-muted-foreground">
                        Search and filter spaces by location, price, and type.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                      2
                    </span>
                    <div>
                      <p className="font-medium">Request a Booking</p>
                      <p className="text-sm text-muted-foreground">
                        Select your dates and submit a booking request.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                      3
                    </span>
                    <div>
                      <p className="font-medium">Get Confirmed</p>
                      <p className="text-sm text-muted-foreground">
                        Once approved, your booking is confirmed and ready to go.
                      </p>
                    </div>
                  </li>
                </ol>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">For Space Owners</h3>
                <ol className="space-y-4">
                  <li className="flex gap-4">
                    <span className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                      1
                    </span>
                    <div>
                      <p className="font-medium">List Your Space</p>
                      <p className="text-sm text-muted-foreground">
                        Create a listing with photos, description, and pricing.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                      2
                    </span>
                    <div>
                      <p className="font-medium">Review Requests</p>
                      <p className="text-sm text-muted-foreground">
                        Receive booking requests and approve the ones you like.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                      3
                    </span>
                    <div>
                      <p className="font-medium">Earn Revenue</p>
                      <p className="text-sm text-muted-foreground">
                        Get paid for hosting advertisements in your space.
                      </p>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-muted-foreground mb-8">
              Join our growing community of businesses and advertisers today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/spaces">
                  Browse Spaces <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/register">Create Account</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 mt-auto">
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
