import React from "react";
import { toast, ToastOptions } from "react-toastify";
import { POTToast, ToastType } from "@/components/ui/POTToast";

export interface CustomToastOptions extends Omit<ToastOptions, "icon" | "closeButton"> {
  title?: string;
}

const defaultOptions: ToastOptions = {
  position: "top-right",
  autoClose: 3500,
  hideProgressBar: false,
  closeOnClick: false,
  pauseOnHover: true,
  draggable: true,
  theme: "light",
  icon: false,
  closeButton: false,
};

const triggerToast = (
  type: ToastType,
  message: string,
  options?: CustomToastOptions
) => {
  const { title, ...toastOptions } = options || {};

  return toast[type](
    ({ closeToast }) => (
      <POTToast
        type={type}
        title={title}
        message={message}
        closeToast={closeToast}
      />
    ),
    {
      ...defaultOptions,
      ...toastOptions,
      icon: false,
      closeButton: false,
    }
  );
};

export const showToast = {
  success: (message: string, options?: CustomToastOptions) =>
    triggerToast("success", message, options),
  error: (message: string, options?: CustomToastOptions) =>
    triggerToast("error", message, options),
  info: (message: string, options?: CustomToastOptions) =>
    triggerToast("info", message, options),
  warning: (message: string, options?: CustomToastOptions) =>
    triggerToast("warning", message, options),
};
