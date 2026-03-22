package com.alentadev.shopping.feature.auth.ui.login

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.alentadev.shopping.R

@Suppress("UNUSED_PARAMETER")
@Composable
fun LoginScreen(
    modifier: Modifier = Modifier,
    viewModel: LoginViewModel = hiltViewModel(),
    recoverableMode: Boolean = false,
    isRecoverableRetrying: Boolean = false,
    onLoginSuccess: () -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()
    val email by viewModel.email.collectAsState()
    val password by viewModel.password.collectAsState()
    val cookieTestResult by viewModel.cookieTestResult.collectAsState()
    val context = LocalContext.current

    // Navegar al completar login exitoso y mostrar Toast
    LaunchedEffect(uiState) {
        if (uiState is LoginUiState.Success) {
            val user = (uiState as LoginUiState.Success).user
            Toast.makeText(
                context,
                "✅ ¡Bienvenido ${user.name}! Login exitoso",
                Toast.LENGTH_LONG
            ).show()
            onLoginSuccess()
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Header
        Text(
            text = "🛒 Shopping List",
            style = MaterialTheme.typography.headlineLarge,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(bottom = 32.dp)
        )

        Text(
            text = "Iniciar Sesión",
            style = MaterialTheme.typography.headlineSmall,
            modifier = Modifier.padding(bottom = 24.dp)
        )


        if (recoverableMode && isRecoverableRetrying) {
            AssistChip(
                onClick = {},
                enabled = false,
                label = { Text(text = stringResource(R.string.login_reconnect_retrying)) },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp)
            )
        }

        // Email field
        OutlinedTextField(
            value = email,
            onValueChange = { viewModel.onEmailChanged(it) },
            label = { Text("Email") },
            placeholder = { Text("usuario@ejemplo.com") },
            leadingIcon = { Icon(Icons.Default.Email, contentDescription = "Email") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            enabled = uiState !is LoginUiState.Loading,
            singleLine = true
        )

        // Password field
        OutlinedTextField(
            value = password,
            onValueChange = { viewModel.onPasswordChanged(it) },
            label = { Text("Contraseña") },
            placeholder = { Text("Ingresa tu contraseña") },
            leadingIcon = { Icon(Icons.Default.Lock, contentDescription = "Contraseña") },
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 24.dp),
            enabled = uiState !is LoginUiState.Loading,
            singleLine = true
        )

        // Error message
        if (uiState is LoginUiState.Error) {
            Text(
                text = (uiState as LoginUiState.Error).message,
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(bottom = 16.dp)
            )
        }

        // Login button
        Button(
            onClick = { viewModel.onLoginClicked() },
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            enabled = uiState !is LoginUiState.Loading,
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.primary,
                disabledContainerColor = MaterialTheme.colorScheme.surfaceVariant
            )
        ) {
            if (uiState is LoginUiState.Loading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    color = MaterialTheme.colorScheme.onPrimary,
                    strokeWidth = 2.dp
                )
            } else {
                Text(
                    text = "Iniciar Sesión",
                    color = MaterialTheme.colorScheme.onPrimary
                )
            }
        }

        // Loading state info
        if (uiState is LoginUiState.Loading) {
            Text(
                text = "Autenticando...",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.outline,
                modifier = Modifier.padding(top = 16.dp)
            )
        }

        // Botón para probar cookies (solo visible después de login exitoso)
        if (uiState is LoginUiState.Success) {
            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = { viewModel.testCookies() },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.secondary
                )
            ) {
                Text("🍪 Probar Cookies")
            }

            // Mostrar resultado de prueba de cookies
            if (cookieTestResult.isNotEmpty()) {
                Text(
                    text = cookieTestResult,
                    style = MaterialTheme.typography.bodySmall,
                    color = if (cookieTestResult.startsWith("✅"))
                        MaterialTheme.colorScheme.primary
                    else
                        MaterialTheme.colorScheme.error,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }
        }
    }
}
