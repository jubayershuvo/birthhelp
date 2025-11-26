import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, Document, Filter, ObjectId } from 'mongodb';

const uri = process.env.MONGO_URI!;
const dbName = "bdris";
const collectionName = "people";

/** ---------- INTERFACE DEFINITIONS ---------- **/

interface Person {
  ubrn: string;
  personNameEn: string;
  personNameBn: string;
  personBirthDate: string;
  gender: string;
  dateOfRegistration: string;
  searchText?: string;
}

interface PersonWithScore extends Person {
  score?: number;
}

interface SearchParams {
  q?: string;
  fields?: string;
  hint?: string;
  match?: string;
  limit?: string;
  skip?: string;
  sort?: string;
  birthYearFrom?: string;
  birthYearTo?: string;
  regYearFrom?: string;
  regYearTo?: string;
  [key: string]: string | undefined;
}

interface YearFilters {
  birthYearFrom: number | null;
  birthYearTo: number | null;
  regYearFrom: number | null;
  regYearTo: number | null;
}

interface SearchResponse {
  count: number;
  usedTextIndex: boolean;
  hintApplied: boolean;
  autoHintApplied: string | null;
  matchMode: string;
  yearFiltersApplied: YearFilters;
  results: PersonWithScore[];
}

interface ErrorResponse {
  error: string;
  unknownParams?: string[];
  allowedParams?: string[];
  allowedHints?: string[];
  allowedSort?: string[];
  allowedMatch?: string[];
  allowedFields?: string[];
  allowedYearParams?: string[];
  allowedFilters?: string[];
}

interface MongoIndex {
  key: Document;
  name?: string;
  ns?: string;
  v?: number;
  [key: string]: unknown;
}

interface Projection {
  _id: number;
  score?: { $meta: string };
  [key: string]: number | { $meta: string } | undefined;
}

interface SortObject {
  [key: string]: 1 | -1 | { $meta: string };
}

// Union type for different query scenarios
type TextSearchQuery = Filter<Document> & { $text: { $search: string } };
type RegexSearchQuery = Filter<Document> & { $or: Array<{ [key: string]: { $regex: string; $options?: string } }> };
type FilterOnlyQuery = Filter<Document>;
type MongoQuery = TextSearchQuery | RegexSearchQuery | FilterOnlyQuery;

/** ---------- ALLOWED PARAMS CONSTANTS ---------- **/

const ALLOWED_FILTERS = new Set([
  "ubrn",
  "personNameEn",
  "personNameBn",
  "personBirthDate",
  "gender",
  "dateOfRegistration",
]);

const ALLOWED_FIELDS = new Set([
  "ubrn",
  "personNameEn",
  "personNameBn",
  "personBirthDate",
  "gender",
  "dateOfRegistration",
  "searchText",
]);

const ALLOWED_HINTS = new Set([
  "id",
  "ubrn_1",
  "personNameEn_1",
  "personNameBn_1",
  "personBirthDate_1",
  "_id_1_ubrn_1",
  "gender_1",
  "dateOfRegistration_1",
  "gender_1_personNameBn_1",
  "gender_1_personNameEn_1",
  "searchText_text",
]);

const ALLOWED_SORT = new Set(["score", ...ALLOWED_FILTERS]);
const ALLOWED_MATCH = new Set(["exact", "prefix", "contains"]);

/** ---------- HELPER FUNCTIONS ---------- **/

function invalidParams(allParams: Record<string, string | undefined>, allowedSet: Set<string>): string[] {
  return Object.keys(allParams).filter((k) => !allowedSet.has(k));
}

