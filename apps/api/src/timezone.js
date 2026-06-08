const DEFAULT_TIMEZONE = 'America/New_York';

function dateTimePartsInTimezone(date, timezone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  return Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );
}

export function atTimeOnCurrentDayInTimezone(
  hours,
  minutes,
  timezone = DEFAULT_TIMEZONE,
  now = new Date(),
) {
  const current = dateTimePartsInTimezone(now, timezone);
  const desiredAsUtc = Date.UTC(
    current.year,
    current.month - 1,
    current.day,
    hours,
    minutes,
    0,
    0,
  );
  let timestamp = desiredAsUtc;

  // Two passes handle offset changes around daylight-saving transitions.
  for (let pass = 0; pass < 2; pass += 1) {
    const observed = dateTimePartsInTimezone(new Date(timestamp), timezone);
    const observedAsUtc = Date.UTC(
      observed.year,
      observed.month - 1,
      observed.day,
      observed.hour,
      observed.minute,
      observed.second,
      0,
    );
    timestamp += desiredAsUtc - observedAsUtc;
  }

  return new Date(timestamp).toISOString();
}
