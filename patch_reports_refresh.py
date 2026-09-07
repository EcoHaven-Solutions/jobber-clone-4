import pathlib

path = pathlib.Path("phone-app/app.js")
content = path.read_text()


def apply(old, new, label):
    global content
    count = content.count(old)
    if count != 1:
        raise SystemExit(f"ABORT: expected exactly 1 match for '{label}', found {count}. No changes written.")
    content = content.replace(old, new)
    print(f"OK: patched '{label}'")


# The Reports tab only ever loaded its numbers once, on app startup
# (loadReportYears()) or when you changed the year dropdown. Switching
# tabs never re-fetched anything -- so marking an invoice paid (or adding
# an expense, etc.) elsewhere in the app wouldn't show up in Reports until
# you happened to change the year filter or reload the whole app. This
# adds a refresh the moment you click into the Reports tab, same idea as
# the existing "schedule" tab's initRouteMap() refresh right above it.
apply(
    "    if (target === 'schedule' && window.initRouteMap) window.initRouteMap();",
    "    if (target === 'schedule' && window.initRouteMap) window.initRouteMap();\n"
    "    if (target === 'reports' && reportYearSelect.value) loadReportForYear(reportYearSelect.value);",
    "reports tab auto-refresh on click",
)

path.write_text(content)
print("DONE: phone-app/app.js patched successfully.")
