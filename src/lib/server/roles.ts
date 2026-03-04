import { fail } from '@sveltejs/kit';

/**
 * Centralized role definitions and authorization helpers.
 * Valid user roles in the system.
 */
export const VALID_ROLES = ['staff', 'dentist', 'admin'] as const;
export type UserRole = (typeof VALID_ROLES)[number];

/**
 * Check if a given string is a valid user role.
 */
export function isValidRole(role: string): role is UserRole {
  return VALID_ROLES.includes(role as UserRole);
}

/**
 * Roles that are allowed to perform delete operations.
 */
const DELETE_ROLES: readonly UserRole[] = ['admin', 'dentist'];

/**
 * Check if a user with the given role can perform delete operations.
 */
export function canDelete(role: string | undefined): boolean {
  return !!role && DELETE_ROLES.includes(role as UserRole);
}

/**
 * Guard function for delete actions. Call at the top of any form action
 * that deletes data. Returns a fail(401) or fail(403) ActionFailure if
 * the user is not authorized, or null if they are authorized.
 *
 * Usage:
 *   const denied = await requireDeletePermission(locals);
 *   if (denied) return denied;
 */
export async function requireDeletePermission(locals: App.Locals) {
  const session = await locals.auth();

  if (!session?.user) {
    return fail(401, { error: 'You must be logged in to perform this action.' });
  }

  // @ts-ignore - role is added via JWT callback
  const role = session.user.role as string | undefined;

  if (!canDelete(role)) {
    return fail(403, {
      error: 'Unauthorized: Only admins and dentists can delete records.'
    });
  }

  return null; // Authorized
}
