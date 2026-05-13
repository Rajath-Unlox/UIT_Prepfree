"use client";

import React, { useEffect, useState, useCallback } from "react";

const INTERVAL = 4000; // 4 seconds between slides

const HeroSlider = () => {
    const [images, setImages] = useState<string[]>([]);
    const [current, setCurrent] = useState(0);

    // Fetch image list from API (dynamic — picks up any images in the folder)
    useEffect(() => {
        fetch("/api/hero-images")
            .then(r => r.json())
            .then(data => {
                if (data.images?.length) setImages(data.images);
            })
            .catch(() => { });
    }, []);

    // Auto-advance
    const next = useCallback(() => {
        setCurrent(prev => (prev + 1) % images.length);
    }, [images.length]);

    useEffect(() => {
        if (images.length <= 1) return;
        const timer = setInterval(next, INTERVAL);
        return () => clearInterval(timer);
    }, [images.length, next]);

    if (!images.length) return null;

    return (
        <div className="relative w-full h-full">
            {images.map((src, i) => (
                <img
                    key={src}
                    src={src}
                    alt=""
                    className="absolute inset-0 w-full h-full object-fill transition-opacity duration-700 ease-in-out"
                    style={{ opacity: i === current ? 1 : 0 }}
                    draggable={false}
                />
            ))}

            {/* Dot indicators */}
            {images.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {images.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${i === current
                                ? "bg-white w-5"
                                : "bg-white/50 hover:bg-white/70"
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default HeroSlider;
