"use client";

import React, {
    forwardRef,
    useImperativeHandle,
    useRef,
} from "react";

interface HtmlResumeRendererProps {
    htmlString: string;
    containerWidth: number;
}

const BASE_RESUME_WIDTH = 800;
const BASE_RESUME_HEIGHT = 1100;

const HtmlResumeRenderer = forwardRef<any, HtmlResumeRendererProps>(
    ({ htmlString, containerWidth }, ref) => {
        const iframeRef = useRef<HTMLIFrameElement>(null);

        // Calculate scale immediately to avoid initialization flicker
        const scale = containerWidth > 0 ? containerWidth / BASE_RESUME_WIDTH : 1;
        const scaledHeight = BASE_RESUME_HEIGHT * scale;

        // Expose generateResumePdf() to parent
        useImperativeHandle(ref, () => ({
            generateResumePdf: async (): Promise<File | null> => {
                try {
                    const iframeDoc =
                        iframeRef.current?.contentDocument ||
                        iframeRef.current?.contentWindow?.document;
                    if (!iframeDoc) return null;

                    const html2canvas = (await import("html2canvas-pro")).default;
                    const jsPDF = (await import("jspdf")).default;

                    const canvas = await html2canvas(iframeDoc.body, {
                        scale: 2,
                        useCORS: true,
                        backgroundColor: "#ffffff",
                        logging: false,
                    });

                    const imgData = canvas.toDataURL("image/png");
                    const pdf = new jsPDF({
                        orientation: "p",
                        unit: "mm",
                        format: "a4",
                    });

                    const pageWidth = 210;
                    const pageHeight = 297;
                    const imgWidth = pageWidth;
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;

                    if (imgHeight > pageHeight) {
                        let heightLeft = imgHeight;
                        let position = 0;
                        while (heightLeft > 0) {
                            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
                            heightLeft -= pageHeight;
                            if (heightLeft > 0) {
                                pdf.addPage();
                                position = -pageHeight;
                            }
                        }
                    } else {
                        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
                    }

                    const pdfBlob = pdf.output("blob");
                    return new File([pdfBlob], "resume.pdf", {
                        type: "application/pdf",
                    });
                } catch (err) {
                    console.error("PDF generation failed:", err);
                    return null;
                }
            },
        }));

        return (
            <div
                style={{
                    width: containerWidth > 0 ? `${containerWidth}px` : `${BASE_RESUME_WIDTH}px`,
                    height: `${scaledHeight}px`,
                    overflow: "hidden",
                    position: "relative",
                    display: "block",
                }}
            >
                <div
                    style={{
                        width: `${BASE_RESUME_WIDTH}px`,
                        height: `${BASE_RESUME_HEIGHT}px`,
                        transformOrigin: "top left",
                        transform: `scale(${scale})`,
                        position: "absolute",
                        top: 0,
                        left: 0,
                    }}
                >
                    <iframe
                        ref={iframeRef}
                        srcDoc={htmlString}
                        scrolling="no"
                        style={{
                            width: `${BASE_RESUME_WIDTH}px`,
                            height: `${BASE_RESUME_HEIGHT}px`,
                            border: "none",
                            display: "block",
                            overflow: "hidden",
                        }}
                        sandbox="allow-same-origin allow-scripts"
                        title="Resume Preview"
                    />
                </div>
            </div>
        );
    }
);

HtmlResumeRenderer.displayName = "HtmlResumeRenderer";
export default HtmlResumeRenderer;
