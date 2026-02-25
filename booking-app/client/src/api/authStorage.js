export function getToken() {
  return localStorage.getItem("token");
}

export function setAuth({ token, kind }) {
  localStorage.setItem("token", token);
  localStorage.setItem("role", kind); // "owner" | "client"
  }

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
}