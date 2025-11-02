import { useEffect, useState } from "react";

interface UseTypingAnimationOptions {
  speed?: number; // milliseconds per character
  onComplete?: () => void;
}

export const useTypingAnimation = (
  text: string,
  options: UseTypingAnimationOptions = {}
) => {
  const { speed = 20, onComplete } = options;
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!text) {
      setDisplayedText("");
      setIsTyping(false);
      return;
    }

    // If text is the same, don't restart animation
    if (displayedText === text) {
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
        if (onComplete) {
          onComplete();
        }
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return { displayedText, isTyping };
};

