'use client';

import { createAuthClient } from '@neondatabase/auth/next';

const neonAuthClient = createAuthClient();

// React's development tooling probes callable values for a displayName. The
// Better Auth client is a dynamic route proxy, so an unguarded probe becomes a
// request to /api/auth/display-name (and then /to-string or /value-of).
export const authClient = new Proxy(neonAuthClient, {
    get(target, property, receiver) {
        if (property === 'displayName') return 'NeonAuthClient';
        return Reflect.get(target, property, receiver);
    },
});
