package com.alentadev.shopping.ui.screens

import android.util.Log
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.alentadev.shopping.network.RetrofitClient
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

private const val TAG = "HealthCheckScreen"

sealed class HealthUiState {
    object Idle : HealthUiState()
    object Loading : HealthUiState()
    data class Success(val response: Map<String, String>, val responseTime: Long) : HealthUiState()
    data class Error(val message: String, val code: Int?, val details: String? = null) : HealthUiState()
}

class HealthViewModel : ViewModel() {
    var uiState by mutableStateOf<HealthUiState>(HealthUiState.Idle)
        private set

    fun checkHealth() {
        viewModelScope.launch {
            uiState = HealthUiState.Loading
            val startTime = System.currentTimeMillis()

            try {
                Log.d(TAG, "=== INICIANDO VERIFICACIÓN DE SALUD ===")
                Log.d(TAG, "Timestamp: ${System.currentTimeMillis()}")

                Log.d(TAG, "Obteniendo ApiService...")
                val apiService = RetrofitClient.getApiService()
                Log.d(TAG, "ApiService obtenido")

                Log.d(TAG, "Realizando petición HTTP GET /health...")
                val response = apiService.getHealth()
                val responseTime = System.currentTimeMillis() - startTime

                Log.d(TAG, "Respuesta recibida después de ${responseTime}ms")
                Log.d(TAG, "Status: ${response.code()}")
                Log.d(TAG, "Mensaje: ${response.message()}")

                if (response.isSuccessful) {
                    val body = response.body()
                    if (body != null) {
                        Log.d(TAG, "✅ Respuesta exitosa: $body")
                        uiState = HealthUiState.Success(body, responseTime)
                    } else {
                        Log.w(TAG, "⚠️ Respuesta vacía del servidor")
                        uiState = HealthUiState.Error("Respuesta vacía", response.code())
                    }
                } else {
                    Log.w(TAG, "❌ Error HTTP ${response.code()}: ${response.message()}")
                    val errorBody = try {
                        response.errorBody()?.string() ?: "Sin cuerpo de error"
                    } catch (e: Exception) {
                        "No se pudo leer el cuerpo del error"
                    }
                    Log.w(TAG, "Cuerpo del error: $errorBody")
                    uiState = HealthUiState.Error(
                        "Error HTTP: ${response.message()}",
                        response.code()
                    )
                }
            } catch (e: Exception) {
                val elapsedTime = System.currentTimeMillis() - startTime
                Log.e(TAG, "❌ EXCEPCIÓN en verificación de salud después de ${elapsedTime}ms", e)
                Log.e(TAG, "Tipo: ${e::class.simpleName}")
                Log.e(TAG, "Mensaje: ${e.message}")
                Log.e(TAG, "Stack trace:\n${e.stackTraceToString()}")

                uiState = HealthUiState.Error(
                    e.message ?: "Error desconocido",
                    null,
                    e.stackTraceToString()
                )
            }
            Log.d(TAG, "=== FIN VERIFICACIÓN DE SALUD ===")
        }
    }

    fun reset() {
        uiState = HealthUiState.Idle
    }
}

@Composable
fun HealthCheckScreen(
    modifier: Modifier = Modifier,
    viewModel: HealthViewModel = viewModel()
) {
    val scrollState = rememberScrollState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp)
            .verticalScroll(scrollState),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Header
        Text(
            text = "🏥 Health Check",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(vertical = 16.dp)
        )

        // Endpoint info
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant
            )
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Endpoint:",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "GET /health",
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Test button
        Button(
            onClick = { viewModel.checkHealth() },
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            enabled = viewModel.uiState !is HealthUiState.Loading,
            shape = RoundedCornerShape(12.dp)
        ) {
            if (viewModel.uiState is HealthUiState.Loading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(24.dp),
                    color = MaterialTheme.colorScheme.onPrimary,
                    strokeWidth = 2.dp
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text("Probando...")
            } else {
                Text(
                    text = "🚀 Probar Endpoint",
                    style = MaterialTheme.typography.titleMedium
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Results
        when (val state = viewModel.uiState) {
            is HealthUiState.Idle -> {
                EmptyState()
            }
            is HealthUiState.Loading -> {
                // Already shown in button
            }
            is HealthUiState.Success -> {
                SuccessCard(state)
            }
            is HealthUiState.Error -> {
                ErrorCard(state)
            }
        }

        // Reset button
        if (viewModel.uiState !is HealthUiState.Idle && viewModel.uiState !is HealthUiState.Loading) {
            Spacer(modifier = Modifier.height(16.dp))
            OutlinedButton(
                onClick = { viewModel.reset() },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Limpiar")
            }
        }
    }
}

@Composable
fun EmptyState() {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "⏳",
                style = MaterialTheme.typography.displayMedium
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Presiona el botón para probar el endpoint",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun SuccessCard(state: HealthUiState.Success) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFF4CAF50).copy(alpha = 0.1f)
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(bottom = 16.dp)
            ) {
                Text(
                    text = "✅",
                    style = MaterialTheme.typography.headlineMedium
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Éxito",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF4CAF50)
                )
            }

            HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

            state.response["status"]?.let { status ->
                InfoRow("Estado", status)
            }
            state.response["timestamp"]?.let { timestamp ->
                InfoRow("Timestamp", timestamp)
            }
            state.response["message"]?.let { message ->
                InfoRow("Mensaje", message)
            }
            InfoRow("Tiempo de respuesta", "${state.responseTime} ms")
            InfoRow("Hora local", getCurrentTime())
        }
    }
}

@Composable
fun ErrorCard(state: HealthUiState.Error) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.errorContainer
        )
    ) {
        Column(modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
            .verticalScroll(rememberScrollState())) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(bottom = 16.dp)
            ) {
                Text(
                    text = "❌",
                    style = MaterialTheme.typography.headlineMedium
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Error",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.error
                )
            }

            HorizontalDivider(
                modifier = Modifier.padding(vertical = 8.dp),
                color = MaterialTheme.colorScheme.error.copy(alpha = 0.3f)
            )

            state.code?.let { code ->
                InfoRow("Código HTTP", code.toString())
            }
            InfoRow("Mensaje", state.message)
            InfoRow("Hora", getCurrentTime())

            // Mostrar detalles del error (stack trace) si está disponible
            state.details?.let { details ->
                Spacer(modifier = Modifier.height(12.dp))
                HorizontalDivider(
                    modifier = Modifier.padding(vertical = 8.dp),
                    color = MaterialTheme.colorScheme.error.copy(alpha = 0.2f)
                )
                Text(
                    text = "📋 Detalles técnicos:",
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onErrorContainer
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = details,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onErrorContainer.copy(alpha = 0.8f),
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            MaterialTheme.colorScheme.error.copy(alpha = 0.1f),
                            shape = RoundedCornerShape(4.dp)
                        )
                        .padding(8.dp)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "💡 Asegúrate de que:",
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onErrorContainer
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "• El servidor esté ejecutándose en localhost:3000\n• La URL sea correcta (http://10.0.2.2:3000 en emulador)\n• El endpoint /health esté disponible\n• La política de seguridad de red permite HTTP\n• El firewall no bloquea la conexión",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onErrorContainer
            )
        }
    }
}

@Composable
fun InfoRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = "$label:",
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.weight(0.4f)
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.weight(0.6f)
        )
    }
}

fun getCurrentTime(): String {
    val sdf = SimpleDateFormat("HH:mm:ss", Locale.getDefault())
    return sdf.format(Date())
}
