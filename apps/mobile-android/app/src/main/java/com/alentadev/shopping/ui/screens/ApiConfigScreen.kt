package com.alentadev.shopping.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Composable
fun ApiConfigScreen(
    currentUrl: String,
    onUrlChange: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var urlInput by remember { mutableStateOf(currentUrl) }
    val scrollState = rememberScrollState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp)
            .verticalScroll(scrollState),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "⚙️ Configuración de API",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(vertical = 16.dp)
        )

        // Info actual
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
                    text = "URL actual:",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = currentUrl,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Opciones preestablecidas
        Text(
            text = "Opciones rápidas:",
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 8.dp)
        )

        // Botones de opciones
        val options = listOf(
            "Emulador (10.0.2.2)" to "http://10.0.2.2:3000",
            "Localhost" to "http://localhost:3000",
            "127.0.0.1" to "http://127.0.0.1:3000"
        )

        options.forEach { (label, url) ->
            OutlinedButton(
                onClick = {
                    urlInput = url
                    onUrlChange(url)
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                colors = ButtonDefaults.outlinedButtonColors(
                    containerColor = if (currentUrl == url) {
                        MaterialTheme.colorScheme.primaryContainer
                    } else {
                        MaterialTheme.colorScheme.surface
                    }
                )
            ) {
                Text(label)
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Campo personalizado
        Text(
            text = "URL personalizada:",
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 8.dp)
        )

        OutlinedTextField(
            value = urlInput,
            onValueChange = { urlInput = it },
            label = { Text("Ej: http://192.168.1.100:3000") },
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            shape = RoundedCornerShape(8.dp),
            singleLine = true
        )

        Button(
            onClick = {
                if (urlInput.isNotBlank()) {
                    onUrlChange(urlInput)
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
                .padding(vertical = 8.dp),
            shape = RoundedCornerShape(8.dp)
        ) {
            Text("Guardar URL")
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Info útil
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.tertiaryContainer
            )
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "💡 Tips de configuración:",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onTertiaryContainer
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "• Emulador: http://10.0.2.2:3000\n" +
                            "• Dispositivo físico: obtén tu IP con 'ipconfig' (cmd)\n" +
                            "• Asegúrate que el firewall permite la conexión\n" +
                            "• El servidor debe estar corriendo en tu máquina",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onTertiaryContainer
                )
            }
        }
    }
}

