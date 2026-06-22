const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api';

function getUserIdHeader() {
  const user = localStorage.getItem('dumbake_user');
  if (user) {
    try {
      return JSON.parse(user).id.toString();
    } catch (e) {
      return 'Anonymous';
    }
  }
  return 'Anonymous';
}

// 1. Auth Services
export async function loginUser(email, passwordHash) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, passwordHash }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function registerUser(name, email, passwordHash, role) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, passwordHash, role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function forgotPassword(email) {
  const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Password reset request failed');
  return data;
}

export async function resetPassword(email, token, newPasswordHash) {
  const res = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token, newPasswordHash }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Password reset failed');
  return data;
}

export async function fetchProfile() {
  const res = await fetch(`${BASE_URL}/auth/profile`, {
    headers: { 'x-user-id': getUserIdHeader() }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Profile fetch failed');
  return data;
}

// 2. Item Services
export async function fetchItems(category = '', search = '', eggless = false) {
  let url = `${BASE_URL}/items?`;
  if (category) url += `category=${encodeURIComponent(category)}&`;
  if (search) url += `search=${encodeURIComponent(search)}&`;
  if (eggless) url += `eggless=true&`;
  
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Fetch items failed');
  return data;
}

export async function fetchItemDetails(id) {
  const res = await fetch(`${BASE_URL}/items/${id}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Fetch item details failed');
  return data;
}

export async function addBakeryItem(itemData) {
  const res = await fetch(`${BASE_URL}/items`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-user-id': getUserIdHeader()
    },
    body: JSON.stringify(itemData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Add item failed');
  return data;
}

export async function updateBakeryItem(id, itemData) {
  const res = await fetch(`${BASE_URL}/items/${id}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'x-user-id': getUserIdHeader()
    },
    body: JSON.stringify(itemData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Update item failed');
  return data;
}

export async function deleteBakeryItem(id) {
  const res = await fetch(`${BASE_URL}/items/${id}`, {
    method: 'DELETE',
    headers: { 'x-user-id': getUserIdHeader() }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Delete item failed');
  return data;
}

// 3. Orders Services
export async function postOrder(orderData) {
  const res = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-user-id': getUserIdHeader()
    },
    body: JSON.stringify(orderData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Place order failed');
  return data;
}

export async function fetchOrders() {
  const res = await fetch(`${BASE_URL}/orders`, {
    headers: { 'x-user-id': getUserIdHeader() }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Fetch orders failed');
  return data;
}

export async function updateOrderStatus(id, statusData) {
  const res = await fetch(`${BASE_URL}/orders/${id}/status`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'x-user-id': getUserIdHeader()
    },
    body: JSON.stringify(statusData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Update order status failed');
  return data;
}

// 4. Reviews Services
export async function fetchReviews() {
  const res = await fetch(`${BASE_URL}/reviews`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Fetch reviews failed');
  return data;
}

export async function postReview(reviewData) {
  const res = await fetch(`${BASE_URL}/reviews`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-user-id': getUserIdHeader()
    },
    body: JSON.stringify(reviewData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Post review failed');
  return data;
}

// 5. AI Services
export async function fetchAIRecommendations() {
  const res = await fetch(`${BASE_URL}/ai/recommendations`, {
    headers: { 'x-user-id': getUserIdHeader() }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Fetch AI recommendations failed');
  return data;
}

export async function fetchAIBestsellers() {
  const res = await fetch(`${BASE_URL}/ai/bestsellers`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Fetch bestsellers failed');
  return data;
}
