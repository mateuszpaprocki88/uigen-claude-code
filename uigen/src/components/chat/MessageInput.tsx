"use client";

import { ChangeEvent, FormEvent, KeyboardEvent, useRef, useState } from "react";
import { Send, ImagePlus, X } from "lucide-react";

interface MessageInputProps {
  input: string;
  handleInputChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>, options?: { experimental_attachments?: FileList | File[] }) => void;
  isLoading: boolean;
}

export function MessageInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
}: MessageInputProps) {
  const [attachment, setAttachment] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) form.requestSubmit();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachment(file);
    setPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const removeAttachment = () => {
    if (preview) URL.revokeObjectURL(preview);
    setAttachment(null);
    setPreview(null);
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e, attachment ? { experimental_attachments: [attachment] } : undefined);
    removeAttachment();
  };

  return (
    <form onSubmit={onSubmit} className="relative p-4 bg-white border-t border-neutral-200/60">
      <div className="relative max-w-4xl mx-auto">
        {preview && (
          <div className="mb-2 flex items-start gap-2">
            <div className="relative inline-block">
              <img src={preview} alt="attachment" className="h-16 w-16 rounded-lg object-cover border border-neutral-200" />
              <button
                type="button"
                onClick={removeAttachment}
                className="absolute -top-1.5 -right-1.5 bg-neutral-800 text-white rounded-full p-0.5 hover:bg-neutral-600 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
        <textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Describe the React component you want to create..."
          disabled={isLoading}
          className="w-full min-h-[80px] max-h-[200px] pl-4 pr-24 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 text-neutral-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 focus:bg-white transition-all placeholder:text-neutral-400 text-[15px] font-normal shadow-sm"
          rows={3}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="absolute right-3 bottom-3 flex items-center gap-1">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-lg transition-all hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ImagePlus className={`h-4 w-4 ${attachment ? "text-blue-600" : "text-neutral-400 hover:text-neutral-600"}`} />
          </button>
          <button
            type="submit"
            disabled={isLoading || (!input?.trim() && !attachment)}
            className="p-2.5 rounded-lg transition-all hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent group"
          >
            <Send className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${isLoading || (!input?.trim() && !attachment) ? "text-neutral-300" : "text-blue-600"}`} />
          </button>
        </div>
      </div>
    </form>
  );
}
