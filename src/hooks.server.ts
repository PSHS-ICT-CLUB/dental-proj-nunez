import { sequence } from '@sveltejs/kit/hooks';
import { error, redirect, type Handle } from '@sveltejs/kit';
import { handle as authHandle } from './auth';

// Paths reachable without a session: the login page and Auth.js endpoints.
const PUBLIC_PATHS = ['/login', '/auth'];

function isPublicPath(pathname: string): boolean {
	return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// The root layout's load redirects anonymous users, but form actions and
// +server.ts endpoints run without it, so enforce authentication here.
const requireAuth: Handle = async ({ event, resolve }) => {
	if (!isPublicPath(event.url.pathname)) {
		const session = await event.locals.auth();
		if (!session?.user) {
			if (event.url.pathname.startsWith('/api/')) {
				error(401, 'Unauthorized');
			}
			redirect(303, '/login');
		}
	}
	return resolve(event);
};

export const handle = sequence(authHandle, requireAuth);
