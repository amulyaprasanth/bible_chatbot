import { useEffect, useRef, useState } from "react";

interface UseTypingAnimationOptions {
  speed?: number; // milliseconds per character
  onComplete?: () => void;
}

export const useTypingAnimation = (
  text: string,
  options: UseTypingAnimationOptions = {},
) => {
  const { speed = 20, onComplete } = options;
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Keep onComplete in a ref so changing the callback never restarts the animation
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!text) {
      setDisplayedText("");
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    setDisplayedText("");

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
      }
    }, speed);

    return () => clearInterval(interval);
    // onComplete intentionally excluded — stored in a ref to avoid restarting animation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed]);

  return { displayedText, isTyping };
};
