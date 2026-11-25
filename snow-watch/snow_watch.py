#!/usr/bin/env python3
"""EcoHaven snow watch.

Checks the National Weather Service forecast for your area. If the forecast
snow total inside the look-ahead window reaches your limit, it sends a
max-priority ntfy alert to your phone (a few times, a few minutes apart).

Settings come from environment variables (see snow-watch.yml):
  NTFY_TOPIC        required - your private ntfy topic name
  NTFY_SERVER       default https://ntfy.sh
  SNOW_LAT/SNOW_LON default Spokane, WA
  SNOW_INCHES       default 2     alert when forecast total is at least this
  SNOW_WINDOW_HOURS default 12    how far ahead to look
  REPEAT_COUNT      default 3     how many alert buzzes to send
  REPEAT_MINUTES    default 3     minutes between buzzes
  APP_URL           tapping the alert opens this
  TEST=1            send a test alarm right now, no weather check
  DRY_RUN=1         print what would happen, send nothing
"""
import json, os, re, sys, time, urllib.parse, urllib.request
from datetime import datetime, timedelta, timezone

try:
    from zoneinfo import ZoneInfo
    LOCAL_TZ = ZoneInfo('America/Los_Angeles')
except Exception:  # pragma: no cover
    LOCAL_TZ = timezone(timedelta(hours=-8))

MM_PER_INCH = 25.4
TAG_ALARM, TAG_ERROR, TAG_TEST = 'snow-watch-alarm', 'snow-watch-error', 'snow-watch-test'


def env(name, default=''):
    v = os.environ.get(name)
    return v.strip() if v and v.strip() else default


def parse_duration(s):
    """ISO 8601 duration like PT6H, PT1H, P1D, P1DT6H -> timedelta."""
    m = re.fullmatch(r'P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?', s or '')
    if not m or not any(m.groups()):
        raise ValueError('bad duration: %r' % (s,))
    d, h, mi = (int(x) if x else 0 for x in m.groups())
    return timedelta(days=d, hours=h, minutes=mi)


def parse_valid_time(vt):
    start_s, dur_s = vt.split('/')
    start = datetime.fromisoformat(start_s.replace('Z', '+00:00'))
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    return start, parse_duration(dur_s)


def to_inches(value, uom):
    u = (uom or '').lower()
    if value is None:
        return 0.0
    if u.endswith(':mm') or u.endswith('mm'):
        return float(value) / MM_PER_INCH
    if u.endswith(':cm') or u.endswith('cm'):
        return float(value) / 2.54
    if u.endswith(':m') :
        return float(value) * 1000 / MM_PER_INCH
    if u.endswith(':in') or u.endswith('inch'):
        return float(value)
    raise ValueError('unknown snowfall unit: %r' % (uom,))


def snow_in_window(series, now, hours):
    """series = NWS snowfallAmount block. Returns (total_inches, first_snow_start or None).
    An interval that overlaps the window only partly counts proportionally."""
    uom = series.get('uom')
    w_start, w_end = now, now + timedelta(hours=hours)
    total, first = 0.0, None
    for item in series.get('values') or []:
        amt = to_inches(item.get('value'), uom)
        if amt <= 0:
            continue
        start, dur = parse_valid_time(item['validTime'])
        end = start + dur
        lo, hi = max(start, w_start), min(end, w_end)
        if hi <= lo:
            continue
        total += amt * ((hi - lo) / dur)
        if first is None or lo < first:
            first = lo
    return total, first


def fmt_time(dt, now):
    loc = dt.astimezone(LOCAL_TZ)
    if dt <= now + timedelta(minutes=30):
        return 'now'
    label = loc.strftime('%I %p').lstrip('0')
    return 'about ' + label


def build_message(total, first, now, hours, threshold):
    when = fmt_time(first, now) if first else 'soon'
    inches = ('%.1f' % total).rstrip('0').rstrip('.')
    return ('Snow alert: about %s inches forecast in the next %d hours' % (inches, hours),
            'Starts %s. Your limit is %s inches. Time to line up the driveways.' % (when, ('%g' % threshold)))


def http_json(url, data=None, headers=None, timeout=30):
    h = {'User-Agent': 'EcoHavenSnowWatch/1.0 ' + env('NWS_CONTACT'), 'Accept': 'application/json'}
    h.update(headers or {})
    body = json.dumps(data).encode() if data is not None else None
    if body is not None:
        h['Content-Type'] = 'application/json'
    req = urllib.request.Request(url, data=body, headers=h)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        raw = r.read().decode('utf-8', 'replace')
    return raw


