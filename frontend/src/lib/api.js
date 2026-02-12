const jsonHeaders = {
  "Content-Type": "application/json"
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function apiUrl(path) {
  if (!API_BASE_URL) return path;
  return `${API_BASE_URL}${path}`;
}

function getAccessToken() {
  return localStorage.getItem("access_token") || "";
}

function setAccessToken(token) {
  if (!token) {
    localStorage.removeItem("access_token");
    return;
  }
  localStorage.setItem("access_token", token);
}

async function ensureCsrf() {
  await fetch(apiUrl("/api/auth/csrf/"), {
    method: "GET",
    credentials: "include"
  });
}

function getCookie(name) {
  const pairs = document.cookie ? document.cookie.split("; ") : [];
  const match = pairs.find((item) => item.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : "";
}

async function request(path, options = {}) {
  const token = getAccessToken();
  const response = await fetch(apiUrl(path), {
    credentials: "include",
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...options
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    const errorText = payload?.error || payload?.detail || `Request failed (${response.status})`;
    throw new Error(errorText);
  }
  return payload;
}

async function requestWithCsrf(path, options = {}) {
  await ensureCsrf();
  const csrftoken = getCookie("csrftoken");
  const token = getAccessToken();
  return request(path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      "X-CSRFToken": csrftoken,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
}

export const api = {
  listVideos: () => request("/api/videos/"),
  listChannelVideos: (username) => request(`/api/videos/channel/${encodeURIComponent(username)}/`),
  listHistory: () => request("/api/videos/history/"),
  listLikedVideos: () => request("/api/videos/liked/"),
  listWatchLater: () => request("/api/videos/watch-later/"),
  getVideo: (videoId) => request(`/api/videos/${videoId}/`),
  voteVideo: (videoId, vote) =>
    requestWithCsrf(`/api/videos/${videoId}/vote/`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ vote })
    }),
  deleteVideo: (videoId) =>
    requestWithCsrf(`/api/videos/${videoId}/delete/`, {
      method: "POST"
    }),
  toggleWatchLater: (videoId) =>
    requestWithCsrf(`/api/videos/${videoId}/watch-later/`, {
      method: "POST"
    }),
  uploadVideo: (formData) =>
    requestWithCsrf("/api/videos/upload/", {
      method: "POST",
      body: formData
    }),
  login: async (username, password) => {
    const data = await requestWithCsrf("/api/auth/login/", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ username, password })
    });
    setAccessToken(data?.access_token || "");
    return data;
  },
  register: async (username, email, password, confirmPassword) => {
    const data = await requestWithCsrf("/api/auth/register/", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        username,
        email,
        password,
        confirm_password: confirmPassword
      })
    });
    setAccessToken(data?.access_token || "");
    return data;
  },
  logout: async () => {
    try {
      await requestWithCsrf("/api/auth/logout/", {
        method: "POST"
      });
    } finally {
      setAccessToken("");
    }
    return { success: true };
  },
  me: async () => {
    try {
      const data = await request("/api/auth/me/");
      if (!data?.authenticated) {
        setAccessToken("");
      }
      return data;
    } catch (err) {
      throw err;
    }
  },
  clearToken: () => setAccessToken(""),
  getToken: () => getAccessToken()
,
  getSettings: () => request("/api/auth/settings/"),
  updateSettings: (formData) =>
    requestWithCsrf("/api/auth/settings/update/", {
      method: "POST",
      body: formData
    })
};
