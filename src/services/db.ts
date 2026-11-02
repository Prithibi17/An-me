/**
 * Direct HTTP Client for Turso Database (anime-web-prithibi)
 * Connects the web application database for User Auth, Profile, Cloud Library, and Notifications.
 */

const TURSO_URL = 'https://anime-web-prithibi.aws-ap-south-1.turso.io/v2/pipeline';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTA2ODc5NzYsImlkIjoiMDFhMGVkMmUtYjQwMS03OGMxLWJhNTAtZjQ3MTI2ODZiNmQ0Iiwia2lkIjoiSEhxN1FHZThBd0lsVW9WNDRZa0E2VXRobnlFSGFucHhFSExuUm1qams3VSIsInJpZCI6ImYzZDQwNjg3LTgwOGUtNGJiOC1hM2JlLTZjOGQ2ZTkyZDRlYiJ9.0okdZRYp0To4LeMmA2CJpTHpGAC_A5mLOfnXteCvFUY6VSW9x5oCSYx7LqfZTVx0jkhvtGgg3DSX_e4OQ3qACw';

interface TursoValue {
  type: 'text' | 'integer' | 'float' | 'null' | 'blob';
  value?: string;
}

export interface SqlArg {
  type: 'text' | 'integer' | 'float' | 'null';
  value?: string;
}

export async function executeSql<T = any>(sql: string, args: (string | number | boolean | null | undefined)[] = []): Promise<T[]> {
  try {
    const formattedArgs: SqlArg[] = args.map((arg) => {
      if (arg === null || arg === undefined) return { type: 'null' };
      if (typeof arg === 'number') {
        return Number.isInteger(arg)
          ? { type: 'integer', value: String(arg) }
          : { type: 'float', value: String(arg) };
      }
      if (typeof arg === 'boolean') {
        return { type: 'integer', value: arg ? '1' : '0' };
      }
      return { type: 'text', value: String(arg) };
    });

    const res = await fetch(TURSO_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TURSO_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            type: 'execute',
            stmt: {
              sql,
              args: formattedArgs,
            },
          },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`Turso HTTP error: ${res.statusText}`);
    }

    const data = await res.json();
    const result = data?.results?.[0];

    if (!result || result.type !== 'ok') {
      const errorMsg = result?.error?.message || 'Unknown database error';
      throw new Error(errorMsg);
    }

    const { cols, rows } = result.response.result;
    return rows.map((row: TursoValue[]) => {
      const item: Record<string, any> = {};
      cols.forEach((col: { name: string }, idx: number) => {
        const val = row[idx];
        if (!val || val.type === 'null') {
          item[col.name] = null;
        } else if (val.type === 'integer') {
          item[col.name] = parseInt(val.value || '0', 10);
        } else if (val.type === 'float') {
          item[col.name] = parseFloat(val.value || '0');
        } else {
          item[col.name] = val.value;
        }
      });
      return item as T;
    });
  } catch (error) {
    console.error('[DB] Execution failed for:', sql, error);
    throw error;
  }
}
