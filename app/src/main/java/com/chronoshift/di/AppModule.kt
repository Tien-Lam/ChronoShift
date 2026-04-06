package com.chronoshift.di

import com.chronoshift.nlp.CityResolver
import com.chronoshift.nlp.CityResolverInterface
import com.chronoshift.nlp.StreamingTimeExtractor
import com.chronoshift.nlp.TieredTimeExtractor
import com.chronoshift.nlp.TimeExtractor
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

@Module
@InstallIn(SingletonComponent::class)
abstract class AppModule {

    @Binds
    abstract fun bindTimeExtractor(impl: TieredTimeExtractor): TimeExtractor

    @Binds
    abstract fun bindStreamingTimeExtractor(impl: TieredTimeExtractor): StreamingTimeExtractor

    @Binds
    abstract fun bindCityResolver(impl: CityResolver): CityResolverInterface
}
