// This is your full, updated file.
// Copy and paste this to replace your existing productGroupApi.ts

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/product-groups`;

export async function createProductGroup(data: any) {
  console.log('Creating product group with data:', data);
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('API Error Response:', errorText);
    throw new Error(`Failed to create product group: ${res.status} - ${errorText}`);
  }
  
  const result = await res.json();
  console.log('Product group created successfully:', result);
  return result;
}

export async function fetchProductGroups(params: Record<string, any> = {}) {
  const query = new URLSearchParams(params as any).toString();
  const res = await fetch(`${API_BASE}${query ? `?${query}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch product groups');
  return res.json();
}

export async function updateProductGroupStatus(id: number, status: 'accepted' | 'declined' | 'delivered') {
  console.log(`Making API call to update status: ${API_BASE}/${id}/status with status: ${status}`);
  
  const res = await fetch(`${API_BASE}/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  
  console.log(`API response status: ${res.status}`);
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`API error response: ${errorText}`);
    throw new Error(`Failed to update product group status: ${res.status} ${errorText}`);
  }
  
  const result = await res.json();
  console.log(`API success response:`, result);
  return result;
}

// --- ADDED FUNCTIONS START HERE ---

/**
 * Updates an entire product group.
 * Assumes a PUT request to /product-groups/{id}
 */
export async function updateProductGroup(id: string, data: any) {
  console.log(`Updating product group ${id} with data:`, data);
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT', // or 'PATCH' if your API supports partial updates
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('API Error Response:', errorText);
    throw new Error(`Failed to update product group: ${res.status} - ${errorText}`);
  }

  const result = await res.json();
  console.log('Product group updated successfully:', result);
  return result;
}

/**
 * Deletes a product group.
 * Assumes a DELETE request to /product-groups/{id}
 */
export async function deleteProductGroup(id: string) {
  console.log(`Deleting product group ${id}`);
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('API Error Response:', errorText);
    throw new Error(`Failed to delete product group: ${res.status} - ${errorText}`);
  }
  
  // DELETE requests might return 204 No Content, which has no JSON body
  if (res.status === 204) {
    console.log('Product group deleted successfully (204 No Content)');
    return { success: true }; 
  }

  const result = await res.json(); // Or handle as text if no JSON is expected
  console.log('Product group deleted successfully:', result);
  return result;
}

// --- ADDED FUNCTIONS END HERE ---