def with_retries(fn, tries=3, wait=8):
    last = None
    for i in range(tries):
        try:
            return fn()
        except Exception as e:  # network blips are common
            last = e
            if i < tries - 1:
                time.sleep(wait * (i + 1))
    raise last


def fetch_snow_series(lat, lon):
    pt = json.loads(with_retries(lambda: http_json('https://api.weather.gov/points/%s,%s' % (lat, lon), headers={'Accept': 'application/geo+json'})))
    grid_url = pt['properties']['forecastGridData']
    grid = json.loads(with_retries(lambda: http_json(grid_url, headers={'Accept': 'application/geo+json'})))
    series = grid['properties'].get('snowfallAmount')
    if not isinstance(series, dict) or 'values' not in series:
        raise ValueError('forecast has no snowfallAmount data')
    return series


def recently_sent(server, topic, tag, since):
    """True if a message with this tag is already in ntfy's recent history (so we do not alert twice for one storm)."""
    try:
        raw = http_json('%s/%s/json?poll=1&since=%s' % (server, urllib.parse.quote(topic), since))
    except Exception as e:
        print('could not read ntfy history (%s) - sending anyway' % e)
        return False
    for line in raw.splitlines():
        try:
            m = json.loads(line)
        except ValueError:
            continue
        if m.get('event') == 'message' and tag in (m.get('tags') or []):
            return True
    return False


def publish(server, topic, title, message, priority, tags, click=None, dry=False):
    payload = {'topic': topic, 'title': title, 'message': message, 'priority': priority, 'tags': tags}
    if click:
        payload['click'] = click
    if dry:
        print('DRY RUN would send:', json.dumps(payload))
        return
    http_json(server, data=payload)


def alarm(server, topic, title, message, tags, count, minutes, click, dry):
    for i in range(count):
        t = title if i == 0 else title + ' (reminder %d)' % i
        publish(server, topic, t, message, 5, tags, click, dry)
        if i < count - 1 and not dry:
            time.sleep(minutes * 60)


def main(now=None):
    topic = env('NTFY_TOPIC')
    if not topic:
        print('NTFY_TOPIC is not set. Add it as a GitHub secret named NTFY_TOPIC.')
        return 0
    server = env('NTFY_SERVER', 'https://ntfy.sh').rstrip('/')
    lat, lon = env('SNOW_LAT', '47.6588'), env('SNOW_LON', '-117.4260')
    threshold = float(env('SNOW_INCHES', '2'))
    hours = int(float(env('SNOW_WINDOW_HOURS', '12')))
    count, minutes = int(env('REPEAT_COUNT', '3')), float(env('REPEAT_MINUTES', '3'))
    click = env('APP_URL', 'https://ecohaven-solutions.github.io/jobber-clone-4/phone-app/')
    dry = env('DRY_RUN') == '1'
    now = now or datetime.now(timezone.utc)

    if env('TEST') == '1':
        alarm(server, topic, 'TEST: snow alarm', 'If this woke you or made noise on silent, the alarm works. No snow is forecast because this is only a test.',
              ['snowflake', TAG_TEST], min(count, 2), min(minutes, 0.2), click, dry)
        print('test alarm sent')
        return 0

    try:
        series = fetch_snow_series(lat, lon)
        total, first = snow_in_window(series, now, hours)
    except Exception as e:
        print('ERROR reading forecast: %r' % (e,))
        if not recently_sent(server, topic, TAG_ERROR, '24h'):
            try:
                publish(server, topic, 'Snow watch could not read the forecast', 'It will keep trying every hour. If you see this for more than a day, tell Claude. (%s)' % str(e)[:120], 3, ['warning', TAG_ERROR], None, dry)
            except Exception as e2:
                print('could not send error notice: %r' % (e2,))
        return 0

    print('forecast snow next %dh: %.2f in (limit %g)' % (hours, total, threshold))
    if total < threshold:
        print('below the limit - no alert')
        return 0
    if recently_sent(server, topic, TAG_ALARM, '12h'):
        print('already alerted in the last 12 hours - not repeating')
        return 0
    title, message = build_message(total, first, now, hours, threshold)
    alarm(server, topic, title, message, ['snowflake', TAG_ALARM], count, minutes, click, dry)
    print('alert sent')
    return 0


if __name__ == '__main__':
    sys.exit(main())
