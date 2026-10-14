/**
 * Helper to execute GraphQL Queries and Mutations from the Client
 * Sends a standard POST request with { query, variables } to /api/graphql
 */
import { supabase } from '@/lib/supabase'

export async function fetchGraphQL<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  // Retrieve current active Supabase session token
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  try {
    const { data } = await supabase.auth.getSession()
    if (data?.session?.access_token) {
      headers['Authorization'] = `Bearer ${data.session.access_token}`
    }
  } catch (err) {
    console.warn('Could not fetch Supabase session for GraphQL request:', err)
  }

  const response = await fetch('/api/graphql', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    throw new Error(`HTTP network error! Status: ${response.status}`)
  }

  const result = await response.json()

  if (result.errors && result.errors.length > 0) {
    throw new Error(result.errors[0].message || 'GraphQL request error occurred')
  }

  return result.data as T
}
