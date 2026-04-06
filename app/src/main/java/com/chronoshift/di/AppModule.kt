package com.chronoshift.di

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
}
