const token = process.env.PR_QUEUE_PAT;
if (!token) throw new Error("PR_QUEUE_PAT is not set");

const query = `
  query {
    viewer {
      pullRequests(first: 20, states: [OPEN, CLOSED, MERGED], orderBy: { field: UPDATED_AT, direction: DESC }) {
        totalCount
        nodes { number title url isDraft updatedAt repository { nameWithOwner } }
      }
    }
    rateLimit { cost remaining resetAt }
  }`;

const res = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query }),
});

console.log(res.status);
console.log(JSON.stringify(await res.json(), null, 2));