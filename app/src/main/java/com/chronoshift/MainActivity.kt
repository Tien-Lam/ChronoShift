package com.chronoshift

import android.content.Intent
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.chronoshift.ui.main.MainScreen
import com.chronoshift.ui.main.MainViewModel
import com.chronoshift.ui.settings.SettingsScreen
import com.chronoshift.ui.theme.ChronoShiftTheme
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.MutableStateFlow

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    private val pendingText = MutableStateFlow<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        Log.d("ChronoShift", "onCreate action=${intent?.action} extras=${intent?.extras?.keySet()}")
        handleIntent(intent)

        setContent {
            ChronoShiftTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    val navController = rememberNavController()
                    NavHost(navController, startDestination = "main") {
                        composable("main") {
                            val viewModel: MainViewModel = hiltViewModel()
                            val incoming by pendingText.collectAsStateWithLifecycle()

                            LaunchedEffect(incoming) {
                                incoming?.let {
                                    viewModel.processIncomingText(it)
                                    pendingText.value = null
                                }
                            }

                            MainScreen(
                                viewModel = viewModel,
                                onNavigateToSettings = { navController.navigate("settings") },
                            )
                        }
                        composable("settings") {
                            SettingsScreen(
                                viewModel = hiltViewModel(),
                                onBack = { navController.popBackStack() },
                            )
                        }
                    }
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        Log.d("ChronoShift", "onNewIntent action=${intent.action} extras=${intent.extras?.keySet()}")
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        val text = intent?.getCharSequenceExtra(Intent.EXTRA_PROCESS_TEXT)?.toString()
        Log.d("ChronoShift", "handleIntent text=${text?.take(80)}")
        if (text != null) {
            pendingText.value = text
        }
    }
}
