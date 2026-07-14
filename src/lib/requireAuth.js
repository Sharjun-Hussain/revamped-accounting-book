import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

const secret = process.env.NEXTAUTH_SECRET;

/**
 * Call at the top of any API route handler.
 * Returns { session } on success, or a NextResponse 401 to return immediately.
 *
 * Usage:
 *   const auth = await requireAuth(request);
 *   if (auth instanceof NextResponse) return auth;
 *   // auth.session is available here
 */
export async function requireAuth(request) {
    const token = await getToken({ req: request, secret });

    if (!token) {
        return NextResponse.json(
            { error: 'Unauthorized. Please log in to access this resource.' },
            { status: 401 }
        );
    }

    return {
        session: {
            user: {
                id: token.id,
                name: token.name,
                email: token.email,
                role: token.role,
            },
        },
    };
}

/**
 * Require admin role specifically.
 */
export async function requireAdmin(request) {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    if (auth.session.user.role !== 'admin') {
        return NextResponse.json(
            { error: 'Forbidden. Admin access required.' },
            { status: 403 }
        );
    }

    return auth;
}
