import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { getSignedFileUrl } from '../../lib/supabase';
import { ExternalLink, FileText, Download, Loader2, AlertCircle } from 'lucide-react';

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  storagePath: string | null;
  fileName?: string | null;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  onClose,
  title,
  storagePath,
  fileName,
}) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !storagePath) {
      setSignedUrl(null);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const fetchUrl = async () => {
      try {
        const url = await getSignedFileUrl(storagePath);
        if (isMounted) {
          if (url) {
            setSignedUrl(url);
          } else {
            setError('Could not generate secure signed link. The file may have moved or access is restricted.');
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error accessing document');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUrl();

    return () => {
      isMounted = false;
    };
  }, [isOpen, storagePath]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={fileName ? `File: ${fileName}` : undefined}
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-stone-500">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mb-3" />
            <p className="text-sm font-medium">Authorizing and retrieving secure PDF...</p>
          </div>
        )}

        {error && (
          <div className="p-6 text-center rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
            <AlertCircle className="w-8 h-8 mx-auto text-rose-600 mb-2" />
            <p className="text-sm font-semibold">{error}</p>
            <p className="text-xs text-rose-600 mt-1">
              Ensure you have logged in with an authorized account and the Supabase Storage bucket policy is applied.
            </p>
          </div>
        )}

        {!loading && !error && signedUrl && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 text-xs">
              <span className="text-stone-500 flex items-center gap-1.5 font-medium">
                <FileText className="w-4 h-4 text-emerald-700" />
                Protected Study Document
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open in New Tab
                </a>
                <a
                  href={signedUrl}
                  download={fileName || 'document.pdf'}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold transition shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>
              </div>
            </div>

            <div className="w-full h-[65vh] rounded-xl overflow-hidden border border-stone-200 bg-stone-50">
              <iframe
                src={`${signedUrl}#toolbar=1`}
                title={title}
                className="w-full h-full"
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
