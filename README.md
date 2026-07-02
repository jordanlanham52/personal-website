# jordanlanham.com

Personal site for Jordan Lanham — security researcher (reverse engineering & web).
Static HTML/CSS/JS, deployed via GitHub Pages on the `jordanlanham.com` custom domain.
No framework, no build step required to view the site.

## Structure

```
index.html            Landing page
about/                About
ctf/                  CTF write-ups index (+ generated /ctf/<slug>/ pages)
disclosures/          CVE & bug-bounty index (+ generated /disclosures/<slug>/ pages)
contact/              Contact
styles.css script.js  Shared styles and behavior
assets/               favicon, PGP key, vCard
writeups-src/         Markdown sources for write-ups (authoring input)
scripts/              build-writeups.js (markdown -> HTML)
```

