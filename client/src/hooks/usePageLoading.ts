import { useLayoutEffect } from "react";
import { beginRequestLoading } from "../utils/requestLoading";

export function usePageLoading(isLoading: boolean): void {
    useLayoutEffect(() => {
        const finishLoading = beginRequestLoading({
            immediate: true,
        });

        let firstFrame: number | undefined;
        let secondFrame: number | undefined;

        if (!isLoading) {
            firstFrame = requestAnimationFrame(() => {
                firstFrame = undefined;

                secondFrame = requestAnimationFrame(() => {
                    secondFrame = undefined;
                    finishLoading();
                });
            });
        }

        return () => {
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