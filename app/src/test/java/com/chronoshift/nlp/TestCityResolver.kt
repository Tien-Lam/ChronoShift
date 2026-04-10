package com.chronoshift.nlp

import kotlinx.datetime.TimeZone

class TestCityResolver : CityResolverInterface {

    override fun resolve(cityQuery: String): TimeZone? = IanaCityLookup.resolve(cityQuery)
}
