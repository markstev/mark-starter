"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getToken } from '@/lib/clerk';

// TypeScript Types for GraphQL Responses
interface Post {
  id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: string;
  updatedAt: string | null;
}

interface Tenant {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string | null;
}

interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
  }>;
}

interface GraphQLError {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: Array<string | number>;
}

// GraphQL Client Implementation with proper typing
class GraphQLClient {
  constructor(private endpoint: string) {}

  async query<T = any>(query: string, variables?: Record<string, any>): Promise<GraphQLResponse<T>> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getToken()}`,
      },
      body: JSON.stringify({ query, variables }),
    });
    
    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status}`);
    }
    
    const result: GraphQLResponse<T> = await response.json();
    
    if (result.errors && result.errors.length > 0) {
      throw new Error(`GraphQL errors: ${result.errors.map((e: GraphQLError) => e.message).join(', ')}`);
    }
    
    return result;
  }

  subscribe(query: string, variables?: Record<string, any>) {
    const params = new URLSearchParams({
      query,
      ...(variables && { variables: JSON.stringify(variables) }),
    });
    
    return new EventSource(`${this.endpoint}/stream?${params}`);
  }
}

const client = new GraphQLClient('http://localhost:3004/api/graphql');

// Add RLS Example types
interface RlsExample {
  id: string;
  content: string;
  userId: string;
  publicToken: string | null;
  createdAt: string;
  updatedAt: string | null;
}

// GraphQL Queries and Mutations with proper typing
const GET_POSTS_QUERY = `
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
`;

const GET_TENANTS_QUERY = `
  query GetTenants {
    getTenants {
      id
      name
      createdAt
      updatedAt
    }
  }
`;

const CREATE_POST_MUTATION = `
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
`;

const CREATE_TENANT_MUTATION = `
  mutation CreateTenant($name: String!) {
    createTenant(name: $name) {
      id
      name
      createdAt
      updatedAt
    }
  }
`;

const HELLO_QUERY = `
  query Hello($name: String) {
    hello(name: $name)
  }
`;

const ADD_NUMBERS_QUERY = `
  query AddNumbers($a: Int!, $b: Int!) {
    addNumbers(a: $a, b: $b)
  }
`;

const CALCULATE_AREA_QUERY = `
  query CalculateArea($width: Float!, $height: Float!) {
    calculateArea(width: $width, height: $height)
  }
`;

const PROCESS_ORDER_MUTATION = `
  mutation ProcessOrder($orderId: String!, $amount: Float!) {
    processOrder(orderId: $orderId, amount: $amount)
  }
`;

// Type definitions for GraphQL responses
interface GetPostsResponse {
  getPosts: Post[];
}

interface GetTenantsResponse {
  getTenants: Tenant[];
}

interface CreatePostResponse {
  createPost: Post;
}

interface CreateTenantResponse {
  createTenant: Tenant;
}

interface HelloResponse {
  hello: string;
}

interface AddNumbersResponse {
  addNumbers: number;
}

interface CalculateAreaResponse {
  calculateArea: number;
}

interface ProcessOrderResponse {
  processOrder: string;
}

interface RPCResults {
  hello: string;
  math: number;
  area: number;
  order: string;
}

