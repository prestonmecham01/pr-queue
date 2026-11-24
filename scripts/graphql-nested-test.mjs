const token = process.env.PR_QUEUE_PAT;
if (!token) throw new Error("PR_QUEUE_PAT is not set");

const [owner, name, size = "100", pages = "3"] = process.argv.slice(2);
if (!owner || !name) throw new Error("usage: node graphql-nested-test.mjs OWNER NAME [PAGE_SIZE] [PAGES]");

const query = `
  query($owner: String!, $name: String!, $first: Int!, $after: String) {
    repository(owner: $owner, name: $name) {
      pullRequests(first: $first, after: $after, states: [OPEN], orderBy: { field: UPDATED_AT, direction: DESC }) {
        totalCount
        pageInfo { hasNextPage endCursor }
        nodes {
          number isDraft updatedAt additions deletions reviewDecision
          labels(first: 10) { nodes { name } }
          reviewRequests(first: 10) {
            nodes { requestedReviewer { ... on User { login } ... on Team { name } } }
          }
          reviews(last: 5) { totalCount nodes { state submittedAt } }
          comments(last: 1) { totalCount nodes { createdAt } }
          commits(last: 1) { nodes { commit { committedDate statusCheckRollup { state } } } }
        }
      }
    }
    rateLimit { cost limit nodeCount remaining resetAt }
  }`;

const rows = [];
const all = []
let after = null;

for (let i = 1; i <= Number(pages); i++) {
  const start = performance.now();
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { owner, name, first: Number(size), after } }),
  });
  const text = await res.text();
  const ms = Math.round(performance.now() - start);
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    console.log({ page: i, status: res.status, ms, notJson: text.slice(0, 200) });
    break;
  }

  if (body.errors) {
    console.log(res.status, JSON.stringify(body.errors, null, 2));
    break;
  }
  const prs = body.data.repository.pullRequests;
  all.push(...prs.nodes);
  const rl = body.data.rateLimit;
  rows.push({ page: i, status: res.status, ms, returned: prs.nodes.length, cost: rl.cost, nodeCount: rl.nodeCount, remaining: rl.remaining });

  if (!prs.pageInfo.hasNextPage) break;
  after = prs.pageInfo.endCursor;
}

console.table(rows);
console.log({
  totalMs: rows.reduce((a, r) => a + r.ms, 0),
  totalCost: rows.reduce((a, r) => a + r.cost, 0),
});

const ci = {};
const ids = new Set();
for (const pr of all) {
  ids.add(pr.number);
  const s = pr.commits.nodes[0]?.commit.statusCheckRollup?.state ?? "NONE";
  ci[s] = (ci[s] ?? 0) + 1;
}
const yearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
console.log({
  fetched: all.length,
  unique: ids.size,
  drafts: all.filter((p) => p.isDraft).length,
  withReviewRequests: all.filter((p) => p.reviewRequests.nodes.length > 0).length,
  notUpdatedInYear: all.filter((p) => Date.parse(p.updatedAt) < yearAgo).length,
  ci,
});