import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Validate JWT and refresh token if needed.
    // NEVER remove this — it keeps sessions alive.
    const { data: { user } } = await supabase.auth.getUser()

    // Public routes that don't require authentication
    const isPublicRoute =
        request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/register') ||
        request.nextUrl.pathname.startsWith('/auth') ||
        request.nextUrl.pathname.startsWith('/menu') ||
        request.nextUrl.pathname.startsWith('/mesa') ||
        request.nextUrl.pathname.startsWith('/opengraph-image') ||
        request.nextUrl.pathname.startsWith('/twitter-image') ||
        request.nextUrl.pathname.startsWith('/icon') ||
        request.nextUrl.pathname.startsWith('/apple-icon') ||
        request.nextUrl.pathname.startsWith('/manifest.json')

    // Not authenticated → redirect to /login (except public routes)
    if (!user && !isPublicRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Authenticated user accessing protected (dashboard) routes → verify cargo
    if (user && !isPublicRoute) {
        const cargo = user.app_metadata?.cargo
        if (cargo !== 'dono' && cargo !== 'admin') {
            // User is authenticated but not authorized for dashboard
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }
    }

    // Authenticated but accessing /login or /register → redirect to dashboard
    if (user && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register'))) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
