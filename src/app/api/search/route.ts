import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { SearchRequest, SearchResponse, ErrorResponse } from '@/lib/types';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json();
    const { firstName, lastName } = body;

    if (!firstName || !lastName) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'ValidationError',
          message: 'Both firstName and lastName are required'
        },
        { status: 400 }
      );
    }

    const sanitizedFirstName = sanitizeInput(firstName);
    const sanitizedLastName = sanitizeInput(lastName);
    const fixturePath = getFixturePath(sanitizedFirstName, sanitizedLastName);

    if (!fixturePath) {
      return NextResponse.json<SearchResponse>(
        {
          success: true,
          totalCases: 0,
          cases: [],
          query: {
            firstName: sanitizedFirstName,
            lastName: sanitizedLastName
          }
        },
        { status: 404 }
      );
    }

    const projectRoot = process.cwd();
    const pythonScript = path.join(projectRoot, 'python', 'parser.py');
    const absoluteFixturePath = path.join(projectRoot, fixturePath);
    const command = `python3 "${pythonScript}" "${absoluteFixturePath}" "${sanitizedFirstName}" "${sanitizedLastName}"`;

    try {
      const { stdout, stderr } = await execAsync(command);

      if (stderr) {
        console.error('Python parser stderr:', stderr);
      }

      const result: SearchResponse = JSON.parse(stdout);

      if (result.totalCases === 0) {
        return NextResponse.json(result, { status: 404 });
      }

      return NextResponse.json(result, { status: 200 });

    } catch (execError: any) {
      console.error('Parser execution failed:', execError);

      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'ParsingError',
          message: 'Failed to parse court records'
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('API error:', error);

    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: 'InternalServerError',
        message: error.message || 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

function sanitizeInput(input: string): string {
  // Allow letters, spaces, hyphens, and apostrophes only
  return input.replace(/[^a-zA-Z\s\-']/g, '').trim();
}

function getFixturePath(firstName: string, lastName: string): string | null {
  const key = `${firstName.toLowerCase()}-${lastName.toLowerCase()}`;

  const fixtures: Record<string, string> = {
    'john-smith': 'fixtures/john-smith-search.html',
    'jose-garcia': 'fixtures/jose-garcia-search.html',
  };

  return fixtures[key] || null;
}

export async function GET() {
  return NextResponse.json({
    name: 'Santa Clara County Court Records API',
    version: '1.0.0',
    endpoint: '/api/search',
    method: 'POST',
    description: 'Search court records by first and last name',
    requestBody: {
      firstName: 'string (required)',
      lastName: 'string (required)'
    },
    responses: {
      200: 'Success - cases found',
      404: 'No cases found',
      400: 'Invalid request',
      500: 'Server error'
    },
    testData: {
      availableNames: [
        { firstName: 'John', lastName: 'Smith' },
        { firstName: 'Jose', lastName: 'Garcia' }
      ]
    },
    compliance: {
      dataSource: 'mock',
      note: 'Uses mock fixtures - no live scraping performed'
    }
  });
}
