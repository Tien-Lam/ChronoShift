package com.chronoshift.nlp

internal data class ExpectedAiExtraction(
    val time: String,
    val date: String,
    val timezone: String,
    val original: String,
)

internal data class AiExtractionFixture(
    val name: String,
    val input: String,
    val modelResponseJson: String,
    val expected: List<ExpectedAiExtraction>,
)

internal val aiExtractionFixtures = listOf(
    AiExtractionFixture(
        name = "range with noon keyword keeps chronological order",
        input = "10am to noon PST",
        modelResponseJson = """[
            {"time":"10:00","date":"2026-01-09","timezone":"America/Los_Angeles","original":"10am PST"},
            {"time":"12:00","date":"2026-01-09","timezone":"America/Los_Angeles","original":"noon PST"}
        ]""",
        expected = listOf(
            ExpectedAiExtraction("10:00", "2026-01-09", "America/Los_Angeles", "10am PST"),
            ExpectedAiExtraction("12:00", "2026-01-09", "America/Los_Angeles", "noon PST"),
        ),
    ),
    AiExtractionFixture(
        name = "multi timezone announcement preserves all entries",
        input = "January 11 at 4:30 a.m. PT / 7:30 a.m. ET / 19:30 CST",
        modelResponseJson = """[
            {"time":"04:30","date":"2026-01-11","timezone":"America/Los_Angeles","original":"January 11 at 4:30 a.m. PT"},
            {"time":"07:30","date":"2026-01-11","timezone":"America/New_York","original":"7:30 a.m. ET"},
            {"time":"19:30","date":"2026-01-11","timezone":"America/Chicago","original":"19:30 CST"}
        ]""",
        expected = listOf(
            ExpectedAiExtraction("04:30", "2026-01-11", "America/Los_Angeles", "January 11 at 4:30 a.m. PT"),
            ExpectedAiExtraction("07:30", "2026-01-11", "America/New_York", "7:30 a.m. ET"),
            ExpectedAiExtraction("19:30", "2026-01-11", "America/Chicago", "19:30 CST"),
        ),
    ),
    AiExtractionFixture(
        name = "parenthetical equivalent time is not dropped",
        input = "Movie night starts at 8pm EST (5pm PST)",
        modelResponseJson = """[
            {"time":"20:00","date":"2026-01-09","timezone":"America/New_York","original":"8pm EST"},
            {"time":"17:00","date":"2026-01-09","timezone":"America/Los_Angeles","original":"5pm PST"}
        ]""",
        expected = listOf(
            ExpectedAiExtraction("20:00", "2026-01-09", "America/New_York", "8pm EST"),
            ExpectedAiExtraction("17:00", "2026-01-09", "America/Los_Angeles", "5pm PST"),
        ),
    ),
    AiExtractionFixture(
        name = "flight copy keeps departure and arrival zones separate",
        input = "Flight UA123 departs SFO at 7:00 AM PST, arrives JFK at 3:30 PM EST",
        modelResponseJson = """[
            {"time":"07:00","date":"2026-01-09","timezone":"America/Los_Angeles","original":"7:00 AM PST"},
            {"time":"15:30","date":"2026-01-09","timezone":"America/New_York","original":"3:30 PM EST"}
        ]""",
        expected = listOf(
            ExpectedAiExtraction("07:00", "2026-01-09", "America/Los_Angeles", "7:00 AM PST"),
            ExpectedAiExtraction("15:30", "2026-01-09", "America/New_York", "3:30 PM EST"),
        ),
    ),
    AiExtractionFixture(
        name = "relative date resolves to explicit model date",
        input = "Reminder: standup at 9:30am PT tomorrow",
        modelResponseJson = """[
            {"time":"09:30","date":"2026-01-10","timezone":"America/Los_Angeles","original":"9:30am PT tomorrow"}
        ]""",
        expected = listOf(
            ExpectedAiExtraction("09:30", "2026-01-10", "America/Los_Angeles", "9:30am PT tomorrow"),
        ),
    ),
    AiExtractionFixture(
        name = "city name resolves to IANA timezone",
        input = "Let's meet at 5pm in Tokyo",
        modelResponseJson = """[
            {"time":"17:00","date":"2026-01-09","timezone":"Asia/Tokyo","original":"5pm in Tokyo"}
        ]""",
        expected = listOf(
            ExpectedAiExtraction("17:00", "2026-01-09", "Asia/Tokyo", "5pm in Tokyo"),
        ),
    ),
    AiExtractionFixture(
        name = "ambiguous CST can intentionally mean China",
        input = "Shanghai office review at 10am CST",
        modelResponseJson = """[
            {"time":"10:00","date":"2026-01-09","timezone":"Asia/Shanghai","original":"10am CST"}
        ]""",
        expected = listOf(
            ExpectedAiExtraction("10:00", "2026-01-09", "Asia/Shanghai", "10am CST"),
        ),
    ),
    AiExtractionFixture(
        name = "calendar invite range keeps start and end",
        input = "Deploy window: 2:00 AM - 4:00 AM UTC",
        modelResponseJson = """[
            {"time":"02:00","date":"2026-01-09","timezone":"UTC","original":"2:00 AM UTC"},
            {"time":"04:00","date":"2026-01-09","timezone":"UTC","original":"4:00 AM UTC"}
        ]""",
        expected = listOf(
            ExpectedAiExtraction("02:00", "2026-01-09", "UTC", "2:00 AM UTC"),
            ExpectedAiExtraction("04:00", "2026-01-09", "UTC", "4:00 AM UTC"),
        ),
    ),
    AiExtractionFixture(
        name = "malformed model output is ignored",
        input = "3pm ET",
        modelResponseJson = """not json""",
        expected = emptyList(),
    ),
)
