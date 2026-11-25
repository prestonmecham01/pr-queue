import { mkdir, writeFile } from "node:fs/promises";

const token = process.env.PR_QUEUE_PAT;
if (!token) throw new Error("PR_QUEUE_PAT is not set");

const [owner, name, size = "25"] = process.argv.slice(2);
if (!owner || !name) throw new Error("usage: node graphql-page-test.mjs OWNER NAME [PAGE_SIZE]");

export const query = `
  query($owner: String!,  $name: String!, $first: Int!, $after: String, $baseRefName: String) {
    repository(owner: $owner, name: $name) {
      pullRequests(
        first: $first
        after: $after
        states: OPEN
        baseRefName: $baseRefName
        orderBy: { field: UPDATED_AT, direction: DESC }
      ) {
        totalCount
        nodes {
          number
          title
          url
          isDraft
          author {
            login
            url
          }
          createdAt
          updatedAt
          additions
          deletions
          reviewDecision
          labels(first: 100) {
            nodes {
              name
              color
            }
          }
          reviewRequests(first: 100) {
            nodes {
              requestedReviewer {
                ... on User {
                  login
                }
                ... on Team {
                  name
                }
              }
            }
          }
          reviews(last: 5) {
            nodes {
              state
              submittedAt
              author {
                login
              }
            }
          }
          comments(last: 5) {
            totalCount
            nodes {
              createdAt
            }
          }
          commits(last: 1) {
            nodes {
              commit {
                committedDate
                statusCheckRollup {
                  state
                }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
          hasPreviousPage
          startCursor
        }
      }
    }
    rateLimit {
      cost
      remaining
      resetAt
      limit
      nodeCount
    }
  }
`;

const OUT_DIR = "data/raw"; // choose a path that is gitignored
const MAX_ATTEMPTS = 3;

async function fetchPage(cursor) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const start = performance.now();
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { owner, name, first: Number(size), after: cursor } }),
    });
    const text = await res.text();
    const ms = Math.round(performance.now() - start);

    if (res.status === 502 || res.status === 504) {
      if (attempt === MAX_ATTEMPTS) {
        throw new Error(`${res.status} after ${MAX_ATTEMPTS} attempts (last ${ms} ms)`);
      }
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
      continue;
    }

    let body;
    try {
      body = JSON.parse(text);
    } catch {
      throw new Error(`Not JSON (status ${res.status}, ${ms} ms): ${text.slice(0, 200)}`);
    }
    if (!res.ok || body.errors) {
      throw new Error(
        body.errors?.map((e) => e.message).join("; ") || `GitHub API returned ${res.status}`,
      );
    }
    return { body, ms };
  }
}

const pages = [];
const byNumber = new Map();
let cursor = null;
let totalCost = 0;
let totalCountFirst;
let totalCountLast;

do {
  const { body, ms } = await fetchPage(cursor);
  const prs = body.data.repository.pullRequests;
  const { rateLimit } = body.data;

  pages.push(body);
  totalCountFirst ??= prs.totalCount;
  totalCountLast = prs.totalCount;
  totalCost += rateLimit.cost;

  for (const pr of prs.nodes) {
    byNumber.set(pr.number, pr);
  }

  console.log(`page ${pages.length}: ${prs.nodes.length} PRs, ${ms} ms, cost ${rateLimit.cost}`);
  cursor = prs.pageInfo.hasNextPage ? prs.pageInfo.endCursor : null;
} while (cursor);

const fetched = pages.reduce((n, p) => n + p.data.repository.pullRequests.nodes.length, 0);
const unique = byNumber.size;

const metadata = {
  source: `${owner}/${name}`,
  capturedAt: new Date().toISOString(),
  pageSize: Number(size),
  pages: pages.length,
  fetched,
  unique,
  totalCountFirst,
  totalCountLast,
  totalCost,
};

console.log(metadata);

if (totalCountFirst !== totalCountLast || unique !== totalCountLast) {
  console.warn("Counts do not match: nothing saved, rerun (see ADR 0005).");
  process.exit(1);
}

await mkdir(OUT_DIR, { recursive: true });
await writeFile(`${OUT_DIR}/pull-requests-raw.json`, JSON.stringify(pages, null, 2));
await writeFile(`${OUT_DIR}/metadata.json`, JSON.stringify(metadata, null, 2));

if (totalCountFirst !== totalCountLast || unique !== totalCountLast) {
  console.warn("Counts do not match: requery (see ADR 0005).");
  process.exitCode = 1;
}