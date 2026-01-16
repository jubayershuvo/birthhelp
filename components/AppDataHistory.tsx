'use client';

import { useEffect, useState } from 'react';

type HistoryDataItem = {
  _id: string;
  ubrn: string;
  personBirthDate: string;
  personNameBn: string | null;
  fatherNameBn: string | null;
  motherNameBn: string | null;
  officeNameBn: string;
};

type HistoryItem = {
  _id: string;
  appId: string;
  createdAt: string;
  updatedAt: string;
  data: HistoryDataItem[];
};

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/possible-app-data/history')
      .then(res => res.json())
      .then(res => setHistory(res.history || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300">
        Loading history...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Application History
        </h1>

        {history.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400">
            No history available
          </p>
        )}

        {history.map(item => (
          <div
            key={item._id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 space-y-4"
          >
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <Info label="App ID" value={item.appId} />
              <Info label="Created At" value={new Date(item.createdAt).toLocaleString()} />
            </div>

            {/* DATA LIST */}
            <div className="space-y-4">
              {item.data.map(d => (
                <div
                  key={d._id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  {/* Mobile Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <Info label="UBRN" value={d.ubrn} />
                    <Info label="Birth Date" value={d.personBirthDate} />
                    <Info label="Office (BN)" value={d.officeNameBn} />
                    <Info label="Name (BN)" value={d.personNameBn || '—'} />
                    <Info label="Father Name (BN)" value={d.fatherNameBn || '—'} />
                    <Info label="Mother Name (BN)" value={d.motherNameBn || '—'} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Reusable info row */
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-500 dark:text-gray-400">{label}</p>
      <p className="font-medium text-gray-900 dark:text-gray-100 break-all">
        {value}
      </p>
    </div>
  );
}
