// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { Session, DefaultSession } from '@auth/sveltekit';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session: Session | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare module '@auth/sveltekit' {
	interface Session {
		user: {
			id: string;
			role?: string;
		} & DefaultSession['user'];
	}
}

export {};
