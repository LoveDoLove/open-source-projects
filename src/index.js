export default {
	async fetch(request, env) {
		const { pathname } = new URL(request.url);
		const accept = request.headers.get("accept") || "";
		const wantsMarkdown =
			accept.includes("text/markdown") &&
			(pathname === "/" || pathname === "/index.html");

		if (wantsMarkdown) {
			const dataRes = await env.ASSETS.fetch(
				new URL("/data/projects.json", request.url),
			);
			if (dataRes.ok) {
				const md = renderMarkdown(await dataRes.json());
				return new Response(md, {
					headers: {
						"content-type": "text/markdown; charset=utf-8",
						vary: "Accept",
						"cache-control": "public, max-age=3600",
						"x-markdown-tokens": String(Math.ceil(md.length / 4)),
					},
				});
			}
		}

		return env.ASSETS.fetch(request);
	},
};

function renderMarkdown(accounts) {
	const lines = [
		"# Open Source Projects Showcase",
		"",
		"Discover and explore our collection of open source projects.",
		"",
	];

	for (const group of accounts) {
		for (const provider of Object.keys(group)) {
			for (const account of group[provider]) {
				for (const p of account.metadata || []) {
					lines.push(`## [${p.name}](${p.html_url})`, "");
					if (p.description) lines.push(p.description, "");
					lines.push(
						`⭐ ${p.stargazers_count ?? 0} · 🍴 ${p.forks_count ?? 0}` +
							(p.updated_at
								? ` · Updated: ${p.updated_at.slice(0, 10)}`
								: ""),
						"",
					);
					if (Array.isArray(p.topics) && p.topics.length) {
						lines.push(
							`Topics: ${p.topics.map((t) => `\`${t}\``).join(", ")}`,
							"",
						);
					}
					if (p.homepage && p.homepage !== p.html_url) {
						lines.push(`Homepage: <${p.homepage}>`, "");
					}
				}
			}
		}
	}

	return lines.join("\n");
}
