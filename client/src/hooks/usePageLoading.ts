import { useLayoutEffect } from "react";
import { beginRequestLoading } from "../utils/requestLoading";

export function usePageLoading(isLoading: boolean): void {
    useLayoutEffect(() => {
        const finishLoading = beginRequestLoading({
            immediate: true,
        });

        let cancelled = false;
        let firstFrame: number | undefined;
        let secondFrame: number | undefined;

        if (!isLoading) {
            firstFrame = requestAnimationFrame(() => {
                firstFrame = undefined;

                // 반영된 페이지의 배치를 계산하고 폰트 준비 상태를 확인합니다.
                document.getElementById("root")?.getBoundingClientRect();

                const fontsReady =
                    document.fonts?.ready ?? Promise.resolve();

                void fontsReady
                    .catch(() => undefined)
                    .then(() => {
                        if (cancelled) {
                            return;
                        }

                        secondFrame = requestAnimationFrame(() => {
                            secondFrame = undefined;

                            if (!cancelled) {
                                finishLoading();
                            }
                        });
                    });
            });
        }

        return () => {
            cancelled = true;

            if (firstFrame !== undefined) {
                cancelAnimationFrame(firstFrame);
            }

            if (secondFrame !== undefined) {
                cancelAnimationFrame(secondFrame);
            }

            finishLoading();
        };
    }, [isLoading]);
}