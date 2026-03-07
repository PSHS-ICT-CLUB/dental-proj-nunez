import type { Actions, PageServerLoad } from './$types';
import {
	isPasswordSet,
	setAdminPassword,
	verifyAdminPassword,
	removeAdminPassword
} from '$lib/server/auth';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const isSet = await isPasswordSet();
	return { isSet };
};

export const actions: Actions = {
	setPassword: async ({ request }) => {
		const form = await request.formData();
		const current = (form.get('current') || '').toString();
		const next = (form.get('next') || '').toString();
		const confirm = (form.get('confirm') || '').toString();

		if (!next || !confirm) {
			return fail(400, { error: 'New password and confirmation are required' });
		}
		if (next !== confirm) {
			return fail(400, { error: 'New password and confirmation do not match' });
		}

		const alreadySet = await isPasswordSet();
		if (alreadySet) {
			const ok = await verifyAdminPassword(current);
			if (!ok) {
				return fail(400, { error: 'Current password is incorrect' });
			}
		}

		await setAdminPassword(next);
		const isSet = await isPasswordSet();
		return {
			message: isSet ? 'Password updated successfully' : 'Password set successfully',
			isSet: true
		};
	},
	resetPassword: async ({ request }) => {
		const form = await request.formData();
		const confirmPassword = (form.get('confirm_password') || '').toString();

		// Verify current password before allowing reset
		const passwordIsSet = await isPasswordSet();
		if (!passwordIsSet) {
			return fail(400, { error: 'No password is set to reset' });
		}

		if (!confirmPassword) {
			return fail(400, { error: 'Password confirmation is required' });
		}

		const ok = await verifyAdminPassword(confirmPassword);
		if (!ok) {
			return fail(400, { error: 'Password is incorrect' });
		}

		await removeAdminPassword();
		return {
			message: 'Password has been removed successfully',
			isSet: false
		};
	}
};
