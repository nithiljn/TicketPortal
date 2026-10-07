/**
 * Helper to execute GraphQL Queries and Mutations from the Client
 * Sends a standard POST request with { query, variables } to /api/graphql
 */
export async function fetchGraphQL<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const response = await fetch('/api/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
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
