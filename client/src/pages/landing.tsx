import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowRight, Files, Gauge, Share2, TrendingUp } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
              <Files className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold">SetupComparer</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild data-testid="button-login">
              <a href="/api/login">Log In</a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-4">
              Analyze Your iRacing Setups
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Compare car setups side-by-side, understand parameter changes, and improve your lap times with intelligent interpretations.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" asChild data-testid="button-get-started">
                <a href="/api/login">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/40">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <Files className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">Side-by-Side Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Upload two setup files and see every parameter change highlighted with clear visual indicators.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Gauge className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">Smart Interpretations</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Get human-friendly explanations of what each setup change will do to your car's behavior on track.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <TrendingUp className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">Track Your Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Save comparison history and revisit past setups to understand your tuning evolution over time.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Share2 className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">Share with Teammates</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Generate shareable links to discuss setup changes with your team and coaches.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-semibold mb-4">Ready to Improve Your Setups?</h3>
            <p className="text-muted-foreground mb-6">
              Join sim racers who are using SetupComparer to understand their car setups better.
            </p>
            <Button size="lg" asChild data-testid="button-start-comparing">
              <a href="/api/login">
                Start Comparing Setups <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p>SetupComparer - Your iRacing Setup Analysis Tool</p>
        </div>
      </footer>
    </div>
  );
}
