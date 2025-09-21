"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// GraphQL Client Implementation
class GraphQLClient {
  constructor(private endpoint: string) {}

  async query(query: string, variables?: any) {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });
    return await response.json();
  }

  subscribe(query: string, variables?: any) {
    const params = new URLSearchParams({
      query,
      ...(variables && { variables: JSON.stringify(variables) }),
    });
    
    return new EventSource(`${this.endpoint}/stream?${params}`);
  }
}

const client = new GraphQLClient('http://localhost:3004/api/graphql');

export default function GraphQLExamplePage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newTenantName, setNewTenantName] = useState('');
  const [rpcResults, setRpcResults] = useState<any>({});
  const [subscriptionData, setSubscriptionData] = useState<any>({});
  const [mathA, setMathA] = useState('5');
  const [mathB, setMathB] = useState('3');

  // GraphQL Query Examples (RPC-style)
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const result = await client.query(`
        query GetPosts {
          getPosts {
            id
            title
            content
            userId
            createdAt
            updatedAt
          }
        }
      `);
      
      if (result.data) {
        setPosts(result.data.getPosts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const result = await client.query(`
        query GetTenants {
          getTenants {
            id
            name
            createdAt
            updatedAt
          }
        }
      `);
      
      if (result.data) {
        setTenants(result.data.getTenants);
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  // GraphQL Mutation Examples (RPC-style)
  const createPost = async () => {
    if (!newPostTitle || !newPostContent) return;
    
    setLoading(true);
    try {
      const result = await client.query(`
        mutation CreatePost($title: String!, $content: String!, $userId: String!) {
          createPost(title: $title, content: $content, userId: $userId) {
            id
            title
            content
            userId
            createdAt
            updatedAt
          }
        }
      `, {
        title: newPostTitle,
        content: newPostContent,
        userId: 'user_123'
      });
      
      if (result.data) {
        setNewPostTitle('');
        setNewPostContent('');
        fetchPosts(); // Refresh posts
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTenant = async () => {
    if (!newTenantName) return;
    
    setLoading(true);
    try {
      const result = await client.query(`
        mutation CreateTenant($name: String!) {
          createTenant(name: $name) {
            id
            name
            createdAt
            updatedAt
          }
        }
      `, {
        name: newTenantName
      });
      
      if (result.data) {
        setNewTenantName('');
        fetchTenants(); // Refresh tenants
      }
    } catch (error) {
      console.error('Error creating tenant:', error);
    } finally {
      setLoading(false);
    }
  };

  // Simple RPC Function Examples
  const callSimpleRPCs = async () => {
    try {
      // Hello RPC
      const helloResult = await client.query(`
        query Hello($name: String) {
          hello(name: $name)
        }
      `, { name: 'GraphQL' });

      // Math RPC
      const mathResult = await client.query(`
        query AddNumbers($a: Int!, $b: Int!) {
          addNumbers(a: $a, b: $b)
        }
      `, { a: parseInt(mathA), b: parseInt(mathB) });

      // Area calculation RPC
      const areaResult = await client.query(`
        query CalculateArea($width: Float!, $height: Float!) {
          calculateArea(width: $width, height: $height)
        }
      `, { width: 10.5, height: 8.2 });

      // Business logic RPC
      const orderResult = await client.query(`
        mutation ProcessOrder($orderId: String!, $amount: Float!) {
          processOrder(orderId: $orderId, amount: $amount)
        }
      `, { orderId: 'ORD-123', amount: 99.99 });

      setRpcResults({
        hello: helloResult.data?.hello,
        math: mathResult.data?.addNumbers,
        area: areaResult.data?.calculateArea,
        order: orderResult.data?.processOrder,
      });
    } catch (error) {
      console.error('Error calling RPCs:', error);
    }
  };

  // GraphQL Subscription Examples (RPC-style real-time functions)
  useEffect(() => {
    // Subscribe to random numbers
    const randomNumberSource = client.subscribe(`
      subscription {
        randomNumber
      }
    `);

    randomNumberSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.data) {
          setSubscriptionData((prev: any) => ({
            ...prev,
            randomNumber: data.data.randomNumber
          }));
        }
      } catch (error) {
        console.error('Error parsing subscription data:', error);
      }
    };

    // Subscribe to post updates
    const postUpdatesSource = client.subscribe(`
      subscription {
        postUpdates {
          id
          title
          content
          userId
          createdAt
        }
      }
    `);

    postUpdatesSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.data) {
          setSubscriptionData((prev: any) => ({
            ...prev,
            postUpdate: data.data.postUpdates
          }));
        }
      } catch (error) {
        console.error('Error parsing post updates:', error);
      }
    };

    return () => {
      randomNumberSource.close();
      postUpdatesSource.close();
    };
  }, []);

  // Load initial data
  useEffect(() => {
    fetchPosts();
    fetchTenants();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">GraphQL RPC Example</h1>
        <p className="text-muted-foreground mt-2">
          Demonstrating Remote Procedure Calls using GraphQL instead of TRPC
        </p>
      </div>

      {/* Simple RPC Functions */}
      <Card>
        <CardHeader>
          <CardTitle>Simple RPC Functions</CardTitle>
          <CardDescription>Basic remote procedure calls using GraphQL queries and mutations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input 
              type="number" 
              value={mathA} 
              onChange={(e) => setMathA(e.target.value)}
              placeholder="Number A"
              className="w-20"
            />
            <span className="flex items-center">+</span>
            <Input 
              type="number" 
              value={mathB} 
              onChange={(e) => setMathB(e.target.value)}
              placeholder="Number B"
              className="w-20"
            />
            <Button onClick={callSimpleRPCs}>Call RPC Functions</Button>
          </div>
          
          {rpcResults.hello && (
            <div className="space-y-2">
              <Badge variant="outline">Hello RPC: {rpcResults.hello}</Badge>
              <Badge variant="outline">Math RPC: {mathA} + {mathB} = {rpcResults.math}</Badge>
              <Badge variant="outline">Area RPC: 10.5 × 8.2 = {rpcResults.area}</Badge>
              <Badge variant="outline">Order RPC: {rpcResults.order}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Management RPCs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Posts Management */}
        <Card>
          <CardHeader>
            <CardTitle>Posts RPC</CardTitle>
            <CardDescription>CRUD operations as remote procedure calls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input 
                placeholder="Post title"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
              />
              <Input 
                placeholder="Post content"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
              />
              <Button onClick={createPost} disabled={loading}>
                Create Post (RPC)
              </Button>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Posts ({posts.length})</h4>
                <Button variant="outline" size="sm" onClick={fetchPosts}>
                  Refresh
                </Button>
              </div>
              {posts.map((post) => (
                <div key={post.id} className="p-2 border rounded text-sm">
                  <div className="font-medium">{post.title}</div>
                  <div className="text-muted-foreground">{post.content}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    ID: {post.id}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tenants Management */}
        <Card>
          <CardHeader>
            <CardTitle>Tenants RPC</CardTitle>
            <CardDescription>Tenant management via GraphQL RPCs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input 
                placeholder="Tenant name"
                value={newTenantName}
                onChange={(e) => setNewTenantName(e.target.value)}
              />
              <Button onClick={createTenant} disabled={loading}>
                Create Tenant (RPC)
              </Button>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Tenants ({tenants.length})</h4>
                <Button variant="outline" size="sm" onClick={fetchTenants}>
                  Refresh
                </Button>
              </div>
              {tenants.map((tenant) => (
                <div key={tenant.id} className="p-2 border rounded text-sm">
                  <div className="font-medium">{tenant.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    ID: {tenant.id}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Subscription RPCs */}
      <Card>
        <CardHeader>
          <CardTitle>Real-time RPC Subscriptions</CardTitle>
          <CardDescription>Live data streams using GraphQL subscriptions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded">
              <h4 className="font-medium mb-2">Random Number Stream</h4>
              <div className="text-2xl font-mono">
                {subscriptionData.randomNumber?.toFixed(4) || 'Connecting...'}
              </div>
            </div>
            
            <div className="p-4 border rounded">
              <h4 className="font-medium mb-2">Live Post Updates</h4>
              {subscriptionData.postUpdate ? (
                <div className="text-sm">
                  <div className="font-medium">{subscriptionData.postUpdate.title}</div>
                  <div className="text-muted-foreground">{subscriptionData.postUpdate.content}</div>
                </div>
              ) : (
                <div className="text-muted-foreground">Waiting for updates...</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison with TRPC */}
      <Card>
        <CardHeader>
          <CardTitle>GraphQL vs TRPC Comparison</CardTitle>
          <CardDescription>Key differences in RPC approaches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">GraphQL RPCs</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Single endpoint (/api/graphql)</li>
                <li>• Query language for data fetching</li>
                <li>• Built-in introspection</li>
                <li>• Subscriptions via Server-Sent Events</li>
                <li>• Client-side query building</li>
                <li>• Industry standard</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">TRPC RPCs</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Multiple endpoints (/api/trpc/*)</li>
                <li>• Direct function calls</li>
                <li>• Full TypeScript inference</li>
                <li>• WebSocket subscriptions</li>
                <li>• Automatic client generation</li>
                <li>• TypeScript-first</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
