# YourTechSave V1 — GitHub Pages

This package is ready to upload to the root of the GitHub repository that will host `yourtechsave.com`.

## Included
- Clean mobile-first homepage
- Functional in-browser Tech Spending Checkup
- Wireless and monthly-to-annual calculators
- Three useful launch guides
- About
- Methodology
- How We Make Money
- Affiliate Disclosure
- Privacy Policy
- Small Business Partners page
- `robots.txt`
- `sitemap.xml`
- `CNAME`

## Important V1 design choice
The site does **not** publish live carrier-price recommendations yet. It only assigns dollar values to calculations based directly on information the visitor enters. This avoids making unverified provider claims before a provider-data maintenance process is in place.

## Publish on GitHub Pages
1. Open the GitHub repository you want to use for YourTechSave.
2. Upload the **contents** of this folder to the repository root.
3. Commit the files.
4. Go to **Settings → Pages**.
5. Publish from the branch containing the files (normally `main`) and `/ (root)`.
6. In **Custom domain**, enter `yourtechsave.com`.
7. Keep the included `CNAME` file.
8. Follow GitHub's DNS instructions at GoDaddy. **Do not remove the iCloud Mail MX/TXT records.**
9. When GitHub validates the domain, turn on **Enforce HTTPS**.
10. Test:
   - `https://yourtechsave.com/`
   - `https://yourtechsave.com/checkup.html`
   - `https://yourtechsave.com/privacy.html`

## After launch
- Add Google Search Console.
- Submit `https://yourtechsave.com/sitemap.xml`.
- Add analytics only after deciding on a privacy-conscious setup; do not capture checkup answers.
- Reapply to affiliate programs once the public site is live and complete.
