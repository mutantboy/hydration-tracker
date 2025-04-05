import type { ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async ({ locals: { getSession } }) => {
    const session = await getSession();
    console.log("Layout session:", session);
    return { session };
};