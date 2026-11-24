const token = process.env.PR_QUEUE_PAT;
if (!token) throw new Error("PR_QUEUE_PAT is not set");

const [owner, name, size = "25"] = process.argv.slice(2);
if (!owner || !name) throw new Error("usage: node graphql-page-test.mjs OWNER NAME [PAGE_SIZE]");

const query = `
  query($owner: String!, $name: String!, $first: Int!) {
    repository(owner: $owner, name: $name) {
      pullRequests(first: $first, states: [OPEN], orderBy: { field: UPDATED_AT, direction: DESC }) {
        totalCount
        pageInfo { hasNextPage endCursor }
        nodes {
          number isDraft updatedAt additions deletions reviewDecision
          labels(first: 10) { nodes { name } }
          reviewRequests(first: 10) { totalCount }
          commits(last: 1) { nodes { commit { statusCheckRollup { state } } } }
        }
      }
    }
    rateLimit { cost remaining resetAt }
  }`;

const start = performance.now();
const res = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query, variables: { owner, name, first: Number(size) } }),
});
const body = await res.json();
const ms = Math.round(performance.now() - start);

const prs = body.data?.repository?.pullRequests;
console.log({
  status: res.status,
  ms,
  pageSize: Number(size),
  returned: prs?.nodes.length,
  totalCount: prs?.totalCount,
  rateLimit: body.data?.rateLimit,
  errors: body.errors,
});