function escapeRegex(str: string): string {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeGender(val: string): string {
  if (!val) return val;
  return String(val).trim().toUpperCase();
}

function toIntSafe(v: string | undefined | null): number | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function yearExpr(fieldName: string): Document {
  return {
    $convert: {
      input: {
        $substrBytes: [{ $ifNull: ["$" + fieldName, ""] }, 6, 4],
      },
      to: "int",
      onError: null,
      onNull: null,
    },
  };
}

/** ---------- DATABASE CONNECTION ---------- **/

let cachedClient: MongoClient | null = null;

async function connectDB(): Promise<MongoClient> {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(uri, { maxPoolSize: 20 });
  await client.connect();
  cachedClient = client;
  return client;
}

/** ---------- MAIN API ROUTE ---------- **/

export async function GET(request: NextRequest): Promise<NextResponse<SearchResponse | ErrorResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract all query parameters
    const params: SearchParams = {};
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }
    
    const {
      q,
      fields,
      hint,
      match,
      limit = '20',
      skip = '0',
      sort = 'score',
      birthYearFrom,
      birthYearTo,
      regYearFrom,
      regYearTo,
      ...rest
    } = params;

    // Reject unknown params
    const knownTopLevel = new Set([
      "q",
      "fields",
      "hint",
      "match",
      "limit",
      "skip",
      "sort",
      "birthYearFrom",
      "birthYearTo",
      "regYearFrom",
      "regYearTo",
      ...ALLOWED_FILTERS,
    ]);

    const unknownParams = invalidParams(params, knownTopLevel);
    
    if (unknownParams.length > 0) {
      return NextResponse.json({
        error: "Unknown query params",
        unknownParams,
        allowedParams: [...knownTopLevel],
      }, { status: 400 });
    }

    // Validate hint if provided
    if (hint && !ALLOWED_HINTS.has(hint)) {
      return NextResponse.json({
        error: "Invalid hint index",
        hint,
        allowedHints: [...ALLOWED_HINTS],
      }, { status: 400 });
    }

    // Validate sort if provided
    if (sort && !ALLOWED_SORT.has(sort)) {
      return NextResponse.json({
        error: "Invalid sort field",
        sort,
        allowedSort: [...ALLOWED_SORT],
      }, { status: 400 });
    }

    // Validate match if provided
    if (match && !ALLOWED_MATCH.has(match)) {
      return NextResponse.json({
        error: "Invalid match mode",
        match,
        allowedMatch: [...ALLOWED_MATCH],
      }, { status: 400 });
    }

    /** ---------- BUILD BASE FILTER ---------- **/
    const baseFilter: Filter<Document> = {};
    for (const [k, vRaw] of Object.entries(rest)) {
      if (!ALLOWED_FILTERS.has(k)) continue;
      if (vRaw === undefined || vRaw === null || vRaw === "") continue;

      const v = String(vRaw).trim();

      if (k === "gender") {
        baseFilter[k] = normalizeGender(v);
        continue;
      }

      if (k === "personNameEn" || k === "personNameBn") {
        const mode = match || "prefix";
        const vNorm = v.toUpperCase();

        if (mode === "exact") {
          baseFilter[k] = vNorm;
        } else if (mode === "prefix") {
          baseFilter[k] = { $regex: "^" + escapeRegex(vNorm) };
        } else {
          baseFilter[k] = { $regex: escapeRegex(vNorm) };
        }
        continue;
      }

      baseFilter[k] = v;
    }

    /** ---------- BUILD YEAR RANGE FILTERS ---------- **/
    const exprAnd: Document[] = [];

    // Birth year range
    const byFrom = toIntSafe(birthYearFrom);
    const byTo = toIntSafe(birthYearTo);

    if (byFrom !== null || byTo !== null) {
      const y = yearExpr("personBirthDate");

      if (byFrom !== null) {
        exprAnd.push({
          $and: [{ $ne: [y, null] }, { $gte: [y, byFrom] }],
        });
      }

      if (byTo !== null) {
        exprAnd.push({
          $and: [{ $ne: [y, null] }, { $lte: [y, byTo] }],
        });
      }
    }

    // Registration year range
    const ryFrom = toIntSafe(regYearFrom);
    const ryTo = toIntSafe(regYearTo);

    if (ryFrom !== null || ryTo !== null) {
      const y = yearExpr("dateOfRegistration");

      if (ryFrom !== null) {
        exprAnd.push({
          $and: [{ $ne: [y, null] }, { $gte: [y, ryFrom] }],
        });
      }

      if (ryTo !== null) {
        exprAnd.push({
          $and: [{ $ne: [y, null] }, { $lte: [y, ryTo] }],
        });
      }
    }

    // Validation: at least one filter or year-range if no q
    if (!q && Object.keys(baseFilter).length === 0 && exprAnd.length === 0) {
      return NextResponse.json({
        error: "Provide at least one indexed filter or year range if q is not used",
        allowedFilters: [...ALLOWED_FILTERS],
        allowedYearParams: [
          "birthYearFrom",
          "birthYearTo",
          "regYearFrom",
          "regYearTo",
        ],
      }, { status: 400 });
    }

    /** ---------- DATABASE OPERATIONS ---------- **/
    const client = await connectDB();
    const db = client.db(dbName);
    const collection = db.collection<Person>(collectionName);

    // Detect text index
    const indexes: MongoIndex[] = await collection.indexes();
    const hasTextIndex = indexes.some((ix: MongoIndex) =>
      Object.values(ix.key).includes("text")
    );

    // Create base query with expression if needed
    const baseQuery: Filter<Document> = { ...baseFilter };
    if (exprAnd.length > 0) {
      baseQuery.$expr = { $and: exprAnd };
    }

    let mongoQuery: MongoQuery;
    const projection: Projection = { _id: 0 };
    let sortObj: SortObject = {};

    if (q && hasTextIndex) {
      // TEXT search + filters
      mongoQuery = {
        ...baseQuery,
        $text: { $search: q }
      } as TextSearchQuery;
      projection.score = { $meta: "textScore" };
      sortObj =
        sort === "score" ? { score: { $meta: "textScore" } } : { [sort]: 1 };
    } else if (q && !hasTextIndex) {
      // Regex fallback only if no text index
      const searchFields = fields
        ? fields
            .split(",")
            .map((f: string) => f.trim())
            .filter((f: string) => ALLOWED_FIELDS.has(f))
        : ["personNameEn", "personNameBn", "ubrn"];

      if (searchFields.length === 0) {
        return NextResponse.json({
          error: "fields must be one of allowed indexed fields",
          allowedFields: [...ALLOWED_FIELDS],
        }, { status: 400 });
      }

      mongoQuery = {
        ...baseQuery,
        $or: searchFields.map((f: string) => ({
          [f]: { $regex: q, $options: "i" },
        })),
      } as RegexSearchQuery;

      sortObj = sort && sort !== "score" ? { [sort]: 1 } : {};
    } else {
      // FILTER ONLY mode
      mongoQuery = baseQuery as FilterOnlyQuery;
      sortObj = sort && sort !== "score" ? { [sort]: 1 } : {};
    }

    // AUTO-HINT logic
    let autoHint: string | null = null;
    if (!hint) {
      const baseFilterMap = baseFilter as Record<string, unknown>;
      const hasGender = typeof baseFilterMap.gender === "string" && (baseFilterMap.gender as string).trim() !== "";
      const hasPersonNameEn = typeof baseFilterMap.personNameEn === "string" && (baseFilterMap.personNameEn as string).trim() !== "";
      const hasPersonNameBn = typeof baseFilterMap.personNameBn === "string" && (baseFilterMap.personNameBn as string).trim() !== "";

      if (hasGender && hasPersonNameEn) {
        autoHint = "gender_1_personNameEn_1";
      } else if (hasGender && hasPersonNameBn) {
        autoHint = "gender_1_personNameBn_1";
      }
    }

    // Execute query
    let cursor = collection
      .find(mongoQuery, { projection })
      .sort(sortObj)
      .skip(Number(skip))
      .limit(Math.min(Number(limit), 2000));

    if (hint) cursor = cursor.hint(hint);
    else if (autoHint) cursor = cursor.hint(autoHint);

    const results = await cursor.toArray() as PersonWithScore[];

    const response: SearchResponse = {
      count: results.length,
      usedTextIndex: !!(q && hasTextIndex),
      hintApplied: !!hint,
      autoHintApplied: autoHint,
      matchMode: match || "(names default prefix)",
      yearFiltersApplied: {
        birthYearFrom: byFrom,
        birthYearTo: byTo,
        regYearFrom: ryFrom,
        regYearTo: ryTo,
      },
      results,
    };

    return NextResponse.json(response);

  } catch (err: unknown) {
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    );
  }
}