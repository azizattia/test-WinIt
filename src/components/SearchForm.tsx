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
    <div className="container">
      <div className="header">
        <h1>Santa Clara County Court Records Search</h1>
        <p>Search court records by first and last name</p>
        <p className="subtitle">Attempts live access first, falls back to mock data if blocked</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="firstName" className="form-label">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="form-input"
              placeholder="John"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName" className="form-label">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="form-input"
              placeholder="Smith"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn">
            {loading ? 'Searching...' : 'Search Records'}
          </button>
        </form>

        <div className="examples">
          <p>Try example names:</p>
          <div className="example-buttons">
            <button
              onClick={() => handleExampleClick('John', 'Smith')}
              className="btn-example"
            >
              John Smith
            </button>
            <button
              onClick={() => handleExampleClick('Jose', 'Garcia')}
              className="btn-example"
            >
              Jose Garcia
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <p className="alert-title">Error</p>
          <p className="alert-message">{error}</p>
        </div>
      )}

      {results && (
        <div className="results">
          <h2>Search Results</h2>

          <div className="results-summary">
            <p>
              <span className="label">Query:</span> {results.query.firstName} {results.query.lastName}
            </p>
            <p>
              <span className="label">Total Cases:</span> {results.totalCases}
            </p>
          </div>

          {results.totalCases === 0 ? (
            <p className="no-results">No cases found for this name.</p>
          ) : (
            <div>
              {results.cases.map((courtCase, index) => (
                <CaseCard key={index} courtCase={courtCase} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CaseCard({ courtCase }: { courtCase: CourtCase }) {
  return (
    <div className="case-card">
      <h3>Case #{courtCase.caseInfo.caseNumber}</h3>

      <div className="case-section">
        <h4>Case Information</h4>
        <div className="case-grid">
          <div className="case-grid-item">
            <span className="case-grid-label">Filing Date:</span>
            <span className="case-grid-value">{courtCase.caseInfo.filingDate}</span>
          </div>
          <div className="case-grid-item">
            <span className="case-grid-label">Case Type:</span>
            <span className="case-grid-value">{courtCase.caseInfo.caseType}</span>
          </div>
          <div className="case-grid-item">
            <span className="case-grid-label">Status:</span>
            <span className="case-grid-value">{courtCase.caseInfo.status}</span>
          </div>
          <div className="case-grid-item">
            <span className="case-grid-label">Court:</span>
            <span className="case-grid-value">{courtCase.caseInfo.courtLocation}</span>
          </div>
        </div>
      </div>

      <div>
        <h4>Parties</h4>
        <div className="party-list">
          {courtCase.parties.map((party, idx) => (
            <div key={idx} className="party-item">
              <p className="party-name">{party.name}</p>
              <p className="party-role">
                {party.role}
                {party.details && ` - ${party.details}`}
              </p>
            </div>
          ))}
        </div>
      </div>

      {courtCase.hearings.length > 0 && (
        <div>
          <h4>Hearings</h4>
          <div className="hearing-list">
            {courtCase.hearings.map((hearing, idx) => (
              <div key={idx} className="hearing-item">
                <div className="hearing-header">
                  <span className="hearing-type">{hearing.type}</span>
                  <span className="hearing-datetime">{hearing.dateTime}</span>
                </div>
                <p className="hearing-details">
                  {hearing.department}
                  {hearing.judge && ` - ${hearing.judge}`}
                </p>
                {hearing.result && (
                  <p className="hearing-result">
                    <span className="label">Result:</span> {hearing.result}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {courtCase.financials && (
        <div className="financial-section">
          <h4>Financial Information</h4>
          <div className="financial-grid">
            {courtCase.financials.fines !== undefined && (
              <div className="financial-item">
                <p>Fines</p>
                <p>${courtCase.financials.fines.toFixed(2)}</p>
              </div>
            )}
            {courtCase.financials.fees !== undefined && (
              <div className="financial-item">
                <p>Fees</p>
                <p>${courtCase.financials.fees.toFixed(2)}</p>
              </div>
            )}
            {courtCase.financials.balance !== undefined && (
              <div className="financial-item balance">
                <p>Balance</p>
                <p>${courtCase.financials.balance.toFixed(2)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="metadata">
        <p>
          Source: {courtCase.sourceMetadata.dataSource} |{' '}
          {new Date(courtCase.sourceMetadata.scrapeTimestamp).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
