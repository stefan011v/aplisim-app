export const INTERNAL_ROLES = ["admin", "staff", "viewer"];

export function isAdmin(user) {
  return user?.role === "admin";
}

export function isStaff(user) {
  return user?.role === "staff";
}

export function isViewer(user) {
  return user?.role === "viewer";
}

export function isClient(user) {
  return user?.role === "client";
}

export function isInternal(user) {
  return INTERNAL_ROLES.includes(user?.role);
}

export function isClientPortalAdmin(user) {
  return isClient(user) && user?.clientPortalRole === "admin";
}

/** Creating records is an admin/staff action; viewers are read-only. */
export function canWrite(user) {
  return isAdmin(user) || isStaff(user);
}

export function canDelete(user) {
  return isAdmin(user);
}

export function isAuthenticatedUser(user) {
  return Boolean(user?.id || user?.email);
}
