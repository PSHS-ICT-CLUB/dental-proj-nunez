import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const session = await event.locals.auth();

	if (!session?.user) {
		if (event.url.pathname !== '/login') {
			redirect(303, '/login');
		}
	} else if (event.url.pathname === '/login') {
		redirect(303, '/');
	}

	return {
		session
	};
};
