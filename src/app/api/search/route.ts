import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { SearchRequest, SearchResponse, ErrorResponse } from '@/lib/types';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';

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

    const projectRoot = process.cwd();
    const scraperScript = path.join(projectRoot, 'python', 'scraper.py');
    const parserScript = path.join(projectRoot, 'python', 'parser.py');

    const scraperCommand = `python3 "${scraperScript}" "${sanitizedFirstName}" "${sanitizedLastName}"`;

    try {
      const { stdout: scraperOutput, stderr: scraperStderr } = await execAsync(scraperCommand);

      if (scraperStderr) {
        console.log('Scraper log:', scraperStderr);
      }

      const scraperResult = JSON.parse(scraperOutput);

      if (!scraperResult.html) {
        return NextResponse.json(scraperResult, {
          status: scraperResult.totalCases === 0 ? 404 : 200
        });
      }

      const tmpHtmlFile = path.join(tmpdir(), `court-${Date.now()}.html`);
      await writeFile(tmpHtmlFile, scraperResult.html);

      try {
        const parserCommand = `python3 "${parserScript}" "${tmpHtmlFile}" "${sanitizedFirstName}" "${sanitizedLastName}" "${scraperResult.dataSource}"`;
        const { stdout: parserOutput, stderr: parserStderr } = await execAsync(parserCommand);

        if (parserStderr) {
          console.error('Parser stderr:', parserStderr);
        }

        const result: SearchResponse = JSON.parse(parserOutput);

        await unlink(tmpHtmlFile);

        if (result.totalCases === 0) {
          return NextResponse.json(result, { status: 404 });
        }

        return NextResponse.json(result, { status: 200 });

      } catch (parseError: any) {
        await unlink(tmpHtmlFile).catch(() => {});
        throw parseError;
      }

    } catch (execError: any) {
      console.error('Execution failed:', execError);

      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'ExecutionError',
          message: 'Failed to fetch or parse court records'
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
  return input.replace(/[^a-zA-Z\s\-']/g, '').trim();
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
    strategy: {
      approach: 'Attempts live access first, falls back to mock if blocked',
      dataSource: 'live or mock (automatic)',
      compliance: 'No CAPTCHA bypass, respects access controls'
    }
  });
}
