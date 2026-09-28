import type { ComponentType } from "react";

import type { AGUILoadingTextAnimation } from "../../..";

import { AGUILoadingCaptionTextShuffle } from "./agui-loading-caption-text-shuffle";
import { AGUILoadingCaptionTextSlideFade } from "./agui-loading-caption-text-slide-fade";
import { AGUILoadingCaptionTextTyping } from "./agui-loading-caption-text-typing";

type CaptionText = ComponentType<{ text: string }>;

// The component for each animation option. Shared by the text parts.
export const AGUI_LOADING_CAPTION_TEXT_COMPONENTS = {
  "slide-up": ({ text }) => <AGUILoadingCaptionTextSlideFade text={text} direction="up" />,
  "slide-down": ({ text }) => <AGUILoadingCaptionTextSlideFade text={text} direction="down" />,
  "slide-left": ({ text }) => <AGUILoadingCaptionTextSlideFade text={text} direction="left" />,
  "slide-right": ({ text }) => <AGUILoadingCaptionTextSlideFade text={text} direction="right" />,
  typing: AGUILoadingCaptionTextTyping,
  shuffle: AGUILoadingCaptionTextShuffle,
} satisfies Record<AGUILoadingTextAnimation, CaptionText>;