// Custom hooks for GraphQL operations with proper typing
const usePosts = () => {
  return useQuery<Post[]>({
    queryKey: ['graphql', 'posts'],
    queryFn: async (): Promise<Post[]> => {
      const result = await client.query<GetPostsResponse>(GET_POSTS_QUERY);
      return result.data.getPosts;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
};

const useTenants = () => {
  return useQuery<Tenant[]>({
    queryKey: ['graphql', 'tenants'],
    queryFn: async (): Promise<Tenant[]> => {
      const result = await client.query<GetTenantsResponse>(GET_TENANTS_QUERY);
      return result.data.getTenants;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
};

const useRPCResults = (mathA: string, mathB: string) => {
  return useQuery<RPCResults>({
    queryKey: ['graphql', 'rpc', mathA, mathB],
    queryFn: async (): Promise<RPCResults> => {
      const [helloResult, mathResult, areaResult, orderResult] = await Promise.all([
        client.query<HelloResponse>(HELLO_QUERY, { name: 'GraphQL' }),
        client.query<AddNumbersResponse>(ADD_NUMBERS_QUERY, { a: parseInt(mathA), b: parseInt(mathB) }),
        client.query<CalculateAreaResponse>(CALCULATE_AREA_QUERY, { width: 10.5, height: 8.2 }),
        client.query<ProcessOrderResponse>(PROCESS_ORDER_MUTATION, { orderId: 'ORD-123', amount: 99.99 }),
      ]);

      return {
        hello: helloResult.data.hello,
        math: mathResult.data.addNumbers,
        area: areaResult.data.calculateArea,
        order: orderResult.data.processOrder,
      };
    },
    enabled: mathA !== '' && mathB !== '' && !isNaN(parseInt(mathA)) && !isNaN(parseInt(mathB)),
  });
};

// Add RLS Example GraphQL Client
const rlsGraphQLClient = new GraphQLClient('http://localhost:3004/api/graphql/rls');

export default function GraphQLExamplePage() {
  const queryClient = useQueryClient();
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newTenantName, setNewTenantName] = useState('');
  const [subscriptionData, setSubscriptionData] = useState<{
    randomNumber?: number;
    postUpdate?: Post;
  }>({});
  const [mathA, setMathA] = useState('5');
  const [mathB, setMathB] = useState('3');

  // React Query hooks with proper typing
  const { data: posts = [], isLoading: postsLoading, error: postsError } = usePosts();
  const { data: tenants = [], isLoading: tenantsLoading, error: tenantsError } = useTenants();
  const { data: rpcResults, isLoading: rpcLoading, refetch: refetchRPCs } = useRPCResults(mathA, mathB);

  // Mutations with proper typing
  const createPostMutation = useMutation<Post, Error, { title: string; content: string; userId: string }>({
    mutationFn: async (variables) => {
      const result = await client.query<CreatePostResponse>(CREATE_POST_MUTATION, variables);
      return result.data.createPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graphql', 'posts'] });
      setNewPostTitle('');
      setNewPostContent('');
    },
  });

  const createTenantMutation = useMutation<Tenant, Error, { name: string }>({
    mutationFn: async (variables) => {
      const result = await client.query<CreateTenantResponse>(CREATE_TENANT_MUTATION, variables);
      return result.data.createTenant;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graphql', 'tenants'] });
      setNewTenantName('');
    },
  });

  // Event handlers with proper typing
  const handleCreatePost = (): void => {
    if (!newPostTitle || !newPostContent) return;
    createPostMutation.mutate({
      title: newPostTitle,
      content: newPostContent,
      userId: 'user_123'
    });
  };

  const handleCreateTenant = (): void => {
    if (!newTenantName) return;
    createTenantMutation.mutate({ name: newTenantName });
  };

  const handleCallRPCs = (): void => {
    refetchRPCs();
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
          setSubscriptionData((prev) => ({
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
          setSubscriptionData((prev) => ({
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

  const isLoading = postsLoading || tenantsLoading;
  const hasError = postsError || tenantsError;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">GraphQL RPC Example</h1>
        <p className="text-muted-foreground mt-2">
          Demonstrating Remote Procedure Calls using GraphQL with React Query and TypeScript
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
            <Button onClick={handleCallRPCs} disabled={rpcLoading}>
              {rpcLoading ? 'Loading...' : 'Call RPC Functions'}
            </Button>
          </div>
          
          {rpcResults && (
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
              <Button 
                onClick={handleCreatePost} 
                disabled={createPostMutation.isPending || !newPostTitle || !newPostContent}
              >
                {createPostMutation.isPending ? 'Creating...' : 'Create Post (RPC)'}
              </Button>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Posts ({posts.length})</h4>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['graphql', 'posts'] })}
                  disabled={postsLoading}
                >
                  {postsLoading ? 'Loading...' : 'Refresh'}
                </Button>
              </div>
              
              {postsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : postsError ? (
                <div className="text-destructive text-sm">Error loading posts: {postsError.message}</div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="p-2 border rounded text-sm">
                    <div className="font-medium">{post.title}</div>
                    <div className="text-muted-foreground">{post.content}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      ID: {post.id}
                    </div>
                  </div>
                ))
              )}
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
              <Button 
                onClick={handleCreateTenant} 
                disabled={createTenantMutation.isPending || !newTenantName}
              >
                {createTenantMutation.isPending ? 'Creating...' : 'Create Tenant (RPC)'}
              </Button>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Tenants ({tenants.length})</h4>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['graphql', 'tenants'] })}
                  disabled={tenantsLoading}
                >
                  {tenantsLoading ? 'Loading...' : 'Refresh'}
                </Button>
              </div>
              
              {tenantsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : tenantsError ? (
                <div className="text-destructive text-sm">Error loading tenants: {tenantsError.message}</div>
              ) : (
                tenants.map((tenant) => (
                  <div key={tenant.id} className="p-2 border rounded text-sm">
                    <div className="font-medium">{tenant.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      ID: {tenant.id}
                    </div>
                  </div>
                ))
              )}
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
                <li>• <strong>Now with full TypeScript support!</strong></li>
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
                <li>• Built-in React Query integration</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add RLS Example Section */}
      <RlsExampleSection />
    </div>
  );
}

// Add RLS Example section after the existing content
const RlsExampleSection = () => {
  const [rlsExamples, setRlsExamples] = useState<RlsExample[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newContent, setNewContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  // Fetch RLS examples
  const fetchRlsExamples = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await rlsGraphQLClient.query<{ getRlsExamples: RlsExample[] }>(`
        query {
          getRlsExamples {
            id
            content
            userId
            publicToken
            createdAt
            updatedAt
          }
        }
      `);
      
      if (response.errors) {
        throw new Error(response.errors[0]?.message || 'Failed to fetch RLS examples');
      }
      
      setRlsExamples(response.data.getRlsExamples);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch RLS examples');
    } finally {
      setLoading(false);
    }
  };

  // Create RLS example
  const createRlsExample = async () => {
    if (!newContent.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await rlsGraphQLClient.query<{ createRlsExample: RlsExample }>(`
        mutation CreateRlsExample($content: String!) {
          createRlsExample(content: $content) {
            id
            content
            userId
            publicToken
            createdAt
            updatedAt
          }
        }
      `, { content: newContent });
      
      if (response.errors) {
        throw new Error(response.errors[0]?.message || 'Failed to create RLS example');
      }
      
      setRlsExamples(prev => [response.data.createRlsExample, ...prev]);
      setNewContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create RLS example');
    } finally {
      setLoading(false);
    }
  };

  // Update RLS example
  const updateRlsExample = async (id: string) => {
    if (!editingContent.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await rlsGraphQLClient.query<{ updateRlsExample: RlsExample }>(`
        mutation UpdateRlsExample($id: String!, $content: String!) {
          updateRlsExample(id: $id, content: $content) {
            id
            content
            userId
            publicToken
            createdAt
            updatedAt
          }
        }
      `, { id, content: editingContent });
      
      if (response.errors) {
        throw new Error(response.errors[0]?.message || 'Failed to update RLS example');
      }
      
      setRlsExamples(prev => 
        prev.map(example => 
          example.id === id ? response.data.updateRlsExample : example
        )
      );
      setEditingId(null);
      setEditingContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update RLS example');
    } finally {
      setLoading(false);
    }
  };

  // Delete RLS example
  const deleteRlsExample = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await rlsGraphQLClient.query<{ deleteRlsExample: boolean }>(`
        mutation DeleteRlsExample($id: String!) {
          deleteRlsExample(id: $id)
        }
      `, { id });
      
      if (response.errors) {
        throw new Error(response.errors[0]?.message || 'Failed to delete RLS example');
      }
      
      if (response.data.deleteRlsExample) {
        setRlsExamples(prev => prev.filter(example => example.id !== id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete RLS example');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRlsExamples();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>RLS Example (GraphQL)</CardTitle>
        <CardDescription>
          Row Level Security example with GraphQL. Only shows your own data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create Form */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter content for RLS example..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && createRlsExample()}
          />
          <Button onClick={createRlsExample} disabled={loading || !newContent.trim()}>
            Create
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}

        {/* RLS Examples List */}
        <div className="space-y-2">
          {rlsExamples.map((example) => (
            <div key={example.id} className="p-3 border rounded-md">
              {editingId === example.id ? (
                <div className="flex gap-2">
                  <Input
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && updateRlsExample(example.id)}
                  />
                  <Button 
                    size="sm" 
                    onClick={() => updateRlsExample(example.id)}
                    disabled={loading || !editingContent.trim()}
                  >
                    Save
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setEditingId(null);
                      setEditingContent('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm">{example.content}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {example.id}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(example.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(example.id);
                        setEditingContent(example.content);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteRlsExample(example.id)}
                      disabled={loading}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {rlsExamples.length === 0 && !loading && (
          <p className="text-sm text-gray-500 text-center py-4">
            No RLS examples found. Create one above!
          </p>
        )}
      </CardContent>
    </Card>
  );
};
