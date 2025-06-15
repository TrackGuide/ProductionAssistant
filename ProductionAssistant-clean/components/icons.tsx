
import React from 'react';

export const SparklesIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"} aria-hidden={title ? undefined : "true"} role={title ? "img" : undefined}>
    {title && <title>{title}</title>}
    <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
  </svg>
);

export const DownloadIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"} aria-hidden={title ? undefined : "true"} role={title ? "img" : undefined}>
    {title && <title>{title}</title>}
    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

export const SaveIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"} aria-hidden={title ? undefined : "true"} role={title ? "img" : undefined}>
    {title && <title>{title}</title>}
    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V4zm2 0v10h6V4H7zm5 1h-4a1 1 0 100 2h4a1 1 0 100-2z" />
  </svg>
);

export const TrashIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"} aria-hidden={title ? undefined : "true"} role={title ? "img" : undefined}>
    {title && <title>{title}</title>}
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

export const BookOpenIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} aria-hidden={title ? undefined : "true"} role={title ? "img" : undefined}>
  {title && <title>{title}</title>}
  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
</svg>
);

export const PDFIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"} aria-hidden={title ? undefined : "true"} role={title ? "img" : undefined}>
    {title && <title>{title}</title>}
    <path fillRule="evenodd" d="M4 0C2.89543 0 2 0.89543 2 2V18C2 19.1046 2.89543 20 4 20H16C17.1046 20 18 19.1046 18 18V6L13 0H4ZM4 2H12V7H17V18H4V2ZM14 1.41421L16.5858 4H14V1.41421ZM8 10C7.44772 10 7 10.4477 7 11V12H6V14H7V15C7 15.5523 7.44772 16 8 16H9C9.55228 16 10 15.5523 10 15V10H8ZM8 12H9V14H8V12ZM11 10C11.5523 10 12 10.4477 12 11V15C12 15.5523 11.5523 16 11 16H10V10H11ZM11 12H13V11C13 10.4477 13.4477 10 14 10H15V12H14V14H15V16H14C13.4477 16 13 15.5523 13 15V14H11V12Z" clipRule="evenodd" />
  </svg>
);

export const CopyIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"} aria-hidden={title ? undefined : "true"} role={title ? "img" : undefined}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m9.75 0l-4.5-4.5m0 0l-4.5 4.5M12.75 3v4.5A2.25 2.25 0 0015 9.75h4.5" />
  </svg>
);


export const MusicNoteIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"} aria-hidden={title ? undefined : "true"} role={title ? "img" : undefined}>
    {title && <title>{title}</title>}
    <path d="M10 3.515V11.24a3.513 3.513 0 00-1.5-.406c-1.313 0-2.388.752-2.388 1.672S7.187 14.18 8.5 14.18c1.238 0 2.263-.672 2.375-1.537h.125v-7.14c0-.313.11-.604.313-.828.202-.224.494-.344.812-.344.625 0 1.125.5 1.125 1.125V11.24a3.513 3.513 0 00-1.5-.406c-1.313 0-2.388.752-2.388 1.672S10.187 14.18 11.5 14.18c1.313 0 2.388-.752 2.388-1.672a1.675 1.675 0 00-1.078-1.543V3.515A2.625 2.625 0 0010 1C8.619 1 7.5 2.12 7.5 3.5V11.24A3.513 3.513 0 006 10.833c-1.313 0-2.388.752-2.388 1.672S4.687 14.18 6 14.18c1.237 0 2.262-.672 2.375-1.537h.125V6.125C8.5 4.5 9.125 3.515 10 3.515z" />
  </svg>
);

export const PlusIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"} aria-hidden={title ? undefined : "true"} role={title ? "img" : undefined}>
    {title && <title>{title}</title>}
    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
  </svg>
);

export const PlayIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"} aria-hidden={title ? undefined : "true"} role={title ? "img" : undefined}>
    {title && <title>{title}</title>}
    <path fillRule="evenodd" d="M6.516 4.42A1.5 1.5 0 004 5.662v8.676a1.5 1.5 0 002.516 1.242l6.712-4.338a1.5 1.5 0 000-2.484L6.516 4.42z" clipRule="evenodd" />
  </svg>
);

export const StopIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"} aria-hidden={title ? undefined : "true"} role={title ? "img" : undefined}>
    {title && <title>{title}</title>}
    <path fillRule="evenodd" d="M5 5a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V6a1 1 0 00-1-1H5zm0-2a3 3 0 00-3 3v8a3 3 0 003 3h8a3 3 0 003-3V6a3 3 0 00-3-3H5z" clipRule="evenodd" />
  </svg>
);

export const RefreshIcon: React.FC<{ className?: string; isSpinning?: boolean; title?: string }> = ({ className, isSpinning, title }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${className || "w-5 h-5"} ${isSpinning ? 'animate-spin' : ''}`} aria-hidden={title ? undefined : "true"} role={title ? "img" : undefined}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

export const KeyboardIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"} aria-hidden={title ? undefined : "true"} role={title ? "img" : undefined}>
    {title && <title>{title}</title>}
    <path fillRule="evenodd" d="M18 7H2a1 1 0 00-1 1v6a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1zM2 9.5v3h16v-3H2z" clipRule="evenodd" />
    <path d="M4 11h1v1H4v-1zm2 0h1v1H6v-1zm2 0h1v1H8v-1zm2 0h1v1h-1v-1zm2 0h1v1h-1v-1zm2 0h1v1h-1v-1z" />
  </svg>
);

export const CheckboxUncheckedIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} aria-hidden={title ? undefined : "true"} role={title ? "img" : undefined}>
    {title && <title>{title}</title>}
    <rect x="3.5" y="3.5" width="17" height="17" rx="2" stroke="currentColor" fill="none" strokeWidth="1.5" />
  </svg>
);

export const CheckboxCheckedIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"} aria-hidden={title ? undefined : "true"} role={title ? "img" : undefined}>
    {title && <title>{title}</title>}
    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm10.707 3.707a1 1 0 00-1.414-1.414L8 9.586 6.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l5-5z" clipRule="evenodd" />
  </svg>
);

export const CloseIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} aria-hidden={title ? undefined : "true"} role={title ? "img" : undefined}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const SpeakerWaveIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"} aria-hidden={title ? undefined : "true"} role={title ? "img" : undefined}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
  </svg>
);

export const SpeakerXMarkIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"} aria-hidden={title ? undefined : "true"} role={title ? "img" : undefined}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
  </svg>
);

export const StarIcon: React.FC<{ className?: string; title?: string; isFilled?: boolean }> = ({ className, title, isFilled }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill={isFilled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isFilled ? 0 : 1.5} className={className || "w-5 h-5"} aria-hidden={title ? undefined : "true"} role={title ? "img" : undefined}>
    {title && <title>{title}</title>}
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export const UploadIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} aria-hidden={title ? undefined : "true"} role={title ? "img" : undefined}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

export const AdjustmentsHorizontalIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} aria-hidden={title ? undefined : "true"} role={title ? "img" : undefined}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a2.25 2.25 0 11-4.5 0m4.5 0a2.25 2.25 0 10-4.5 0M3.75 6H7.5m3 12h9.75m-9.75 0a2.25 2.25 0 01-4.5 0m4.5 0a2.25 2.25 0 00-4.5 0M3.75 18H7.5M10.5 12h9.75M10.5 12a2.25 2.25 0 01-4.5 0m4.5 0a2.25 2.25 0 00-4.5 0M3.75 12H7.5" />
  </svg>
);

export const PencilSquareIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} aria-hidden={title ? undefined : "true"} role={title ? "img" : undefined}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);
