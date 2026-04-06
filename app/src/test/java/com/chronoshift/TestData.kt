package com.chronoshift

internal data class ExpectedTimestamp(
    val hour: Int,
    val minute: Int = 0,
    val timezone: String? = null,
    val description: String = "",
)

internal data class TimestampTestCase(
    val input: String,
    val expectedCount: Int,
    val expected: List<ExpectedTimestamp> = emptyList(),
    val description: String,
)

// ---------------------------------------------------------------------------
// Comprehensive corpus of real-world timestamp strings.
//
// Every entry mirrors text a user might paste from an email, calendar invite,
// Slack message, social-media post, flight booking, or meeting scheduler.
// ---------------------------------------------------------------------------

internal val testCases: List<TimestampTestCase> = listOf(

    // =====================================================================
    // Category 1 — Simple time + timezone abbreviation
    // =====================================================================

    // US Eastern
    TimestampTestCase("3pm EST", 1, listOf(ExpectedTimestamp(15, 0, "EST")), "simple 12h + EST"),
    TimestampTestCase("3:00 PM EST", 1, listOf(ExpectedTimestamp(15, 0, "EST")), "12h with minutes + EST"),
    TimestampTestCase("15:00 EST", 1, listOf(ExpectedTimestamp(15, 0, "EST")), "24h + EST"),
    TimestampTestCase("3 PM EST", 1, listOf(ExpectedTimestamp(15, 0, "EST")), "space before PM + EST"),
    TimestampTestCase("3pm EDT", 1, listOf(ExpectedTimestamp(15, 0, "EDT")), "simple 12h + EDT"),
    TimestampTestCase("3:00 PM EDT", 1, listOf(ExpectedTimestamp(15, 0, "EDT")), "12h with minutes + EDT"),
    TimestampTestCase("3pm ET", 1, listOf(ExpectedTimestamp(15, 0, "ET")), "simple 12h + ET (generic Eastern)"),
    TimestampTestCase("9:30 a.m. EST", 1, listOf(ExpectedTimestamp(9, 30, "EST")), "dotted am + EST"),
    TimestampTestCase("9:30 A.M. EST", 1, listOf(ExpectedTimestamp(9, 30, "EST")), "dotted AM uppercase + EST"),
    TimestampTestCase("9:30am EST", 1, listOf(ExpectedTimestamp(9, 30, "EST")), "no-space am + EST"),
    TimestampTestCase("11:45 PM EDT", 1, listOf(ExpectedTimestamp(23, 45, "EDT")), "late evening + EDT"),

    // US Central
    TimestampTestCase("3pm CST", 1, listOf(ExpectedTimestamp(15, 0, "CST")), "simple 12h + CST"),
    TimestampTestCase("3:00 PM CST", 1, listOf(ExpectedTimestamp(15, 0, "CST")), "12h with minutes + CST"),
    TimestampTestCase("3pm CDT", 1, listOf(ExpectedTimestamp(15, 0, "CDT")), "simple 12h + CDT"),
    TimestampTestCase("3pm CT", 1, listOf(ExpectedTimestamp(15, 0, "CT")), "simple 12h + CT (generic Central)"),
    TimestampTestCase("8:15 AM CDT", 1, listOf(ExpectedTimestamp(8, 15, "CDT")), "morning + CDT"),

    // US Mountain
    TimestampTestCase("3pm MST", 1, listOf(ExpectedTimestamp(15, 0, "MST")), "simple 12h + MST"),
    TimestampTestCase("3:00 PM MST", 1, listOf(ExpectedTimestamp(15, 0, "MST")), "12h with minutes + MST"),
    TimestampTestCase("3pm MDT", 1, listOf(ExpectedTimestamp(15, 0, "MDT")), "simple 12h + MDT"),
    TimestampTestCase("3pm MT", 1, listOf(ExpectedTimestamp(15, 0, "MT")), "simple 12h + MT (generic Mountain)"),
    TimestampTestCase("10:00 AM MST", 1, listOf(ExpectedTimestamp(10, 0, "MST")), "morning + MST"),

    // US Pacific
    TimestampTestCase("3pm PST", 1, listOf(ExpectedTimestamp(15, 0, "PST")), "simple 12h + PST"),
    TimestampTestCase("3:00 PM PST", 1, listOf(ExpectedTimestamp(15, 0, "PST")), "12h with minutes + PST"),
    TimestampTestCase("3pm PDT", 1, listOf(ExpectedTimestamp(15, 0, "PDT")), "simple 12h + PDT"),
    TimestampTestCase("3pm PT", 1, listOf(ExpectedTimestamp(15, 0, "PT")), "simple 12h + PT (generic Pacific)"),
    TimestampTestCase("9:30 a.m. PST", 1, listOf(ExpectedTimestamp(9, 30, "PST")), "dotted am + PST"),
    TimestampTestCase("9:30 A.M. PST", 1, listOf(ExpectedTimestamp(9, 30, "PST")), "dotted AM uppercase + PST"),
    TimestampTestCase("7:00 p.m. PDT", 1, listOf(ExpectedTimestamp(19, 0, "PDT")), "dotted pm + PDT"),

    // Global — GMT / UTC / BST
    TimestampTestCase("3pm GMT", 1, listOf(ExpectedTimestamp(15, 0, "GMT")), "simple 12h + GMT"),
    TimestampTestCase("15:00 GMT", 1, listOf(ExpectedTimestamp(15, 0, "GMT")), "24h + GMT"),
    TimestampTestCase("3pm UTC", 1, listOf(ExpectedTimestamp(15, 0, "UTC")), "simple 12h + UTC"),
    TimestampTestCase("15:00 UTC", 1, listOf(ExpectedTimestamp(15, 0, "UTC")), "24h + UTC"),
    TimestampTestCase("3pm BST", 1, listOf(ExpectedTimestamp(15, 0, "BST")), "simple 12h + BST"),
    TimestampTestCase("10:00 AM BST", 1, listOf(ExpectedTimestamp(10, 0, "BST")), "morning + BST"),

    // Europe
    TimestampTestCase("3pm CET", 1, listOf(ExpectedTimestamp(15, 0, "CET")), "simple 12h + CET"),
    TimestampTestCase("15:00 CET", 1, listOf(ExpectedTimestamp(15, 0, "CET")), "24h + CET"),
    TimestampTestCase("3pm CEST", 1, listOf(ExpectedTimestamp(15, 0, "CEST")), "simple 12h + CEST"),
    TimestampTestCase("14:30 CEST", 1, listOf(ExpectedTimestamp(14, 30, "CEST")), "24h + CEST"),
    TimestampTestCase("3pm EET", 1, listOf(ExpectedTimestamp(15, 0, "EET")), "simple 12h + EET"),
    TimestampTestCase("3pm EEST", 1, listOf(ExpectedTimestamp(15, 0, "EEST")), "simple 12h + EEST"),
    TimestampTestCase("3pm WET", 1, listOf(ExpectedTimestamp(15, 0, "WET")), "simple 12h + WET"),

    // Asia
    TimestampTestCase("3pm IST", 1, listOf(ExpectedTimestamp(15, 0, "IST")), "simple 12h + IST (India)"),
    TimestampTestCase("15:00 IST", 1, listOf(ExpectedTimestamp(15, 0, "IST")), "24h + IST"),
    TimestampTestCase("3pm JST", 1, listOf(ExpectedTimestamp(15, 0, "JST")), "simple 12h + JST"),
    TimestampTestCase("15:00 JST", 1, listOf(ExpectedTimestamp(15, 0, "JST")), "24h + JST"),
    TimestampTestCase("3pm KST", 1, listOf(ExpectedTimestamp(15, 0, "KST")), "simple 12h + KST"),
    TimestampTestCase("3pm CST", 1, listOf(ExpectedTimestamp(15, 0, "CST")), "simple 12h + CST (ambiguous: US Central or China)"),
    TimestampTestCase("3pm HKT", 1, listOf(ExpectedTimestamp(15, 0, "HKT")), "simple 12h + HKT"),
    TimestampTestCase("3pm SGT", 1, listOf(ExpectedTimestamp(15, 0, "SGT")), "simple 12h + SGT"),
    TimestampTestCase("3pm PHT", 1, listOf(ExpectedTimestamp(15, 0, "PHT")), "simple 12h + PHT (Philippines)"),
    TimestampTestCase("3pm ICT", 1, listOf(ExpectedTimestamp(15, 0, "ICT")), "simple 12h + ICT (Indochina)"),
    TimestampTestCase("3pm WIB", 1, listOf(ExpectedTimestamp(15, 0, "WIB")), "simple 12h + WIB (Western Indonesia)"),

    // Australia / NZ
    TimestampTestCase("3pm AEST", 1, listOf(ExpectedTimestamp(15, 0, "AEST")), "simple 12h + AEST"),
    TimestampTestCase("3pm AEDT", 1, listOf(ExpectedTimestamp(15, 0, "AEDT")), "simple 12h + AEDT"),
    TimestampTestCase("3pm ACST", 1, listOf(ExpectedTimestamp(15, 0, "ACST")), "simple 12h + ACST"),
    TimestampTestCase("3pm AWST", 1, listOf(ExpectedTimestamp(15, 0, "AWST")), "simple 12h + AWST"),
    TimestampTestCase("3pm NZST", 1, listOf(ExpectedTimestamp(15, 0, "NZST")), "simple 12h + NZST"),
    TimestampTestCase("3pm NZDT", 1, listOf(ExpectedTimestamp(15, 0, "NZDT")), "simple 12h + NZDT"),

    // Other
    TimestampTestCase("3pm AST", 1, listOf(ExpectedTimestamp(15, 0, "AST")), "simple 12h + AST (Atlantic)"),
    TimestampTestCase("3pm AKST", 1, listOf(ExpectedTimestamp(15, 0, "AKST")), "simple 12h + AKST (Alaska)"),
    TimestampTestCase("3pm AKDT", 1, listOf(ExpectedTimestamp(15, 0, "AKDT")), "simple 12h + AKDT (Alaska daylight)"),
    TimestampTestCase("3pm HST", 1, listOf(ExpectedTimestamp(15, 0, "HST")), "simple 12h + HST (Hawaii)"),
    TimestampTestCase("3pm SAST", 1, listOf(ExpectedTimestamp(15, 0, "SAST")), "simple 12h + SAST (South Africa)"),
    TimestampTestCase("3pm WAT", 1, listOf(ExpectedTimestamp(15, 0, "WAT")), "simple 12h + WAT (West Africa)"),
    TimestampTestCase("3pm EAT", 1, listOf(ExpectedTimestamp(15, 0, "EAT")), "simple 12h + EAT (East Africa)"),
    TimestampTestCase("3pm PKT", 1, listOf(ExpectedTimestamp(15, 0, "PKT")), "simple 12h + PKT (Pakistan)"),
    TimestampTestCase("3pm BRT", 1, listOf(ExpectedTimestamp(15, 0, "BRT")), "simple 12h + BRT (Brazil)"),
    TimestampTestCase("3pm ART", 1, listOf(ExpectedTimestamp(15, 0, "ART")), "simple 12h + ART (Argentina)"),

    // =====================================================================
    // Category 2 — Time + city / region name
    // =====================================================================

    TimestampTestCase("3pm in New York", 1, listOf(ExpectedTimestamp(15, 0, "America/New_York")), "city: New York"),
    TimestampTestCase("5:00 in Tokyo", 1, listOf(ExpectedTimestamp(5, 0, "Asia/Tokyo")), "city: Tokyo, bare time"),
    TimestampTestCase("noon in London", 1, listOf(ExpectedTimestamp(12, 0, "Europe/London")), "city: London, noon keyword"),
    TimestampTestCase("3pm in Los Angeles", 1, listOf(ExpectedTimestamp(15, 0, "America/Los_Angeles")), "city: Los Angeles"),
    TimestampTestCase("10:30 AM in Berlin", 1, listOf(ExpectedTimestamp(10, 30, "Europe/Berlin")), "city: Berlin"),
    TimestampTestCase("9am in Sydney", 1, listOf(ExpectedTimestamp(9, 0, "Australia/Sydney")), "city: Sydney"),
    TimestampTestCase("2:15 PM in Mumbai", 1, listOf(ExpectedTimestamp(14, 15, "Asia/Kolkata")), "city: Mumbai"),
    TimestampTestCase("8pm in Dubai", 1, listOf(ExpectedTimestamp(20, 0, "Asia/Dubai")), "city: Dubai"),
    TimestampTestCase("6:00 AM in Singapore", 1, listOf(ExpectedTimestamp(6, 0, "Asia/Singapore")), "city: Singapore"),
    TimestampTestCase("11pm in Hong Kong", 1, listOf(ExpectedTimestamp(23, 0, "Asia/Hong_Kong")), "city: Hong Kong"),
    TimestampTestCase("7:30 AM in Seoul", 1, listOf(ExpectedTimestamp(7, 30, "Asia/Seoul")), "city: Seoul"),
    TimestampTestCase("4pm in Paris", 1, listOf(ExpectedTimestamp(16, 0, "Europe/Paris")), "city: Paris"),
    TimestampTestCase("3pm in Chicago", 1, listOf(ExpectedTimestamp(15, 0, "America/Chicago")), "city: Chicago"),
    TimestampTestCase("3pm in Denver", 1, listOf(ExpectedTimestamp(15, 0, "America/Denver")), "city: Denver"),
    TimestampTestCase("2:30 PM at San Francisco", 1, listOf(ExpectedTimestamp(14, 30, "America/Los_Angeles")), "city: San Francisco, 'at' preposition"),
    TimestampTestCase("midnight in Auckland", 1, listOf(ExpectedTimestamp(0, 0, "Pacific/Auckland")), "city: Auckland, midnight"),
    TimestampTestCase("9 a.m. in Toronto", 1, listOf(ExpectedTimestamp(9, 0, "America/Toronto")), "city: Toronto, dotted am"),
    TimestampTestCase("5pm in São Paulo", 1, listOf(ExpectedTimestamp(17, 0, "America/Sao_Paulo")), "city: São Paulo (accented)"),

    // Region-name timezones
    TimestampTestCase("3pm Pacific", 1, listOf(ExpectedTimestamp(15, 0, "PT")), "region: Pacific"),
    TimestampTestCase("3pm Eastern", 1, listOf(ExpectedTimestamp(15, 0, "ET")), "region: Eastern"),
    TimestampTestCase("3pm Central", 1, listOf(ExpectedTimestamp(15, 0, "CT")), "region: Central"),
    TimestampTestCase("3pm Mountain", 1, listOf(ExpectedTimestamp(15, 0, "MT")), "region: Mountain"),
    TimestampTestCase("3pm Pacific Time", 1, listOf(ExpectedTimestamp(15, 0, "PT")), "region: Pacific Time"),
    TimestampTestCase("3pm Eastern Time", 1, listOf(ExpectedTimestamp(15, 0, "ET")), "region: Eastern Time"),
    TimestampTestCase("3pm Central Time", 1, listOf(ExpectedTimestamp(15, 0, "CT")), "region: Central Time"),
    TimestampTestCase("3pm Mountain Time", 1, listOf(ExpectedTimestamp(15, 0, "MT")), "region: Mountain Time"),
    TimestampTestCase("3pm pacific time", 1, listOf(ExpectedTimestamp(15, 0, "PT")), "region: pacific time (lowercase)"),
    TimestampTestCase("3pm eastern time", 1, listOf(ExpectedTimestamp(15, 0, "ET")), "region: eastern time (lowercase)"),
    TimestampTestCase("3pm US Eastern", 1, listOf(ExpectedTimestamp(15, 0, "ET")), "region: US Eastern"),
    TimestampTestCase("3pm US Pacific", 1, listOf(ExpectedTimestamp(15, 0, "PT")), "region: US Pacific"),
    TimestampTestCase("3pm US Central", 1, listOf(ExpectedTimestamp(15, 0, "CT")), "region: US Central"),
    TimestampTestCase("3pm US Mountain", 1, listOf(ExpectedTimestamp(15, 0, "MT")), "region: US Mountain"),

    // =====================================================================
    // Category 3 — Date + time + timezone
    // =====================================================================

    TimestampTestCase("April 9 at 3pm EST", 1, listOf(ExpectedTimestamp(15, 0, "EST")), "month-day at time + tz"),
    TimestampTestCase("Apr 9, 2026 3:00 PM EST", 1, listOf(ExpectedTimestamp(15, 0, "EST")), "abbreviated month with year"),
    TimestampTestCase("April 9 @ 3pm EST", 1, listOf(ExpectedTimestamp(15, 0, "EST")), "@ sign separator"),
    TimestampTestCase("April 9th, 3:00 PM EDT", 1, listOf(ExpectedTimestamp(15, 0, "EDT")), "ordinal day + comma"),
    TimestampTestCase("April 9th at 3:00 PM EDT", 1, listOf(ExpectedTimestamp(15, 0, "EDT")), "ordinal day + at"),
    TimestampTestCase("9 April 2026 at 15:00 BST", 1, listOf(ExpectedTimestamp(15, 0, "BST")), "European day-month order"),
    TimestampTestCase("9 April 2026 at 3pm BST", 1, listOf(ExpectedTimestamp(15, 0, "BST")), "European order + 12h"),
    TimestampTestCase("Wednesday, April 9, 2026 4:30 AM PDT", 1, listOf(ExpectedTimestamp(4, 30, "PDT")), "full weekday + date + time"),
    TimestampTestCase("Wed, Apr 9, 2026 4:30 AM PDT", 1, listOf(ExpectedTimestamp(4, 30, "PDT")), "abbreviated weekday + date"),
    TimestampTestCase("04/09/2026 3:00 PM EST", 1, listOf(ExpectedTimestamp(15, 0, "EST")), "US numeric date format"),
    TimestampTestCase("09/04/2026 3:00 PM BST", 1, listOf(ExpectedTimestamp(15, 0, "BST")), "European numeric date format"),
    TimestampTestCase("2026-04-09 3:00 PM EST", 1, listOf(ExpectedTimestamp(15, 0, "EST")), "ISO-ish date + 12h time"),
    TimestampTestCase("April 9, 2026, 15:00 CET", 1, listOf(ExpectedTimestamp(15, 0, "CET")), "date comma time 24h"),
    TimestampTestCase("April 9, 2026 at 9:00 a.m. PST", 1, listOf(ExpectedTimestamp(9, 0, "PST")), "date + dotted am + tz"),
    TimestampTestCase("Tue Apr 8 2026 10:00 AM EDT", 1, listOf(ExpectedTimestamp(10, 0, "EDT")), "Unix-style date string"),
    TimestampTestCase("March 15 at 2:30pm GMT", 1, listOf(ExpectedTimestamp(14, 30, "GMT")), "different month, no year"),
    TimestampTestCase("Jan 1, 2027 at midnight EST", 1, listOf(ExpectedTimestamp(0, 0, "EST")), "midnight keyword in date"),
    TimestampTestCase("December 31, 2026 at 11:59 PM PST", 1, listOf(ExpectedTimestamp(23, 59, "PST")), "new year's eve timestamp"),
    TimestampTestCase("May 1st, 2026 @ 8:00 AM JST", 1, listOf(ExpectedTimestamp(8, 0, "JST")), "ordinal + @ + JST"),
    TimestampTestCase("June 15th 2026 14:00 IST", 1, listOf(ExpectedTimestamp(14, 0, "IST")), "ordinal + no comma + 24h + IST"),
    TimestampTestCase("Fri, 10 Jul 2026 09:30:00 GMT", 1, listOf(ExpectedTimestamp(9, 30, "GMT")), "RFC 2822 style"),
    TimestampTestCase("Saturday, 11 April 2026 at 5pm AEST", 1, listOf(ExpectedTimestamp(17, 0, "AEST")), "European order + weekday + AEST"),

    // =====================================================================
    // Category 4 — Multiple timestamps (slash-separated)
    // =====================================================================

    TimestampTestCase(
        "3pm ET / 12pm PT", 2,
        listOf(ExpectedTimestamp(15, 0, "ET"), ExpectedTimestamp(12, 0, "PT")),
        "two times slash-separated",
    ),
    TimestampTestCase(
        "9am PT / 12pm ET / 5pm GMT", 3,
        listOf(ExpectedTimestamp(9, 0, "PT"), ExpectedTimestamp(12, 0, "ET"), ExpectedTimestamp(17, 0, "GMT")),
        "three times slash-separated",
    ),
    TimestampTestCase(
        "4:30 AM PT / 7:30 AM ET / 19:30 CST", 3,
        listOf(ExpectedTimestamp(4, 30, "PT"), ExpectedTimestamp(7, 30, "ET"), ExpectedTimestamp(19, 30, "CST")),
        "three times mixed 12h/24h slash-separated",
    ),
    TimestampTestCase(
        "April 9 at 9:00 a.m. PT / 12:00 p.m. ET", 2,
        listOf(ExpectedTimestamp(9, 0, "PT"), ExpectedTimestamp(12, 0, "ET")),
        "date + dotted am/pm slash-separated",
    ),
    TimestampTestCase(
        "3pm EST / 12pm PST / 8pm GMT", 3,
        listOf(ExpectedTimestamp(15, 0, "EST"), ExpectedTimestamp(12, 0, "PST"), ExpectedTimestamp(20, 0, "GMT")),
        "three US + global slash-separated",
    ),
    TimestampTestCase(
        "10am JST / 1am GMT", 2,
        listOf(ExpectedTimestamp(10, 0, "JST"), ExpectedTimestamp(1, 0, "GMT")),
        "Asia + GMT slash-separated",
    ),
    TimestampTestCase(
        "2:00 PM EST / 11:00 AM PST / 7:00 PM GMT", 3,
        listOf(ExpectedTimestamp(14, 0, "EST"), ExpectedTimestamp(11, 0, "PST"), ExpectedTimestamp(19, 0, "GMT")),
        "three full-format slash-separated",
    ),
    TimestampTestCase(
        "noon ET / 9am PT", 2,
        listOf(ExpectedTimestamp(12, 0, "ET"), ExpectedTimestamp(9, 0, "PT")),
        "noon keyword + time slash-separated",
    ),
    TimestampTestCase(
        "6pm CET / 5pm GMT / 12pm ET / 9am PT", 4,
        listOf(
            ExpectedTimestamp(18, 0, "CET"), ExpectedTimestamp(17, 0, "GMT"),
            ExpectedTimestamp(12, 0, "ET"), ExpectedTimestamp(9, 0, "PT"),
        ),
        "four times slash-separated",
    ),
    TimestampTestCase(
        "8:30 PM IST / 3:00 PM GMT / 10:00 AM EST", 3,
        listOf(ExpectedTimestamp(20, 30, "IST"), ExpectedTimestamp(15, 0, "GMT"), ExpectedTimestamp(10, 0, "EST")),
        "India + GMT + US slash-separated",
    ),

    // =====================================================================
    // Category 5 — Time ranges (no date)
    // =====================================================================

    TimestampTestCase(
        "3pm - 4pm EST", 2,
        listOf(ExpectedTimestamp(15, 0, "EST"), ExpectedTimestamp(16, 0, "EST")),
        "simple range with spaces + dash",
    ),
    TimestampTestCase(
        "3:00 PM - 4:30 PM EST", 2,
        listOf(ExpectedTimestamp(15, 0, "EST"), ExpectedTimestamp(16, 30, "EST")),
        "range with minutes + dash",
    ),
    TimestampTestCase(
        "9am-5pm PST", 2,
        listOf(ExpectedTimestamp(9, 0, "PST"), ExpectedTimestamp(17, 0, "PST")),
        "compact range no spaces",
    ),
    TimestampTestCase(
        "9:00 AM \u2013 10:30 AM CET", 2,
        listOf(ExpectedTimestamp(9, 0, "CET"), ExpectedTimestamp(10, 30, "CET")),
        "range with en-dash",
    ),
    TimestampTestCase(
        "9:00 AM \u2014 10:30 AM CET", 2,
        listOf(ExpectedTimestamp(9, 0, "CET"), ExpectedTimestamp(10, 30, "CET")),
        "range with em-dash",
    ),
    TimestampTestCase(
        "from 2pm to 4pm EST", 2,
        listOf(ExpectedTimestamp(14, 0, "EST"), ExpectedTimestamp(16, 0, "EST")),
        "'from X to Y' range",
    ),
    TimestampTestCase(
        "between 3 and 5pm ET", 2,
        listOf(ExpectedTimestamp(15, 0, "ET"), ExpectedTimestamp(17, 0, "ET")),
        "'between X and Y' range, shared pm",
    ),
    TimestampTestCase(
        "1:00 - 2:00 PM GMT", 2,
        listOf(ExpectedTimestamp(13, 0, "GMT"), ExpectedTimestamp(14, 0, "GMT")),
        "range where first time inherits PM from second",
    ),
    TimestampTestCase(
        "10am to noon PST", 2,
        listOf(ExpectedTimestamp(10, 0, "PST"), ExpectedTimestamp(12, 0, "PST")),
        "range with noon keyword",
    ),
    TimestampTestCase(
        "8:00 PM - 9:30 PM JST", 2,
        listOf(ExpectedTimestamp(20, 0, "JST"), ExpectedTimestamp(21, 30, "JST")),
        "evening range JST",
    ),
    TimestampTestCase(
        "11:30 AM - 1:00 PM EDT", 2,
        listOf(ExpectedTimestamp(11, 30, "EDT"), ExpectedTimestamp(13, 0, "EDT")),
        "range spanning noon EDT",
    ),
    TimestampTestCase(
        "14:00-15:30 CET", 2,
        listOf(ExpectedTimestamp(14, 0, "CET"), ExpectedTimestamp(15, 30, "CET")),
        "24h compact range CET",
    ),

    // =====================================================================
    // Category 6 — Date + time range + timezone
    // =====================================================================

    TimestampTestCase(
        "April 9 @ 12:00 pm - 12:50 pm EDT", 2,
        listOf(ExpectedTimestamp(12, 0, "EDT"), ExpectedTimestamp(12, 50, "EDT")),
        "date + @ + range + EDT",
    ),
    TimestampTestCase(
        "Wednesday, April 9, 3:00 PM - 4:30 PM EST", 2,
        listOf(ExpectedTimestamp(15, 0, "EST"), ExpectedTimestamp(16, 30, "EST")),
        "full weekday + date + range",
    ),
    TimestampTestCase(
        "04/09 from 9am to 11am PST", 2,
        listOf(ExpectedTimestamp(9, 0, "PST"), ExpectedTimestamp(11, 0, "PST")),
        "numeric date + from-to range",
    ),
    TimestampTestCase(
        "April 9, 2026 10:00 AM - 11:30 AM PDT", 2,
        listOf(ExpectedTimestamp(10, 0, "PDT"), ExpectedTimestamp(11, 30, "PDT")),
        "full date + range + PDT",
    ),
    TimestampTestCase(
        "Fri, April 10 from 2pm to 3:30pm ET", 2,
        listOf(ExpectedTimestamp(14, 0, "ET"), ExpectedTimestamp(15, 30, "ET")),
        "weekday + date + from-to",
    ),
    TimestampTestCase(
        "9 April 2026, 09:00 - 10:30 BST", 2,
        listOf(ExpectedTimestamp(9, 0, "BST"), ExpectedTimestamp(10, 30, "BST")),
        "European date + 24h range + BST",
    ),
    TimestampTestCase(
        "March 20, 2026 1:00 PM \u2013 2:30 PM CET", 2,
        listOf(ExpectedTimestamp(13, 0, "CET"), ExpectedTimestamp(14, 30, "CET")),
        "date + en-dash range + CET",
    ),
    TimestampTestCase(
        "Tuesday, April 14th, 8:00 AM - 9:00 AM JST", 2,
        listOf(ExpectedTimestamp(8, 0, "JST"), ExpectedTimestamp(9, 0, "JST")),
        "full date ordinal + range + JST",
    ),

    // =====================================================================
    // Category 7 — ISO 8601
    // =====================================================================

    TimestampTestCase("2026-04-09T15:00:00Z", 1, listOf(ExpectedTimestamp(15, 0, "UTC")), "ISO 8601 Zulu"),
    TimestampTestCase("2026-04-09T15:00:00+02:00", 1, listOf(ExpectedTimestamp(15, 0, "UTC+2")), "ISO 8601 + positive offset"),
    TimestampTestCase("2026-04-09T15:00:00-05:00", 1, listOf(ExpectedTimestamp(15, 0, "UTC-5")), "ISO 8601 + negative offset"),
    TimestampTestCase("2026-04-09T15:00:00+05:30", 1, listOf(ExpectedTimestamp(15, 0, "UTC+5:30")), "ISO 8601 + half-hour offset"),
    TimestampTestCase("2026-04-09T15:00:00+09:00", 1, listOf(ExpectedTimestamp(15, 0, "UTC+9")), "ISO 8601 + JST offset"),
    TimestampTestCase("2026-04-09T00:00:00Z", 1, listOf(ExpectedTimestamp(0, 0, "UTC")), "ISO 8601 midnight Zulu"),
    TimestampTestCase("2026-04-09T23:59:59Z", 1, listOf(ExpectedTimestamp(23, 59, "UTC")), "ISO 8601 end of day Zulu"),
    TimestampTestCase("2026-04-09 15:00Z", 1, listOf(ExpectedTimestamp(15, 0, "UTC")), "ISO 8601 with space separator"),
    TimestampTestCase("2026-04-09T15:00Z", 1, listOf(ExpectedTimestamp(15, 0, "UTC")), "ISO 8601 no seconds Zulu"),
    TimestampTestCase("2026-04-09T08:30:00-08:00", 1, listOf(ExpectedTimestamp(8, 30, "UTC-8")), "ISO 8601 PST offset"),
    TimestampTestCase("2026-04-09T15:00:00.000Z", 1, listOf(ExpectedTimestamp(15, 0, "UTC")), "ISO 8601 with milliseconds"),
    TimestampTestCase("2026-04-09T15:00:00+00:00", 1, listOf(ExpectedTimestamp(15, 0, "UTC")), "ISO 8601 explicit UTC +00:00"),
    TimestampTestCase("2026-12-25T09:00:00-05:00", 1, listOf(ExpectedTimestamp(9, 0, "UTC-5")), "ISO 8601 Christmas morning EST"),
    TimestampTestCase("2026-04-09T15:00:00+05:45", 1, listOf(ExpectedTimestamp(15, 0, "UTC+5:45")), "ISO 8601 Nepal offset +05:45"),

    // =====================================================================
    // Category 8 — Relative dates
    // =====================================================================

    TimestampTestCase("tomorrow at 3pm EST", 1, listOf(ExpectedTimestamp(15, 0, "EST")), "relative: tomorrow"),
    TimestampTestCase("tomorrow at 9:30 AM PST", 1, listOf(ExpectedTimestamp(9, 30, "PST")), "relative: tomorrow + minutes"),
    TimestampTestCase("next Tuesday at 3pm EST", 1, listOf(ExpectedTimestamp(15, 0, "EST")), "relative: next weekday"),
    TimestampTestCase("next Monday at 10am PST", 1, listOf(ExpectedTimestamp(10, 0, "PST")), "relative: next Monday"),
    TimestampTestCase("this Friday at noon PST", 1, listOf(ExpectedTimestamp(12, 0, "PST")), "relative: this Friday + noon"),
    TimestampTestCase("this Thursday at 2:30pm ET", 1, listOf(ExpectedTimestamp(14, 30, "ET")), "relative: this Thursday"),
    TimestampTestCase("next Wednesday at 4pm CET", 1, listOf(ExpectedTimestamp(16, 0, "CET")), "relative: next Wednesday + CET"),
    TimestampTestCase("tomorrow at noon GMT", 1, listOf(ExpectedTimestamp(12, 0, "GMT")), "relative: tomorrow + noon"),
    TimestampTestCase("tonight at 8pm EST", 1, listOf(ExpectedTimestamp(20, 0, "EST")), "relative: tonight"),
    TimestampTestCase("today at 5pm PST", 1, listOf(ExpectedTimestamp(17, 0, "PST")), "relative: today"),
    TimestampTestCase("next Saturday at 11am AEST", 1, listOf(ExpectedTimestamp(11, 0, "AEST")), "relative: next Saturday + AEST"),

    // =====================================================================
    // Category 9 — Military / 24-hour time
    // =====================================================================

    TimestampTestCase("1500 hours", 1, listOf(ExpectedTimestamp(15, 0, null)), "military: 1500 hours"),
    TimestampTestCase("0800 hours", 1, listOf(ExpectedTimestamp(8, 0, null)), "military: 0800 hours"),
    TimestampTestCase("1500 Zulu", 1, listOf(ExpectedTimestamp(15, 0, "UTC")), "military: 1500 Zulu = UTC"),
    TimestampTestCase("0800 Zulu", 1, listOf(ExpectedTimestamp(8, 0, "UTC")), "military: 0800 Zulu"),
    TimestampTestCase("0800 EST", 1, listOf(ExpectedTimestamp(8, 0, "EST")), "military: 0800 + timezone"),
    TimestampTestCase("1430 PST", 1, listOf(ExpectedTimestamp(14, 30, "PST")), "military: 1430 + timezone"),
    TimestampTestCase("2359 GMT", 1, listOf(ExpectedTimestamp(23, 59, "GMT")), "military: 2359 + GMT"),
    TimestampTestCase("0000 UTC", 1, listOf(ExpectedTimestamp(0, 0, "UTC")), "military: 0000 midnight UTC"),
    TimestampTestCase("15:00", 1, listOf(ExpectedTimestamp(15, 0, null)), "bare 24h time, no timezone"),
    TimestampTestCase("08:00 CET", 1, listOf(ExpectedTimestamp(8, 0, "CET")), "24h colon + CET"),
    TimestampTestCase("22:30 JST", 1, listOf(ExpectedTimestamp(22, 30, "JST")), "24h colon + JST"),
    TimestampTestCase("00:00 UTC", 1, listOf(ExpectedTimestamp(0, 0, "UTC")), "24h midnight + UTC"),
    TimestampTestCase("13:45 BST", 1, listOf(ExpectedTimestamp(13, 45, "BST")), "24h + BST"),
    TimestampTestCase("0600 hours EST", 1, listOf(ExpectedTimestamp(6, 0, "EST")), "military: 0600 hours + tz"),
    TimestampTestCase("1200 Zulu", 1, listOf(ExpectedTimestamp(12, 0, "UTC")), "military: 1200 Zulu (noon)"),

    // =====================================================================
    // Category 10 — Natural language / informal
    // =====================================================================

    TimestampTestCase("noon EST", 1, listOf(ExpectedTimestamp(12, 0, "EST")), "noon + timezone"),
    TimestampTestCase("noon PST", 1, listOf(ExpectedTimestamp(12, 0, "PST")), "noon + PST"),
    TimestampTestCase("noon GMT", 1, listOf(ExpectedTimestamp(12, 0, "GMT")), "noon + GMT"),
    TimestampTestCase("midnight PST", 1, listOf(ExpectedTimestamp(0, 0, "PST")), "midnight + timezone"),
    TimestampTestCase("midnight EST", 1, listOf(ExpectedTimestamp(0, 0, "EST")), "midnight + EST"),
    TimestampTestCase("midnight UTC", 1, listOf(ExpectedTimestamp(0, 0, "UTC")), "midnight + UTC"),
    TimestampTestCase("EOD Friday PST", 1, listOf(ExpectedTimestamp(17, 0, "PST")), "EOD = end of day ~5pm"),
    TimestampTestCase("EOD EST", 1, listOf(ExpectedTimestamp(17, 0, "EST")), "EOD + timezone, no day"),
    TimestampTestCase("COB Friday EST", 1, listOf(ExpectedTimestamp(17, 0, "EST")), "COB = close of business ~5pm"),
    TimestampTestCase("morning meeting 9am London", 1, listOf(ExpectedTimestamp(9, 0, "Europe/London")), "informal with city name"),
    TimestampTestCase("the call is at half past 3 EST", 1, listOf(ExpectedTimestamp(15, 30, "EST")), "half past + timezone"),
    TimestampTestCase("quarter to 4 PST", 1, listOf(ExpectedTimestamp(15, 45, "PST")), "quarter to = :45 of prior hour"),
    TimestampTestCase("quarter past 2 GMT", 1, listOf(ExpectedTimestamp(14, 15, "GMT")), "quarter past = :15"),
    TimestampTestCase("half past noon EST", 1, listOf(ExpectedTimestamp(12, 30, "EST")), "half past noon"),
    TimestampTestCase("let's meet at 3ish EST", 1, listOf(ExpectedTimestamp(15, 0, "EST")), "informal 'ish' suffix"),
    TimestampTestCase("standup at 9 Pacific", 1, listOf(ExpectedTimestamp(9, 0, "PT")), "informal standup time"),
    TimestampTestCase("lunch at noon Central", 1, listOf(ExpectedTimestamp(12, 0, "CT")), "informal lunch time"),

    // =====================================================================
    // Category 11 — Multi-line / email / calendar format
    // =====================================================================

    TimestampTestCase(
        "When: Wednesday, April 9, 2026 3:00 PM - 4:00 PM (EST)", 2,
        listOf(ExpectedTimestamp(15, 0, "EST"), ExpectedTimestamp(16, 0, "EST")),
        "Outlook-style 'When:' line",
    ),
    TimestampTestCase(
        "Date: April 9, 2026\nTime: 3:00 PM EDT", 1,
        listOf(ExpectedTimestamp(15, 0, "EDT")),
        "multi-line date/time separate",
    ),
    TimestampTestCase(
        "Join at 9:00 AM PT (12:00 PM ET)", 2,
        listOf(ExpectedTimestamp(9, 0, "PT"), ExpectedTimestamp(12, 0, "ET")),
        "primary + parenthetical alternative",
    ),
    TimestampTestCase(
        "When: Thursday, April 10, 2026 10:00 AM - 11:00 AM (Eastern Time)", 2,
        listOf(ExpectedTimestamp(10, 0, "ET"), ExpectedTimestamp(11, 0, "ET")),
        "Outlook 'When:' with Eastern Time",
    ),
    TimestampTestCase(
        "Start: 2:00 PM EST\nEnd: 3:30 PM EST", 2,
        listOf(ExpectedTimestamp(14, 0, "EST"), ExpectedTimestamp(15, 30, "EST")),
        "multi-line start/end",
    ),
    TimestampTestCase(
        "Event: Product Review\nDate: April 14, 2026\nTime: 10:30 AM - 11:30 AM PST", 2,
        listOf(ExpectedTimestamp(10, 30, "PST"), ExpectedTimestamp(11, 30, "PST")),
        "multi-line event block",
    ),
    TimestampTestCase(
        "RSVP for April 9 at 3pm ET. Reminder: April 8 at 3pm ET.", 2,
        listOf(ExpectedTimestamp(15, 0, "ET"), ExpectedTimestamp(15, 0, "ET")),
        "two full timestamps in prose",
    ),
    TimestampTestCase(
        "Webinar: April 9 @ 1pm PT | 4pm ET | 9pm GMT", 3,
        listOf(ExpectedTimestamp(13, 0, "PT"), ExpectedTimestamp(16, 0, "ET"), ExpectedTimestamp(21, 0, "GMT")),
        "pipe-separated multi-timezone webinar",
    ),
    TimestampTestCase(
        "Office Hours: Mon/Wed/Fri 2:00 PM - 3:00 PM EST", 2,
        listOf(ExpectedTimestamp(14, 0, "EST"), ExpectedTimestamp(15, 0, "EST")),
        "recurring schedule format",
    ),

    // =====================================================================
    // Category 12 — Parenthetical timezone
    // =====================================================================

    TimestampTestCase("3pm (EST)", 1, listOf(ExpectedTimestamp(15, 0, "EST")), "parenthetical: (EST)"),
    TimestampTestCase("3:00 PM (EST)", 1, listOf(ExpectedTimestamp(15, 0, "EST")), "parenthetical: with minutes"),
    TimestampTestCase("3:00 PM (Eastern)", 1, listOf(ExpectedTimestamp(15, 0, "ET")), "parenthetical: (Eastern)"),
    TimestampTestCase("9am (Pacific Time)", 1, listOf(ExpectedTimestamp(9, 0, "PT")), "parenthetical: (Pacific Time)"),
    TimestampTestCase("noon (GMT+8)", 1, listOf(ExpectedTimestamp(12, 0, "GMT+8")), "parenthetical: (GMT+8)"),
    TimestampTestCase("3:00 PM (Eastern Standard Time)", 1, listOf(ExpectedTimestamp(15, 0, "EST")), "parenthetical: full name"),
    TimestampTestCase("3:00 PM (Pacific Daylight Time)", 1, listOf(ExpectedTimestamp(15, 0, "PDT")), "parenthetical: full daylight name"),
    TimestampTestCase("10am (Central)", 1, listOf(ExpectedTimestamp(10, 0, "CT")), "parenthetical: (Central)"),
    TimestampTestCase("8pm (IST)", 1, listOf(ExpectedTimestamp(20, 0, "IST")), "parenthetical: (IST)"),
    TimestampTestCase("3pm (UTC)", 1, listOf(ExpectedTimestamp(15, 0, "UTC")), "parenthetical: (UTC)"),
    TimestampTestCase("5:30 PM (Mountain Time)", 1, listOf(ExpectedTimestamp(17, 30, "MT")), "parenthetical: (Mountain Time)"),
    TimestampTestCase("9:00 AM (GMT)", 1, listOf(ExpectedTimestamp(9, 0, "GMT")), "parenthetical: (GMT)"),

    // =====================================================================
    // Category 13 — UTC / GMT offsets
    // =====================================================================

    TimestampTestCase("3pm UTC+5", 1, listOf(ExpectedTimestamp(15, 0, "UTC+5")), "UTC positive integer offset"),
    TimestampTestCase("3pm UTC-8", 1, listOf(ExpectedTimestamp(15, 0, "UTC-8")), "UTC negative integer offset"),
    TimestampTestCase("3pm GMT+5:30", 1, listOf(ExpectedTimestamp(15, 0, "GMT+5:30")), "GMT half-hour offset"),
    TimestampTestCase("15:00 UTC+2", 1, listOf(ExpectedTimestamp(15, 0, "UTC+2")), "24h + UTC offset"),
    TimestampTestCase("15:00 GMT-4", 1, listOf(ExpectedTimestamp(15, 0, "GMT-4")), "24h + GMT negative offset"),
    TimestampTestCase("3pm UTC+0", 1, listOf(ExpectedTimestamp(15, 0, "UTC+0")), "UTC+0 = UTC"),
    TimestampTestCase("3pm UTC-0", 1, listOf(ExpectedTimestamp(15, 0, "UTC-0")), "UTC-0 = UTC"),
    TimestampTestCase("3pm GMT+0", 1, listOf(ExpectedTimestamp(15, 0, "GMT+0")), "GMT+0 = UTC"),
    TimestampTestCase("9am UTC+9", 1, listOf(ExpectedTimestamp(9, 0, "UTC+9")), "UTC+9 (Japan/Korea)"),
    TimestampTestCase("3pm UTC+12", 1, listOf(ExpectedTimestamp(15, 0, "UTC+12")), "UTC+12 (NZ/Fiji)"),
    TimestampTestCase("3pm UTC-12", 1, listOf(ExpectedTimestamp(15, 0, "UTC-12")), "UTC-12 (Baker Island)"),
    TimestampTestCase("3pm UTC+5:45", 1, listOf(ExpectedTimestamp(15, 0, "UTC+5:45")), "UTC Nepal offset"),
    TimestampTestCase("3pm UTC+9:30", 1, listOf(ExpectedTimestamp(15, 0, "UTC+9:30")), "UTC+9:30 (ACST)"),
    TimestampTestCase("3pm GMT+1", 1, listOf(ExpectedTimestamp(15, 0, "GMT+1")), "GMT+1 (CET)"),
    TimestampTestCase("3pm GMT-5", 1, listOf(ExpectedTimestamp(15, 0, "GMT-5")), "GMT-5 (EST)"),
    TimestampTestCase("3pm GMT+8", 1, listOf(ExpectedTimestamp(15, 0, "GMT+8")), "GMT+8 (SGT/HKT)"),
    TimestampTestCase("3pm GMT+10", 1, listOf(ExpectedTimestamp(15, 0, "GMT+10")), "GMT+10 (AEST)"),
    TimestampTestCase("3pm GMT-3", 1, listOf(ExpectedTimestamp(15, 0, "GMT-3")), "GMT-3 (BRT)"),
    TimestampTestCase("10:00 AM UTC+3", 1, listOf(ExpectedTimestamp(10, 0, "UTC+3")), "12h + UTC+3"),
    TimestampTestCase("6:30 PM GMT+5:30", 1, listOf(ExpectedTimestamp(18, 30, "GMT+5:30")), "12h + GMT India offset"),

    // =====================================================================
    // Category 14 — Edge cases
    // =====================================================================

    // 12 AM / 12 PM ambiguity
    TimestampTestCase("12:00 AM EST", 1, listOf(ExpectedTimestamp(0, 0, "EST")), "12:00 AM = midnight"),
    TimestampTestCase("12:00 PM EST", 1, listOf(ExpectedTimestamp(12, 0, "EST")), "12:00 PM = noon"),
    TimestampTestCase("12am EST", 1, listOf(ExpectedTimestamp(0, 0, "EST")), "12am = midnight"),
    TimestampTestCase("12pm EST", 1, listOf(ExpectedTimestamp(12, 0, "EST")), "12pm = noon"),
    TimestampTestCase("12:01 AM EST", 1, listOf(ExpectedTimestamp(0, 1, "EST")), "just after midnight"),
    TimestampTestCase("12:01 PM EST", 1, listOf(ExpectedTimestamp(12, 1, "EST")), "just after noon"),
    TimestampTestCase("12:30 AM PST", 1, listOf(ExpectedTimestamp(0, 30, "PST")), "half past midnight"),
    TimestampTestCase("12:30 PM PST", 1, listOf(ExpectedTimestamp(12, 30, "PST")), "half past noon"),

    // Midnight / end-of-day boundaries
    TimestampTestCase("0:00 UTC", 1, listOf(ExpectedTimestamp(0, 0, "UTC")), "0:00 midnight UTC"),
    TimestampTestCase("23:59 PST", 1, listOf(ExpectedTimestamp(23, 59, "PST")), "last minute of day"),
    TimestampTestCase("00:00 GMT", 1, listOf(ExpectedTimestamp(0, 0, "GMT")), "00:00 midnight GMT"),
    TimestampTestCase("23:59:59 UTC", 1, listOf(ExpectedTimestamp(23, 59, "UTC")), "last second of day"),

    // Unusual but valid formatting
    TimestampTestCase("3 pm EST", 1, listOf(ExpectedTimestamp(15, 0, "EST")), "space between number and pm"),
    TimestampTestCase("3PM EST", 1, listOf(ExpectedTimestamp(15, 0, "EST")), "uppercase PM, no space"),
    TimestampTestCase("3 P.M. EST", 1, listOf(ExpectedTimestamp(15, 0, "EST")), "dotted PM with spaces"),
    TimestampTestCase("3p EST", 1, listOf(ExpectedTimestamp(15, 0, "EST")), "abbreviated 'p' for pm"),
    TimestampTestCase("3a EST", 1, listOf(ExpectedTimestamp(3, 0, "EST")), "abbreviated 'a' for am"),
    TimestampTestCase("03:00 PM EST", 1, listOf(ExpectedTimestamp(15, 0, "EST")), "leading zero in 12h format"),
    TimestampTestCase("3.00 PM EST", 1, listOf(ExpectedTimestamp(15, 0, "EST")), "dot separator instead of colon"),
    TimestampTestCase("3:00PM EST", 1, listOf(ExpectedTimestamp(15, 0, "EST")), "no space before PM"),

    // Single digit hours
    TimestampTestCase("1am EST", 1, listOf(ExpectedTimestamp(1, 0, "EST")), "1am early morning"),
    TimestampTestCase("1pm EST", 1, listOf(ExpectedTimestamp(13, 0, "EST")), "1pm early afternoon"),
    TimestampTestCase("6am PST", 1, listOf(ExpectedTimestamp(6, 0, "PST")), "6am morning"),
    TimestampTestCase("11pm JST", 1, listOf(ExpectedTimestamp(23, 0, "JST")), "11pm late night"),

    // =====================================================================
    // Category 15 — Non-English / expanded timezone names
    // =====================================================================

    TimestampTestCase(
        "3pm BST (British Summer Time)", 1,
        listOf(ExpectedTimestamp(15, 0, "BST")),
        "abbreviation + full name in parens",
    ),
    TimestampTestCase(
        "3pm IST (Indian Standard Time)", 1,
        listOf(ExpectedTimestamp(15, 0, "IST")),
        "IST + full name",
    ),
    TimestampTestCase(
        "3pm AEDT (Australian Eastern Daylight Time)", 1,
        listOf(ExpectedTimestamp(15, 0, "AEDT")),
        "AEDT + full name",
    ),
    TimestampTestCase(
        "3pm NZST (New Zealand Standard Time)", 1,
        listOf(ExpectedTimestamp(15, 0, "NZST")),
        "NZST + full name",
    ),
    TimestampTestCase(
        "10am Eastern Standard Time", 1,
        listOf(ExpectedTimestamp(10, 0, "EST")),
        "full name: Eastern Standard Time",
    ),
    TimestampTestCase(
        "10am Eastern Daylight Time", 1,
        listOf(ExpectedTimestamp(10, 0, "EDT")),
        "full name: Eastern Daylight Time",
    ),
    TimestampTestCase(
        "10am Pacific Standard Time", 1,
        listOf(ExpectedTimestamp(10, 0, "PST")),
        "full name: Pacific Standard Time",
    ),
    TimestampTestCase(
        "10am Pacific Daylight Time", 1,
        listOf(ExpectedTimestamp(10, 0, "PDT")),
        "full name: Pacific Daylight Time",
    ),
    TimestampTestCase(
        "10am Central Standard Time", 1,
        listOf(ExpectedTimestamp(10, 0, "CST")),
        "full name: Central Standard Time",
    ),
    TimestampTestCase(
        "10am Central Daylight Time", 1,
        listOf(ExpectedTimestamp(10, 0, "CDT")),
        "full name: Central Daylight Time",
    ),
    TimestampTestCase(
        "10am Mountain Standard Time", 1,
        listOf(ExpectedTimestamp(10, 0, "MST")),
        "full name: Mountain Standard Time",
    ),
    TimestampTestCase(
        "10am Mountain Daylight Time", 1,
        listOf(ExpectedTimestamp(10, 0, "MDT")),
        "full name: Mountain Daylight Time",
    ),
    TimestampTestCase(
        "10am Central European Time", 1,
        listOf(ExpectedTimestamp(10, 0, "CET")),
        "full name: Central European Time",
    ),
    TimestampTestCase(
        "10am Central European Summer Time", 1,
        listOf(ExpectedTimestamp(10, 0, "CEST")),
        "full name: Central European Summer Time",
    ),
    TimestampTestCase(
        "10am Greenwich Mean Time", 1,
        listOf(ExpectedTimestamp(10, 0, "GMT")),
        "full name: Greenwich Mean Time",
    ),
    TimestampTestCase(
        "10am Japan Standard Time", 1,
        listOf(ExpectedTimestamp(10, 0, "JST")),
        "full name: Japan Standard Time",
    ),
    TimestampTestCase(
        "10am Korea Standard Time", 1,
        listOf(ExpectedTimestamp(10, 0, "KST")),
        "full name: Korea Standard Time",
    ),
    TimestampTestCase(
        "10am Australian Eastern Standard Time", 1,
        listOf(ExpectedTimestamp(10, 0, "AEST")),
        "full name: Australian Eastern Standard Time",
    ),
    TimestampTestCase(
        "10am India Standard Time", 1,
        listOf(ExpectedTimestamp(10, 0, "IST")),
        "full name: India Standard Time",
    ),
    TimestampTestCase(
        "3pm Hong Kong Time", 1,
        listOf(ExpectedTimestamp(15, 0, "HKT")),
        "full name: Hong Kong Time",
    ),
    TimestampTestCase(
        "3pm Singapore Time", 1,
        listOf(ExpectedTimestamp(15, 0, "SGT")),
        "full name: Singapore Time",
    ),

    // =====================================================================
    // Category 16 — Real-world copy-paste from apps
    // =====================================================================

    // Google Calendar style
    TimestampTestCase(
        "Wed, Apr 9, 3:00 PM \u2013 4:00 PM (EDT)", 2,
        listOf(ExpectedTimestamp(15, 0, "EDT"), ExpectedTimestamp(16, 0, "EDT")),
        "Google Calendar event format",
    ),

    // Zoom invite style
    TimestampTestCase(
        "Apr 9, 2026 03:00 PM Eastern Time (US and Canada)", 1,
        listOf(ExpectedTimestamp(15, 0, "ET")),
        "Zoom meeting invite format",
    ),

    // Slack reminder style
    TimestampTestCase(
        "Reminder: standup at 9:30am PT tomorrow", 1,
        listOf(ExpectedTimestamp(9, 30, "PT")),
        "Slack reminder style",
    ),

    // Eventbrite style
    TimestampTestCase(
        "Wednesday, April 9, 2026 3:00 PM \u2013 5:00 PM EDT", 2,
        listOf(ExpectedTimestamp(15, 0, "EDT"), ExpectedTimestamp(17, 0, "EDT")),
        "Eventbrite event listing",
    ),

    // Tweet / social media style
    TimestampTestCase(
        "Going live at 2pm PT!", 1,
        listOf(ExpectedTimestamp(14, 0, "PT")),
        "social media announcement",
    ),
    TimestampTestCase(
        "AMA starts at 3pm ET today", 1,
        listOf(ExpectedTimestamp(15, 0, "ET")),
        "social media AMA",
    ),

    // Flight booking
    TimestampTestCase(
        "Departs: 06:45 PST  Arrives: 15:20 EST", 2,
        listOf(ExpectedTimestamp(6, 45, "PST"), ExpectedTimestamp(15, 20, "EST")),
        "flight departure + arrival",
    ),
    TimestampTestCase(
        "Flight UA123 departs SFO at 7:00 AM PST, arrives JFK at 3:30 PM EST", 2,
        listOf(ExpectedTimestamp(7, 0, "PST"), ExpectedTimestamp(15, 30, "EST")),
        "flight with airport codes",
    ),

    // Support ticket
    TimestampTestCase(
        "Incident reported at 2:15 AM UTC on April 9, 2026", 1,
        listOf(ExpectedTimestamp(2, 15, "UTC")),
        "support ticket timestamp",
    ),

    // Cron / deploy window
    TimestampTestCase(
        "Deploy window: 2:00 AM - 4:00 AM UTC", 2,
        listOf(ExpectedTimestamp(2, 0, "UTC"), ExpectedTimestamp(4, 0, "UTC")),
        "deployment window",
    ),

    // Discord announcement
    TimestampTestCase(
        "Movie night starts at 8pm EST (5pm PST)", 2,
        listOf(ExpectedTimestamp(20, 0, "EST"), ExpectedTimestamp(17, 0, "PST")),
        "Discord-style dual timezone announcement",
    ),

    // LinkedIn event
    TimestampTestCase(
        "Live Session | Apr 9 at 11:00 AM PDT", 1,
        listOf(ExpectedTimestamp(11, 0, "PDT")),
        "LinkedIn event format",
    ),

    // Meeting poll (e.g., When2meet, Doodle)
    TimestampTestCase(
        "Option A: April 9, 10:00 AM EST\nOption B: April 10, 2:00 PM EST", 2,
        listOf(ExpectedTimestamp(10, 0, "EST"), ExpectedTimestamp(14, 0, "EST")),
        "meeting poll with multiple options",
    ),

    // Twitch stream schedule
    TimestampTestCase(
        "Stream schedule: Mon 7pm PT / 10pm ET", 2,
        listOf(ExpectedTimestamp(19, 0, "PT"), ExpectedTimestamp(22, 0, "ET")),
        "Twitch stream schedule",
    ),

    // Email footer auto-reply
    TimestampTestCase(
        "I will be out of office until April 14 at 9:00 AM EST", 1,
        listOf(ExpectedTimestamp(9, 0, "EST")),
        "OOO auto-reply",
    ),

    // Conference talk schedule
    TimestampTestCase(
        "Keynote: 9:00 AM - 10:15 AM PST | Breakout: 10:30 AM - 11:45 AM PST", 4,
        listOf(
            ExpectedTimestamp(9, 0, "PST"), ExpectedTimestamp(10, 15, "PST"),
            ExpectedTimestamp(10, 30, "PST"), ExpectedTimestamp(11, 45, "PST"),
        ),
        "conference schedule with two sessions",
    ),

    // Apple Calendar
    TimestampTestCase(
        "April 9, 2026 from 3:00 PM to 4:00 PM EDT", 2,
        listOf(ExpectedTimestamp(15, 0, "EDT"), ExpectedTimestamp(16, 0, "EDT")),
        "Apple Calendar style",
    ),

    // Teams meeting
    TimestampTestCase(
        "Microsoft Teams Meeting\nApril 9, 2026 3:00 PM-3:30 PM (UTC-05:00) Eastern Time", 2,
        listOf(ExpectedTimestamp(15, 0, "UTC-5"), ExpectedTimestamp(15, 30, "UTC-5")),
        "Teams meeting invite",
    ),

    // =====================================================================
    // Category 17 — Stress tests and tricky patterns
    // =====================================================================

    // No timezone at all (still a valid time, just no tz)
    TimestampTestCase("3pm", 1, listOf(ExpectedTimestamp(15, 0, null)), "bare time, no timezone"),
    TimestampTestCase("3:00 PM", 1, listOf(ExpectedTimestamp(15, 0, null)), "bare time with minutes"),

    // Timezone before time (unusual order)
    TimestampTestCase("EST 3pm", 1, listOf(ExpectedTimestamp(15, 0, "EST")), "timezone before time"),

    // Multiple dates in one string
    TimestampTestCase(
        "Available April 9 at 3pm EST or April 10 at 2pm EST", 2,
        listOf(ExpectedTimestamp(15, 0, "EST"), ExpectedTimestamp(14, 0, "EST")),
        "two full date-times in prose",
    ),

    // Very long string with timestamp buried inside
    TimestampTestCase(
        "Hey team, just a reminder that our quarterly planning meeting is scheduled for next Wednesday, April 9th at 2:30 PM EST. Please prepare your status updates.", 1,
        listOf(ExpectedTimestamp(14, 30, "EST")),
        "timestamp buried in long email text",
    ),

    // Timestamp with seconds
    TimestampTestCase("3:00:00 PM EST", 1, listOf(ExpectedTimestamp(15, 0, "EST")), "time with seconds"),
    TimestampTestCase("15:30:45 UTC", 1, listOf(ExpectedTimestamp(15, 30, "UTC")), "24h time with seconds"),

    // All-caps text
    TimestampTestCase("MEETING AT 3PM EST", 1, listOf(ExpectedTimestamp(15, 0, "EST")), "all-caps text"),
    TimestampTestCase("CALL AT 9:00 AM PST", 1, listOf(ExpectedTimestamp(9, 0, "PST")), "all-caps with colon time"),

    // Mixed case timezone
    TimestampTestCase("3pm est", 1, listOf(ExpectedTimestamp(15, 0, "EST")), "lowercase timezone"),
    TimestampTestCase("3pm Pst", 1, listOf(ExpectedTimestamp(15, 0, "PST")), "mixed-case timezone"),
    TimestampTestCase("3pm pdt", 1, listOf(ExpectedTimestamp(15, 0, "PDT")), "lowercase PDT"),

    // Comma-separated times (not slash)
    TimestampTestCase(
        "3pm ET, 12pm PT", 2,
        listOf(ExpectedTimestamp(15, 0, "ET"), ExpectedTimestamp(12, 0, "PT")),
        "comma-separated times",
    ),

    // 'and'-separated
    TimestampTestCase(
        "3pm ET and 12pm PT", 2,
        listOf(ExpectedTimestamp(15, 0, "ET"), ExpectedTimestamp(12, 0, "PT")),
        "'and'-separated times",
    ),

    // Embedded URL-like timestamp
    TimestampTestCase(
        "Join us at 3pm EST: https://zoom.us/j/123456", 1,
        listOf(ExpectedTimestamp(15, 0, "EST")),
        "time before URL",
    ),

    // Leading text with colon (potential false positive)
    TimestampTestCase(
        "Subject: Meeting at 3pm EST", 1,
        listOf(ExpectedTimestamp(15, 0, "EST")),
        "email subject line",
    ),

    // Repeated timezone mention
    TimestampTestCase(
        "3pm EST (that's 12pm PST)", 2,
        listOf(ExpectedTimestamp(15, 0, "EST"), ExpectedTimestamp(12, 0, "PST")),
        "clarification in parens",
    ),

    // Date with no time (should be 0 timestamps extracted, or 1 with date only)
    TimestampTestCase("April 9, 2026", 0, emptyList(), "date only, no time"),
    TimestampTestCase("04/09/2026", 0, emptyList(), "numeric date only, no time"),

    // Time-like numbers that are NOT times
    TimestampTestCase("I scored 300 points", 0, emptyList(), "number that is not a time"),
    TimestampTestCase("Room 1500", 0, emptyList(), "room number, not military time"),
    TimestampTestCase("$15.00", 0, emptyList(), "price, not a time"),
    TimestampTestCase("version 3.00", 0, emptyList(), "version number, not a time"),

    // =====================================================================
    // Category 18 — Additional 12h format variations
    // =====================================================================

    TimestampTestCase("2:00 pm EST", 1, listOf(ExpectedTimestamp(14, 0, "EST")), "lowercase pm + EST"),
    TimestampTestCase("2:00 p.m. EST", 1, listOf(ExpectedTimestamp(14, 0, "EST")), "dotted lowercase pm"),
    TimestampTestCase("2:00PM EST", 1, listOf(ExpectedTimestamp(14, 0, "EST")), "no space before PM caps"),
    TimestampTestCase("2:00pm EST", 1, listOf(ExpectedTimestamp(14, 0, "EST")), "no space before pm lower"),
    TimestampTestCase("2 PM EST", 1, listOf(ExpectedTimestamp(14, 0, "EST")), "no minutes, space PM"),
    TimestampTestCase("2PM EST", 1, listOf(ExpectedTimestamp(14, 0, "EST")), "no minutes, no space PM"),
    TimestampTestCase("10:00 A.M. CDT", 1, listOf(ExpectedTimestamp(10, 0, "CDT")), "dotted AM uppercase + CDT"),
    TimestampTestCase("10:00 a.m. CDT", 1, listOf(ExpectedTimestamp(10, 0, "CDT")), "dotted am lowercase + CDT"),

    // =====================================================================
    // Category 19 — Dash / pipe / bullet multi-timezone lists
    // =====================================================================

    TimestampTestCase(
        "3:00 PM EST | 12:00 PM PST | 8:00 PM GMT", 3,
        listOf(ExpectedTimestamp(15, 0, "EST"), ExpectedTimestamp(12, 0, "PST"), ExpectedTimestamp(20, 0, "GMT")),
        "pipe-separated triple timezone",
    ),
    TimestampTestCase(
        "9am PT \u2022 12pm ET \u2022 5pm GMT", 3,
        listOf(ExpectedTimestamp(9, 0, "PT"), ExpectedTimestamp(12, 0, "ET"), ExpectedTimestamp(17, 0, "GMT")),
        "bullet-separated triple timezone",
    ),
    TimestampTestCase(
        "- 9:00 AM PST\n- 12:00 PM EST\n- 5:00 PM GMT", 3,
        listOf(ExpectedTimestamp(9, 0, "PST"), ExpectedTimestamp(12, 0, "EST"), ExpectedTimestamp(17, 0, "GMT")),
        "bullet-list multi-timezone",
    ),

    // =====================================================================
    // Category 20 — Times with date ordinals (1st, 2nd, 3rd, etc.)
    // =====================================================================

    TimestampTestCase("April 1st at 3pm EST", 1, listOf(ExpectedTimestamp(15, 0, "EST")), "1st ordinal"),
    TimestampTestCase("April 2nd at 3pm EST", 1, listOf(ExpectedTimestamp(15, 0, "EST")), "2nd ordinal"),
    TimestampTestCase("April 3rd at 3pm EST", 1, listOf(ExpectedTimestamp(15, 0, "EST")), "3rd ordinal"),
    TimestampTestCase("April 22nd at 3pm EST", 1, listOf(ExpectedTimestamp(15, 0, "EST")), "22nd ordinal"),
    TimestampTestCase("April 11th at 3pm EST", 1, listOf(ExpectedTimestamp(15, 0, "EST")), "11th ordinal"),
    TimestampTestCase("April 21st at 3pm EST", 1, listOf(ExpectedTimestamp(15, 0, "EST")), "21st ordinal"),
)
