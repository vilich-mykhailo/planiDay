export function getToken() {
  return localStorage.getItem("token") || "";
}

export function getKind() {
  return localStorage.getItem("kind") || localStorage.getItem("role") || "";
}