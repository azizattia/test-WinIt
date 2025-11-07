'use client';

import { useState } from 'react';
import { SearchResponse, CourtCase } from '@/lib/types';

export default function SearchForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
        }),
      });

      const data = await response.json();

      if (response.ok || response.status === 404) {
        setResults(data);
      } else {
        setError(data.message || 'An error occurred');
      }
    } catch (err) {
      setError('Failed to connect to the API');
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (first: string, last: string) => {
    setFirstName(first);
    setLastName(last);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Santa Clara County Court Records Search
          </h1>
          <p className="text-gray-600">
            Search court records by first and last name
          </p>
          <p className="text-sm text-gray-500 mt-2">
            (Using mock data fixtures - compliant with anti-bot policies)
          </p>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="John"
                required
              />
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="Smith"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Searching...' : 'Search Records'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Try example names:</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleExampleClick('John', 'Smith')}
                className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 transition-colors"
              >
                John Smith
              </button>
              <button
                onClick={() => handleExampleClick('Jose', 'Garcia')}
                className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 transition-colors"
              >
                Jose Garcia
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {results && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Search Results
            </h2>

            <div className="mb-4 p-3 bg-blue-50 rounded">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Query:</span> {results.query.firstName}{' '}
                {results.query.lastName}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Total Cases:</span>{' '}
                {results.totalCases}
              </p>
            </div>

            {results.totalCases === 0 ? (
              <p className="text-gray-600">No cases found for this name.</p>
            ) : (
              <div className="space-y-6">
                {results.cases.map((courtCase, index) => (
                  <CaseCard key={index} courtCase={courtCase} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CaseCard({ courtCase }: { courtCase: CourtCase }) {
  return (
    <div className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-bold text-gray-900 mb-3">
        Case #{courtCase.caseInfo.caseNumber}
      </h3>

      {/* Case Info */}
      <div className="mb-4 p-4 bg-gray-50 rounded">
        <h4 className="font-semibold text-gray-900 mb-2">Case Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-600">Filing Date:</span>{' '}
            <span className="text-gray-900">{courtCase.caseInfo.filingDate}</span>
          </div>
          <div>
            <span className="text-gray-600">Case Type:</span>{' '}
            <span className="text-gray-900">{courtCase.caseInfo.caseType}</span>
          </div>
          <div>
            <span className="text-gray-600">Status:</span>{' '}
            <span className="text-gray-900 font-medium">
              {courtCase.caseInfo.status}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Court:</span>{' '}
            <span className="text-gray-900">{courtCase.caseInfo.courtLocation}</span>
          </div>
        </div>
      </div>

      {/* Parties */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-900 mb-2">Parties</h4>
        <div className="space-y-2">
          {courtCase.parties.map((party, idx) => (
            <div key={idx} className="text-sm border-l-2 border-blue-500 pl-3">
              <p className="text-gray-900 font-medium">{party.name}</p>
              <p className="text-gray-600">
                {party.role}
                {party.details && ` - ${party.details}`}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Hearings */}
      {courtCase.hearings.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 mb-2">Hearings</h4>
          <div className="space-y-2">
            {courtCase.hearings.map((hearing, idx) => (
              <div
                key={idx}
                className="text-sm p-3 bg-gray-50 rounded border border-gray-200"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-gray-900 font-medium">{hearing.type}</span>
                  <span className="text-gray-600 text-xs">{hearing.dateTime}</span>
                </div>
                <p className="text-gray-600">
                  {hearing.department}
                  {hearing.judge && ` - ${hearing.judge}`}
                </p>
                {hearing.result && (
                  <p className="text-gray-700 mt-1">
                    <span className="font-medium">Result:</span> {hearing.result}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financials */}
      {courtCase.financials && (
        <div className="mb-4 p-4 bg-yellow-50 rounded border border-yellow-200">
          <h4 className="font-semibold text-gray-900 mb-2">Financial Information</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {courtCase.financials.fines !== undefined && (
              <div>
                <p className="text-gray-600">Fines</p>
                <p className="text-gray-900 font-medium">
                  ${courtCase.financials.fines.toFixed(2)}
                </p>
              </div>
            )}
            {courtCase.financials.fees !== undefined && (
              <div>
                <p className="text-gray-600">Fees</p>
                <p className="text-gray-900 font-medium">
                  ${courtCase.financials.fees.toFixed(2)}
                </p>
              </div>
            )}
            {courtCase.financials.balance !== undefined && (
              <div>
                <p className="text-gray-600">Balance</p>
                <p className="text-gray-900 font-bold">
                  ${courtCase.financials.balance.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Source Metadata */}
      <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
        <p>
          Source: {courtCase.sourceMetadata.dataSource} |{' '}
          {new Date(courtCase.sourceMetadata.scrapeTimestamp).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
