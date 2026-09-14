#!/usr/bin/env python3
"""
Bundles the multi-file dashboard (index.html/styles.css/config.js/
supabaseClient.js/data.js/app.js) into one self-contained HTML file, for
publishing as a zero-install demo link (a Claude Artifact, or anywhere else
that wants a single file). The real, maintained source stays the split files
in the repo root — this is a build output, not something to hand-edit.

Usage:
    python3 scripts/build-artifact.py > dist/sanitize-demo.html
"""
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent


def read(name):
    return (ROOT / name).read_text(encoding="utf-8")


def build():
    css = read("styles.css")
    js = "\n".join([read("config.js"), read("supabaseClient.js"), read("data.js"), read("app.js")])

    return f"""<title>Sanitize Pool Intelligence</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&family=Inter:wght@400;500;600;700;800&display=swap">
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.5.1/chart.umd.min.js"></script>
<style>
{css}
</style>

<div id="app"></div>

<script>
{js}
</script>
"""


if __name__ == "__main__":
    print(build())
