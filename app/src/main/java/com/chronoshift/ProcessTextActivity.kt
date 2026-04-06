package com.chronoshift

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.LaunchedEffect
import androidx.hilt.navigation.compose.hiltViewModel
import com.chronoshift.ui.main.MainViewModel
import com.chronoshift.ui.result.ResultSheet
import com.chronoshift.ui.theme.ChronoShiftTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class ProcessTextActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val incomingText = intent
            ?.getCharSequenceExtra(Intent.EXTRA_PROCESS_TEXT)
            ?.toString()
            ?: run { finish(); return }

        setContent {
            ChronoShiftTheme {
                val viewModel: MainViewModel = hiltViewModel()

                LaunchedEffect(Unit) {
                    viewModel.processIncomingText(incomingText)
                }

                ResultSheet(
                    viewModel = viewModel,
                    onDismiss = { finish() },
                )
            }
        }
    }
}
