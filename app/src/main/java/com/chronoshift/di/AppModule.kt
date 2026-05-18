package com.chronoshift.di

import com.chronoshift.nlp.ChronoExtractor
import com.chronoshift.nlp.CityResolver
import com.chronoshift.nlp.CityResolverInterface
import com.chronoshift.nlp.LiteRtExtractor
import com.chronoshift.nlp.LiteRtEngineFactory
import com.chronoshift.nlp.MlKitEntityExtractor
import com.chronoshift.nlp.RealLiteRtEngineFactory
import com.chronoshift.nlp.RegexExtractor
import com.chronoshift.nlp.SpanAwareTimeExtractor
import com.chronoshift.nlp.SpanDetector
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

    @Binds
    abstract fun bindSpanAwareTimeExtractor(impl: ChronoExtractor): SpanAwareTimeExtractor

    @Binds
    abstract fun bindSpanDetector(impl: MlKitEntityExtractor): SpanDetector

    @Binds @LiteRt
    abstract fun bindLiteRtExtractor(impl: LiteRtExtractor): TimeExtractor

    @Binds
    abstract fun bindLiteRtEngineFactory(impl: RealLiteRtEngineFactory): LiteRtEngineFactory

    @Binds @Regex
    abstract fun bindRegexExtractor(impl: RegexExtractor): TimeExtractor
}
