import { useRef, useState } from 'react';
import NavBar from '../components/NavBar.jsx';
import Sheet from '../components/Sheet.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useData } from '../contexts/DataContext.jsx';
import { LogOut, Download, Upload, Check, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { books, collections, importData } = useData();
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [mode, setMode] = useState('skip');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const exportData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      books,
      collections
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-library-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFilePicked = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setResult(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed.books) || !Array.isArray(parsed.collections)) {
        throw new Error('This file does not look like a library export.');
      }
      setMode('skip');
      setPreview(parsed);
    } catch (err) {
      setError(err?.message || 'Could not read the file.');
    }
  };

  const closeSheet = () => {
    setPreview(null);
    setResult(null);
    setError('');
  };

  const runImport = async () => {
    if (!preview) return;
    setImporting(true);
    try {
      const stats = await importData(preview, mode);
      setResult(stats);
    } catch (err) {
      setError(err?.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <NavBar title="Settings" large />
      <div className="px-4 flex flex-col gap-4">
        <div className="ios-list">
          <div className="px-4 py-3">
            <div className="text-[12px] text-ash">Signed in as</div>
            <div className="text-[15px] font-medium">{user?.email}</div>
          </div>
        </div>

        <div className="ios-list">
          <button onClick={exportData} className="ios-row w-full text-left">
            <div className="w-9 h-9 rounded-lg bg-rose-soft/60 text-rose-deep flex items-center justify-center">
              <Download size={18} />
            </div>
            <div className="flex-1">
              <div className="font-medium">Export library</div>
              <div className="text-[13px] text-ash">Download a JSON backup</div>
            </div>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="ios-row w-full text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-rose-soft/60 text-rose-deep flex items-center justify-center">
              <Upload size={18} />
            </div>
            <div className="flex-1">
              <div className="font-medium">Import library</div>
              <div className="text-[13px] text-ash">Restore from a JSON backup</div>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={onFilePicked}
            className="hidden"
          />
        </div>

        <div className="ios-list">
          <button onClick={signOut} className="ios-row w-full text-left">
            <div className="w-9 h-9 rounded-lg bg-rose-soft/60 text-rose-deep flex items-center justify-center">
              <LogOut size={18} />
            </div>
            <div className="flex-1 font-medium">Sign out</div>
          </button>
        </div>

        {error && !preview && (
          <div className="ios-card p-3 text-[13px] bg-yellow-50 border border-yellow-200 text-yellow-900 flex gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        <div className="text-center text-[12px] text-ash mt-2 pb-4">
          <div>
            {books.length} books · {collections.length} collections
          </div>
          <div className="opacity-70 mt-1">v{__APP_VERSION__}</div>
        </div>
      </div>

      <Sheet open={!!preview} onClose={closeSheet} title="Import Library">
        {preview && (
          <div className="px-4 pb-6 flex flex-col gap-4">
            {result ? (
              <>
                <div className="ios-card p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 flex gap-3">
                  <Check size={20} className="shrink-0 mt-0.5" />
                  <div className="text-[14px]">
                    <div className="font-semibold mb-1">Import complete</div>
                    <div>Added {result.added} {result.added === 1 ? 'book' : 'books'}</div>
                    {result.overwritten > 0 && (
                      <div>Overwrote {result.overwritten} existing</div>
                    )}
                    {result.skipped > 0 && <div>Skipped {result.skipped} duplicates</div>}
                    {result.collectionsCreated > 0 && (
                      <div>
                        Created {result.collectionsCreated}{' '}
                        {result.collectionsCreated === 1 ? 'collection' : 'collections'}
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={closeSheet} className="ios-button">
                  Done
                </button>
              </>
            ) : (
              <>
                <div className="ios-card p-4 text-[14px]">
                  Found <strong>{preview.books.length}</strong>{' '}
                  {preview.books.length === 1 ? 'book' : 'books'} and{' '}
                  <strong>{preview.collections.length}</strong>{' '}
                  {preview.collections.length === 1 ? 'collection' : 'collections'} in the file.
                </div>

                <div>
                  <div className="text-[12px] uppercase tracking-wider text-ash px-1 pb-1.5">
                    When a book already exists in your library
                  </div>
                  <div className="ios-list">
                    <ModeOption
                      active={mode === 'skip'}
                      onClick={() => setMode('skip')}
                      title="Skip it"
                      body="Keep the local version unchanged."
                    />
                    <ModeOption
                      active={mode === 'overwrite'}
                      onClick={() => setMode('overwrite')}
                      title="Overwrite it"
                      body="Replace the local version with the imported version."
                    />
                  </div>
                </div>

                {error && (
                  <div className="ios-card p-3 text-[13px] bg-yellow-50 border border-yellow-200 text-yellow-900 flex gap-2">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <div>{error}</div>
                  </div>
                )}

                <button onClick={runImport} disabled={importing} className="ios-button">
                  {importing ? 'Importing…' : 'Import'}
                </button>
                <button onClick={closeSheet} className="ios-button-secondary">
                  Cancel
                </button>
              </>
            )}
          </div>
        )}
      </Sheet>
    </>
  );
}

function ModeOption({ active, onClick, title, body }) {
  return (
    <button onClick={onClick} className="ios-row w-full text-left">
      <div className="flex-1">
        <div className="font-medium">{title}</div>
        <div className="text-[13px] text-ash">{body}</div>
      </div>
      {active && <Check size={20} className="text-rose-deep" />}
    </button>
  );
}
