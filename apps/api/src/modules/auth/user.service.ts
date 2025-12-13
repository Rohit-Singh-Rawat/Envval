import { auth } from './auth.service';

type UpdateUserData = {
	name?: string;
};

export class UserService {
	async updateUser(userId: string, data: UpdateUserData, headers: HeadersInit) {
		const { name } = data;

		if (name !== undefined) {
			await auth.api.updateUser({
				headers,
				body: {
					name,
				},
			});
		}

		// Fetch updated user
		const session = await auth.api.getSession({ headers });
		return session?.user ?? null;
	}
}
