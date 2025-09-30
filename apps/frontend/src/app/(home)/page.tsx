import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Code2, Database, Zap, Users, Table, Flag, Webhook, Layers } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center">
      {/* Hero Section */}
      <section className="space-y-6 pt-6 pb-8 md:pt-10 md:pb-12 lg:py-32">
        <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
          <Link
            href="https://github.com/markstev/mark-starter"
            className="rounded-2xl bg-muted px-4 py-1.5 font-medium text-sm"
            target="_blank"
          >
            GitHub
          </Link>
          <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
            WebApp Starter Template
          </h1>
          <p className="max-w-[42rem] text-muted-foreground leading-normal sm:text-xl sm:leading-8">
            A production-ready starter template with everything you need to build a modern
            full-stack web application
          </p>
          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-6xl mt-8">
            <Card className="hover:shadow-md transition-shadow flex flex-col">
              <CardHeader className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <Database className="size-5 text-blue-600" />
                  TRPC
                </CardTitle>
                <CardDescription>
                  Type-safe RPC for seamless frontend-backend communication
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link href="/tenants">
                  <Button variant="outline" size="sm" className="w-full">
                    View Tenants API
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow flex flex-col">
              <CardHeader className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="size-5 text-purple-600" />
                  GraphQL
                </CardTitle>
                <CardDescription>
                  Example GraphQL implementation alongside TRPC
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link href="/graphql_example">
                  <Button variant="outline" size="sm" className="w-full">
                    GraphQL Demo
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow flex flex-col">
              <CardHeader className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="size-5 text-green-600" />
                  SSE Streaming
                </CardTitle>
                <CardDescription>
                  Server-Sent Events for real-time, ChatGPT-like responses
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link href="/sse_demo">
                  <Button variant="outline" size="sm" className="w-full">
                    SSE Demo
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow flex flex-col">
              <CardHeader className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <Users className="size-5 text-orange-600" />
                  Clerk Auth
                </CardTitle>
                <CardDescription>
                  User and Organization authentication with role-based access
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm text-muted-foreground">
                  Built-in authentication system
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow flex flex-col">
              <CardHeader className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <Table className="size-5 text-red-600" />
                  MUI Data Grid
                </CardTitle>
                <CardDescription>
                  Advanced data tables with sorting, filtering, and pagination
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link href="/grid_example">
                  <Button variant="outline" size="sm" className="w-full">
                    Grid Demo
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow flex flex-col">
              <CardHeader className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <Flag className="size-5 text-yellow-600" />
                  Feature Flags
                </CardTitle>
                <CardDescription>
                  Global, User, and Organization-level feature toggles
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link href="/flags">
                  <Button variant="outline" size="sm" className="w-full">
                    Feature Flags
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow flex flex-col">
              <CardHeader className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="size-5 text-indigo-600" />
                  Component Library
                </CardTitle>
                <CardDescription>
                  Reusable UI components built with shadcn/ui
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link href="/examples">
                  <Button variant="outline" size="sm" className="w-full">
                    Examples
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow flex flex-col">
              <CardHeader className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <Layers className="size-5 text-teal-600" />
                  BullMQ Tasks
                </CardTitle>
                <CardDescription>
                  Background job processing with Redis and BullMQ
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link href="/bullmq_example">
                  <Button variant="outline" size="sm" className="w-full">
                    Task Queue
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
