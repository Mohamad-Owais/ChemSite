import React, { useState } from 'react';
import { SyllabusDocument } from '../../types/database';
import { FileText, Eye, Upload, Calendar, HardDrive, CheckCircle2 } from 'lucide-react';
import { PdfViewerModal } from '../common/PdfViewerModal';
import { useAuth } from '../../contexts/AuthContext';
import { uploadSyllabus } from '../../lib/dataService';

interface SyllabusViewerProps {
  syllabus: SyllabusDocument | null;
  onSyllabusUpdated?: () => void;
}

export const SyllabusViewer: React.FC<SyllabusViewerProps> = ({ syllabus, onSyllabusUpdated }) => {
  const { isAdmin } = useAuth();
  const [isViewing, setIsViewing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return null;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setUploadError('Only PDF documents are supported for the official syllabus.');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      await uploadSyllabus(file, 'Official IIT-JAM Chemistry Syllabus');
      onSyllabusUpdated?.();
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-100">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-stone-900">
                {syllabus?.title || 'IIT-JAM Chemistry Syllabus'}
              </h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                Active Document
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Official reference curriculum covering Physical, Organic, and Inorganic Chemistry.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {syllabus && (
            <button
              type="button"
              onClick={() => setIsViewing(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <Eye className="w-4 h-4" />
              Open Syllabus Document
            </button>
          )}

          {isAdmin && (
            <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition cursor-pointer border border-stone-200">
              <Upload className="w-4 h-4" />
              <span>{uploading ? 'Uploading...' : syllabus ? 'Replace Syllabus PDF' : 'Upload Syllabus PDF'}</span>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                disabled={uploading}
                onChange={handleFileUpload}
              />
            </label>
          )}
        </div>
      </div>

      {uploadError && (
        <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
          {uploadError}
        </div>
      )}

      {/* Meta details strip */}
      {syllabus ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-stone-400" />
            <span>
              File: <strong className="text-stone-700 font-mono">{syllabus.file_name}</strong>
            </span>
          </div>
          {syllabus.file_size && (
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-stone-400" />
              <span>
                Size: <strong className="text-stone-700">{formatFileSize(syllabus.file_size)}</strong>
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-stone-400" />
            <span>
              Updated: <strong className="text-stone-700">{new Date(syllabus.updated_at).toLocaleDateString()}</strong>
            </span>
          </div>
        </div>
      ) : (
        <div className="pt-4 text-xs text-stone-400 italic">
          No official syllabus document has been uploaded yet. Admin can upload the PDF using the button above.
        </div>
      )}

      {/* Viewer Modal */}
      {syllabus && (
        <PdfViewerModal
          isOpen={isViewing}
          onClose={() => setIsViewing(false)}
          title={syllabus.title}
          storagePath={syllabus.storage_path}
          fileName={syllabus.file_name}
        />
      )}
    </div>
  );
};
