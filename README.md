# Zeus Battle Site

Minimal public website for Zeus Battle.

- `index.html`: official landing page with download, privacy, and community links.
- `privacy.html`: public privacy policy URL for Google Play Console.
- `assets/`: web images.
- `.nojekyll`: tells GitHub Pages to serve files directly without Jekyll.

Before publishing, replace these placeholders:

- `your-email@example.com`
- Naver Cafe link
- YouTube link
- Instagram link
- Copyright/developer name if needed

The Google Play link already uses the Android package id:

```text
https://play.google.com/store/apps/details?id=kode.beerock.io
```

If the final application id changes, update the link in `index.html`.

## Deploy To GitHub Pages

Create an empty public GitHub repo named `zeus_web`, then run:

```bash
cd /Users/user/Desktop/zeus-battle-site
git push -u origin main
```

In GitHub:

1. Open `Settings > Pages`.
2. Set `Source` to `Deploy from a branch`.
3. Set branch to `main` and folder to `/root`.
4. Save.

Expected URLs:

```text
https://hswoo8.github.io/zeus_web/
https://hswoo8.github.io/zeus_web/privacy.html
```
