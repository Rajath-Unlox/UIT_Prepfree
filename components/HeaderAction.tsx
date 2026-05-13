'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function HeaderAction({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const target = document.getElementById('breadcrumb-actions');
    if (!target) return null;

    return createPortal(children, target);
}
