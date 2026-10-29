import { vi } from 'vitest';

const { mockSupabase, rPush, rReset } = vi.hoisted(() => {
    let callCount = 0;
    const responses = [];
    const rPush = (data, error = null, count = null) => {
        responses.push({ data, error, count });
    };
    const rReset = () => { responses.length = 0; callCount = 0; };
    const nextResponse = () => {
        if (callCount < responses.length) return responses[callCount++];
        return { data: null, error: null, count: null };
    };
    const makeBuilder = () => ({
        select() { return this; },
        insert() { return this; },
        update() { return this; },
        delete() { return this; },
        eq() { return this; },
        neq() { return this; },
        in() { return this; },
        is() { return this; },
        gt() { return this; },
        gte() { return this; },
        lt() { return this; },
        lte() { return this; },
        order() { return this; },
        limit() { return this; },
        single() { return Promise.resolve(nextResponse()); },
        maybeSingle() { return Promise.resolve(nextResponse()); },
        then(resolve) { resolve(nextResponse()); },
    });
    const supabase = {
        from() { return makeBuilder(); },
        auth: {
            getSession: vi.fn(),
            signInWithPassword: vi.fn(),
            signOut: vi.fn(),
            signUp: vi.fn(),
            setSession: vi.fn(),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        },
        functions: { invoke: vi.fn() },
    };
    return { mockSupabase: supabase, rPush, rReset };
});

vi.mock('../supabase-config.js', () => ({ supabase: mockSupabase }));

export const pushResponse = rPush;
export const resetMock = rReset;
export const mockClient = mockSupabase;
