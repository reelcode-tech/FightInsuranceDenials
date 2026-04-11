# Source Compliance Notes

## Can ingest now

- Official government pages and public datasets
  - CMS
  - HHS
  - state insurance department pages and external appeal guides

- Public investigative journalism and public reporting
  - ProPublica
  - major news reports where the relevant facts are public

- Public forums with public pages
  - Reddit public posts
  - AARP public forums

## Must be cautious or blocked

- Facebook Groups
  - Private or gated groups should not be scraped.
  - Public Pages may be usable later if API access and terms are satisfied.

- PatientsLikeMe
  - Requires explicit permission or a compliant data-sharing path.
  - Do not scrape.

- Nextdoor
  - Neighborhood data is access-restricted and sensitive.
  - Do not scrape.

- TikTok, Threads, X
  - Public content may be visible, but bulk collection must follow platform API terms and legal constraints.
  - Do not rely on unauthorized scraping for production ingestion.

## Practical policy for this project

1. Prefer official, public, high-signal sources.
2. Treat public forum content as narrative evidence, not ground truth.
3. Tag every record with source type and quality score.
4. Keep low-signal public posts out of promoted public observatory records.
5. Never ingest private-group or gated-platform content without a compliant access path.
