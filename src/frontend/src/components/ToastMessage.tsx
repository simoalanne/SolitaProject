import { useState, useEffect } from "react";
import "../../css/toastMessage.css";

type ToastProps = {
  message?: string;
  uuid?: string;
  displayTime?: number;
};

const ToastMessage = ({ message, uuid, displayTime = 2500 }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!message) return;

    setIsVisible(true);

    const timer = setTimeout(() => setIsVisible(false), displayTime);
    return () => clearTimeout(timer);
  }, [uuid, message, displayTime]);

  if (!isVisible || !message) return null;

  return <p className="toast-message">{message}</p>;
};

export default ToastMessage;
