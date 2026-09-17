import React from 'react';
import { ImageAttachment } from '../types';
import { X, Download, Calendar, MapPin, User, ZoomIn } from 'lucide-react';
import { formatThaiDate, triggerImageDownload } from '../utils/fileUtils';

interface ImageLightboxProps {
  image: ImageAttachment | null;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ image, onClose }) => {
  if (!image) return null;

  return (
    <div 
      id="image-lightbox-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        id="image-lightbox-modal"
        className="relative max-w-5xl w-full max-h-[90vh] flex flex-col bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 text-white z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-600/30 text-indigo-300 border border-indigo-500/30">
              ภาพถ่ายหน้างานจริง
            </span>
            <h3 className="text-sm font-semibold truncate max-w-md">
              {image.name}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="lightbox-download-btn"
              type="button"
              onClick={() => triggerImageDownload(image)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลดภาพ</span>
            </button>
            <button
              id="lightbox-close-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Content Container */}
        <div className="relative flex-1 overflow-auto flex items-center justify-center p-4 bg-slate-950 min-h-[300px]">
          <img
            id="lightbox-display-image"
            src={image.url}
            alt={image.name}
            className="max-h-[68vh] max-w-full object-contain rounded-lg shadow-lg"
          />
        </div>

        {/* Footer info bar */}
        <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 text-slate-300 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            {image.caption && (
              <p className="text-sm text-slate-100 font-medium">
                "{image.caption}"
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-slate-400 text-xs">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                ผู้บันทึก: {image.uploadedBy}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                เวลา: {formatThaiDate(image.uploadedAt)}
              </span>
              {image.latLng && (
                <span className="flex items-center gap-1 text-emerald-400">
                  <MapPin className="w-3.5 h-3.5" />
                  พิกัด: {image.latLng}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
