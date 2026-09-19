export async function getStarCount(repo: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) return null;
    const data: { stargazers_count?: number } = await res.json();
    return data.stargazers_count ?? null;
  } catch {
    return null;
  }
}
