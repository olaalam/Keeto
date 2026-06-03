/**
 * Checks if the current logged-in user has permission to view a specific module.
 * @param {Object} user - The user object from useAuthStore.
 * @param {string} requiredModule - The name of the module to check.
 * @returns {boolean} True if permitted, false otherwise.
 */
export const hasModulePermission = (user, requiredModule) => {
  if (!user) return false;

  // If user is superadmin, grant access to everything
  if (user.type === "super_admin" || user.role?.name?.toLowerCase() === "superadmin") {
    return true;
  }

  // If no required module is specified, it's public
  if (!requiredModule) return true;

  // Find user permissions in either user.role.permissions or user.permissions
  const permissions = user.role?.permissions || user.permissions || [];

  // Find permission matching the required module (case-insensitive)
  const permission = permissions.find(
    (p) => p.module?.toLowerCase() === requiredModule.toLowerCase()
  );

  if (!permission) return false;

  // Check if they have the 'View' action (case-insensitive)
  return permission.actions?.some(
    (a) => a.action?.toLowerCase() === "view"
  );
};
