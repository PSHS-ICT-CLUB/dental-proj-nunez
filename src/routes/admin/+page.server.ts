import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth();

  if (!session?.user || session.user.role !== 'admin') {
    redirect(302, '/');
  }

  return {
    user: session.user
  };
};
